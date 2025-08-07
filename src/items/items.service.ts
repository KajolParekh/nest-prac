import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Item } from './interfaces/item.interface';
import { Bid } from './interfaces/bid.interface';

@Injectable()
export class ItemsService {
  private readonly items: Item[] = [];
  private readonly bids: Bid[] = [];

  create(item: Item): Item {
    const newItem = { ...item, id: this.items.length + 1}
    //console.log(newItem);
    this.items.push(newItem);
    return newItem;
  }

  findAll(): Item[] {
    const activeItems = this.items.filter(item => item.isActive == true);
    return activeItems;
  }

  findOne(id: number): Item {
    const foundItem = this.items.find(item => item.id == id);
    if (foundItem === undefined) {
        throw new Error(`Item with id ${id} not found.`); // Or return a default item
        }
        return foundItem;  
  }
    
  update(id: number, updatedItem: Item) {
    const findIndex = this.items.findIndex(item => item.id == id);
    if (findIndex > -1) {
        this.items[findIndex] = { ...this.items[findIndex], ...updatedItem, id};
        return this.items[findIndex];
        }
    else {
        throw new Error(`Item with id ${id} not found.`); // Or return a default item
    }
  }

  placebid(id:number, bid: Bid) {
    const findItem = this.items.find(item => item.id == id);
    if (findItem) {
        //console.log(`bid::: ${JSON.stringify(bid)}`);
        //console.log(`findItem:::${JSON.stringify(findItem)}`);
        if (findItem.isActive) {
            if (bid.BidAmount >= findItem.minBidAmount) {
                const bidAmtchecker = this.acceptBidAmtCalc(id, bid.BidAmount, findItem.incrementAmt, findItem.totalBids);
                //console.log(`bidAmtchecker: ${JSON.stringify(bidAmtchecker)}`);
                if (bidAmtchecker?.totalBidsComplete) return {Status: HttpStatus.OK, message: "Cannot place Bid, Auction ended"};

                if (bidAmtchecker?.acceptable) {
                    const createBid = {...bid,ItemID: id ,ID: this.bids.length + 1};
                    this.bids.push(createBid);
                    //close the item for bidding as this is the last placed bid
                    if ((bidAmtchecker.noOfBids + 1) == findItem.totalBids) {
                        const closebidres = this.closeBid(findItem.id);
                        return {Status: HttpStatus.CREATED, message: "Bid placed successfully. Bid has ended.", data: closebidres?.data ?? {} };
                    } else return {Status: HttpStatus.CREATED, message: "Bid placed successfully"};
                } else return {Status: HttpStatus.OK, message: "Bid amount not in range"};
                
            } else return {Status: HttpStatus.OK, message: `Bid must be higher than minimum bid : ${findItem.minBidAmount}`};
        } else return {Status:HttpStatus.NOT_FOUND, message: `This item is not available for bidding.`}
    } else return {Status: HttpStatus.NOT_FOUND, message: `Item with ${id} not found`};
  }

  fetchItemBid(id: number) {
    const itemBids = this.bids.filter(bid => bid.ItemID == id);
    if (itemBids.length) return {Status: HttpStatus.FOUND, data: itemBids};
    return {Status: HttpStatus.OK, data: []};
  }

  closeBid(id: number) {
    const findItem = this.items.find(item => item.id == id);
    if (findItem) {
        if (findItem.isActive){
            this.update(id, { ...findItem, isActive: false});
        }
        const findbids = this.fetchItemBid(id);
        //console.log(`closeBid:::findbids : ${JSON.stringify(findbids)}`);
        if (findbids && findbids.data) {
            const highestBidder = findbids.data.reduce((prevItem,currItem) => {
                return currItem.BidAmount > prevItem.BidAmount ? currItem : prevItem;
            }, this.bids[0]);
            //console.log(`highestBidder:::${JSON.stringify(highestBidder)}`);
            return {Status: HttpStatus.FOUND, data: highestBidder, message: `Bid closed and higest bidder found`}
        } else {
            return {Status: HttpStatus.NOT_FOUND, data: {}, message: `No bids against this item`};
        }
    } else {
        return {Status: HttpStatus.NOT_FOUND, data: {}, message: `Item not found`};
    }
  }

  diff(a: number, b: number) {
    if (a > b) return (a - b);
    return (b - a);
  }

  acceptBidAmtCalc(id: number, BidAmount: number, increment: number, totalBids: number) {
    const findbids = this.fetchItemBid(id);
    //console.log(`acceptBid:::findbids ::: ${JSON.stringify(findbids)}`);

    if (findbids?.data?.length) {
        if (findbids?.data?.length == totalBids) return {totalBidsComplete: true, noOfBids: findbids.data.length}
        const sortedData = [...findbids.data].sort((a, b) => a[BidAmount] - b[BidAmount]);
        //console.log(`acceptBid:::sortedData ::: ${JSON.stringify(sortedData)}`);
        
        let accept;
        // Edge cases: target is outside the range of the data      
        if (BidAmount <= sortedData[0]['BidAmount']) {
            //console.log(`case 1 ::: `);
            if (BidAmount < sortedData[0]['BidAmount']) {
                //console.log(`case 1 ::: IF`);
                accept = this.diff(sortedData[0]['BidAmount'], BidAmount) >= increment ? true : false;
                //console.log(`case 1 ::: IF ::: ${this.diff(sortedData[0]['BidAmount'], BidAmount) >= increment}`);
            } else accept = true;
            return { lower: 0, higher: sortedData[0]['BidAmount'], acceptable:accept, noOfBids: sortedData.length};
        }

        //console.log(`sortedData[sortedData.length - 1][BidAmount] ::: ${sortedData[sortedData.length - 1]['BidAmount']}`);
        if (BidAmount >= sortedData[sortedData.length - 1]['BidAmount']) {
            //console.log(`case 2 ::: `);
            if (BidAmount > sortedData[sortedData.length - 1]['BidAmount']) {
                //console.log(`case 2 ::: IF ${this.diff(BidAmount, sortedData[sortedData.length - 1]['BidAmount']) >= increment}`);
                accept = this.diff(BidAmount, sortedData[sortedData.length - 1]['BidAmount']) >= increment ? true : false;
            } else accept = true;
            return { lower: sortedData[sortedData.length - 1]['BidAmount'], higher: 0, acceptable:accept, noOfBids: sortedData.length };
        }

        let low = 0;
        let high = sortedData.length - 1;
        let mid;
        let count = 1;

        while (low <= high) {
            mid = Math.floor((low + high) / 2);
            const midValue = sortedData[mid]['BidAmount'];

            if (midValue === BidAmount) {
                return { lower: sortedData[mid].BidAmount, higher: sortedData[mid].BidAmount, acceptable: true, noOfBids: sortedData.length };
            } else if (midValue < BidAmount) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
            //console.log(`Count ::: ${count}`);
            count++;
        }
        //console.log(`Value of low :::${low}`);
        //console.log(`Value of high ::: ${high}`);

        // After binary search, 'low' will be the index of the first element
        // greater than or equal to the target, and 'high' will be the index
        // of the last element less than or equal to the target.
        const lowerClosest = (sortedData[high] == undefined) ? 0 : sortedData[high].BidAmount;
        const higherClosest = (sortedData[low] == undefined) ? 0 : sortedData[low].BidAmount;

        //console.log(`BidAmount :: ${BidAmount}`);
        //console.log(`lowerClosest ::: ${JSON.stringify(lowerClosest)}`);
        //console.log(`higherClosest ::: ${JSON.stringify(higherClosest)}`);
        //console.log(`eval-lower ::: ${(this.diff(BidAmount, lowerClosest) >= increment)}`);
        //console.log(`eval-higher ::: ${(this.diff(higherClosest, BidAmount) >= increment)}`);

        accept = ((this.diff(BidAmount, lowerClosest) >= increment) && (this.diff(higherClosest, BidAmount) >= increment));

        return { lower: lowerClosest, higher: higherClosest, acceptable:accept, noOfBids: sortedData.length };

    } else {
        return {lower: 0, higher: 0, acceptable:true, noOfBids: findbids?.data?.length ?? 0 }
    }
  }

  
}

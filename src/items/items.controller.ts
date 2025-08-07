import { Controller, Get, Post, Put, Body, Param, ParseIntPipe } from '@nestjs/common';
import {ItemsService} from './items.service';
import { CreateItemDTO } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './interfaces/item.interface';
import { PlaceBidDto } from './dto/place-bid.dto';
import { Bid } from './interfaces/bid.interface';

@Controller('items')
export class ItemsController {
    constructor(private itemService: ItemsService) {}
  @Get()
  findAll() {
    return this.itemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.itemService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateItemDTO) {
    return this.itemService.create(createDto as Item);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateItemDto: UpdateItemDto) {
    return this.itemService.update(id, updateItemDto as Item);
  }

  @Post(':id/bid')
  placebid(@Param('id', ParseIntPipe)id: number, @Body() placebidDto: PlaceBidDto) {
    return this.itemService.placebid(id, placebidDto as Bid);
  }

  @Get(':id/fetchBid')
  fetchItemBid(@Param('id', ParseIntPipe)id: number) {
    return this.itemService.fetchItemBid(id);
  }

  @Get(':id/closeBid')
  closeItemBid(@Param('id', ParseIntPipe)id: number) {
    return this.itemService.closeBid(id);
  }
  
}

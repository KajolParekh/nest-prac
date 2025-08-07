import { IsNumber, IsPositive } from "class-validator";

export class PlaceBidDto{
    @IsNumber()
    @IsPositive()
    readonly BidAmount: number;
}
import {  IsBoolean, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";


export class CreateItemDTO {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsNumber()
    @IsPositive()
    readonly minBidAmount: number;

    @IsNumber()
    @IsPositive()
    readonly incrementAmt: number;

    @IsBoolean()
    readonly isActive: boolean;

    @IsNumber()
    @IsPositive()
    readonly totalBids: number;
}
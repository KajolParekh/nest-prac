import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class ApitokenauthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    console.log(`Headers ::: ${JSON.stringify(req.headers)}`)
    if (req.headers['api-token'] === "myToken") {
      next();
    } else throw new BadRequestException(`Invalid Token`);
    
  }
}

import { ApitokenauthMiddleware } from './apitokenauth.middleware';

describe('ApitokenauthMiddleware', () => {
  it('should be defined', () => {
    expect(new ApitokenauthMiddleware()).toBeDefined();
  });
});

import { AsMultiPipe } from './as.pipe';

describe('AsPipe', () => {
  it('create an instance', () => {
    const pipe = new AsMultiPipe();
    expect(pipe).toBeTruthy();
  });
});

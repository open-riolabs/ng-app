import { CmsPipe } from './cms.pipe';

describe('CmsPipe', () => {
  it('create an instance', () => {
    const pipe = new CmsPipe({
      chacheDuration: 0,
      endpoint: "http://localhost:3000/cms",
      contentLanguages: ["en", "de"],
      markdown: 'html',
      useAppLanguage: true
    });
    expect(pipe).toBeTruthy();
  });
});

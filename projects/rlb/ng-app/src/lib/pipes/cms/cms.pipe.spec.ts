import { TestBed } from '@angular/core/testing';
import { RLB_CFG_CMS } from '../../configuration';
import { CmsPipe } from './cms.pipe';

/** CmsPipe reads its options with inject(), so it has to be built in an injection context. */
function buildPipe(endpoint?: string): CmsPipe {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: RLB_CFG_CMS, useValue: endpoint ? { endpoint } : null }],
  });
  return TestBed.runInInjectionContext(() => new CmsPipe());
}

describe('CmsPipe', () => {
  it('prefixes a path with the configured endpoint', () => {
    expect(buildPipe('http://localhost:3000/cms').transform('img/logo.png')).toBe(
      'http://localhost:3000/cms/img/logo.png',
    );
  });

  it('joins with exactly one slash however the two sides are written', () => {
    expect(buildPipe('http://localhost:3000/cms/').transform('/img/logo.png')).toBe(
      'http://localhost:3000/cms/img/logo.png',
    );
  });

  it('leaves the value alone when no CMS is configured', () => {
    expect(buildPipe().transform('img/logo.png')).toBe('img/logo.png');
  });
});

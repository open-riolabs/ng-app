import { inject, Pipe, PipeTransform } from '@angular/core';
import { RLB_CFG_CMS } from '../../configuration';

@Pipe({
  name: 'cms',
})
export class CmsPipe implements PipeTransform {
  private cmsOptions = inject(RLB_CFG_CMS, { optional: true });

  transform(value: string, ...args: unknown[]): string {
    let cms = this.cmsOptions?.endpoint;
    if (!cms) {
      return value;
    }
    if (cms.endsWith('/')) {
      cms = cms.substring(0, cms.length - 1);
    }
    if (value.startsWith('/')) {
      value = value.substring(1);
    }
    return `${cms}/${value}`;
  }
}

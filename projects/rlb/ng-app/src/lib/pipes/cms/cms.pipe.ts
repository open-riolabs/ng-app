import { Inject, Optional, Pipe, PipeTransform } from '@angular/core';
import { CmsConfiguration, RLB_CFG_CMS } from '../../configuration';

@Pipe({
    name: 'cms',
    standalone: false
})
export class CmsPipe implements PipeTransform {

  constructor(@Inject(RLB_CFG_CMS) @Optional() private cmsOptions: CmsConfiguration) { }

  transform(value: string, ...args: unknown[]): string {
    let cms = this.cmsOptions.endpoint
    if (!cms) {
      return value
    }
    if (cms.endsWith("/")) {
      cms = cms.substring(0, cms.length - 1)
    }
    if (value.startsWith("/")) {
      value = value.substring(1)
    }
    return `${cms}/${value}`
  }

}

import { inject, Pipe, PipeTransform, Type } from '@angular/core';
import { RLB_APP_NAVCOMP } from '../../configuration';

@Pipe({
  name: 'mobileComponent',
})
export class MobileComponentPipe implements PipeTransform {
  private config = inject(RLB_APP_NAVCOMP);

  transform(value: string): Type<any> {
    const slot = this.config.mobile ?? this.config.right;
    const t = slot.find(c => c.name === value)?.component;
    if (!t) {
      throw new Error(`No component found for name ${value}`);
    }
    return t;
  }
}

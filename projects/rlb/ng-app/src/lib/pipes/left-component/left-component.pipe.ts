import { Inject, Pipe, PipeTransform, Type } from "@angular/core";
import { NavbarComponents, RLB_APP_NAVCOMP } from "../../configuration";


@Pipe({
    name: 'leftComponent',
    standalone: false
})
export class LeftComponentPipe implements PipeTransform {

  constructor(@Inject(RLB_APP_NAVCOMP) private config: NavbarComponents) { }

  transform(value: string): Type<any> {
    const t = this.config.left.find(c => c.name === value)?.component;
    if (!t) {
      throw new Error(`No component found for name ${value}`);
    }
    return t;
  }
}
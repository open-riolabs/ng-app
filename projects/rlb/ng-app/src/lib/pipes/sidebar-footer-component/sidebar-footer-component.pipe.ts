import { inject, Pipe, PipeTransform, Type } from "@angular/core";
import { RLB_APP_SIDEBARCOMP } from "../../configuration";

@Pipe({
    name: 'sidebarFooterComponent'
})
export class SidebarFooterComponentPipe implements PipeTransform {
  private config = inject(RLB_APP_SIDEBARCOMP);

  transform(value: string): Type<any> {
    const t = this.config.footer.find(c => c.name === value)?.component;
    if (!t) {
      throw new Error(`No component found for name ${value}`);
    }
    return t;
  }
}

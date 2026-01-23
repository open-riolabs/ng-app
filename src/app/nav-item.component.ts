
import { Component, OnInit, TemplateRef, ViewChild, ViewContainerRef } from "@angular/core";
import { RlbAppModule } from "@open-rlb/ng-app";

@Component({
  imports: [RlbAppModule],
  template: `
    <ng-template #template>
      <rlb-navbar-item href="#">
        <i class="bi bi-123"></i>
      </rlb-navbar-item>
    </ng-template>`
})
export class NavbarItemDemoComponent implements OnInit {
  @ViewChild('template', { static: true }) template!: TemplateRef<any>;
  element!: HTMLElement;

  constructor(private viewContainerRef: ViewContainerRef) { }

  ngOnInit() {
    const templateView = this.viewContainerRef.createEmbeddedView(this.template);
    this.element = (templateView.rootNodes[0]);
    this.viewContainerRef.element.nativeElement.remove();
  }
}

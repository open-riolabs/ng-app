import { CommonModule } from "@angular/common";
import { Component, OnInit, TemplateRef, ViewChild, ViewContainerRef } from "@angular/core";
import { RlbAppModule } from "../../projects/rlb/ng-app/src/lib/rlb-app.module";

@Component({
  standalone: true,
  imports: [CommonModule, RlbAppModule],
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

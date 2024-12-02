import { Component } from "@angular/core";
import { IModal, ModalData, ModalDirective } from "@rlb/ng-bootstrap";
import { AppInfo } from "../services/apps/app";
import { RlbAppModule } from "../rlb-app.module";
import { CommonModule } from "@angular/common";

@Component({
    imports: [RlbAppModule, CommonModule],
    template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ data.title }}</h5>
      <button type="button" class="btn-close" aria-label="Close" data-modal-reason="close"></button>
    </div>
    <div class="modal-body">
      <ul class="row row-cols-4 list-unstyled list">
        <li *ngFor="let app of data.content" class="col my-2" [tooltip]="app.description | translate">
          <a class="d-block text-body-emphasis text-decoration-none" (click)="appSelected(app)" [class.disabled]="!app.enabled" data-modal-reason="ok">
            <div class="px-3 py-4 mb-2 bg-body-secondary text-center rounded">
              <i [ngClass]="app.icon"></i>
            </div>
            <div class="name text-muted text-decoration-none text-center pt-1">{{app.name | translate}}</div>
          </a>
        </li>
      </ul>
    </div>`,
    hostDirectives: [{ directive: ModalDirective, inputs: ['id', 'data-instance', 'data-options'] }]
})
export class ModalAppsComponent implements IModal<AppInfo[], AppInfo> {
  data!: ModalData<any>;
  valid?: boolean = true;
  result?: any;
  apps: AppInfo[] = [];

  appSelected(app: AppInfo) {
    this.result = app;
  }
}

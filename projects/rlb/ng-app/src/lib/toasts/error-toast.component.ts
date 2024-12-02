import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RlbAppModule } from '../rlb-app.module';
import { ToastData, ToastDirective, IToast } from '@rlb/ng-bootstrap';

@Component({
    imports: [RlbAppModule, CommonModule],
    template: `
    <div class="toast-header">
      <strong class="me-auto">
        <svg
          class="bd-placeholder-img rounded me-2"
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid slice"
          focusable="false"
        >
          <rect width="100%" height="100%" fill="#007aff"></rect>
        </svg>
        {{ data.title }}
      </strong>
      <small *ngIf="data.subtitle"> {{ data.subtitle }}</small>
      <button
        type="button"
        class="btn-close"
        data-bs-dismiss="toast"
        aria-label="Close"
      ></button>
    </div>
    <div class="toast-body">{{ data.content }}</div>
  `,
    hostDirectives: [
        {
            directive: ToastDirective,
            inputs: ['id', 'data-instance', 'data-options'],
        },
    ]
})
export class ToastComponent implements IToast<string, void> {
  data!: ToastData<string>;
  valid?: boolean = true;
  result?: any;
}

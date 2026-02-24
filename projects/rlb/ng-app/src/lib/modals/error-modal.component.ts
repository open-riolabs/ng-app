import { Component, input, model, OnInit } from '@angular/core';
import { RlbAppModule } from '../rlb-app.module';
import { IModal, ModalData, ModalDirective } from '@open-rlb/ng-bootstrap';

@Component({
  imports: [RlbAppModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ data().title }}</h5>
      <button
        type="button"
        class="btn-close"
        aria-label="Close"
        data-modal-reason="close"
      ></button>
    </div>
    <div class="modal-body">
      <span>{{ data().content }}</span>
    </div>
    <div class="modal-footer">
      <button
        type="button"
        class="btn btn-primary"
        data-modal-reason="close"
      >
        {{ data().ok }}
      </button>
    </div>
  `,
  hostDirectives: [
    {
      directive: ModalDirective,
      inputs: ['id', 'data-instance', 'data-options'],
    },
  ],
})
export class ErrorModalComponent implements IModal<string, void>, OnInit {
  data = input.required<ModalData<any>>();
  valid = model(true);

  onEnter() {}

  ngOnInit(): void {
    console.log(this.data());
  }
}

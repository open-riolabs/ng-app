import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AbstractSupportService } from '../../services/abstraction/abstract-support.service';
import { Location } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ListComponent, ListItemComponent, InputComponent, SwitchComponent } from '@open-rlb/ng-bootstrap';

@Component({
    selector: 'rlb-support',
    templateUrl: './support.component.html',
    styleUrl: './support.component.scss',
    imports: [ReactiveFormsModule, TranslateModule, ListComponent, ListItemComponent, InputComponent, SwitchComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportComponent implements OnInit {
  private readonly supportService = inject(AbstractSupportService);
  private readonly _location = inject(Location);

  public readonly supportForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    subject: new FormControl('', [Validators.required]),
    message: new FormControl('', [Validators.required]),
    legal: new FormControl('', [Validators.required]),
  });

  public hasError(form: string, controlName: string, errorName: string) {
    if (form === 'supportForm') {
      return this.supportForm.get(controlName)?.hasError(errorName);
    }
    return false;
  }

  public sendSupport(data: any) {
    if (this.supportForm.valid) {
      this.supportService.sendSupport(data);
    }
  }

  backClicked() {
    this._location.back();
  }

  ngOnInit() { }
}


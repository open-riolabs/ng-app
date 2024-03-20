import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AbstractSupportService } from '../../services/abstraction/abstract-support.service';
import { Location } from '@angular/common';

@Component({
  selector: 'rlb-support',
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss'
})
export class SupportComponent {

  public supportForm: FormGroup

  constructor(private supportService: AbstractSupportService, private _location: Location) {
    this.supportForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      subject: new FormControl('', [Validators.required]),
      message: new FormControl('', [Validators.required]),
      legal: new FormControl('', [Validators.required]),
    })
  }

  public hasError(form: string, controlName: string, errorName: string) {
    switch (form) {
      case 'supportForm':
        return this.supportForm.controls[controlName].hasError(errorName)
      default: return false
    }
  }

  public sendSupport(data: any) {
    if (this.supportForm.valid) {
      this.supportService.sendSupport(data)
    }
  }

  backClicked() {
    this._location.back();
  }

  ngOnInit() { }
}

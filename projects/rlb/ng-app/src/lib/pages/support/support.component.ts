import { Component } from '@angular/core';
import { BreadcrumbItem } from '@rlb/ng-bootstrap';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AbstractSupportService } from '../../services/abstraction/abstract-support.service';


@Component({
  selector: 'rlb-support',
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss'
})
export class SupportComponent {

  breadcrumb: BreadcrumbItem[] | undefined

  public subscriptionForm: FormGroup
  public questionForm: FormGroup
  public supportForm: FormGroup

  constructor(private supportService: AbstractSupportService) {
    this.subscriptionForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      legal: new FormControl('', [Validators.required]),
    })
    this.questionForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      subject: new FormControl('', [Validators.required]),
      message: new FormControl('', [Validators.required]),
      legal: new FormControl('', [Validators.required]),
    })
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
      case 'subscriptionForm':
        return this.subscriptionForm.controls[controlName].hasError(errorName)
      case 'questionForm':
        return this.questionForm.controls[controlName].hasError(errorName)
      case 'supportForm':
        return this.supportForm.controls[controlName].hasError(errorName)
      default: return false
    }
  }

  public subscribeNewsletter(data: any) {
    if (this.subscriptionForm.valid) {
      this.supportService.subscribeNewsletter(data)
    }
  }

  public sendQuestion(data: any) {
    if (this.subscriptionForm.valid) {
      this.supportService.sendQuestion(data)
    }
  }

  public sendSupport(data: any) {
    if (this.subscriptionForm.valid) {
      this.supportService.sendSupport(data)
    }
  }

  ngOnInit() { }
}

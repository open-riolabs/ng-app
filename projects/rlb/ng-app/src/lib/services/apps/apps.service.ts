import { Injectable } from '@angular/core';
import { App } from './app';
import { ModalService } from '@rlb/ng-bootstrap';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppsService {

  private _currentApp_s = new Subject<App | null>();
  private _currentApp: App | null = null;
  public currentApp$ = this._currentApp_s.asObservable();
  public get currentApp(): App | null {
    return this._currentApp;
  }

  getApps(): App[] {
    return [{
      id: 'chat',
      name: 'Chat',
      description: 'Chat with other users',
      url: 'chat',
      icon: 'bi-chat',
      enabled: true
    },
    {
      id: 'drive',
      name: 'Drive',
      description: 'Store your files',
      url: 'drive',
      icon: 'bi-hdd-rack',
      enabled: true
    }]
  }

  chooseApp() {
    this.modalService.openModal<App[], App>('modal-apps-component', {
      title: 'Riolabs Apps',
      content: this.getApps(),
      ok: 'OK',
      type: 'info'
    }).subscribe((o) => {
      if (o?.reason === 'ok') {
        if (this._currentApp?.id !== o.result?.id) {
          this._currentApp = o.result;
          this._currentApp_s.next(o.result);
        }
      }
    });
  }

  constructor(private modalService: ModalService) { }
}

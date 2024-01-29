import { Injectable } from '@angular/core';
import { AppItem } from './app';
import { ModalService } from '@rlb/ng-bootstrap';
import { Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import { appContextFeatureKey } from '../../store/app-context/app-context.model';
import { LanguageService } from '../i18n/language.service';
import { AppContextActions, BaseState } from '../../../public-api';

@Injectable({
  providedIn: 'root'
})
export class AppsService {

  async chooseApp() {
    const apps = this.store.selectSignal(state => state[appContextFeatureKey].apps)();
    console.log(apps);
    this.modalService.openModal<AppItem[], AppItem>('modal-apps-component', {
      title: this.languageService.translate('core.apps.title'),
      content: apps,
      ok: this.languageService.translate('common.ok'),
      type: 'info'
    }).subscribe((o) => {
      if (o?.reason === 'ok') {
        this.store.dispatch(AppContextActions.setCurrentApp({ app: o.result }));
      }
    });
  }

  constructor(
    private modalService: ModalService,
    private languageService: LanguageService,
    private store: Store<BaseState>
  ) { }
}

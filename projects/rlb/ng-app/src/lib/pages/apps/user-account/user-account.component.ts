import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { RlbAppModule } from '../../../rlb-app.module';
import { CommonModule, Location } from '@angular/common';
import { KeycloakProfileService, KeycloakUser, KeycloakCredential, KeycloakSession } from '../../../auth/keycloak';
import { EMPTY, Subscription, lastValueFrom, switchMap } from 'rxjs';
import { AuthActions } from '../../../store/auth/auth.actions';
import { Store } from '@ngrx/store';
import { ModalService } from '@rlb/ng-bootstrap';
import { LanguageService } from '../../../services/i18n/language.service';
import { BaseState } from '../../../../public-api';

@Component({
  selector: 'rlb-user-account',
  standalone: true,
  imports: [RlbAppModule, CommonModule],
  templateUrl: './user-account.component.html',
  styleUrl: './user-account.component.scss'
})
export class UserAccountComponent implements OnInit, OnDestroy {
  constructor(
    private _location: Location,
    public store: Store<BaseState>,
    private keycloakProfileService: KeycloakProfileService,
    private modalService: ModalService,
    private languageService: LanguageService
  ) { }


  keyCloakUser!: KeycloakUser;
  keyCloakDevices!: KeycloakSession[];
  keycloakCredentials!: KeycloakCredential[];
  private subs: Subscription[] = [];

  backClicked() {
    this._location.back();
  }

  ngOnInit() {
    this.subs.push(this.keycloakProfileService.getUserProfile().subscribe((user) => {
      this.keyCloakUser = user;
    }));
    this.subs.push(this.keycloakProfileService.getDevices().subscribe((devices) => {
      this.keyCloakDevices = devices;
    }));
    this.subs.push(this.keycloakProfileService.getCredentials().subscribe((credentials) => {
      this.keycloakCredentials = credentials;
    }));
  }

  ngOnDestroy(): void {
    while (this.subs.length) {
      this.subs.pop()?.unsubscribe();
    }
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }

  async removeCredential(id: string) {
    return await lastValueFrom(this.modalService.openConfirmModal(
      this.languageService.translate("core.account.credentials.deleteTitle"),
      this.languageService.translate("core.account.credentials.deleteMessage"),
      this.languageService.translate("core.account.credentials.deleteHeader"),
      this.languageService.translate("common.yes"),
      this.languageService.translate("common.cancel")).pipe(switchMap((result) => {
        if (result) {
          return this.keycloakProfileService.removeCredential(id);
        }
        return EMPTY;
      })));
  }

  async updateProfile() {
    return await lastValueFrom(this.keycloakProfileService.updateUserProfile(this.keyCloakUser));
  }
}

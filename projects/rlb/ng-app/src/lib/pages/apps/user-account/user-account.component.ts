import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ModalService } from '@rlb-core/lib-ng-bootstrap';
import { EMPTY, Subscription, lastValueFrom, switchMap, tap } from 'rxjs';
import { BaseState } from '../../../../public-api';
import { KeycloakCredential, KeycloakProfileService, KeycloakSession, KeycloakUser } from '../../../auth/keycloak';
import { RlbAppModule } from '../../../rlb-app.module';
import { LanguageService } from '../../../services/i18n/language.service';
import { AuthActions } from '../../../store/auth/auth.actions';

@Component({
  selector: 'rlb-user-account',
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

  async removeCredential(type: string, id: string) {
    return await lastValueFrom(this.modalService.openConfirmModal(
      this.languageService.translate("core.account.credentials.deleteTitle"),
      this.languageService.translate("core.account.credentials.deleteMessage"),
      this.languageService.translate("core.account.credentials.deleteHeader"),
      this.languageService.translate("common.yes"),
      this.languageService.translate("common.cancel")).pipe(switchMap((result) => {
        if (result) {
          return this.keycloakProfileService.removeCredential(id).pipe(tap(() => {
            const meta = this.keycloakCredentials.find((c) => c.type === type)?.userCredentialMetadatas;
            const idx = meta?.findIndex((m) => m.credential.id === id);
            if (meta && idx !== undefined && idx !== -1) {
              meta.splice(idx, 1);
            }
          }));
        }
        return EMPTY;
      })));
  }

  async updateProfile() {
    return await lastValueFrom(this.keycloakProfileService.updateUserProfile(this.keyCloakUser));
  }

  updatePassword() {
    this.keycloakProfileService.updatePassword();
  }

  configureOTP() {
    this.keycloakProfileService.configureOTP();
  }
}


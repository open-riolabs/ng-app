import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { ModalService } from '@open-rlb/ng-bootstrap';
import { EMPTY, filter, lastValueFrom, switchMap, tap } from 'rxjs';
import { KeycloakCredential, KeycloakProfileService, KeycloakSession, KeycloakUser } from '../../../auth/keycloak';
import { RlbAppModule } from '../../../rlb-app.module';
import { LanguageService } from '../../../services/i18n/language.service';
import { BaseState } from '../../../store';
import { AuthActions } from '../../../store/auth/auth.actions';
import { AuthenticationService } from '../../../auth/services/auth.service';

@Component({
  selector: 'rlb-user-account',
  imports: [RlbAppModule, CommonModule],
  templateUrl: './user-account.component.html',
  styleUrl: './user-account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAccountComponent implements OnInit {
  private readonly _location = inject(Location);
  private readonly store = inject(Store<BaseState>);
  private readonly keycloakProfileService = inject(KeycloakProfileService);
  private readonly modalService = inject(ModalService);
  private readonly languageService = inject(LanguageService);
  private readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);

  readonly keyCloakUser = signal<KeycloakUser | undefined>(undefined);
  readonly keyCloakDevices = toSignal(this.keycloakProfileService.getDevices());
  readonly keycloakCredentials = signal<KeycloakCredential[]>([]);

  constructor() {
    this.authService.isAuthenticated$.pipe(
      takeUntilDestroyed(),
      filter(isAuth => !isAuth),
      switchMap(() => this.router.navigate(['/']))
    ).subscribe();
  }

  backClicked() {
    this._location.back();
  }

  ngOnInit() {
    this.keycloakProfileService.getUserProfile()
      .pipe(takeUntilDestroyed())
      .subscribe((user) => this.keyCloakUser.set(user));

    this.keycloakProfileService.getCredentials()
      .pipe(takeUntilDestroyed())
      .subscribe((credentials) => this.keycloakCredentials.set(credentials));
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
            this.keycloakCredentials.update(credentials => {
              const newCredentials = [...credentials];
              const credType = newCredentials.find(c => c.type === type);
              if (credType?.userCredentialMetadatas) {
                credType.userCredentialMetadatas = credType.userCredentialMetadatas.filter(m => m.credential.id !== id);
              }
              return newCredentials;
            });
          }));
        }
        return EMPTY;
      })));
  }

  async updateProfile() {
    const user = this.keyCloakUser();
    if (user) {
      return await lastValueFrom(this.keycloakProfileService.updateUserProfile(user));
    }
    return;
  }

  updatePassword() {
    this.keycloakProfileService.updatePassword();
  }

  configureOTP() {
    this.keycloakProfileService.configureOTP();
  }
}



import { DatePipe, Location, UpperCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { ModalService } from '@open-rlb/ng-bootstrap';
import { EMPTY, filter, lastValueFrom, switchMap, tap } from 'rxjs';
import { KeycloakCredential, KeycloakProfileService, KeycloakUser } from '../../../auth/keycloak';
import { RlbAppModule } from '../../../rlb-app.module';
import { LanguageService } from '../../../services/i18n/language.service';
import { BaseState } from '../../../store';
import { AuthActions } from '../../../store/auth/auth.actions';
import { AuthenticationService } from '../../../auth/services/auth.service';

@Component({
  selector: 'rlb-user-account',
  imports: [RlbAppModule, ReactiveFormsModule, DatePipe, UpperCasePipe],
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
  private readonly destroyRef = inject(DestroyRef); // <-- Required for takeUntilDestroyed outside of constructor
  private readonly fb = inject(FormBuilder);

  readonly keyCloakUser = signal<KeycloakUser | undefined>(undefined);
  readonly keyCloakDevices = toSignal(this.keycloakProfileService.getDevices(), {
    initialValue: [],
  });
  readonly keycloakCredentials = signal<KeycloakCredential[]>([]);

  readonly breadcrumbItems = [
    { label: 'Home', link: '/', id: '1' },
    { label: 'Account settings', id: '2' },
  ];

  readonly profileForm = this.fb.nonNullable.group({
    username: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    firstName: [{ value: '', disabled: true }],
    lastName: [{ value: '', disabled: true }],
  });

  constructor() {
    this.authService.isAuthenticated$
      .pipe(
        takeUntilDestroyed(),
        filter(isAuth => !isAuth),
        switchMap(() => this.router.navigate(['/'])),
      )
      .subscribe();
  }

  backClicked(): void {
    this._location.back();
  }

  ngOnInit(): void {
    this.keycloakProfileService
      .getUserProfile()
      .pipe(takeUntilDestroyed(this.destroyRef)) // Using explicitly injected DestroyRef
      .subscribe(user => {
        this.keyCloakUser.set(user);

        if (user) {
          this.profileForm.enable();
          this.profileForm.controls.username.disable();
          this.profileForm.patchValue({
            username: user.username || '',
            email: user.email || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
          });
        } else {
          this.profileForm.disable();
        }
      });

    this.keycloakProfileService
      .getCredentials()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(credentials => this.keycloakCredentials.set(credentials));
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  removeCredential(type: string, id: string): void {
    this.modalService
      .openConfirmModal(
        this.languageService.translate('core.account.credentials.deleteTitle'),
        this.languageService.translate('core.account.credentials.deleteMessage'),
        this.languageService.translate('core.account.credentials.deleteHeader'),
        this.languageService.translate('common.yes'),
        this.languageService.translate('common.cancel'),
      )
      .pipe(
        switchMap(result => {
          if (result.reason === 'ok') {
            return this.keycloakProfileService.removeCredential(id).pipe(
              tap(() => {
                this.keycloakCredentials.update(credentials =>
                  credentials.map(credType => {
                    if (credType.type === type && credType.userCredentialMetadatas) {
                      return {
                        ...credType,
                        userCredentialMetadatas: credType.userCredentialMetadatas.filter(
                          m => m.credential.id !== id,
                        ),
                      };
                    }
                    return credType;
                  }),
                );
              }),
            );
          }
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  async updateProfile(): Promise<void> {
    const user = this.keyCloakUser();
    if (user && this.profileForm.valid) {
      const updatedUser = { ...user, ...this.profileForm.getRawValue() };
      await lastValueFrom(this.keycloakProfileService.updateUserProfile(updatedUser));
      this.keyCloakUser.set(updatedUser);
    }
  }

  updatePassword(): void {
    this.keycloakProfileService.updatePassword();
  }

  configureOTP(): void {
    this.keycloakProfileService.configureOTP();
  }
}

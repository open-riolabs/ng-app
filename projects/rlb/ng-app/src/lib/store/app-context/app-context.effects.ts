import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatMap, map, tap } from 'rxjs/operators';
import { AppContextActions, AppContextActionsInternal } from './app-context.actions';
import { Store } from '@ngrx/store';
import { EnvironmentConfiguration, RLB_CFG_ENV } from '../../configuration';
import { LanguageService } from '../../services';

@Injectable()
export class AppContextEffects {

  setLanguage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AppContextActions.setLanguage),
      tap(({ language }) => this.languageService.language = language),
      map(({ language }) => AppContextActionsInternal.setLanguage({ language })),
    );
  });

  setLanguages$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AppContextActions.setSupportedLanguages),
      tap(({ supportedLanguages }) => this.languageService.languages = supportedLanguages),
      map(({ supportedLanguages }) => AppContextActionsInternal.setSupportedLanguages({ supportedLanguages })),
    );
  });

  constructor(
    private actions$: Actions,
    private languageService: LanguageService,
    store: Store,
    @Inject(RLB_CFG_ENV) envConfig: EnvironmentConfiguration) {

  }
}

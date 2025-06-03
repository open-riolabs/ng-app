import { Inject, Injectable, Optional, Renderer2, RendererFactory2 } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, tap } from 'rxjs/operators';
import { BaseState } from '..';
import { LanguageService } from '../../services';
import { AppInfo } from '../../services/apps/app';
import { AppStorageService } from '../../services/utils/app-storage.service';
import { AppContextActions, AppContextActionsInternal } from './app-context.actions';
import { RLB_APPS } from './app-context.model';

@Injectable()
export class AppContextEffects {
  private renderer: Renderer2;
  setLanguage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AppContextActions.setLanguage),
      tap(({ language }) => this.languageService.language = language),
      tap(({ language }) => {
        this.renderer.setAttribute(document.documentElement, 'lang', language);
      }),
      tap(({ language }) => { this.storage.writeLocal('locale', language); }),
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

  setTheme$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AppContextActions.setTheme),
      tap(({ theme }) => {
        this.renderer.setAttribute(document.documentElement, 'data-bs-theme', theme);
      }),
      tap(({ theme }) => { this.storage.writeLocal('theme', theme); }),
      map(({ theme }) => AppContextActionsInternal.setTheme({ theme })),
    );
  });

  setApp$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AppContextActions.setCurrentApp),
      map(({ app, mode, url }) => {
        return AppContextActionsInternal.setCurrentApp({ app, mode, url });
      }),
      tap(({ app }) => {
        if (app) {
          localStorage.setItem('c-app-id', app.id!);
        } else {
          localStorage.removeItem('c-app-id');
        }
      }),
    );
  });

  constructor(
    private readonly actions$: Actions,
    private readonly languageService: LanguageService,
    readonly rendererFactory: RendererFactory2,
    readonly storage: AppStorageService,
    readonly store: Store<BaseState>,
    private readonly router: Router,
    @Inject(RLB_APPS) @Optional() private apps: AppInfo[],
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    if (this.apps && this.apps.length > 0) {
      for (const app of this.apps) {
        store.dispatch(AppContextActionsInternal.addApp({ app: app }));
      }
    }
  }
}

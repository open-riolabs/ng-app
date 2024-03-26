import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, tap } from 'rxjs/operators';
import { AppContextActions, AppContextActionsInternal } from './app-context.actions';
import { LanguageService } from '../../services';
import { AppStorageService } from '../../services/utils/app-storage.service';

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
      tap(({ language }) => { this.store.writeLocal('locale', language); }),
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
      tap(({ theme }) => { this.store.writeLocal('theme', theme); }),
      map(({ theme }) => AppContextActionsInternal.setTheme({ theme })),
    );
  });

  constructor(
    private actions$: Actions,
    private languageService: LanguageService,
    rendererFactory: RendererFactory2,
    private readonly store: AppStorageService
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }
}

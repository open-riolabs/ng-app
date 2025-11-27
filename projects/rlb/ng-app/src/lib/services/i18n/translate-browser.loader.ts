import { Observable } from 'rxjs';
import { TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { makeStateKey, StateKey, TransferState } from '@angular/core';

export class TranslateBrowserLoader implements TranslateLoader {
  constructor(private http: HttpClient,
    private transferState: TransferState,
    private prefix: string = './assets/i18n/',
    private suffix: string = '.json') {}

  public getTranslation(lang: string): Observable<any> {
    const key: StateKey<number> = makeStateKey<number>(
      'transfer-translate-' + lang
    );
    const data = this.transferState.get(key, null);

    // First we are looking for the translations in transfer-state,
	  // if none found, http load as fallback
    if (data) {
      return new Observable((observer) => {
        observer.next(data);
        observer.complete();
      });
    } else {
      return this.http.get(`${this.prefix}${lang}${this.suffix}`);
    }
  }
}

export function translateBrowserLoaderFactory(
  httpClient: HttpClient,
  transferState: TransferState
) {
  return new TranslateBrowserLoader(httpClient, transferState);
}

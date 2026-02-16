import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { appContextFeatureKey, } from '../store/app-context/app-context.model';
import { ProjectConfiguration, RLB_CFG } from '../configuration';
import { AppInfo } from '../services/apps/app'

@Injectable()
export class CompanyInterceptor implements HttpInterceptor {
  private store = inject(Store);
  private config = inject(RLB_CFG) as ProjectConfiguration;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authConfig = this.config.auth;
    const isAllowed = authConfig?.allowedUrls?.some(url => req.url.includes(url));

    if (!isAllowed || !authConfig?.enableCompanyInterceptor) {
      return next.handle(req);
    }
    const currentApp = this.store.selectSignal(state => state[appContextFeatureKey].currentApp)();
    const data = currentApp?.data as { [key: string]: string } | undefined;
    const mapping = this.config.acl?.interceptorMapping || {};
    const map = Object.keys(mapping).forEach((key) => {
      const storeKey = mapping[key];
      const value = data?.[storeKey];
      if(!!value) {
        req.params.set(key, value);
      }
    });

    const clonedReq = req.clone({ params: req.params });
    return next.handle(clonedReq);
  }
}

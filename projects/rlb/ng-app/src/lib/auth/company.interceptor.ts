import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { appContextFeatureKey, } from '../store/app-context/app-context.model';
import { ProjectConfiguration, RLB_CFG } from '../configuration';
import { AppInfo } from '../services/apps/app'

interface Data {
  companyId: string;
  productId: string;
  appName?: string;
}

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

    return this.store.select(state => state[appContextFeatureKey].currentApp).pipe(
      take(1),
      map((app: AppInfo<any> | null | undefined) => {
        const mapping = this.config.acl?.interceptorMapping;

        // If no mapping is defined, just return the request
        if (!mapping || !app?.data) {
          return req;
        }

        let params = req.params;

        // DYNAMIC LOOP:
        // Iterate over all keys defined in the environment config
        Object.entries(mapping).forEach(([httpParamName, storeDataKey]) => {
          const value = app.data[storeDataKey];

          if (value !== undefined && value !== null) {
            params = params.set(httpParamName, value.toString());
          }
        });

        return req.clone({ params });
      }),
      switchMap(clonedReq => next.handle(clonedReq))
    );
  }
}

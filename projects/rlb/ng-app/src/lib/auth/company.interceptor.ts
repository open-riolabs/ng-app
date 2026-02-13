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
        // Get the correct keys from config
        const companyKey = this.config.acl?.interceptorMapping?.companyIdKey ?? 'companyId';
        const productKey = this.config.acl?.interceptorMapping?.productIdKey ?? 'productId';

        const companyId = app?.data?.companyId;
        const productId = app?.data?.productId;

        if (companyId && productId) {
          const params = req.params
            .set(companyKey, companyId)
            .set(productKey, productId);

          return req.clone({ params });
        }

        // If no companyId and productId presented call as is
        return req;
      }),
      switchMap(clonedReq => next.handle(clonedReq))
    );
  }
}

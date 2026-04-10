import { inject, Injectable, signal } from "@angular/core";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { BreadcrumbItem, UniqueIdService } from "@open-rlb/ng-bootstrap";
import { filter } from "rxjs";
import { AppLoggerService, LoggerContext } from "./app-logger.service";
import { LanguageService } from "../i18n/language.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Injectable({ providedIn: 'root' })
export class AppBreadcrumbService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly loggerService = inject(AppLoggerService);
  private readonly languageService = inject(LanguageService);
  private readonly idService = inject(UniqueIdService);

  private readonly _breadcrumbs = signal<BreadcrumbItem[]>([]);
  readonly breadcrumbs = this._breadcrumbs.asReadonly();
  
  private logger: LoggerContext;

  constructor() {
    this.logger = this.loggerService.for(this.constructor.name);
    this.logger.info('Service initialized');

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.updateBreadcrumbs());

    this.languageService.languageChanged$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateBreadcrumbs());

    // init construct
    this.updateBreadcrumbs();
  }

  private updateBreadcrumbs() {
    const crumbs = this.buildBreadcrumbFromRoot(this.route);
    this._breadcrumbs.set(crumbs);
    this.logger.info('Breadcrumbs updated', crumbs);
  }

  private buildBreadcrumbFromRoot(route: ActivatedRoute): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];
    let accumulatedLink = '';
    let currentRoute: ActivatedRoute | null = route.root;

    while (currentRoute) {
      const urlPart = currentRoute.snapshot.url.map(s => s.path).join('/');
      if (urlPart) accumulatedLink += `/${urlPart}`;

      const label = currentRoute.snapshot.data['breadcrumb'];
      if (label && (urlPart || breadcrumbs.length === 0)) {
        breadcrumbs.push({
          label: this.languageService.translate(label),
          link: accumulatedLink || '/',
          id: `breadcrumb${this.idService.id}`
        });
        this.logger.debug('Pushed breadcrumb', { label, link: accumulatedLink });
      }

      if (!currentRoute.firstChild) break;
      currentRoute = currentRoute.firstChild;
    }

    return breadcrumbs;
  }
}


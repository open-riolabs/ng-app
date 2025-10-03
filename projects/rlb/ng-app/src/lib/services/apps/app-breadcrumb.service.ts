import { Injectable } from "@angular/core";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { BreadcrumbItem } from "@lbdsh/lib-ng-bootstrap";
import { BehaviorSubject, filter } from "rxjs";
import { AppLoggerService, LoggerContext } from "./app-logger.service";
import { LanguageService } from "../i18n/language.service";

@Injectable({ providedIn: 'root' })
export class AppBreadcrumbService {
	private readonly _breadcrumbs$ = new BehaviorSubject<BreadcrumbItem[]>([]);
	public readonly breadcrumbs$ = this._breadcrumbs$.asObservable();
	private logger: LoggerContext;
	
	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private loggerService: AppLoggerService,
		private languageService: LanguageService
	) {
		this.logger = this.loggerService.for(this.constructor.name);
		
		this.router.events
			.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
			.subscribe(() => {
				const crumbs = this.buildBreadcrumbFromRoot(this.route);
				this._breadcrumbs$.next(crumbs);
				this.logger.info('Breadcrumbs updated', crumbs);
			});
	}
	
	private buildBreadcrumbFromRoot(route: ActivatedRoute): BreadcrumbItem[] {
		const breadcrumbs: BreadcrumbItem[] = [];
		let accumulatedLink = '';
		let currentRoute: ActivatedRoute | null = route.root;
		
		while (currentRoute) {
			const urlPart = currentRoute.snapshot.url.map(s => s.path).join('/');
			if (urlPart) accumulatedLink += `/${urlPart}`;
			
			const label = currentRoute.snapshot.data['breadcrumb'];
			if (label) {
				breadcrumbs.push({
					label: this.languageService.translate(label),
					link: accumulatedLink
				});
				this.logger.debug('Pushed breadcrumb', { label, link: accumulatedLink });
			}
			
			if (!currentRoute.firstChild) break;
			currentRoute = currentRoute.firstChild;
		}
		
		return breadcrumbs;
	}
}

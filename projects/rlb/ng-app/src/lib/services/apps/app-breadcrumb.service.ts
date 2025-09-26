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
		private languageService: LanguageService,
	) {
		this.logger = this.loggerService.for(this.constructor.name);
		
		this.router.events
			.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
			.subscribe((ev) => {
				this.logger.info('NavigationEnd', ev);
				const crumbs = this.buildBreadcrumb(this.route.root);
				this.logger.info('Final crumbs after build', crumbs);
				this._breadcrumbs$.next(crumbs);
			});
	}
	
	private buildBreadcrumb(route: ActivatedRoute): BreadcrumbItem[] {
		this.logger.debug('buildBreadcrumb START');
		
		const breadcrumbs: BreadcrumbItem[] = [];
		let currentRoute: ActivatedRoute | null = route;
		let accumulatedLink = '';
		
		while (currentRoute) {
			const children: ActivatedRoute[] = currentRoute.children || [];
			this.logger.debug('Visiting route', {
				routeConfigPath: currentRoute.snapshot.routeConfig?.path ?? '(root)',
				childrenCount: children.length,
			});
			
			if (children.length === 0) {
				this.logger.debug('No children — stop traversal');
				break;
			}
			
			let childToFollow: ActivatedRoute | null = null;
			for (let i = 0; i < children.length; i++) {
				const ch = children[i];
				const seg = ch.snapshot.url.map(s => s.path).join('/');
				this.logger.debug(`child[${i}]`, {
					routeConfigPath: ch.snapshot.routeConfig?.path,
					urlSegments: seg,
					breadcrumbData: ch.snapshot.data['breadcrumb'],
				});
				
				if (seg.length) {
					childToFollow = ch;
					break;
				}
				if (!childToFollow) childToFollow = ch; // fallback
			}
			
			if (!childToFollow) {
				this.logger.warn('No child to follow found — stop traversal');
				break;
			}
			
			const routeURL = childToFollow.snapshot.url.map(s => s.path).join('/');
			if (routeURL) {
				accumulatedLink += `/${routeURL}`;
				this.logger.info('Computed next link', accumulatedLink);
			} else {
				this.logger.debug('Child has empty url — accumulatedLink stays', accumulatedLink);
			}
			
			let label = childToFollow.snapshot.data['breadcrumb'];
			this.logger.debug('Label for child', label);
			
			if (label) {
				label = this.languageService.translate(label);
				breadcrumbs.push({ label, link: accumulatedLink });
				this.logger.info('Pushed breadcrumb', { label, link: accumulatedLink });
			}
			
			if (childToFollow === currentRoute) {
				this.logger.warn('childToFollow equals currentRoute — breaking to avoid loop');
				break;
			}
			currentRoute = childToFollow;
		}
		
		this.logger.debug('Final breadcrumbs array', breadcrumbs);
		this.logger.debug('buildBreadcrumb END');
		
		return breadcrumbs;
	}
}
import { ChangeDetectionStrategy, Component, computed, Inject, input, OnDestroy, viewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BreadcrumbItem,
  NavigableItem,
  OffcanvasComponent,
  SidebarNavigableItem,
  VisibilityEvent,
} from '@open-rlb/ng-bootstrap';
import { filter, Subscription } from 'rxjs';
import { EnvironmentConfiguration, RLB_CFG_ENV } from '../../configuration';
import { AppInfo, AppsService } from '../../services';
import {
  appContextFeatureKey,
  AuthActions,
  BaseState,
  NavbarActions,
  SidebarActions,
} from '../../store';
import { navbarsFeatureKey } from '../../store/navbar/navbar.model';
import { sidebarsFeatureKey } from '../../store/sidebar/sidebar.model';
import { AuthenticationService } from '../../auth/services/auth.service';
import { NavigationEnd, Router } from '@angular/router';
import { SettingsDropdownSelectorComponent } from '../../pages/settings/settings-dropdown-selector/settings-dropdown-selector.component';

@Component({
  selector: 'rlb-app-template',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppTemplateComponent implements OnDestroy {
  protected readonly Array = Array;
  private navbarItemsSubscription: Subscription | undefined;
  private sidebarItemsSubscription: Subscription | undefined;
  private sidebarFooterItemsSubscription: Subscription | undefined;
  public navSearchText: string | null = null;
  public navbarItems: NavigableItem[] = [];
  public sidebarItems: NavigableItem[] = [];
  public sidebarFooterItems: NavigableItem[] = [];

  readonly modalContainerId = input.required<string>({ alias: 'modal-container-id' });
  readonly breadcrumbInput = input<BreadcrumbItem[] | undefined>(undefined, { alias: 'breadcrumb' });
  readonly breadcrumb = computed(() => this.breadcrumbInput() ?? []);
  readonly toastContainerIds = input.required<string | string[]>({ alias: 'toast-container-ids' });

  readonly mobileOffcanvas = viewChild<OffcanvasComponent>('mobileOffcanvas');
  readonly mobileSettingsMenu = viewChild<SettingsDropdownSelectorComponent>('mobileSettingsMenu');

  readonly theme = this.store.selectSignal(state => state[appContextFeatureKey].theme);
  readonly apps = computed(() => this.appsService.apps.filter(app => app.enabled && app.id));

  constructor(
    @Inject(RLB_CFG_ENV) public env: EnvironmentConfiguration,
    public store: Store<BaseState>,
    public appsService: AppsService,
    private readonly authService: AuthenticationService,
    private readonly router: Router,
  ) {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.closeMobileMenu();
    });
  }

  ngOnDestroy(): void {
    this.navbarItemsSubscription?.unsubscribe();
    this.sidebarItemsSubscription?.unsubscribe();
    this.sidebarFooterItemsSubscription?.unsubscribe();
  }

  get sidebarVisible$() {
    return this.store.select(state => state[sidebarsFeatureKey].visible);
  }

  get sidearHasLogin$() {
    return this.store.select(state => state[sidebarsFeatureKey].loginVisible);
  }

  get sidearHasSearch$() {
    return this.store.select(state => state[sidebarsFeatureKey].searchVisible);
  }

  get sidebarItems$() {
    return this.store.select(state => state[sidebarsFeatureKey].items);
  }

  setSidearSearchText(text: string | null) {
    this.store.dispatch(SidebarActions.setSearchText({ text }));
  }

  setNavbarSearchText(text: string | null) {
    this.store.dispatch(NavbarActions.setSearchText({ text }));
  }

  get sidearHasSettings$() {
    return this.store.select(state => state[sidebarsFeatureKey].settingsVisible);
  }

  get sidearAppsVisible$() {
    return this.store.select(state => state[sidebarsFeatureKey].appsVisible);
  }

  get navVisible$() {
    return this.store.select(state => state[navbarsFeatureKey].visible);
  }

  get navSearchVisible$() {
    return this.store.select(state => state[navbarsFeatureKey].searchVisible);
  }

  get navHeader$() {
    return this.store.select(state => state[navbarsFeatureKey].header);
  }

  get isAuthenticated$() {
    return this.authService.isAuthenticated$;
  }

  get user$() {
    return this.authService.userInfo$;
  }

  get navLeftItems$() {
    return this.store.select(state => state[navbarsFeatureKey].leftItems);
  }

  get navRightItems$() {
    return this.store.select(state => state[navbarsFeatureKey].rightItems);
  }

  get navbarHasLogin$() {
    return this.store.select(state => state[navbarsFeatureKey].loginVisible);
  }

  get navbarHasSettings$() {
    return this.store.select(state => state[navbarsFeatureKey].settingsVisible);
  }

  get navbarHasApps$() {
    return this.store.select(state => state[navbarsFeatureKey].appsVisible);
  }

  get navbarLayout$() {
    return this.store.select(state => state[navbarsFeatureKey].actionsLayout);
  }

  get separatorVisible$() {
    return this.store.select(state => state[navbarsFeatureKey].separatorVisible);
  }

  loginNav(event: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    this.store.dispatch(AuthActions.login());
  }

  onSideBarItemClick(item: SidebarNavigableItem) {
    if (item.externalUrl) {
      window.open(item.externalUrl, '_blank')?.focus();
    }
  }

  selectApp(app: AppInfo, viewMode: 'app' | 'settings') {
    this.appsService.selectApp(app, viewMode);
    this.closeMobileMenu();
  }

  onMobileMenuStatusChange(event: VisibilityEvent) {
    if (event === 'hidden') {
      this.mobileSettingsMenu()?.goToFirstSlide();
    }
  }

  private closeMobileMenu() {
    this.mobileOffcanvas()?.close();
  }
}


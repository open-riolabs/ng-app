import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, viewChild } from '@angular/core';
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
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'rlb-app-template',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppTemplateComponent {
  protected readonly Array = Array;
  public navSearchText: string | null = null;
  
  readonly modalContainerId = input.required<string>({ alias: 'modal-container-id' });
  readonly breadcrumbInput = input<BreadcrumbItem[] | undefined>(undefined, { alias: 'breadcrumb' });
  readonly breadcrumb = computed(() => this.breadcrumbInput() ?? []);
  readonly toastContainerIds = input.required<string | string[]>({ alias: 'toast-container-ids' });

  readonly mobileOffcanvas = viewChild<OffcanvasComponent>('mobileOffcanvas');
  readonly mobileSettingsMenu = viewChild<SettingsDropdownSelectorComponent>('mobileSettingsMenu');

  public readonly env = inject(RLB_CFG_ENV);
  public readonly store = inject(Store<BaseState>);
  public readonly appsService = inject(AppsService);
  private readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);

  readonly sidebarVisible = this.store.selectSignal((state: BaseState) => state[sidebarsFeatureKey].visible);
  readonly sidearHasLogin = this.store.selectSignal((state: BaseState) => state[sidebarsFeatureKey].loginVisible);
  readonly sidearHasSearch = this.store.selectSignal((state: BaseState) => state[sidebarsFeatureKey].searchVisible);
  readonly sidebarItems = this.store.selectSignal((state: BaseState) => state[sidebarsFeatureKey].items);
  readonly sidearHasSettings = this.store.selectSignal((state: BaseState) => state[sidebarsFeatureKey].settingsVisible);
  readonly sidearAppsVisible = this.store.selectSignal((state: BaseState) => state[sidebarsFeatureKey].appsVisible);

  readonly navVisible = this.store.selectSignal((state: BaseState) => state[navbarsFeatureKey].visible);
  readonly navSearchVisible = this.store.selectSignal((state: BaseState) => state[navbarsFeatureKey].searchVisible);
  readonly navHeader = this.store.selectSignal((state: BaseState) => state[navbarsFeatureKey].header);
  readonly navLeftItems = this.store.selectSignal((state: BaseState) => state[navbarsFeatureKey].leftItems);
  readonly navRightItems = this.store.selectSignal((state: BaseState) => state[navbarsFeatureKey].rightItems);
  readonly navbarHasLogin = this.store.selectSignal((state: BaseState) => state[navbarsFeatureKey].loginVisible);
  readonly navbarHasSettings = this.store.selectSignal((state: BaseState) => state[navbarsFeatureKey].settingsVisible);
  readonly navbarHasApps = this.store.selectSignal(state => state[navbarsFeatureKey].appsVisible);
  readonly navbarLayout = this.store.selectSignal(state => state[navbarsFeatureKey].actionsLayout);
  readonly separatorVisible = this.store.selectSignal(state => state[navbarsFeatureKey].separatorVisible);

  readonly isAuthenticated = toSignal(this.authService.isAuthenticated$, { initialValue: false });
  readonly userInfo = toSignal(this.authService.userInfo$, { initialValue: null });

  readonly theme = this.store.selectSignal(state => state[appContextFeatureKey].theme);
  readonly apps = computed(() => this.appsService.apps().filter((app: AppInfo) => app.enabled && app.id));

  constructor() {
    this.router.events.pipe(
      filter((event: any) => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => {
      this.closeMobileMenu();
    });
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

  setSidearSearchText(text: string | null) {
    this.store.dispatch(SidebarActions.setSearchText({ text }));
  }

  setNavbarSearchText(text: string | null) {
    this.store.dispatch(NavbarActions.setSearchText({ text }));
  }

  private closeMobileMenu() {
    this.mobileOffcanvas()?.close();
  }
}


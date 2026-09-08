import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  input,
  viewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BreadcrumbItem,
  ButtonComponent,
  InputComponent,
  InputGroupComponent,
  NavbarBrandDirective,
  NavbarComponent,
  NavbarFormComponent,
  NavbarItemComponent,
  NavbarItemsComponent,
  NavbarSeparatorComponent,
  OffcanvasBodyComponent,
  OffcanvasComponent,
  OffcanvasHeaderComponent,
  RlbFabComponent,
  SidebarComponent,
  SidebarItemComponent,
  SidebarNavigableItem,
  ToggleDirective,
  TooltipDirective,
  VisibilityEvent,
} from '@open-rlb/ng-bootstrap';
import { filter } from 'rxjs';
import { RLB_CFG_ENV, RLB_NAV_SURFACE } from '../../configuration';
import { AppInfo } from '../../services/apps/app';
import { AppsService } from '../../services/apps/apps.service';
import { hasPublicSettingsApps } from '../../services/apps/app-visibility';
import { appContextFeatureKey } from '../../store/app-context/app-context.model';
import { AuthActions } from '../../store/auth/auth.actions';
import { BaseState } from '../../store/base-state';
import { NavbarActions } from '../../store/navbar/navbar.actions';
import { SidebarActions } from '../../store/sidebar/sidebar.actions';
import { navbarsFeatureKey } from '../../store/navbar/navbar.model';
import { sidebarsFeatureKey } from '../../store/sidebar/sidebar.model';
import { AuthenticationService } from '../../auth/services/auth.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SettingsDropdownSelectorComponent } from '../../pages/settings/settings-dropdown-selector/settings-dropdown-selector.component';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LeftComponentPipe } from '../../pipes/left-component/left-component.pipe';
import { RightComponentPipe } from '../../pipes/right-component/right-component.pipe';
import { MobileComponentPipe } from '../../pipes/mobile-component/mobile-component.pipe';
import { SidebarFooterComponentPipe } from '../../pipes/sidebar-footer-component/sidebar-footer-component.pipe';
import { RlbRole } from '../../auth/directives/role.directive';
import { AppDropdownSelectorComponent } from '../../pages/apps/app-dropdown-selector/app-dropdown-selector.component';

@Component({
  selector: 'rlb-app-template',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    NgComponentOutlet,
    NavbarComponent,
    NavbarBrandDirective,
    NavbarFormComponent,
    NavbarItemsComponent,
    NavbarItemComponent,
    NavbarSeparatorComponent,
    SidebarComponent,
    SidebarItemComponent,
    OffcanvasComponent,
    OffcanvasHeaderComponent,
    OffcanvasBodyComponent,
    RlbFabComponent,
    InputGroupComponent,
    InputComponent,
    TooltipDirective,
    LeftComponentPipe,
    MobileComponentPipe,
    RightComponentPipe,
    SidebarFooterComponentPipe,
    RlbRole,
    AppDropdownSelectorComponent,
    SettingsDropdownSelectorComponent,
    ButtonComponent,
    ToggleDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppTemplateComponent {
  protected readonly Array = Array;
  public navSearchText: string | null = null;

  readonly modalContainerId = input.required<string>({ alias: 'modal-container-id' });
  readonly breadcrumbInput = input<BreadcrumbItem[] | undefined>(undefined, {
    alias: 'breadcrumb',
  });
  readonly breadcrumb = computed(() => this.breadcrumbInput() ?? []);
  readonly toastContainerIds = input.required<string | string[]>({ alias: 'toast-container-ids' });

  readonly mobileOffcanvas = viewChild<OffcanvasComponent>('mobileOffcanvas');
  readonly mobileSettingsMenu = viewChild<SettingsDropdownSelectorComponent>('mobileSettingsMenu');

  public readonly env = inject(RLB_CFG_ENV);
  public readonly store = inject(Store<BaseState>);
  public readonly appsService = inject(AppsService);
  private readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  // Lets one custom component serve both chrome surfaces: it injects RLB_NAV_SURFACE
  // (optional) and lays itself out accordingly.
  readonly navbarSurfaceInjector = Injector.create({
    providers: [{ provide: RLB_NAV_SURFACE, useValue: 'navbar' }],
    parent: this.injector,
  });
  readonly mobileSurfaceInjector = Injector.create({
    providers: [{ provide: RLB_NAV_SURFACE, useValue: 'mobile-menu' }],
    parent: this.injector,
  });

  readonly sidebarVisible = this.store.selectSignal(
    (state: BaseState) => state[sidebarsFeatureKey].visible,
  );
  readonly sidearHasLogin = this.store.selectSignal(
    (state: BaseState) => state[sidebarsFeatureKey].loginVisible,
  );
  readonly sidearHasSearch = this.store.selectSignal(
    (state: BaseState) => state[sidebarsFeatureKey].searchVisible,
  );
  readonly sidebarItems = this.store.selectSignal(
    (state: BaseState) => state[sidebarsFeatureKey].items,
  );
  readonly sidebarFooter = this.store.selectSignal(
    (state: BaseState) => state[sidebarsFeatureKey].footerComponent,
  );
  readonly sidearHasSettings = this.store.selectSignal(
    (state: BaseState) => state[sidebarsFeatureKey].settingsVisible,
  );
  readonly sidearAppsVisible = this.store.selectSignal(
    (state: BaseState) => state[sidebarsFeatureKey].appsVisible,
  );

  readonly navVisible = this.store.selectSignal(
    (state: BaseState) => state[navbarsFeatureKey].visible,
  );
  readonly navSearchVisible = this.store.selectSignal(
    (state: BaseState) => state[navbarsFeatureKey].searchVisible,
  );
  readonly navHeader = this.store.selectSignal(
    (state: BaseState) => state[navbarsFeatureKey].header,
  );
  readonly navLeftItems = this.store.selectSignal(
    (state: BaseState) => state[navbarsFeatureKey].leftItems,
  );
  readonly navRightItems = this.store.selectSignal(
    (state: BaseState) => state[navbarsFeatureKey].rightItems,
  );
  readonly navMobileItems = this.store.selectSignal(
    (state: BaseState) => state[navbarsFeatureKey].mobileItems,
  );
  readonly navbarHasLogin = this.store.selectSignal(
    (state: BaseState) => state[navbarsFeatureKey].loginVisible,
  );
  readonly navbarHasSettings = this.store.selectSignal(
    (state: BaseState) => state[navbarsFeatureKey].settingsVisible,
  );
  readonly navbarHasApps = this.store.selectSignal(state => state[navbarsFeatureKey].appsVisible);
  readonly navbarLayout = this.store.selectSignal(state => state[navbarsFeatureKey].actionsLayout);
  readonly separatorVisible = this.store.selectSignal(
    state => state[navbarsFeatureKey].separatorVisible,
  );

  readonly isAuthenticated = toSignal(this.authService.isAuthenticated$, { initialValue: false });
  readonly userInfo = toSignal(this.authService.userInfo$, { initialValue: null });

  readonly theme = this.store.selectSignal(state => state[appContextFeatureKey].theme);
  readonly apps = computed(() =>
    this.appsService.apps().filter((app: AppInfo) => app.enabled && app.id),
  );

  /**
   * Whether any registered app exposes settings that need no session.
   *
   * The chrome below is otherwise authenticated-only by design. This keeps the anonymous case
   * additive: with no public settings app — every consumer whose apps all declare `auth: true` —
   * this is false and the gates reduce to `isAuthenticated()`, exactly as before.
   */
  readonly hasPublicSettings = computed(() => hasPublicSettingsApps(this.apps()));

  /** Mirrors the mobile offcanvas body: false means the panel would render empty. */
  readonly mobileMenuHasContent = computed(
    () =>
      this.navMobileItems().length > 0 ||
      (this.navbarHasApps() && this.apps().length > 1) ||
      this.navbarHasSettings(),
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event: any) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
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

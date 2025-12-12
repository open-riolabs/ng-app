import { Component, Inject, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { NavigableItem, SidebarNavigableItem } from '@open-rlb/ng-bootstrap';
import { Subscription } from 'rxjs';
import { EnvironmentConfiguration, RLB_CFG_ENV } from '../../configuration';
import { AppsService } from '../../services';
import { appContextFeatureKey, AuthActions, BaseState, NavbarActions, SidebarActions } from '../../store';
import { navbarsFeatureKey } from '../../store/navbar/navbar.model';
import { sidebarsFeatureKey } from '../../store/sidebar/sidebar.model';
import { AuthenticationService } from '../../auth/services/auth.service';

@Component({
  selector: 'rlb-app-template',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false
})
export class AppTemplateComponent implements OnDestroy {

  private navbarItemsSubscription: Subscription | undefined;
  private sidebarItemsSubscription: Subscription | undefined;
  private sidebarFooterItemsSubscription: Subscription | undefined;
  public navSearchText: string | null = null;
  public navbarItems: NavigableItem[] = [];
  public sidebarItems: NavigableItem[] = [];
  public sidebarFooterItems: NavigableItem[] = [];

  @Input('modal-container-id') modalContainerId!: string;
  @Input('toast-container-ids') toastContainerIds!: string | string[];

  constructor(
    @Inject(RLB_CFG_ENV) public env: EnvironmentConfiguration,
    public store: Store<BaseState>,
    public appsService: AppsService,
    private readonly authService: AuthenticationService
  ) { }

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

  get isAuth$() {
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

  get theme() {
    return this.store.selectSignal(state => state[appContextFeatureKey].theme)();
  }

  get navbarHasLogin$() {
    return this.store.select(state => state[navbarsFeatureKey].loginVisible);
  }

  get navbarHasSettings$() {
    return this.store.select(state => state[navbarsFeatureKey].loginVisible);
  }

  get navbarHasApps$() {
    return this.store.select(state => state[navbarsFeatureKey].loginVisible);
  }

  get apps() {
    return this.appsService.apps;
  }

  get separatorVisible$() {
    return this.store.select(state => state[navbarsFeatureKey].separatorVisible);
  }

  loginNav(event: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    this.store.dispatch(AuthActions.login());
  }

  login(): void {
    this.store.dispatch(AuthActions.login());
  }

  onSideBarItemClick(item: SidebarNavigableItem) {
    if (item.externalUrl) {
      window.open(item.externalUrl, '_blank')?.focus();
    }
  }
}

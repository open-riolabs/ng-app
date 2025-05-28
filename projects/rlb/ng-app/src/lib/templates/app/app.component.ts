import { Component, Inject, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { NavigableItem } from '@rlb-core/lib-ng-bootstrap';
import { Subscription } from 'rxjs';
import { AppContextActions, AppTheme, AuthActions, BaseState, NavbarActions, SidebarActions, appContextFeatureKey, authsFeatureKey } from '../../../public-api';
import { EnvironmentConfiguration, RLB_CFG_ENV } from '../../configuration';
import { AppStorageService } from '../../services/utils/app-storage.service';
import { navbarsFeatureKey } from '../../store/navbar/navbar.model';
import { sidebarsFeatureKey } from '../../store/sidebar/sidebar.model';

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
    private storage: AppStorageService
  ) {
    const theme: AppTheme = (this.storage.readLocal('theme') || 'light') as AppTheme;
    this.store.dispatch(AppContextActions.setTheme({ theme }));
    this.store.dispatch(AppContextActions.setLanguage({ language: this.storage.readLocal('locale') || 'en' }));
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

  get isAuth$() {
    return this.store.select(state => state[authsFeatureKey].isAuth);
  }

  get user$() {
    return this.store.select(state => state[authsFeatureKey].user);
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

  loginNav(event: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    this.store.dispatch(AuthActions.login());
  }

  login(): void {
    this.store.dispatch(AuthActions.login());
  }
}


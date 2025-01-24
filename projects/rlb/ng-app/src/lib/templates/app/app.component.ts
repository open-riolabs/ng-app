import { Component, Inject, Input, OnDestroy, OnInit, Type } from '@angular/core';
import { Subscription } from 'rxjs';
import { EnvironmentConfiguration, RLB_CFG_ENV } from '../../configuration';
import { NavigableItem } from '@rlb/ng-bootstrap';
import { Store } from '@ngrx/store';
import { sidebarsFeatureKey } from '../../store/sidebar/sidebar.model';
import { navbarsFeatureKey } from '../../store/navbar/navbar.model';
import { AppContextActions, AppTheme, AuthActions, BaseState, NavbarActions, SidebarActions, appContextFeatureKey, authsFeatureKey } from '../../../public-api';
import { AppStorageService } from '../../services/utils/app-storage.service';
import { Router } from '@angular/router';
import { PwaUpdaterService } from '../../services/utils/pwa-updater.service';

@Component({
  selector: 'rlb-app',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false
})
export class AppTemplateComponent implements OnInit, OnDestroy {

  private navbarItemsSubscription: Subscription | undefined;
  private sidebarItemsSubscription: Subscription | undefined;
  private sidebarFooterItemsSubscription: Subscription | undefined;
  private swUpdateSubscription: Subscription | undefined;
  public navSearchText: string | null = null;
  public navbarItems: NavigableItem[] = [];
  public sidebarItems: NavigableItem[] = [];
  public sidebarFooterItems: NavigableItem[] = [];

  @Input() navbarComponents: Type<any>[] = [];

  constructor(
    @Inject(RLB_CFG_ENV) public env: EnvironmentConfiguration,
    public store: Store<BaseState>,
    private storage: AppStorageService,
    private readonly router: Router,
    private readonly pwaUpdaterService: PwaUpdaterService,
  ) {
    const theme: AppTheme = (this.storage.readLocal('theme') || 'light') as AppTheme;
    this.store.dispatch(AppContextActions.setTheme({ theme }));
    this.store.dispatch(AppContextActions.setLanguage({ language: this.storage.readLocal('locale') || 'en' }));
  }

  ngOnDestroy(): void {
    this.navbarItemsSubscription?.unsubscribe();
    this.sidebarItemsSubscription?.unsubscribe();
    this.sidebarFooterItemsSubscription?.unsubscribe();
    this.swUpdateSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    if (this.env.pwaUpdateEnabled) {
      this.swUpdateSubscription = this.pwaUpdaterService
        .checkWithDialog()
        .subscribe();
    }
  }

  @Input('modal-container-id') modalContainerId!: string;
  @Input('toast-container-ids') toastContainerIds!: string | string[];

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

  loginNav(event: MouseEvent){
    event?.preventDefault();
    event?.stopPropagation();
    this.store.dispatch(AuthActions.login());
  }

  login(): void {
    this.store.dispatch(AuthActions.login());
  }
}

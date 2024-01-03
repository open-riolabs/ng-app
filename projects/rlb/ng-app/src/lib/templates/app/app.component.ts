import { Component, ContentChild, DoCheck, Inject, Input, OnDestroy, OnInit, Type } from '@angular/core';
import { Subscription } from 'rxjs';
import { EnvironmentConfiguration, RLB_CFG_ENV } from '../../configuration';
import { NavigableItem } from '@rlb/ng-bootstrap';
import { AppsService } from '../../services/apps/apps.service';
import { Store } from '@ngrx/store';
import { sidebarsFeatureKey } from '../../store/sidebar/sidebar.model';
import { navbarsFeatureKey } from '../../store/navbar/navbar.model';
import { AuthActions, BaseState, NavbarActions, SidebarActions, authsFeatureKey } from '../../../public-api';

@Component({
  selector: 'rlb-app',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppTemplateComponent implements OnInit, OnDestroy {

  private navbarItemsSubscription: Subscription | undefined;
  private sidebarItemsSubscription: Subscription | undefined;
  private sidebarFooterItemsSubscription: Subscription | undefined;
  public navSearchText: string | null = null;
  public navbarItems: NavigableItem[] = [];
  public sidebarItems: NavigableItem[] = [];
  public sidebarFooterItems: NavigableItem[] = [];

  @Input() navbarComponents: Type<any>[] = [];

  constructor(
    @Inject(RLB_CFG_ENV) public env: EnvironmentConfiguration,
    public store: Store<BaseState>,
    private appsService: AppsService) { }

  ngOnDestroy(): void {
    this.navbarItemsSubscription?.unsubscribe();
    this.sidebarItemsSubscription?.unsubscribe();
    this.sidebarFooterItemsSubscription?.unsubscribe();
  }

  ngOnInit(): void {

  }

  @Input('modal-container-id') modalContainerId!: string;
  @Input('toast-container-ids') toastContainerIds!: string | string[];

  modalAppDialog() {
    this.appsService.chooseApp();
  }

  get sidearVisible$() {
    return this.store.select(state => state[sidebarsFeatureKey].visible);
  }

  get sidearHasLogin$() {
    return this.store.select(state => state[sidebarsFeatureKey].loginVisible);
  }

  get sidearHasSearch$() {
    return this.store.select(state => state[sidebarsFeatureKey].searchVisible);
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

  get navVisible$() {
    return this.store.select(state => state[navbarsFeatureKey].visible);
  }

  get navLoginVisible$() {
    return this.store.select(state => state[navbarsFeatureKey].loginVisible);
  }

  get navSearchVisible$() {
    return this.store.select(state => state[navbarsFeatureKey].searchVisible);
  }

  get navSettingsVisible$() {
    return this.store.select(state => state[navbarsFeatureKey].settingsVisible);
  }

  get navHeader$() {
    return this.store.select(state => state[navbarsFeatureKey].header);
  }

  get isAuth$() {
    return this.store.select(state => state[authsFeatureKey].isAuth);
  }

  login(): void {
    this.store.dispatch(AuthActions.login());
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

}

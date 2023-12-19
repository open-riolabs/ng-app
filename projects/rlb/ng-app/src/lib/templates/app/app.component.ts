import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EnvironmentConfiguration, RLB_CFG_ENV } from '../../configuration';
import { NavigableItem } from '@rlb/ng-bootstrap';
import { AppsService } from '../../services/apps/apps.service';
import { Store } from '@ngrx/store';
import { sidebarsFeatureKey } from '../../store/sidebar/sidebar.model';
import { navbarsFeatureKey } from '../../store/navbar/navbar.model';
import { BaseState } from '../../../public-api';

@Component({
  selector: 'rlb-app',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppTemplateComponent implements OnInit, OnDestroy {

  private navbarItemsSubscription: Subscription | undefined;
  private sidebarItemsSubscription: Subscription | undefined;
  private sidebarFooterItemsSubscription: Subscription | undefined;

  public navbarItems: NavigableItem[] = [];
  public sidebarItems: NavigableItem[] = [];
  public sidebarFooterItems: NavigableItem[] = [];

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
    return this.store.select(state => state[sidebarsFeatureKey].hasLogin);
  }

  get sidearHasSearch$() {
    return this.store.select(state => state[sidebarsFeatureKey].hasSearch);
  }

  get navbarVisible$() {
    return this.store.select(state => state[navbarsFeatureKey].visible);
  }

  get navbarHasLogin$() {
    return this.store.select(state => state[navbarsFeatureKey].hasLogin);
  }

  get navbarHasSearch$() {
    return this.store.select(state => state[navbarsFeatureKey].hasSearch);
  }
}

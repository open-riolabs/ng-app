import { NavbarService, SidebarService } from '../../services';
import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EnvironmentConfiguration, RLB_CFG_ENV } from '../../configuration';
import { ModalService, NavigableItem } from '@rlb/ng-bootstrap';
import { AppsService } from '../../services/apps/apps.service';

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
    private sidebarService: SidebarService,
    private appsService: AppsService,
    private navbarService: NavbarService) { }

  ngOnDestroy(): void {
    this.navbarItemsSubscription?.unsubscribe();
    this.sidebarItemsSubscription?.unsubscribe();
    this.sidebarFooterItemsSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.sidebarItemsSubscription = this.sidebarService.sidebarItems$.subscribe(items => this.sidebarItems = items);
    this.sidebarFooterItemsSubscription = this.sidebarService.sidebarFooterItems$.subscribe(items => this.sidebarFooterItems = items);
    this.navbarItemsSubscription = this.navbarService.navbarItems$.subscribe(items => this.navbarItems = items);
  }

  @Input('modal-container-id') modalContainerId!: string;
  @Input('toast-container-ids') toastContainerIds!: string | string[];

  modalAppDialog() {
    this.appsService.chooseApp();
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { appContextFeatureKey, BaseState } from '@lbdsh/lib-ng-app';
import { AppInfo } from '../../../projects/rlb/ng-app/src/lib/services/apps/app';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  title = 'Home';
  constructor(private readonly store: Store<BaseState>) { }

  app!: AppInfo | null;

  ngOnInit(): void {
    this.store.select(o => o[appContextFeatureKey].currentApp).subscribe(app => {
      this.app = app;
    });
  }
}

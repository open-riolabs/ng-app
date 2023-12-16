import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RlbAppModule, AuthenticationService } from '@rlb/ng-app';
import { Store } from '@ngrx/store';
import { Auth, AuthActions, AuthState, BaseState, SidebarActions, authsFeatureKey } from '../../projects/rlb/ng-store/src/public-api';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RlbAppModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'riolabs-mistral-web';

  constructor(private store: Store<BaseState>) { }

  login(): void {
    this.store.dispatch(AuthActions.login());
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  get auth(): Observable<Auth> {
    return this.store.select(o => o[authsFeatureKey]);
  }

  setSidebarVisible(visible: boolean): void {
    this.store.dispatch(SidebarActions.setVisible({ visible }));
  }

}

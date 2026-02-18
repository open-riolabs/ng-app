import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { permissionGuard } from "@open-rlb/ng-app";
import { ProtectedPageComponent } from "@/protected-page/protected-page.component";

export const routes: Routes = [{
	path: '',
	data: { template: 'app' },
	component: HomeComponent
},
	{
		path: 'chatto',
		component: HomeComponent
	},
	{
		path: 'settings/chatto',
		component: HomeComponent
	},
  {
    path: 'protected-page',
    component: ProtectedPageComponent,
    canActivate: [permissionGuard],
    data: { action: 'read-agency'}
  }
  ];

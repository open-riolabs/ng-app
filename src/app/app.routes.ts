import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

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
	}];

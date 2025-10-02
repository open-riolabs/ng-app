import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { TestComponent } from "@/home/test.component";
import { Test2Component } from "@/home/test2.component";
import { Test3Component } from "@/home/test3.component";

export const routes: Routes = [{
  path: '',
  data: { template: 'app', breadcrumb: 'Home' },
  component: HomeComponent,
	children: [
		{
			path: 'dashboard',
			component: TestComponent,
			data: { breadcrumb: 'Dashboard' },
			children: [
				{
					path: 'booking',
					component: Test2Component,
					data: { breadcrumb: 'Booking' },
					children: [
						{
							path: 'booking-info',
							component: Test3Component,
							data: { breadcrumb: 'Booking Info' },
						}
					]
				},
			],
		},
	],
},
{
  path: 'chatto',
  component: HomeComponent
},
{
  path: 'settings/chatto',
  component: HomeComponent
}];

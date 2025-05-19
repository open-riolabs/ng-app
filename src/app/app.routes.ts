import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [{
  path: '',
  component: HomeComponent
}, {
  path: 'apps',
  component: HomeComponent
},
{
  path: 'apps/:id',
  component: HomeComponent
}];

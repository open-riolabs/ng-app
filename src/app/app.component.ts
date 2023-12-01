import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RlbAppModule } from '@rlb/ng-app';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RlbAppModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'riolabs-mistral-web';
}

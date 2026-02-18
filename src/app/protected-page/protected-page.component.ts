import { Component } from '@angular/core';
import { RlbAppModule } from "@open-rlb/ng-app";

@Component({
  selector: 'app-protected-page',
  imports: [RlbAppModule],
  templateUrl: './protected-page.component.html',
  styleUrl: './protected-page.component.scss',
})
export class ProtectedPageComponent {

}

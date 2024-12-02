import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'rlb-cms-content',
    templateUrl: './cms-content.component.html',
    styleUrl: './cms-content.component.scss',
    standalone: false
})
export class CmsContentComponent {

  constructor(private route: ActivatedRoute) { }

  public get contentId() {
    return this.route.snapshot.params['id']
  }

}

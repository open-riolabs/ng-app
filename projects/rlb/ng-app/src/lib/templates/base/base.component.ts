import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { map, Observable, of, shareReplay } from 'rxjs';
import { BreadcrumbItem } from '@rlb-core/lib-ng-bootstrap';

@Component({
    selector: 'rlb-base-template',
    templateUrl: './base.component.html',
    styleUrls: ['./base.component.scss'],
    standalone: false
})
export class BaseComponent implements OnInit {

  constructor(
    private breakpointObserver: BreakpointObserver,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  @Input()
  breadcrumb: BreadcrumbItem[] | undefined;

  @Input()
  title!: string

  @Input()
  subtitle!: string

  get isHandset$(): Observable<boolean> {
    if (isPlatformServer(this.platformId)) {
      return of(true)
    } else {
      return this.breakpointObserver.observe(Breakpoints.Handset)
        .pipe(map(result => result.matches), shareReplay())
    }
  }

  ngOnInit() { }

}


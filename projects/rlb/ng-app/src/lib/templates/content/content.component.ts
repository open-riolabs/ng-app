import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, map, of, shareReplay } from 'rxjs';

@Component({
  selector: 'rlb-content-template',
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss'
})
export class ContentComponent {
  constructor(
    private breakpointObserver: BreakpointObserver,
    @Inject(PLATFORM_ID) private platformId: Object) { }

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

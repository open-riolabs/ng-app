import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { isPlatformServer } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, of } from 'rxjs';

@Component({
    selector: 'rlb-content-template',
    templateUrl: './content.component.html',
    styleUrl: './content.component.scss',
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentComponent implements OnInit {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isHandset = toSignal(
    isPlatformServer(this.platformId)
      ? of(true)
      : this.breakpointObserver.observe(Breakpoints.Handset).pipe(map(result => result.matches)),
    { initialValue: true }
  );

  constructor() { }

  ngOnInit() { }
}


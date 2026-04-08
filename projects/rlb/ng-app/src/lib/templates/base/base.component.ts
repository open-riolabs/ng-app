import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { isPlatformServer } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Inject, input, OnInit, PLATFORM_ID } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreadcrumbItem } from '@open-rlb/ng-bootstrap';
import { map, of } from 'rxjs';

@Component({
  selector: 'rlb-base-template',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseComponent implements OnInit {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly platformId = inject(PLATFORM_ID);

  readonly breadcrumbInput = input<BreadcrumbItem[] | undefined>(undefined, { alias: 'breadcrumb' });
  readonly breadcrumb = computed(() => this.breadcrumbInput() ?? []);
  readonly title = input.required<string>();

  readonly subtitle = input<string>();

  readonly isHandset = toSignal(
    isPlatformServer(this.platformId)
      ? of(true)
      : this.breakpointObserver.observe(Breakpoints.Handset).pipe(map(result => result.matches)),
    { initialValue: true }
  );

  constructor() { }

  ngOnInit() { }

}



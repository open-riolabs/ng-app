import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthenticationService } from '../services/auth.service';
import { ParseJwtService } from '../services/parse-jwt.service';
import { combineLatestWith, map, Subject, tap } from 'rxjs';

@Directive({
  selector: '[roles]',
  standalone: false
})
export class RlbRole implements OnInit {
  private allowedRoles: Subject<string[]> = new Subject<string[]>();
  private allowedRoles$ = this.allowedRoles.asObservable();
  constructor(
    private readonly templateRef: TemplateRef<any>,
    private readonly viewContainer: ViewContainerRef,
    private readonly authenticationService: AuthenticationService,
    private readonly parseJwtService: ParseJwtService,
  ) { }

  @Input() set roles(roles: string[]) {
    this.allowedRoles.next(roles);
  }

  private updateView() {
    return this.authenticationService.
      accessToken$.pipe(
        combineLatestWith(this.allowedRoles$),
        map(([token, roles]) => ([this.parseJwtService.parseJwt(token), roles])),
        map(([payload, roles]) => [payload['roles'] as string[], roles as string[]]),
        tap(([roles, allowedRoles]) => {
          if (allowedRoles.some(role => roles.includes(role))) {
            this.viewContainer.createEmbeddedView(this.templateRef);
          } else {
            this.viewContainer.clear();
          }
        }));
  }

  ngOnInit() {
    this.updateView().subscribe();
  }
}
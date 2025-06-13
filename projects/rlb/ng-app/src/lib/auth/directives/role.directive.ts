import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { map, tap } from 'rxjs';
import { AuthenticationService } from '../services/auth.service';
import { ParseJwtService } from '../services/parse-jwt.service';

@Directive({
  selector: '[roles]',
  standalone: false
})
export class RlbRole implements OnInit {

  constructor(
    private readonly templateRef: TemplateRef<any>,
    private readonly viewContainer: ViewContainerRef,
    private readonly authenticationService: AuthenticationService,
    private readonly parseJwtService: ParseJwtService,
  ) { }

  @Input() set roles(roles: string[] | string) {
    if (typeof roles === 'string') {
      if (roles.includes(',')) roles = roles.split(',').map(role => role.trim());
      else roles = [roles];
    }
  }

  private updateView() {
    return this.authenticationService.
      accessToken$.pipe(
        map(token => this.parseJwtService.parseJwt(token)),
        map(payload => this.authenticationService.currentProvider.roleClaim?.(payload) || []),
        tap(roles => {
          let valid = true;
          for (const role of this.roles) {
            if (roles.includes(role)) valid &&= true;
          }
          if (valid) {
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
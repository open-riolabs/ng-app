import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RlbTranslationService, UniqueIdService } from "@lbdsh/lib-ng-bootstrap";

@Injectable({ providedIn: 'root' })
export class RlbTranslateAdapterService implements RlbTranslationService {
	constructor(private translateService: TranslateService, private service: UniqueIdService) {}
	
	instant(key: string, params?: { [key: string]: any }): string {
		return this.translateService.instant(key, params);
	}
}
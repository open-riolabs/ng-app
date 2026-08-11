import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ParseJwtService {

  // `atob` rather than Node's `Buffer`, which is not defined in a browser: decoding a JWT with it
  // threw, taking `roles$` and `matchRoles` with it. Available in every browser and in Node >= 16.
  private _atob(string: string): string {
    return atob(string);
  }

  public parseJwt(token?: string) {
    if (token !== undefined && token !== null && token !== "") {
      var base64Url = token.split(".")[1];
      var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      var jsonPayload = decodeURIComponent(
        this._atob(base64)
          .split("")
          .map(c => ("%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } else {
      return {};
    }
  };
}

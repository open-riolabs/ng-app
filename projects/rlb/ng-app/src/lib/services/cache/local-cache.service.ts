import { Inject, Injectable, Optional } from '@angular/core';
import { Observable, of, share, switchMap } from 'rxjs'
import { CacheItem } from './cache-item';
import { ProjectConfiguration } from '../../configuration';

@Injectable({
  providedIn: 'root'
})
export class LocalCacheService {

  constructor(
    @Inject('options') @Optional() private options: ProjectConfiguration
  ) {
    this.clear()
  }

  private clear() {
    if (typeof localStorage !== 'undefined') {
      for (let i: number = 0; i < localStorage.length; i++) {
        const key: string = localStorage.key(i) || ''
        const val = localStorage.getItem(key)
        if (!val) continue
        try {
          const exp: CacheItem<any> = JSON.parse(val)
          if (Date.now() > exp?.expire) {
            localStorage.removeItem(key)
          }
        } catch (e) { }
      }
    }
  }

  private readData<T>(key: string): CacheItem<T> | null {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(key)
      if (!val) return null
      return JSON.parse(key)
    }
    return null;
  }

  private storeData<T>(key: string, data: CacheItem<T>): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data))
    }
  }

  public getData<T>(ob: Observable<T>, cacheKey: string, expirationSec: number): Observable<T> {
    const cachedValue = this.readData<T>(cacheKey)
    return of(cachedValue).pipe(switchMap(cache => {
      if (cache && cache.expire >= Date.now()) {
        if (!this.options.production) {
          console.info("%c Cache: " + cacheKey, 'background: #e5edff; color: #000')
        }
        return of(cache.data)
      } else {
        if (!this.options.production) {
          console.info("%c Cached: " + cacheKey, 'background: #e5edff; color: #000')
        }
        return ob.pipe(
          share(),
          switchMap(data => {
            this.storeData<T>(cacheKey, {
              data,
              expire: Date.now() + (expirationSec || 60) * 1000
            })
            return of(data)
          }))
      }
    }),
      share())
  }
}

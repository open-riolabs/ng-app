import { Inject, Injectable, Optional } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { FaqGroup, Home, MenuItem, Page, Tab, Topic, LocalCacheService } from '../'
import { Observable, from, lastValueFrom, map, switchMap, zip } from 'rxjs'
import { CmsConfiguration, RLB_CFG_CMS } from '../../configuration'


@Injectable({
  providedIn: 'root'
})
export class StrapiService {

  constructor(
    private http: HttpClient,
    private cache: LocalCacheService,
    @Inject(RLB_CFG_CMS) @Optional() private cmsOptions: CmsConfiguration) { }

  public fetchHome(lang: string, cid: string): Observable<Home> {
    const __r = this.http.get<Home>(`${this.cmsOptions.endpoint}/homes/${lang}/${cid}`)
    return this.cache.getData(__r, `strapiHome/${lang}/${cid}`, this.cmsOptions.chacheDuration || 3600)
  }

  public fetchTopic(id: string): Observable<Topic> {
    return this.http.get<Topic>(`${this.cmsOptions.endpoint}/topics/${id}`)
  }

  public fetchTab(id: string): Observable<Tab> {
    return this.http.get<Tab>(`${this.cmsOptions.endpoint}/tabs/${id}`)
  }

  public fetchFaqGroup(lang: string, cid: string): Observable<FaqGroup> {
    return this.http.get<FaqGroup>(`${this.cmsOptions.endpoint}/faq-groups/${lang}/${cid}`)
  }


  private async _getGuideMenuPromise(lang: string, cid: string): Promise<MenuItem> {
    const resp: MenuItem = (await lastValueFrom(this.http.get<MenuItem>(`${this.cmsOptions.endpoint}/menu-items/${lang}/${cid}`)))
    resp.menu_items = resp.menu_items.sort((a, b) => ((a.Order || Math.max()) > (b.Order || Math.max())) ? 1 : (((b.Order || Math.max()) > (a.Order || Math.max())) ? -1 : 0))
    const t = await Promise.all(resp.menu_items.map((o: any) => this._getGuideMenuPromise(lang, o.ContentId)))
    resp.menu_items = t.sort((a, b) => (a.Order || Math.max() > b.Order || Math.max()) ? 1 : ((b.Order || Math.max() > a.Order || Math.max()) ? -1 : 0))
    return resp
  }

  public getGuideMenu(lang: string, cid: string): Observable<MenuItem> {
    return this.cache.getData(from(this._getGuideMenuPromise(lang, cid)), `strapiMenu/${lang}/${cid}`, this.cmsOptions.chacheDuration || 3600)
  }

  // public getGuideMenu2(lang: string, cid: string): Observable<MenuItem> {
  //   var __r = this.http.get<MenuItem>(`${this.cmsOptions.endpoint}/menu-items/${lang}/${cid}`)
  //     .pipe(
  //       switchMap(menuItem => {
  //         if (menuItem.menu_items.length == 0)
  //           return of(menuItem)
  //         menuItem.menu_items = menuItem.menu_items
  //           .sort((a, b) => ((a.Order || Math.max()) > (b.Order || Math.max())) ? 1 : (((b.Order || Math.max()) > (a.Order || Math.max())) ? -1 : 0))
  //         return zip(menuItem.menu_items.map(menuSub => this.getGuideMenu(lang, menuSub.ContentId)))
  //           .pipe(map(menuSubItems => {
  //             menuItem.menu_items = menuSubItems
  //             return menuItem
  //           }))
  //       }))
  //   return this.cache.getData(__r, `strapiMenu/${lang}/${cid}`, this.cmsOptions.chacheDuration)
  // }

  public fetchPage(lang: string, cid: string): Observable<Page> {
    const __r = this.http.get<Page>(`${this.cmsOptions.endpoint}/pages/${lang}/${cid}`)
      .pipe(switchMap(page => {
        const tabs$ = zip(page.page_tabs.map((o: Tab) => this.fetchTab(o.id)))
        const topics$ = zip(page.topics.map((o: Topic) => this.fetchTopic(o.id)))
        return zip(tabs$, topics$).pipe(map(([tabs, topics]) => {
          page.page_tabs = tabs
          page.topics = topics
          return page
        }))
      }))
    return this.cache.getData(__r, `strapiPage/${lang}/${cid}`, this.cmsOptions.chacheDuration || 3600)
  }
}
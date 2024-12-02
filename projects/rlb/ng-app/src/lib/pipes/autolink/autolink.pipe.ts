import { Pipe, PipeTransform } from '@angular/core';

const pattern =
  /(^|[\s\n]|<[A-Za-z]*\/?>)((?:https?|ftp):\/\/[\-A-Z0-9+\u0026\u2019@#\/%?=()~_|!:,.;]*[\-A-Z0-9+\u0026@#\/%=~()_|])/gi;

@Pipe({
    name: 'autolink',
    standalone: false
})
export class AutolinkPipe implements PipeTransform {
  transform(
    value?: string,
    target?: string,
    rel?: string,
    id?: string,
  ): string {
    if (!value) {
      return '';
    }
    value = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const _target: string = target ? `target="${target}"` : '';
    const _rel: string = rel ? `rel="${rel}"` : '';
    const _id: string = id ? `id="${id}"` : '';
    const linkAttributes = [_target, _rel, _id].join(' ').trim();
    return value.replace(pattern, function (match, space, url) {
      const link =
        "<a href='" + url + "'" + linkAttributes + '>' + url + '</a>';
      return '' + space + link;
    });
  }
}

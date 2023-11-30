import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  public isNumber(evt: any) {
    evt = evt || window.event
    const charCode = evt.which ? evt.which : evt.keyCode
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 46) {
      evt.preventDefault()
      return false
    } else {
      return true
    }
  }

  public toPlainDataObject(o: ({ [k: string]: any } | { [k: string]: any }[])): any {
    if (o !== null && o != undefined) {
      if (Array.isArray(o)) {
        return o.map(j => this.toPlainDataObject(j))
      } else if (typeof o === 'object') {
        return Object.getOwnPropertyNames(o).reduce((result: { [k: string]: any }, name) => {
          if (name !== '__ob__') result[name] = this.toPlainDataObject(o[name])
          return result
        }, {})
      } else if (typeof o === 'function' || typeof o === 'undefined') {
        return undefined
      } else {
        return o
      }
    }
  }

  public groupBy<T>(xs: T[], predicate: (o: T) => string) {
    return xs.reduce((rv, x) => {
      ; (rv[predicate(x)] = rv[predicate(x)] || []).push(x)
      return rv
    }, {} as { [i: string]: T[] })
  }



  private s(x: any, y: any): number {
    var pre = ['string', 'number', 'bool']
    if (typeof x !== typeof y) return pre.indexOf(typeof y) - pre.indexOf(typeof x)

    if (x === y) return 0
    else return x > y ? 1 : -1
  }

  public compareArrayUnsort(a1: any, a2: any): boolean {
    if (!Array.isArray(a1)) return false
    if (!Array.isArray(a2)) return false
    if (a1.length != a2.length) return false
    a1 = a1.sort(this.s)
    a2 = a2.sort(this.s)
    for (var i = 0, l = a1.length; i < l; i++) {
      if (Array.isArray(a1[i]) && Array.isArray(a2[i])) {
        if (!this.compareArrayUnsort(a1[i], a2[i])) return false
      } else if (a1[i] != a2[i]) {
        // Warning - two different object instances will never be equal: {x:20} != {x:20}
        return false
      }
    }
    return true
  }

  public removeMD(
    md: string,
    options?: { listUnicodeChar?: string; stripListLeaders?: boolean; useImgAltText?: boolean; gfm?: boolean }
  ) {
    options = options || {}
    options.listUnicodeChar = options.hasOwnProperty('listUnicodeChar') ? options.listUnicodeChar : undefined
    options.stripListLeaders = options.hasOwnProperty('stripListLeaders') ? options.stripListLeaders : true
    options.gfm = options.hasOwnProperty('gfm') ? options.gfm : true
    options.useImgAltText = options.hasOwnProperty('useImgAltText') ? options.useImgAltText : true

    var output = md || ''

    // Remove horizontal rules (stripListHeaders conflict with this rule, which is why it has been moved to the top)
    output = output.replace(/^(-\s*?|\*\s*?|_\s*?){3,}\s*$/gm, '')

    try {
      if (options.stripListLeaders) {
        if (options.listUnicodeChar)
          output = output.replace(/^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm, options.listUnicodeChar + ' $1')
        else output = output.replace(/^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm, '$1')
      }
      if (options.gfm) {
        output = output
          // Header
          .replace(/\n={2,}/g, '\n')
          // Fenced codeblocks
          .replace(/~{3}.*\n/g, '')
          // Strikethrough
          .replace(/~~/g, '')
          // Fenced codeblocks
          .replace(/`{3}.*\n/g, '')
      }
      output = output
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove setext-style headers
        .replace(/^[=\-]{2,}\s*$/g, '')
        // Remove footnotes?
        .replace(/\[\^.+?\](\: .*?$)?/g, '')
        .replace(/\s{0,2}\[.*?\]: .*?$/g, '')
        // Remove images
        .replace(/\!\[(.*?)\][\[\(].*?[\]\)]/g, options.useImgAltText ? '$1' : '')
        // Remove inline links
        .replace(/\[(.*?)\][\[\(].*?[\]\)]/g, '$1')
        // Remove blockquotes
        .replace(/^\s{0,3}>\s?/g, '')
        // Remove reference-style links?
        .replace(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, '')
        // Remove atx-style headers
        .replace(/^(\n)?\s{0,}#{1,6}\s+| {0,}(\n)?\s{0,}#{0,} {0,}(\n)?\s{0,}$/gm, '$1$2$3')
        // Remove emphasis (repeat the line to remove double emphasis)
        .replace(/([\*_]{1,3})(\S.*?\S{0,1})\1/g, '$2')
        .replace(/([\*_]{1,3})(\S.*?\S{0,1})\1/g, '$2')
        // Remove code blocks
        .replace(/(`{3,})(.*?)\1/gm, '$2')
        // Remove inline code
        .replace(/`(.+?)`/g, '$1')
        // Replace two or more newlines with exactly two? Not entirely sure this belongs here...
        .replace(/\n{2,}/g, '\n\n')
    } catch (e) {
      console.error(e)
      return md
    }
    return output
  }

  public floatStr(input: string | number) {
    if (input) {
      if (typeof input === 'number') {
        input = input.toString()
      }
      return parseFloat(input.replace(',', '.')).toFixed(2)
    }
    return '0.00'
  }
}

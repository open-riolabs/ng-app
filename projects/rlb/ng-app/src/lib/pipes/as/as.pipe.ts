import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'asMulti' })
export class AsMultiPipe implements PipeTransform {

  transform<T>(value: T | T[]): T[] {
    if(!Array.isArray(value)) {
      return [value];
    }
    return value as T[];
  }
}

@Pipe({ name: 'asSingle' })
export class AsSinglePipe implements PipeTransform {

  transform<T>(value: T | T[]): T {
    if(Array.isArray(value)) {
      return value[0];
    }
    return value as T;
  }
}

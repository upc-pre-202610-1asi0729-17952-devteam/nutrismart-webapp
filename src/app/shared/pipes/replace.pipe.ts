import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replace',
  standalone: true,
})
export class ReplacePipe implements PipeTransform {
  /**
   * Replaces all occurrences of a substring in a string.
   * @param value The input string.
   * @param search The substring to search for.
   * @param replace The string to replace with.
   * @returns The string with replacements.
   */
  transform(value: string, search: string, replace: string): string {
    if (!value) {
      return '';
    }
    // Use a global regex to replace all occurrences
    return value.replace(new RegExp(search, 'g'), replace);
  }
}

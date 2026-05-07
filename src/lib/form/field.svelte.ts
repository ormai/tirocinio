import type { LocalizedString } from '@inlang/paraglide-js';

/**
 * Given an input field validates it, returning `false` if valid or a feedback
 * string explaining why it is invalid and giving advice for a fix.
 */
type Validator = (input: HTMLInputElement) => LocalizedString | false;

export const passwordRegExp = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!#$%&"'()*+,\-./:;<=>?@[\\\]^_`|~]).{10,}$/;

/**
 * Interaction logic for an input field in a form.
 */
export class Field {
  private input = $state<HTMLInputElement>();
  private _error: string = $state('');

  private _dirty: boolean = $state(false);

  get error() {
    return this._error;
  }

  get dirty() {
    return this._dirty;
  }

  /**
   * @param validators {Validator[]} used to validate the value of the field
   * @param onClearServerErrors {() => void} callback to clear server errors on input, defaults to no-op.
   */
  constructor(private validators: Validator[] = [], private onClearServerErrors: () => void = () => {}) {}

  validate() {
    if (!this.input) return;
    for (const validator of this.validators) {
      const feedback = validator(this.input);
      if (feedback) {
        this._error = feedback;
        if (this._dirty) {
          this.input.dataset.valid = 'false';
        }
        return;
      }
    }
    this._error = '';
    if (this._dirty) {
      this.input.dataset.valid = 'true';
    }
  }

  /**
   * Attaches to an input element to enable live validation.
   *
   * Note: this method is declared as an arrow function property so that passing its reference to
   * `@attach`, the internal reference to `this` is not lost.
   *
   * @example
   *
   * ```svelte
   * <script lang="ts">
   *   const name = new Field([(i) => i.validity.valueMissing && 'Name required'], () => {});
   * </script>
   *
   * <label for="name">Name</label>
   * <input id="name" name="name" {@attach name.attach} />
   * {#if name.dirty && name.error}<span class="error">{name.error}</span>{/if}
   * ```
   */
  attach = (input: HTMLInputElement): () => void => {
    this.input = input;

    const onInput = () => {
      this.onClearServerErrors();
      if (this._dirty) {
        this.validate();
      }
    };

    const onBlur = () => {
      this._dirty = true;
      this.validate();
    };

    input.addEventListener('input', onInput);
    input.addEventListener('blur', onBlur);

    return () => {
      input.removeEventListener('input', onInput);
      input.removeEventListener('blur', onBlur);
      this._error = '';
      this._dirty = false;
      this.input = undefined;
    };
  };

  /** Validates and marks dirty before submit. Used in enhance. */
  touch() {
    this._dirty = true;
    this.validate();
  }

  get valid(): boolean {
    return this._error === '';
  }
}

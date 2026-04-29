import type { LocalizedString } from '@inlang/paraglide-js';

type Validator = (input:HTMLInputElement) => LocalizedString | false;

export const passwordRegExp = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!#$%&"'()*+,\-./:;<=>?@[\\\]^_`|~]).{10,}$/;

export class Field {
  #input = $state<HTMLInputElement>();
  #validators: Validator[];
  #onClearServerErrors: () => void;

  error: string = $state('');
  dirty: boolean = $state(false);

  constructor(validators: Validator[], onClearServerErrors: () => void) {
    this.#validators = validators;
    this.#onClearServerErrors = onClearServerErrors;
  }

  validate() {
    if (!this.#input) return;
    for (const validator of this.#validators) {
      const feedback = validator(this.#input);
      if (feedback) {
        this.error = feedback;
        if (this.dirty) {
          this.#input.dataset.valid = 'false';
        }
        return;
      }
    }
    this.error = '';
    if (this.dirty) {
      this.#input.dataset.valid = 'true';
    }
  }

  /** Attaches to an input element */
  attach = (input: HTMLInputElement): (() => void) => {
    this.#input = input;

    const onInput = () => {
      this.#onClearServerErrors();
      if (this.dirty) {
        this.validate();
      }
    };

    const onBlur = () => {
      this.dirty = true;
      this.validate();
    };

    input.addEventListener('input', onInput);
    input.addEventListener('blur', onBlur);

    return () => {
        input.removeEventListener('input', onInput);
        input.removeEventListener('blur', onBlur);
        this.error = '';
        this.dirty = false;
        this.#input = undefined;
    };
  }

  /** Validates and marks dirty before submit. Used in enhance. */
  touch() {
    this.dirty = true;
    this.validate();
  }

  get valid(): boolean {
    return this.error === '';
  }
}

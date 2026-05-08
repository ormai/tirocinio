import type { LocalizedString } from '@inlang/paraglide-js';

/**
 * Given an input field, the Validator validates it, returning `false` if valid or a feedback
 * string explaining why it is invalid and giving advice for a fix, to be displayed in UI.
 */
type Validator = (input: HTMLInputElement) => LocalizedString | false;

/**
 * A valid password has at least
 * - one uppercase letter (A-Z)
 * - one lowercase letter (a-z)
 * - one digit (0-9)
 * - one symbol among !#$%&"'()*+,-./\:;<=>?@[]^_`|~
 * - ten characters
 */
export const passwordRegExp = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!#$%&"'()*+,\-./:;<=>?@[\\\]^_`|~]).{10,}$/;

/**
 * Interaction logic for an input field in a form.
 */
export class Field {
  private input?: HTMLInputElement = $state();

  /**
   * Whether the field is valid or not according to the constraints defined in its constructor.
   */
  get valid(): boolean {
    return this._error === '';
  }

  private _error: string = $state('');

  /**
   * @returns {string} feedback message about the current invalid state of the field as **reactive
   * state**. The empty string `''` stands for a valid field.
   */
  get error(): string {
    return this._error;
  }

  private _dirty: boolean = $state(false);

  /**
   * @returns {boolean} Wether the field was _touched_ interactively by the user. Returns **reactive
   * state**.
   */
  get dirty(): boolean {
    return this._dirty;
  }

  private _value = $state('');

  /**
   * The content of the `value` property of {@link HTMLInputElement} as **reactive state** that is
   * updated when the `input` event fires on the element.
   */
  get value(): string {
    return this._value;
  }

  /**
   * Update the `value` property of the inner {@link HTMLInputElement}.
   */
  set value(value: string | undefined | null) {
    if (this.input) {
      this.input.value = value ?? '';
    } else {
      console.warn('Attempt to mutate a Field that is not attached to the DOM');
    }
  }

  /**
   * @param validators {Validator[]} used to validate the value of the field
   * @param onClearServerErrors {() => void} callback to clear server errors on input, defaults to no-op.
   */
  constructor(
    private readonly validators: Validator[] = [],
    private readonly onClearServerErrors: () => void = () => {},
  ) {}

  /**
   * Applies the constrains passed in the constructor, **in order**, stopping at the first one that
   * results to be violated. This method will update the feedback message and mutate the DOM to
   * display it.
   */
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
      if (this.input) {
        this._value = this.input.value;
      }
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
      this.reset();
      this.input = undefined;
    };
  };

  /**
  Validates and marks dirty before submit. Used on the `onSubmit` callback passed to
   * Svelte's `enhance`.
   */
  touch() {
    this._dirty = true;
    this.validate();
  }

  /**
   * Flushes the validation state. This action is the inverse & opposite of [this.touch].
   */
  reset() {
    this._error = '';
    this._dirty = false;
  }

  /**
   * Flushes the state of the field and sets an optional value.
   */
  resetTo(value: string | undefined | null = '') {
    this.value = value ?? '';
    this.reset();
  }
}

/**
 * Utilities for validating inputs.
 *
 * We rely on the standard constraint validation API. We extend it with custom
 * validation and integrate it with Svelte' progressive enhancement of forms.
 *
 * With progressive enhancement, in the absence of JavaScript the form will
 * still be submitted and the browser's native constraint validation API will work.
 *
 * Our customization is about specifying custom validation messages, and
 * displaying them without the browser's default floating bubble.
 *
 * @see https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation
 */

import { m } from "$lib/paraglide/messages";

export interface Error {
  /**
   * @field value {string} the error feedback to display.
   */
  value: string;
}

// Regular expression for email validation as per HTML specification
const passwordRegExp =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!#$%&"'()*+,\-./:;<=>?@[\\\]^_`{|}~])[A-Za-z\d!#$%&"'()*+,\-./:;<=>?@[\\\]^_`{|}~]{10,}$/;

/**
 * Checks whether an email is valid.
 *
 * @param value {HTMLInputElement} - The email input element to validate.
 * @returns {string | null} A localized feedback error message or the empty string if the input is valid.
 */
export function emailValidator(input: HTMLInputElement): string {
  if (input.validity.valueMissing) {
    return m.email_validity_missing();
  } else if (input.validity.typeMismatch) {
    return m.email_validity_type();
  }
  return "";
}

/**
 * Checks whether a password is valid.
 *
 * @param input {string | null | undefined} - The password to validate.
 * @returns {string | null} A localized feedback error message or the empty string if the input is valid.
 */
export function passwordValidator(input: HTMLInputElement): string {
  if (input.validity.valueMissing) {
    return m.password_validity_missing();
  } else if (input.validity.tooShort) {
    return m.password_validity_too_short({ min: input.minLength, current: input.value.length });
  } else if (input.validity.tooLong) {
    return m.password_validity_too_long({ max: input.maxLength, current: input.value.length });
  } else if (!passwordRegExp.test(input.value)) {
    return m.password_validity_pattern();
  }
  return "";
}

/**
 * An attachment to validate HTML input elements.
 */
export function validation(
  input: HTMLInputElement,
  validator: (input: HTMLInputElement) => string,
  error: Error,
) {
  let validateOnInput = $state(false);

  function validate() {
    input.setCustomValidity(validator(input));
    error.value = input.validationMessage;
  }

  input.addEventListener("invalid", () => {
    validateOnInput = true;
    validate();
  });

  input.addEventListener("input", () => {
    if (validateOnInput) {
      validate();
    }
  });

  input.addEventListener("blur", () => {
    if (input.value.length > 0) {
      validateOnInput = true;
      validate();
    }
  });
}

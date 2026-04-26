/**
 * Utilities for validating inputs.
 *
 * We rely on the standard constraint validation API. We extend it with custom
 * validation and integrate it with Svelte's progressive enhancement of forms.
 *
 * With progressive enhancement, in the absence of JavaScript the form will
 * still be submit and the browser's native constraint validation API will work.
 *
 * Our customization is about specifying custom validation messages, and
 * displaying them without the browser's default floating bubble.
 *
 * @see https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation
 */

export interface Error {
	/**
	 * @field value {string} the error feedback to display.
	 */
	value: string;
}

// Regular expression for email validation as per HTML specification
const passwordRegExp =
	/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!#$%&"'()*+,\-./:;<=>?@\[\\\]^_`{|}~])[A-Za-z\d!#$%&"'()*+,\-./:;<=>?@\[\\\]^_`{|}~]{10,}$/;

/**
 * Checks whether an email is valid.
 *
 * @param value {HTMLInputElement} - The email input element to validate.
 * @returns {string | null} A localized feedback error message or the empty string if the input is valid.
 */
export function validateEmail(input: HTMLInputElement): string {
	if (input.validity.valueMissing) {
		return 'Please provide your email';
	} else if (input.validity.typeMismatch) {
		return 'Email not valid';
	}
	return '';
}

/**
 * Checks whether a password is valid.
 *
 * @param input {string | null | undefined} - The password to validate.
 * @returns {string | null} A localized feedback error message or the empty string if the input is valid.
 */
export function validatePassword(input: HTMLInputElement): string {
	if (input.validity.valueMissing) {
		return 'Please provide your password';
	} else if (input.validity.tooShort) {
		return `Password must be at least ${input.minLength} characters long, yours has a length of ${input.value.length}`;
	} else if (input.validity.tooLong) {
		return `Password cannot be longer than ${input.maxLength} characters, yours has a length of ${input.value.length}`;
	} else if (!passwordRegExp.test(input.value)) {
		return 'Password must contain at least one uppercase letter, one lowercase letter, a digit, and symbol.';
	}
	return '';
}

/**
 * An attachment to validate HTMLInputElements.
 */
export function validator(
	input: HTMLInputElement,
	fn: (input: HTMLInputElement) => string,
	error: Error
) {
	let validateOnInput = $state(false);

	function validate() {
		input.setCustomValidity(fn(input));
		error.value = input.validationMessage;
	}

	input.addEventListener('invalid', () => {
		validateOnInput = true;
		validate();
	});

	input.addEventListener('input', () => {
		if (validateOnInput) {
			validate();
		}
	});

	input.addEventListener('blur', () => {
		if (input.value.length > 0) {
			validateOnInput = true;
			validate();
		}
	});
}

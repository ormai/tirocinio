import { applyAction } from '$app/forms';
import type { ActionResult } from '@sveltejs/kit';
import type { Field } from './field.svelte';

/**
 * An hook passed to Svelte's enhance that adds custom behavior to the submit life-cycle.
 *
 * @param before {() => void} action to execute synchronously before submitting the form.
 * @param after {() => Promise<void>} action to execute asynchronously after the server responded.
 * @param cancel {() => void} The callback provided by [enhance] to abort submission in case
          of validation failure.
 * @param fields {Array<Field>} the fields that make up the form that. They are touched and
          validated on submit.
 */
export default function onSubmit(
  cancel: () => void,
  fields: Field[],
  before: () => void,
  after: (result: ActionResult<Record<string, unknown>>) => Promise<void>,
):
  | (({ result }: { result: ActionResult<Record<string, unknown>> }) => Promise<void>)
  | undefined
{
  for (const field of fields) {
    field.touch();
  }
  if (!fields.every((field) => field.valid)) {
    cancel();
    return;
  }
  before();
  return async ({ result }) => {
    await applyAction(result);
    await after(result);
  };
}

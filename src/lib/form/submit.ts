import { applyAction, deserialize } from '$app/forms';
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

/**
 * Utility to manually submit a form without having to create it in HTML.
 *
 * @param action the action to submit the form to
 * @param data Arbitrary data to submit.
 * @returns The data returned by the form action on the server
 * @throws {ActionResult} if the request status code is not in range 200-299, or the type of the
 * `ActionResult` is not `'success'`.
 */
export async function sendForm(action: string, data: Record<string, string>): Promise<Record<string, unknown>> {
  const body = new FormData();
  for (const [name, value] of Object.entries(data)) {
    body.append(name, value);
  }
  const res = await fetch(action, { method: 'POST', body });
  const result = deserialize(await res.text()) as ActionResult;
  if (res.ok && result.type === 'success' && result.data) {
    return result.data;
  }
  throw result;
}

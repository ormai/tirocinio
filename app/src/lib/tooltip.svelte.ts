import tippy, { type Props } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';
import { untrack } from 'svelte';

/**
 * An attachment to give a tooltip to an element.
 *
 * @see https://atomiks.github.io/tippyjs/
 */
export function tooltip(opts: string | Partial<Props>) {
  return (node: HTMLElement) => {
    const props = typeof opts === 'string' ? { content: opts } : opts;
    props.theme ??= 'app';
    props.inertia ??= true;
    props.animation ??= 'shift-away';
    const instance = tippy(node, untrack(() => props));

    $effect(() => {
      const { content, ...rest } = props;
      if (content !== undefined) {
        instance.setContent(content);
      }
      if (Object.keys(rest).length) {
        instance.setProps(rest);
      }
      return instance.destroy
    });
  };
}

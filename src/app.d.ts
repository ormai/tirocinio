// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type Session from '$lib/server/session';
import type { AuthUser } from '$lib/server/user';

declare global {
  namespace App {
    interface Locals {
      user: AuthUser | null;
      session: Session | null;
    }
  }
}

export {};

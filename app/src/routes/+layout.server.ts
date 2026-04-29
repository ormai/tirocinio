// import { deleteSession, SESSION_COOKIE } from '$lib/server/session';
// import { redirect, type Actions } from '@sveltejs/kit';

// export const actions: Actions = {
//   signout: async ({cookies}) => {
//     const token = cookies.get(SESSION_COOKIE);
//     if (token) await deleteSession(token);
//     cookies.delete(SESSION_COOKIE, {path: '/'});
//     redirect(303, '/sign-in');
//   }
// }

# App

[Svelte](https://svelte.dev/).

## Building

- Running during development: `npm run dev -- --open`.
- Building a production version of the app `npm run build`. To preview the build use `npm run preview`.

## Deploying with Docker

1. Set up the `.env` file, using [`.env.example`](.env.example) as a starting point.
2. Run `docker compose up -d`. The app will be listening at `http://localhost:3000`.

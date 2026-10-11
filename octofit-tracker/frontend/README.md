# OctoFit Tracker – Frontend

React 19 + Vite + react-router-dom + Bootstrap. Runs on port 5173.

## Pages

`/activities`, `/leaderboard`, `/teams`, `/users`, `/workouts`. Each page fetches `/api/<resource>/` from the backend and accepts either a plain array or a paginated `{ results: [...] }` response.

## API base URL

The API base URL is built in [src/api.js](src/api.js) using Vite environment variables (`import.meta.env`):

- **`VITE_CODESPACE_NAME` must be defined** to use the Codespaces backend, for example in `octofit-tracker/frontend/.env.local`:

  ```env
  VITE_CODESPACE_NAME=your-codespace-name
  ```

  The API is then `https://$VITE_CODESPACE_NAME-8000.app.github.dev`. Find the name with `echo $CODESPACE_NAME`. See [.env.example](.env.example).
- If `VITE_CODESPACE_NAME` is unset (or invalid), the app falls back to `http://localhost:8000`.

Restart the dev server after changing `.env.local`.

## Scripts

```bash
npm run dev     # start Vite on 0.0.0.0:5173
npm run build   # production build
npm run lint    # oxlint
```

# OctoFit Tracker API

The Express and TypeScript logic tier serves the REST API on port `8000` and connects to the `octofit_db` MongoDB database.

## Run

Copy `.env.example` to `.env`, adjust `MONGODB_URI` if necessary, then run:

```sh
npm install
npm run dev
```

Set `PORT` to override the default port. The API starts after a successful MongoDB connection.

## Endpoints

- `GET /api/health`
- `GET|POST /api/users`, `GET|PATCH|DELETE /api/users/:id`
- `GET|POST /api/teams`, `GET|PATCH|DELETE /api/teams/:id`
- `GET|POST /api/activities`, `GET|PATCH|DELETE /api/activities/:id`
- `GET /api/leaderboard` (optionally filter by `?period=all-time`)
- `GET|POST /api/workouts`, `GET|PATCH|DELETE /api/workouts/:id`

Activity lists can be filtered with `?user=<user-id>`, and workout lists with `?difficulty=beginner|intermediate|advanced`. JSON request bodies are validated by the Mongoose schemas.

Logging, updating, or deleting an activity recalculates that user's all-time leaderboard score from their activity points. Deleting a user also removes their activities and leaderboard entry.

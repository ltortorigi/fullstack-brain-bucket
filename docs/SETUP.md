# HOTEL setup and verification

## Local (Windows PowerShell or a terminal)

Use Node.js 22 LTS (the MongoDB driver needs Node 20.19 or newer).

```sh
cd server
npm ci
cp .env.example .env
```

PowerShell also accepts `Copy-Item .env.example .env`. Edit `server/.env` locally and set `MONGODB_URI` to your Atlas connection string. Your existing `MONGO_URI` variable also works. Do not paste credentials into GitHub, screenshots, or chat.

Use `MONGODB_DB=hotel` to keep the existing `hotel.students` collection. Use separate database names such as `hotel_dev` and `hotel_prod` if you want independent deployment data. Give the Atlas database user read/write permission on the selected database and allow the deployment server through Atlas Network Access.

```sh
npm start
```

Open http://localhost:3000. Both `npm start` and `node app.js` start the same application. `mongo.js` now contains the reusable connection function; do not run it as a separate HTTP server. Set `PORT=5500` in `.env` if you want the earlier class port instead.

## Test

```sh
cd server
npm ci
npm test
```

The API tests start a real disposable local MongoDB with `mongodb-memory-server`. They do not use Atlas credentials or alter your data. The first run downloads a MongoDB binary. GitHub Actions runs the same tests on Ubuntu with Node 22. The tests check CRUD, filtering, identifiers, validation, JSON errors, static routes, and safe sample seeding/clearing. The persistence check reads the stored update through a separate MongoDB client. Three additional JSDOM tests exercise frontend CRUD actions, safe text rendering, missing-ID errors, and network-failure feedback.

## Development sample records

Set `ENABLE_DEV_TOOLS=true` and `NODE_ENV=development` in local `.env`, then restart. The page displays **Add samples** and **Clear samples**. The endpoints are `POST /api/dev/seed` and `DELETE /api/dev/clear`.

Seeding the same examples twice does not duplicate them. Clearing removes only records marked as demo records. The app disables both routes when `NODE_ENV=production`, even if the flag is true. There is no automatic seed or clear during deployment.

## Render DEV

For the existing Render service:

| Setting | Value |
| --- | --- |
| Branch | `dev` |
| Root directory | `server` |
| Build command | `npm ci --omit=dev` |
| Start command | `npm start` |
| Health check path | `/api/health` |
| Node version environment variable | `NODE_VERSION=22` |
| Environment | `MONGODB_URI` (secret), `MONGODB_DB`, `NODE_ENV=production` |

Render supplies `PORT`; do not force the GCP port there. If the existing service has no root directory, use build `cd server && npm ci --omit=dev` and start `cd server && npm start` instead.

A green `/api/health` response requires a successful database ping. HTTP 200 from `/api/hello` alone does not verify MongoDB.

## GCP PROD

The workflow uses the existing `SSH_PRIVATE_KEY` GitHub secret, user `logantort23`, host `34.174.105.215`, and app directory `~/app/fullstack-brain-bucket.app/server`.

Before deployment, create `server/.env` on the VM and set `MONGODB_URI` (or the existing `MONGO_URI`) and `MONGODB_DB`. The file is ignored by Git and preserved by fast-forward updates. Keep Node 22 and PM2 installed. Nginx should proxy the existing domain to port 3000.

The workflow runs tests, connects through SSH, updates `main`, installs production dependencies, verifies MongoDB connectivity, reloads the PM2 `app` process using `ecosystem.config.cjs`, and checks local plus public `/api/health`. If the database setup is missing, it stops before reloading PM2.

## Connection troubleshooting

Startup logs now include a fixed error category without printing the URI or password:

| Category | Check |
| --- | --- |
| `MONGO_PLACEHOLDER` | Replace example values and `<db_password>`; `MONGODB_URI` wins if both URI variables exist. |
| `MONGO_URI` | Paste only the complete URI, without `MONGO_URI=` or surrounding quotes; encode special password characters. |
| `MONGO_AUTH` | Check the Atlas database username and password. |
| `MONGO_PERMISSION` | Check the database user's access to the selected database. |
| `MONGO_DNS` | Check the Atlas hostname and whether the cluster is active. |
| `MONGO_TLS` | Check the host's TLS certificates and network. Keep certificate checks enabled. |
| `MONGO_NETWORK` | Check the host's Atlas IP access entries, cluster availability, and network connectivity. |

If it works locally but fails on Render, the computer and Render use different outbound IPs. In the Render service, select **Connect → Outbound** and copy the listed ranges. In the Atlas project, add those exact ranges to **Network Access → IP Access List**. A rule for the home computer alone does not cover Render. The ranges are shared with other Render services in the same region; database authentication still applies. Check [Render's outbound IP documentation](https://render.com/docs/outbound-ip-addresses) and [Atlas's IP access list documentation](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

## API contract

| Method | URL | Body / result |
| --- | --- | --- |
| GET | `/api/health` | Database status; 503 on failed ping |
| GET | `/api/hello` | Simple JSON greeting |
| GET | `/api/students` | Array of all records |
| GET | `/api/students?major=CIS` | Array matching an exact major |
| GET | `/api/students/:id` | One record; 404 if missing |
| POST | `/api/students` | `{ "name": "Alex Example", "major": "CIS", "notes": "Optional" }`; returns 201 |
| PATCH | `/api/students/:id` | One or more of name, major, notes |
| DELETE | `/api/students/:id` | Deleted ID and count |

`name` allows 1–100 characters, `major` 1–80, and `notes` 0–500. The server trims text, validates identifiers, rejects unknown fields, and never exposes database errors or credentials. Frontend records are inserted with `textContent`, not interpreted as HTML.

## Final grading checks

- [ ] Create a **HOTEL** milestone and assign issue #2 to it.
- [x] Feature PR #3 merged into `dev` after all 13 tests passed.
- [x] DEV `/api/health` shows `database: connected` (October 1, 2026).
- [x] Live DEV API: create a unique fictional student, list it, read by ID, filter its major, update it, read it again, and delete that same test record. See [VERIFICATION.md](VERIFICATION.md).
- [ ] Merge the `dev` → `main` PR after DEV verification.
- [ ] Link a successful HOTEL GCP workflow run in the grading dashboard.
- [ ] Repeat CRUD on PROD with a fictional record and remove only that record afterward.
- [ ] Close issue #2 when all acceptance criteria are verified.
- [ ] Keep the GCP VM available until graded.

Submit the repository URL once these live-environment checks are complete:
https://github.com/ltortorigi/fullstack-brain-bucket

# Fullstack Brain Bucket
> A student directory that saves your records, majors, and notes in MongoDB.

`@ltortorigi` | `2026-10-01` | `HOTEL`

## Deployments + codebase

| Resource | Direct link |
| --- | --- |
| PROD code | [main](https://github.com/ltortorigi/fullstack-brain-bucket/tree/main) |
| PROD application | [GCP application](https://logan.barrycumbie.com/) |
| DEV code | [dev](https://github.com/ltortorigi/fullstack-brain-bucket/tree/dev) |
| DEV application | [Render application](https://fullstack-brain-bucket-dj2n.onrender.com/) |
| Documentation | [Published docs](https://ltortorigi.github.io/fullstack-brain-bucket/) · [source](https://github.com/ltortorigi/fullstack-brain-bucket/blob/hotel/student-crud/docs/README.md) |
| CI/CD | [Tests](https://github.com/ltortorigi/fullstack-brain-bucket/blob/hotel/student-crud/.github/workflows/test.yml) · [GCP deployment](https://github.com/ltortorigi/fullstack-brain-bucket/blob/hotel/student-crud/.github/workflows/deploy-main-to-gcp.yml) |

## HOTEL grading dashboard

| Requirement | Evidence |
| --- | --- |
| MongoDB Atlas connection | [MongoDB driver, environment config, connection + ping](../server/mongo.js) |
| GET all | [GET /api/students](../server/routes.js) |
| GET one by identifier | [GET /api/students/:id and ObjectId validation](../server/routes.js) |
| Filtered GET | [GET /api/students?major=CIS](../server/routes.js) |
| POST / create | [POST /api/students](../server/routes.js) |
| PATCH / update | [PATCH /api/students/:id](../server/routes.js) |
| DELETE | [DELETE /api/students/:id](../server/routes.js) |
| Frontend fetch + DOM updates | [Client JavaScript](../public/assets/js/hotel.js) · [HTML](../public/hotel.html) |
| Persistent CRUD | [Real MongoDB integration tests](../server/test/api.test.js); live Atlas verification pending |
| Secrets excluded from Git | [.gitignore](../.gitignore) · [blank environment template](../server/.env.example) |
| HOTEL milestone | Pending creation and assignment to issue #2 |
| Feature issue | [Issue #2](https://github.com/ltortorigi/fullstack-brain-bucket/issues/2) |
| Development branch | [hotel/student-crud](https://github.com/ltortorigi/fullstack-brain-bucket/tree/hotel/student-crud) |
| Feature → dev | PR pending |
| dev → main | PR pending DEV verification |
| Successful HOTEL PROD deployment | Pending; do not use the older GOLF run as HOTEL evidence |

## Use the app

1. Enter a name and major, then choose **Add student**.
2. Use **Filter** for an exact major (case-sensitive), or **Show all**.
3. Choose **View** to fetch one record by its ID, **Edit** to update it, or **Delete** to remove it.
4. Refresh the page to confirm records persist. **Find a student by ID** also supports a pasted MongoDB identifier.
5. Expand **API activity** to inspect the latest JSON response.

The directory is a classroom CRUD demo without authentication. Use fictional sample records.

## Architecture

```mermaid
flowchart TD
  User[User] --> Client[HTML / CSS / JavaScript]
  Client -->|fetch + JSON| API[Express REST API]
  API -->|MongoDB Node driver| DB[MongoDB Atlas]
  DB -->|documents| API
  API -->|JSON| Client
```

Development flow: issue → feature branch → PR → dev → DEV test → PR → main → GitHub Actions → GCP / PM2 / Nginx.

Stack: HTML/CSS/JavaScript, Bootstrap 5, Bootstrap Icons, Node.js, Express 5, MongoDB Node.js Driver, Atlas, Git/GitHub, Render, GCP, PM2, Nginx, GitHub Actions.

## Setup + verification

See [SETUP.md](SETUP.md) for local, Render, and GCP setup, API examples, and the final deployment checklist.

The previous Brain Bucket idea-board files remain in `public/asdindex.html`, `public/pages/`, and `public/assets/`. The HOTEL directory is served at `/`, `/index.html`, and `/hotel.html`.

# Fullstack Brain Bucket — HOTEL

A simple Hat Collection web app. Enter a hat color and style, then save and manage records in MongoDB.

`@ltortorigi` | `2026-10-13` | `HOTEL`

## Deployments and project links

| Resource | Link |
| --- | --- |
| PROD app (GCP) | [logan.barrycumbie.com](https://logan.barrycumbie.com/) |
| DEV app (Render) | [fullstack-brain-bucket-dj2n.onrender.com](https://fullstack-brain-bucket-dj2n.onrender.com/) |
| PROD code | [main](https://github.com/ltortorigi/fullstack-brain-bucket/tree/main) |
| DEV code | [dev](https://github.com/ltortorigi/fullstack-brain-bucket/tree/dev) |
| Documentation | [GitHub Pages](https://ltortorigi.github.io/fullstack-brain-bucket/) |
| Grading dashboard | [docs/README.md](docs/README.md) |
| CI/CD | [GitHub Actions](https://github.com/ltortorigi/fullstack-brain-bucket/actions) |
| Feature issue | [Issue #2](https://github.com/ltortorigi/fullstack-brain-bucket/issues/2) |
| Feature PR | [PR #3](https://github.com/ltortorigi/fullstack-brain-bucket/pull/3) |
| Original PROD PR | [PR #4](https://github.com/ltortorigi/fullstack-brain-bucket/pull/4) |
| Hat Collection PROD PR | [PR #6](https://github.com/ltortorigi/fullstack-brain-bucket/pull/6) |

## How to use

1. Enter **Hat Color** (Ex: Black).
2. Enter **Hat Style** (Ex: Baseball Cap).
3. Click **Add hat** to save a record.
4. Use **View**, **Edit**, or **Delete** on saved hats.
5. Filter by hat style or select **Show all**. Refresh to check persistence.

This is a simple classroom CRUD application, not a shopping or hotel booking site.

## Technology and API

Frontend: HTML, CSS, JavaScript, Bootstrap. Backend: Node.js, Express, MongoDB Atlas.

The form uses only color and style. To preserve the existing working API and database structure, the backend stores **color in `name`** and **style in `major`**; `notes` is sent as an empty string. The existing `/api/students` endpoints remain unchanged internally.

| Action | API |
| --- | --- |
| List hats | `GET /api/students` |
| Find one | `GET /api/students/:id` |
| Filter by style | `GET /api/students?major=Baseball%20Cap` |
| Add | `POST /api/students` |
| Edit | `PATCH /api/students/:id` |
| Delete | `DELETE /api/students/:id` |
| Database health | `GET /api/health` |

See [routes.js](server/routes.js), [hotel.html](public/hotel.html), [hotel.js](public/assets/js/hotel.js), and [automated tests](server/test/) for the implementation.

## Submission

Submit this repository URL: **https://github.com/ltortorigi/fullstack-brain-bucket**

Start at [docs/README.md](docs/README.md) for links to APP, CRUD, DEV, PROD, code, issues, branches, pull requests, and deployment evidence.

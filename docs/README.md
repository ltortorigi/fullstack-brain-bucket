# Fullstack Brain Bucket
> Full-stack application with automated DEV and PROD deployments.

### authorship + version

`@ltortorigi` | `2026-09-15` | `GOLF`

### deployments, codebase, & repo features

| resource | link |
| --- | --- |
| PROD codebase | [`main`](https://github.com/ltortorigi/fullstack-brain-bucket/tree/main) |
| PROD server | [GCP](https://logan.barrycumbie.com/) |
| DEV codebase | [`dev`](https://github.com/ltortorigi/fullstack-brain-bucket/tree/dev) |
| DEV server | [Render](https://fullstack-brain-bucket-dj2n.onrender.com) |
| docs | [`docs/`](https://github.com/ltortorigi/fullstack-brain-bucket/tree/main/docs) |
| published docs | [GitHub Pages](ADD-GITHUB-PAGES-URL-HERE) |
| CI/CD workflow | [`re-deploy-main-to-gcp.yml`](https://github.com/ltortorigi/fullstack-brain-bucket/blob/main/.github/workflows/re-deploy-main-to-gcp.yml) |
| successful PROD deployment | [GitHub Action](https://github.com/ltortorigi/fullstack-brain-bucket/actions/runs/35032867701) |
| resolved GOLF issue | [SSH deployment issue](https://github.com/ltortorigi/fullstack-brain-bucket/issues/1) |

### user story

- **As a** burgeoning full-stack developer,
- **I want** a CI/CD infrastructure
- **so that** I can develop locally, manage my code in GitHub, and automatically deploy changes to DEV and PROD environments.

### narrative

Fullstack Brain Bucket uses separate DEV and PROD environments to manage and deploy the application. Changes pushed to the dev branch are automatically deployed to Render, while changes pushed to main use GitHub Actions to automatically deploy the application to my GCP server. The production server uses Linux, Nginx, and PM2 to keep the Node.js application running.

### architecture

```text
LOCAL
  │
  ▼
GitHub
  │
  ├── dev  ──► Render ─────────► DEV
  │
  └── main ──► GitHub Actions ─► GCP ──► PROD

stack

HTML/CSS/JS | Node.js | Express | Git/GitHub | Render |
GCP | Linux | Nginx | PM2 | Certbot | GitHub Actions

fullstack-brain-bucket/
├── .github/
│   └── workflows/
│       └── re-deploy-main-to-gcp.yml
├── docs/
│   └── README.md
├── public/
├── server/
│   └── app.js
├── .gitignore
└── ...

GCP

external IP: 34.174.105.215
Linux user: logantort23
instructor SSH public key installed: NEED TO VERIFY

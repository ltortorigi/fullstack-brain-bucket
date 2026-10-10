# HOTEL live verification

## Render DEV — passed

- Application: https://fullstack-brain-bucket-dj2n.onrender.com/
- Deployed application commit: `e94b83695a16d7abeccd225d3a353d30012c184c`
- Completed: October 1, 2026, 18:31 CDT / 23:31 UTC.
- Method: HTTPS requests to the deployed application and its MongoDB-backed API.
- Health response: HTTP 200, `{"status":"ok","database":"connected","devTools":false}`.

| Check | Observed result |
| --- | --- |
| Frontend entry point | HTTP 200; HOTEL form and client script are served |
| Create a unique fictional student | HTTP 201 with a MongoDB ObjectId |
| Read the student by ID | HTTP 200; saved values match |
| List all students | Includes the temporary record |
| Filter by its unique major | Returns exactly the temporary record |
| Update notes | HTTP 200; updated notes returned |
| Read in a separate request | Updated notes remain saved |
| Delete and read again | HTTP 200 with deletedCount 1, followed by HTTP 404 |

The temporary record was `6abeed175da9cdfb258b3f24`. Its unique name and major were checked before deleting it. Existing records were not edited or removed. This is deployed API verification; frontend interaction is covered separately by the automated JSDOM tests.

Automated evidence: [17 passing tests](https://github.com/ltortorigi/fullstack-brain-bucket/actions/runs/36939379402).

## GCP PROD — pending

https://logan.barrycumbie.com/api/health returned HTTP 502 at 18:29 CDT on October 1. The VM, its Atlas environment variables, and its Atlas network access must be checked before promoting PR #4. A successful HOTEL production workflow and a separate PROD CRUD verification are still required.

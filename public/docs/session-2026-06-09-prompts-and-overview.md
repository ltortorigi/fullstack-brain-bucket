# Session Notes - 2026-06-09

## Prompt Log

The following user prompts were captured for this session (normalized for readability).

1. "let's set our parameters by creating an AGENTS.md file & a CLAUDE.md file... use BS5, BS icons, Google Style Guide (HTML/CSS/JS), and no JS modules for now"
2. "let's create a simple web form to collect data... check out my todo note"
3. "Let's make images and links optional, default the date entry to today, and add a description for each link"
4. "tap into our existing login script and only show form page if logged in (sessionStorage), otherwise redirect to login; save data to localStorage so content.html can load more cards; put all this JS in a new form.js file"
5. "in AGENTS & CLAUDE.md, add: no inline styling or scripting, and no internal styling or scripting"
6. "make a docs/ folder and capture prompts for this session in a .md file with an overview of what you created and how it works"

## What Was Created

### Standards and Agent Guidance

- Added project instruction files:
  - AGENTS.md
  - CLAUDE.md
- Both include:
  - Bootstrap 5 requirement
  - Bootstrap Icons requirement
  - Google style guidance for HTML/CSS/JS
  - Non-module JavaScript requirement
  - No inline or internal styling/scripting rule

### Form Experience

- Built a Bootstrap 5 data form page at pages/form.html.
- Required fields:
  - title
  - author
  - date
  - description
- Optional fields:
  - image URL
  - links (repeatable)
- Each link row supports:
  - URL
  - description
- Date input defaults to today.
- Form includes validation and a submitted JSON preview block.

### JavaScript Split

- Moved form-specific logic into assets/js/form.js.
- Left assets/js/main.js as a shared placeholder to avoid duplicated page logic.
- Added assets/js/content.js to render saved data as cards on the content page.

### Auth Gate and Redirect

- Form page logic checks sessionStorage key `sessionAuthN`.
- If the value is not `"true"`, the user is redirected to pages/auth.html.

### Persistence and Data Shape

- Form submissions are saved in localStorage under key `contentRecords`.
- Stored format is an array of records (newest first), for example:

```json
{
  "id": "entry-1717950000000",
  "title": "Example",
  "author": "Barry",
  "date": "2026-06-09",
  "image": "https://example.com/image.jpg",
  "description": "Short summary",
  "links": [
    { "url": "https://example.com", "description": "Reference" }
  ],
  "createdAt": "2026-06-09T12:00:00.000Z"
}
```

## How It Works End-to-End

1. User logs in on pages/auth.html, which sets sessionStorage key `sessionAuthN`.
2. User opens pages/form.html.
3. assets/js/form.js checks auth:
   - If not logged in, redirect to pages/auth.html.
   - If logged in, initialize form behavior (today date + dynamic links).
4. On submit, form data is validated and written to localStorage key `contentRecords`.
5. User opens pages/content.html.
6. assets/js/content.js reads `contentRecords` and renders one Bootstrap card per saved record.
7. If no records exist, content page shows an empty-state message.

## Files Added or Updated During Session

- AGENTS.md
- CLAUDE.md
- pages/form.html
- assets/css/style.css
- assets/js/form.js
- assets/js/content.js
- assets/js/main.js
- pages/content.html
- docs/session-2026-06-09-prompts-and-overview.md

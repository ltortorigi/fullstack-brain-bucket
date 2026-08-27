# [DEV] Charlie
> Refactor & Harden Your ALFA Web App

## Overview

For **[DEV] Charlie**, we'll revisit your **[DEV] ALFA** project and transform it into a more polished, maintainable, and feature-rich web application.

1. 🧹 Perform GitHub repository housekeeping.
2. 📝 Plan improvements using Agile techniques.
3. 🎨 Refactor and improve the user interface.
4. 🔐 Harden authentication using my JWT Authentication API.
5. 🔍 Add search, filtering, sorting, and favorites.
6. 📦 Move to a JSON-driven application and persist data through an API.
7. ⚙️ Build an administrative dashboard.

---

## Example Project

Some of you have this already but it’s time to figure out the what and why of this app. For me, I want to create an “idea repository” app. 
I’ll call it _brain barn_ and reserve the right to change that later. 

### 🧠🪣 Brain Bucket* User Story

> As a somewhat scatterbrained professor,
> I want one place to store all of my ideas,
> so that I can actually find them and work on them later.

*see, I already changed it. There wasn’t a farm emoji or BS icon. 

### 🧠🪣 Narrative

I have a lot of ideas for apps, yet when the time comes for student projects I can never quite find them or remember them. I’d like one spot where I can have them all together, add new ones, edit existing ones, and start actually working on some of them. Some ideas have repos and apps, including past student projects. That is key that I can link to those. 
It’d be cool to have a catalogue of past student projects too but that’s a **Sprint 99** milestone.

---

# Instructions

---

## 1️⃣ GitHub Repository Housekeeping

Start with your existing **[DEV] ALFA** repository.

- Rename the repository to include both **charlie** and a semantic application name, e.g., `charlie-brain-bucket`
  - why? Six months from now you'll have no idea what "Charlie" means, but you'll immediately recognize what **Brain Bucket** does.
- create a new branch, named alfa to stash your old code. Toggle back to main for the rest of this project. 
- enable wikis if not already 
- add in a milestone, sprint 99. Add in issues for future development as you think of them (at least 3). 
- improve the readme with requirements from the past
- update your GitHub profile to point to this APP, use html for better links

--- 

## 2️⃣ plan the app 

The first phase of Agile is to Plan (`Plan → Code → Build → Test`) 

- The first step of the Agile dev process is PLAN (plan-code-build-test) 
- start with a wireframe, include the “sub-pages”
- brainstorm any ideas (e.g., a login screen) and include in issue cards
- per issue: label with a custom, brainstorm or plan or similar
- upload your wireframe to a wiki page
- link the wiki/wireframe from your readme
- link to issues (a single link to that label) 

---

## 3️⃣ time to code! 

- improve the overall UI
- apply past lessons and codeAcademy stuff to make your app as planned. 
- include a google font (new library!)
- include our standard build patterns, libraries, & standards (e.g., AGENTS.md, Google Style Guide)
- content: hard-code in one exemplar BS5 card to serve as your template for DOM and data
- form: add a new entry and edit an existing one (cool Ux: use `contenteditable=true’ html attribute)

--- 

## 4️⃣ harden authN w/ my JWT Authentication API.

> AuthN → N = Name → Who are you?
> AuthZ → Z = Permission Zone → What can you do?

Requirements:

using a js fetch API, access my AuthN server to obtain secure credentials. 
for any username, use the hashed password of `cat` 
include a fallback with a hardcoded password

---

## 5️⃣ search, filter, & sort

- for the content cards, add in search functionality to search all text
- include filters for key data, e.g, tags
- include sort by date, title
- include a “like” feature, list those at the top and apply a distinct style

---

## 6️⃣ JSON + Fetch API + GitHub Gist

- from your hardcoded html content card, create a JSON object
- ensure it is flexible for multiple links 
- consume the JSON object into your DOM (replacing the fallback hardcoded card) 
- save new/edit data to a GitHub gist using an API and in sessionStorage 
- include the link to the Gist on your app

---

## 7️⃣ admin Page

- include an admin page. 
- display any localStorage data
- display sessionStorage of saved content data 
- display derived user data: date/time, browser, IP, ..

---

# Minimum Acceptance Criteria

Minimum Acceptance Criteria / rubric

- Submission
  - submit a link to either your github profile or your github repo 
- Repo 
  - repo renamed (lower-kabab-case) 
  - file/folder naming: logical and proper web friendly case, don’t forget to rename images
  - GitHub pages enabled & link in the About section 
  - Organized repository structure: no trash files, non-index.html files in pages/ sub directory
- Readme
  - Title + tagline: app name & block quote short tagline 
  - authorship: name, link to GitHub profile, version, date, & link to alfa version (repo branch) 
  - user story
  - narrative
  - resources: websites, tools, libraries, languages, … (full credit for really thinking this through, e.g. LiveServer, - markdown, GitHub: repo, pages, issues, wiki, milestone, Gist) 
  - code snippet(s): code syntax highlighting and explained, e.g., html/dom for a button, js for event listener, js for called function, html/dom for result
- GitHub Profile
  - link to this app included using html (`...target=“_blank”…`) 
  - clear formatted section
- Code
  - logical, organized, & included
  - comments included in js per function
  - console interaction 
  - use of libraries including normalize, BS5, jQ, jQui, Google font, BS icons, & all we’ve used thusfar
  - error handling: try/catch and fallbacks
  - use of fetch api and localStorage
- JSON data
  - structured
  - complete
- APP, overall 
  - functional, clear of console errors
  - nav: consistent navigation, nav/title bar w/icons, link to play your game
  - footer: links to github profile and repo at minimum 
  - link to “saved” GitHub gist data
- APP, parts		
  - sign in: functional with fetch API, fallback mode, & greeting
  - content: BS5 cards with full JSON data consumption  
  - add/edit: editable & saved card info to a GitHub gist
  - saved output, in addition to the gist, is displayed on the admin page in a copy/paste block
  - admin page: local, session, and derived data 
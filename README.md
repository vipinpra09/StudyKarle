# StudyKarle

**Study Resources, Organized Properly.**

A fast, clean, and highly organized academic resource hub for engineering students.

Built by [Nitish Kumar](https://www.instagram.com/realnitishkumarr/)

---

## Features

- ⚡ Instant access — find resources in under 10 seconds
- 📱 Mobile-first, fully responsive
- 🔍 Client-side search (<100ms for 500+ resources)
- 🌙 Dark mode
- 📥 Direct PDF/image downloads
- 🔗 Shareable resource links
- 📂 Organized by Year → Semester → Subject
- 🗃️ Category filters (Notes, PYQ, Assignment, Tutorial)

---

## Project Structure

```
studykarle/
├── index.html              # Main entry point
├── vercel.json             # Vercel SPA routing config
├── data/
│   └── resources.json      # Source of truth for all resources
├── src/
│   ├── data.js             # Static JS data module (generated from resources.json)
│   ├── script.js           # App logic (router, renderer, search)
│   └── styles.css          # Design system & component styles
└── resources/               # Where you upload PDFs and images
    ├── year1/
    │   ├── sem1/
    │   └── sem2/
    ├── year2/
    │   ├── sem1/
    │   └── sem2/
    ├── year3/
    │   ├── sem1/
    │   └── sem2/
    └── year4/
        ├── sem1/
        └── sem2/
```

---

## Running Locally

No build step required. Just open with any static file server:

```bash
# Option 1: Python
python3 -m http.server 3000

# Option 2: Node (npx)
npx serve .

# Option 3: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then open: http://localhost:3000

---

## Admin Workflow — Adding Resources

### Step 1: Upload the file

Place your PDF or image inside the correct folder:

```
resources/year{N}/sem{N}/your-file.pdf
```

Use kebab-case filenames only:
```
unit1-calculus-notes.pdf   ✅
Unit 1 Calculus Notes.pdf  ❌
```

### Step 2: Add entry to `data/resources.json`

```json
{
  "id": "math-unit-1",
  "title": "Mathematics Unit 1 — Calculus Notes",
  "slug": "math-unit-1",
  "type": "pdf",
  "year": "year-1",
  "semester": "sem-1",
  "subject": "mathematics-1",
  "category": "notes",
  "path": "/resources/year1/sem1/unit1-calculus-notes.pdf"
}
```

**Field reference:**

| Field | Values |
|-------|--------|
| `type` | `pdf`, `jpg`, `jpeg` |
| `year` | `year-1`, `year-2`, `year-3`, `year-4` |
| `semester` | `sem-1`, `sem-2` |
| `category` | `notes`, `pyq`, `assignment`, `tutorial`, `paper` |
| `path` | Must start with `/resources/...` |

### Step 3: Sync `data/resources.json` → `src/data.js`

Copy the updated array from `resources.json` into the `RESOURCES_DATA` const in `src/data.js`.

### Step 4: Push to GitHub

```bash
git add .
git commit -m "Add: math unit 1 notes"
git push
```

### Step 5: Vercel auto-deploys

The file appears automatically in the webapp after deployment.

---

## Deploying to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Framework: **Other** (static site)
5. Root directory: `.` (project root)
6. Deploy ✅

The `vercel.json` handles SPA routing automatically.

---

## File Size Rules

| Type | Recommended | Hard Limit |
|------|-------------|------------|
| PDF  | 25–30 MB    | 50 MB      |
| JPG/JPEG | 5–10 MB | 25 MB     |

---

## Tech Stack

- HTML5
- CSS3 (custom properties, grid, flexbox)
- Vanilla JavaScript (ES6+)
- No frameworks, no build step, no database

---

## Routes

| URL | Page |
|-----|------|
| `/` | Home |
| `/year-1` | Year 1 (Sem 1 default) |
| `/year-1/sem-2` | Year 1 Sem 2 |
| `/year-1/sem-1/mathematics-1` | Subject page |
| `/resource/math-unit-1` | Resource viewer |
| `/search` | Search page |
| `/settings` | Settings |

---

Made with ❤️ by [Nitish Kumar](https://www.instagram.com/realnitishkumarr/)

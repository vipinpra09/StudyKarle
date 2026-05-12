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
│   └── resources.json      # Legacy resource list (not used by app)
├── src/
│   ├── data.js             # Resource data used by the app
│   ├── script.js           # App logic (router, renderer, search)
│   └── styles.css          # Design system & component styles
└── resources/               # Where you upload PDFs and images
    ├── year1/
    │   ├── sem1/
    │   │   ├── engineering-chemistry/
    │   │   ├── engineering-physics/
    │   │   └── mathematics-1/
    │   └── sem2/
    │       └── mathematics-2/
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

## Adding New PDFs

### Step 1 — Upload PDF

Upload the PDF inside the correct subject folder.

Example:

```
resources/year1/sem1/engineering-chemistry/
```

Example file:

```
resources/year1/sem1/engineering-chemistry/Chem_A4+A5.pdf
```

### Step 2 — Add Resource Entry

Open:

```
src/data.js
```

Add a new object inside `RESOURCES_DATA`.

```json
{
  "id": "chem-a4-a5",
  "title": "Engineering Chemistry Assignment A4 + A5",
  "slug": "chem-a4-a5",
  "type": "pdf",
  "year": "year-1",
  "semester": "sem-1",
  "subject": "engineering-chemistry",
  "category": "assignment",
  "path": "/resources/year1/sem1/engineering-chemistry/Chem_A4+A5.pdf"
}
```

### Step 3 — Commit & Push

Push changes to GitHub.

Vercel redeploys automatically.

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

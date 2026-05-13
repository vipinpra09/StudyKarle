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
├── index.html              # Main SPA entry point
├── login.html              # Auth page (signup + login + OTP)
├── vercel.json             # Vercel SPA routing config
├── src/
│   ├── data.js             # Resource data (RESOURCES_DATA array)
│   ├── script.js           # App logic: router, renderer, search, auth, OTP, EmailJS
│   └── styles.css          # Design system & component styles
└── resources/              # PDF and image uploads by subject folder
    ├── year1/
    │   ├── sem1/
    │   │   ├── basic-mechanical-engineering/
    │   │   ├── engineering-chemistry/
    │   │   ├── engineering-physics/
    │   │   └── mathematics-1/
    │   └── sem2/
    │       ├── basic-electrical-engineering/
    │       └── mathematics-2/
    ├── year2/
    │   ├── sem1/
    │   │   └── data-structures/
    │   └── sem2/
    │       └── dbms/
    ├── year3/
    │   ├── sem1/
    │   │   ├── computer-networks/
    │   │   └── operating-systems/
    │   └── sem2/
    │       └── software-engineering/
    └── year4/
        └── sem1/
            └── machine-learning/
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

**Current upload folders:**

- Engineering Chemistry → `resources/year1/sem1/engineering-chemistry/`
- Engineering Physics → `resources/year1/sem1/engineering-physics/`
- Mathematics 1 → `resources/year1/sem1/mathematics-1/`
- Basic Mechanical Engineering → `resources/year1/sem1/basic-mechanical-engineering/`
- Mathematics 2 → `resources/year1/sem2/mathematics-2/`
- Basic Electrical Engineering → `resources/year1/sem2/basic-electrical-engineering/`
- Data Structures → `resources/year2/sem1/data-structures/`
- DBMS → `resources/year2/sem2/dbms/`
- Operating Systems → `resources/year3/sem1/operating-systems/`
- Computer Networks → `resources/year3/sem1/computer-networks/`
- Software Engineering → `resources/year3/sem2/software-engineering/`
- Machine Learning → `resources/year4/sem1/machine-learning/`

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

**Required fields (keep in sync):**

- `id` and `slug` must be unique, lowercase, and kebab-case (no spaces).
- `title` should describe the resource clearly (used in cards, search, and viewer).
- `category` controls filters (`notes`, `pyq`, `assignment`, `tutorial`, `paper`).
- `year`, `semester`, and `subject` must match the folder you uploaded into.
- `path` must exactly match the real file path (case-sensitive).
- `type` must match the file type (`pdf`, `jpg`, `jpeg`).

**How the app resolves PDFs:**

- The viewer, download, and share buttons use `path` directly from `RESOURCES_DATA`.
- Year → Semester → Subject pages are built from `year`, `semester`, and `subject`.

**If any of these are wrong:**

- Wrong `path` → file won’t load, viewer shows “File Unavailable”.
- Wrong `year/semester/subject` → resource appears in the wrong place or disappears from its section.
- Duplicate `id`/`slug` → routing conflicts and broken resource pages.

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

| Type     | Recommended | Hard Limit |
|----------|-------------|------------|
| PDF      | 3–8 MB      | 15 MB      |
| JPG/JPEG | 1–3 MB      | 5 MB       |

> **Tip:** Use [Smallpdf](https://smallpdf.com/compress-pdf) or `ghostscript` to compress PDFs before uploading.

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

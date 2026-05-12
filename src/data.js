

const RESOURCES_DATA = [
 {
  "id": "chem-lab",
  "title": "Chem Lab",
  "slug": "chem-lab",
  "type": "pdf",
  "year": "year-1",
  "semester": "sem-1",
  "subject": "engineering-chemistry",
  "category": "notes",
  "path": "/resources/year1/sem1/engineering-chemistry/Chem_Lab.pdf"
 },
  {
    "id": "electrical-unit-1-doc-20250213-wa0000-1",
    "title": "Electrical Unit 1 — DOC-20250213-WA0000 (Copy 1)",
    "slug": "electrical-unit-1-doc-20250213-wa0000-1",
    "type": "pdf",
    "year": "year-1",
    "semester": "sem-2",
    "subject": "electrical",
    "category": "notes",
    "path": "/resources/year1/sem2/electrical/unit1/Copy of DOC-20250213-WA0000. (1).pdf"
  },
  {
    "id": "electrical-unit-1-gateway",
    "title": "Electrical Unit 1 — Gateway",
    "slug": "electrical-unit-1-gateway",
    "type": "pdf",
    "year": "year-1",
    "semester": "sem-2",
    "subject": "electrical",
    "category": "notes",
    "path": "/resources/year1/sem2/electrical/unit1/U1_Gateway.pdf"
  },
  {
    "id": "electrical-unit-1-sir-notes",
    "title": "Electrical Unit 1 — Sir Notes",
    "slug": "electrical-unit-1-sir-notes",
    "type": "pdf",
    "year": "year-1",
    "semester": "sem-2",
    "subject": "electrical",
    "category": "notes",
    "path": "/resources/year1/sem2/electrical/unit1/Unit 1 Sir-Notes.pdf"
  },
  {
    "id": "electrical-unit-1-notes",
    "title": "Electrical Unit 1 — Notes",
    "slug": "electrical-unit-1-notes",
    "type": "pdf",
    "year": "year-1",
    "semester": "sem-2",
    "subject": "electrical",
    "category": "notes",
    "path": "/resources/year1/sem2/electrical/unit1/Unit-1 Electrical.pdf"
  },
  {
    "id": "electrical-unit-1-important-questions-1",
    "title": "Electrical Unit 1 — Important Questions (1)",
    "slug": "electrical-unit-1-important-questions-1",
    "type": "pdf",
    "year": "year-1",
    "semester": "sem-2",
    "subject": "electrical",
    "category": "notes",
    "path": "/resources/year1/sem2/electrical/unit1/ch 1 important question (1).pdf"
  },
  {
    "id": "ds-unit-1",
    "title": "Data Structures Unit 1 — Arrays & Linked Lists",
    "slug": "ds-unit-1",
    "type": "pdf",
    "year": "year-2",
    "semester": "sem-1",
    "subject": "data-structures",
    "category": "notes",
    "path": "/resources/year2/sem1/data-structures/ds-unit1-notes.pdf"
  },
  {
    "id": "ds-pyq-2022",
    "title": "Data Structures PYQ 2022",
    "slug": "ds-pyq-2022",
    "type": "pdf",
    "year": "year-2",
    "semester": "sem-1",
    "subject": "data-structures",
    "category": "pyq",
    "path": "/resources/year2/sem1/data-structures/ds-pyq-2022.pdf"
  },
  {
    "id": "dbms-unit-1",
    "title": "Database Management Systems Unit 1",
    "slug": "dbms-unit-1",
    "type": "pdf",
    "year": "year-2",
    "semester": "sem-2",
    "subject": "dbms",
    "category": "notes",
    "path": "/resources/year2/sem2/dbms/dbms-unit1-notes.pdf"
  },
  {
    "id": "os-unit-2",
    "title": "Operating Systems Unit 2 — Process Management",
    "slug": "os-unit-2",
    "type": "pdf",
    "year": "year-3",
    "semester": "sem-1",
    "subject": "operating-systems",
    "category": "notes",
    "path": "/resources/year3/sem1/operating-systems/os-unit2-notes.pdf"
  },
  {
    "id": "cn-tutorial-1",
    "title": "Computer Networks Tutorial Sheet 1",
    "slug": "cn-tutorial-1",
    "type": "pdf",
    "year": "year-3",
    "semester": "sem-1",
    "subject": "computer-networks",
    "category": "tutorial",
    "path": "/resources/year3/sem1/computer-networks/cn-tutorial-1.pdf"
  },
  {
    "id": "se-unit-1",
    "title": "Software Engineering Unit 1 Notes",
    "slug": "se-unit-1",
    "type": "pdf",
    "year": "year-3",
    "semester": "sem-2",
    "subject": "software-engineering",
    "category": "notes",
    "path": "/resources/year3/sem2/software-engineering/se-unit1-notes.pdf"
  },
  {
    "id": "ml-unit-1",
    "title": "Machine Learning Unit 1 — Linear Regression",
    "slug": "ml-unit-1",
    "type": "pdf",
    "year": "year-4",
    "semester": "sem-1",
    "subject": "machine-learning",
    "category": "notes",
    "path": "/resources/year4/sem1/machine-learning/ml-unit1-notes.pdf"
  },
  {
    "id": "ml-pyq-2023",
    "title": "Machine Learning PYQ 2023",
    "slug": "ml-pyq-2023",
    "type": "pdf",
    "year": "year-4",
    "semester": "sem-1",
    "subject": "machine-learning",
    "category": "pyq",
    "path": "/resources/year4/sem1/machine-learning/ml-pyq-2023.pdf"
  }
];

const SUBJECTS_META = {
  "mathematics-1":            { label: "Mathematics I",                   icon: "📐" },
  "mathematics-2":            { label: "Mathematics II",                  icon: "📐" },
  "engineering-physics":      { label: "Engineering Physics",             icon: "⚛️" },
  "engineering-chemistry":    { label: "Engineering Chemistry",           icon: "🧪" },
  "basic-mechanical-engineering": { label: "Basic Mechanical Engg.",      icon: "⚙️" },
  "basic-electrical-engineering": { label: "Basic Electrical Engg.",      icon: "⚡" },
  "data-structures":          { label: "Data Structures",                 icon: "🌳" },
  "dbms":                     { label: "Database Management Systems",     icon: "🗄️" },
  "operating-systems":        { label: "Operating Systems",               icon: "💻" },
  "computer-networks":        { label: "Computer Networks",               icon: "🌐" },
  "software-engineering":     { label: "Software Engineering",            icon: "🛠️" },
  "machine-learning":         { label: "Machine Learning",                icon: "🤖" }
};

const YEARS_META = [
  { id: "year-1", label: "1st Year", short: "Y1", semesters: ["sem-1","sem-2"], desc: "Foundation courses — Maths, Physics, Chemistry & more" },
  { id: "year-2", label: "2nd Year", short: "Y2", semesters: ["sem-1","sem-2"], desc: "Core engineering — DSA, DBMS, Electronics & more" },
  { id: "year-3", label: "3rd Year", short: "Y3", semesters: ["sem-1","sem-2"], desc: "Advanced topics — OS, Networks, Software Engg & more" },
  { id: "year-4", label: "4th Year", short: "Y4", semesters: ["sem-1","sem-2"], desc: "Specializations — ML, AI, Major Projects & more" }
];

const CATEGORY_META = {
  "notes":      { label: "Notes",       color: "cat-notes" },
  "pyq":        { label: "PYQ",         color: "cat-pyq" },
  "assignment": { label: "Assignment",  color: "cat-assignment" },
  "tutorial":   { label: "Tutorial",    color: "cat-tutorial" },
  "paper":      { label: "Paper",       color: "cat-paper" }
};



const RESOURCES_DATA = [
  {
    "id": "math-unit-1",
    "title": "Mathematics Unit 1 — Calculus Notes",
    "slug": "math-unit-1",
    "type": "pdf",
    "year": "year-1",
    "semester": "sem-1",
    "subject": "mathematics-1",
    "category": "notes",
    "path": "/resources/year1/sem1/mathematics-1/unit1-calculus-notes.pdf"
  },
  {
    "id": "physics-unit-1",
    "title": "Engineering Physics Unit 1 Notes",
    "slug": "physics-unit-1",
    "type": "pdf",
    "year": "year-1",
    "semester": "sem-1",
    "subject": "engineering-physics",
    "category": "notes",
    "path": "/resources/year1/sem1/engineering-physics/physics-unit1-notes.pdf"
  },
  {
    "id": "chemistry-pyq-2023",
    "title": "Engineering Chemistry PYQ 2023",
    "slug": "chemistry-pyq-2023",
    "type": "pdf",
    "year": "year-1",
    "semester": "sem-1",
    "subject": "engineering-chemistry",
    "category": "pyq",
    "path": "/resources/year1/sem1/engineering-chemistry/chemistry-pyq-2023.pdf"
  },
  {
    "id": "bme-assignment-1",
    "title": "Basic Mechanical Engineering Assignment 1",
    "slug": "bme-assignment-1",
    "type": "pdf",
    "year": "year-1",
    "semester": "sem-1",
    "subject": "basic-mechanical-engineering",
    "category": "assignment",
    "path": "/resources/year1/sem1/basic-mechanical-engineering/bme-assignment-1.pdf"
  },
  {
    "id": "math2-unit-1",
    "title": "Mathematics 2 Unit 1 — Differential Equations",
    "slug": "math2-unit-1",
    "type": "pdf",
    "year": "year-1",
    "semester": "sem-2",
    "subject": "mathematics-2",
    "category": "notes",
    "path": "/resources/year1/sem2/mathematics-2/math2-unit1-notes.pdf"
  },
  {
    "id": "bee-unit-2",
    "title": "Basic Electrical Engineering Unit 2",
    "slug": "bee-unit-2",
    "type": "pdf",
    "year": "year-1",
    "semester": "sem-2",
    "subject": "basic-electrical-engineering",
    "category": "notes",
    "path": "/resources/year1/sem2/basic-electrical-engineering/bee-unit2-notes.pdf"
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

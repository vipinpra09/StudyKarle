import { RESOURCES_DATA } from './data.js';

export function searchResources(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();

  return RESOURCES_DATA.filter((resource) => {
    if (!resource || typeof resource !== 'object') return false;
    const title = String(resource.title || '').toLowerCase();
    const subject = String(resource.subject || '').toLowerCase();
    const slug = String(resource.slug || '').toLowerCase();
    const category = String(resource.category || '').toLowerCase();
    const year = String(resource.year || '').toLowerCase();
    const semester = String(resource.semester || '').toLowerCase();

    return (
      title.includes(q) ||
      subject.includes(q) ||
      slug.includes(q) ||
      category.includes(q) ||
      year.includes(q) ||
      semester.includes(q)
    );
  });
}

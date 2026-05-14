/**
 * src/search.js
 * Client-side search functionality
 */

/**
 * Searches through RESOURCES_DATA and returns matching resources.
 * Searches by title, subject, slug, category, year, and semester.
 */
export function searchResources(query) {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();
  
  // RESOURCES_DATA is defined globally in data.js
  return RESOURCES_DATA.filter(r => {
    return (
      r.title.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q) ||
      r.slug.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.year.replace('-', ' ').includes(q) ||
      r.semester.replace('-', ' ').includes(q)
    );
  });
}

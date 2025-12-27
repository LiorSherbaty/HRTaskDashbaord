export function matchesSearch(text: string | undefined | null, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true;
  if (!text) return false;
  return text.toLowerCase().includes(searchTerm.toLowerCase());
}

export function highlightMatch(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) return text;
  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const idOf = (v) => String(v?._id ?? v ?? '');

export const initials = (name = '') => name.trim().slice(0, 2).toUpperCase();

export function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (d.toDateString() === new Date().toDateString()) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Utility functions
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];

export function uid(prefix = 't') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function escapeHtml(s) {
  if (!s) return '';
  return s.replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#039;');
}

export function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export function formatForInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function priorityRank(p) {
  if (p === 'Critical') return 4;
  if (p === 'High') return 3;
  if (p === 'Medium') return 2;
  return 1;
}

export function priorityClass(p) {
  if (p === 'Low') return 'p-low';
  if (p === 'Medium') return 'p-med';
  if (p === 'High') return 'p-high';
  return 'p-crit';
}

export function dueState(deadline) {
  if (!deadline) return '';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  const diff = d.getTime() - now.getTime();
  if (diff < 0) return 'overdue';
  if (diff === 0 || (diff > 0 && diff <= 1000 * 60 * 60 * 24)) return 'due-soon';
  return '';
}

export function formatDate(iso) {
  if (!iso) return 'No deadline';
  const d = new Date(iso);
  return d.toLocaleString();
}

export function formatDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString();
}

export function isToday(date) {
  const today = new Date();
  const d = new Date(date);
  return d.toDateString() === today.toDateString();
}

export function isThisWeek(date) {
  const today = new Date();
  const d = new Date(date);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return d >= weekStart && d < weekEnd;
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}


import { $, $$, uid, escapeHtml, truncate, formatForInput, priorityClass, dueState, formatDate } from './utils.js';
import { checkRecurringTasks, processRecurringTask } from './recurring.js';
import { addNotification } from './notifications.js';

const STORAGE_KEY = 'novatasks.tasks.v2';
let tasks = [];
let dragSrcId = null;
let editingId = null;
let activeFilter = 'all';
let activePriorityFilter = 'all';
let currentView = 'board';

// Event callbacks
let onTasksChange = null;
let onRender = null;

export function initTaskManager(onChange, onRenderCallback) {
  onTasksChange = onChange;
  onRender = onRenderCallback;
  load();
  setupEventListeners();
  checkRecurringTasks(tasks, addTask);
}

export function getTasks() {
  return tasks;
}

export function load() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    tasks = stored ? JSON.parse(stored) : [];
    // Ensure all tasks have required fields
    tasks = tasks.map(t => ({
      id: t.id || uid(),
      title: t.title || 'Untitled',
      desc: t.desc || '',
      category: t.category || 'General',
      priority: t.priority || 'Low',
      status: t.status || 'Pending',
      deadline: t.deadline || null,
      tags: t.tags || [],
      createdAt: t.createdAt || Date.now(),
      order: t.order || 0,
      color: t.color || 'default',
      recurring: t.recurring || null,
      completedAt: t.completedAt || null
    }));
  } catch (e) {
    tasks = [];
  }
  if (onTasksChange) onTasksChange(tasks);
  if (onRender) onRender();
}

export function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  if (onTasksChange) onTasksChange(tasks);
}

export function addTask(data) {
  const t = {
    id: uid(),
    title: data.title || 'Untitled',
    desc: data.desc || '',
    category: data.category || '',
    priority: data.priority || 'Low',
    status: data.status || 'Pending',
    deadline: data.deadline || null,
    tags: data.tags || [],
    createdAt: Date.now(),
    order: tasks.length,
    color: data.color || 'default',
    recurring: data.recurring || null,
    completedAt: null
  };
  tasks.push(t);
  save();
  if (onRender) onRender();
  
  // Check for notifications
  if (t.deadline) {
    const deadline = new Date(t.deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    if (diff > 0 && diff <= 1000 * 60 * 60 * 24) {
      addNotification(`Task "${t.title}" is due soon!`, 'warning');
    }
  }
  
  return t;
}

export function updateTask(id, data) {
  const i = tasks.findIndex(x => x.id === id);
  if (i < 0) return;
  const oldTask = tasks[i];
  tasks[i] = { ...tasks[i], ...data };
  
  // Update completedAt if status changed to Completed
  if (data.status === 'Completed' && oldTask.status !== 'Completed') {
    tasks[i].completedAt = Date.now();
  } else if (data.status !== 'Completed' && oldTask.status === 'Completed') {
    tasks[i].completedAt = null;
  }
  
  save();
  if (onRender) onRender();
  return tasks[i];
}

export function removeTask(id) {
  if (!confirm('Delete this task?')) return;
  tasks = tasks.filter(t => t.id !== id);
  save();
  if (onRender) onRender();
}

export function clearAllTasks() {
  if (confirm('Clear all tasks and reset?')) {
    tasks = [];
    save();
    if (onRender) onRender();
  }
}

export function applyFilters(list) {
  const q = $('#searchInput')?.value.trim().toLowerCase() || '';
  
  // Date filters
  if (activeFilter === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    list = list.filter(t => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      d.setHours(0, 0, 0, 0);
      return d >= start && d < end;
    });
  } else if (activeFilter === 'week') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    list = list.filter(t => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      d.setHours(0, 0, 0, 0);
      return d >= start && d < end;
    });
  } else if (activeFilter === 'overdue') {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    list = list.filter(t => {
      if (!t.deadline || t.status === 'Completed') return false;
      const d = new Date(t.deadline);
      d.setHours(0, 0, 0, 0);
      return d.getTime() < now.getTime();
    });
  } else if (activeFilter === 'recurring') {
    list = list.filter(t => t.recurring !== null);
  } else if (activeFilter && activeFilter !== 'all' && activeFilter.startsWith('cat:')) {
    const cat = activeFilter.split(':')[1];
    list = list.filter(t => (t.category || '').toLowerCase() === cat.toLowerCase());
  }
  
  // Priority filter
  if (activePriorityFilter && activePriorityFilter !== 'all') {
    list = list.filter(t => t.priority === activePriorityFilter);
  }
  
  // Search
  if (q) {
    list = list.filter(t =>
      (t.title || '').toLowerCase().includes(q) ||
      (t.desc || '').toLowerCase().includes(q) ||
      (t.tags || []).join(' ').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q)
    );
  }
  
  return list;
}

export function getFilteredTasks() {
  return applyFilters(tasks.slice());
}

export function setActiveFilter(filter) {
  activeFilter = filter;
  if (onRender) onRender();
}

export function setActivePriorityFilter(priority) {
  activePriorityFilter = priority;
  if (onRender) onRender();
}

export function setCurrentView(view) {
  currentView = view;
  if (onRender) onRender();
}

export function getCurrentView() {
  return currentView;
}

export function createTaskCard(t) {
  const div = document.createElement('div');
  div.className = 'task';
  if (t.recurring) div.classList.add('recurring');
  div.draggable = true;
  div.dataset.id = t.id;
  
  const colorStyle = t.color && t.color !== 'default' ? `border-left: 3px solid ${getColorValue(t.color)};` : '';
  
  div.innerHTML = `
    <div style="${colorStyle}">
      <h5>${escapeHtml(t.title)}</h5>
      <div class="meta">
        <div class="priority ${priorityClass(t.priority)}">${t.priority}</div>
        <div class="muted">${escapeHtml(t.category || '')}</div>
        <div class="deadline ${dueState(t.deadline)}">${t.deadline ? formatDate(t.deadline) : 'No deadline'}</div>
      </div>
      <div style="height:8px"></div>
      <div class="muted" style="font-size:13px">${escapeHtml(truncate(t.desc || '', 140))}</div>
      <div class="task-actions">
        <button class="icon-btn" data-action="edit" title="Edit">✏️</button>
        <button class="icon-btn" data-action="delete" title="Delete">🗑️</button>
        <div style="flex:1"></div>
        <div class="muted" style="font-size:12px">${(t.tags || []).map(x => `#${escapeHtml(x)}`).join(' ')}</div>
      </div>
    </div>
  `;
  
  // Drag events
  div.addEventListener('dragstart', e => {
    dragSrcId = t.id;
    div.classList.add('dragging');
    e.dataTransfer.setData('text/plain', t.id);
  });
  
  div.addEventListener('dragend', e => {
    dragSrcId = null;
    div.classList.remove('dragging');
  });
  
  // Actions
  div.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (btn) {
      const a = btn.dataset.action;
      if (a === 'edit') {
        if (window.openModalForEdit) window.openModalForEdit(t.id);
      } else if (a === 'delete') {
        removeTask(t.id);
      }
    } else {
      if (window.openModalForEdit) window.openModalForEdit(t.id);
    }
  });
  
  return div;
}

function getColorValue(color) {
  const colors = {
    blue: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    purple: '#8b5cf6',
    orange: '#f59e0b'
  };
  return colors[color] || colors.blue;
}

function setupEventListeners() {
  // Drag & Drop
  setTimeout(() => {
    $$('.column .dropzone').forEach(zone => {
      zone.addEventListener('dragover', e => {
        e.preventDefault();
        zone.style.opacity = '0.8';
      });
      zone.addEventListener('dragleave', e => {
        zone.style.opacity = '1';
      });
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.style.opacity = '1';
        const status = zone.closest('.column').dataset.status;
        const id = e.dataTransfer.getData('text/plain') || dragSrcId;
        if (!id) return;
        updateTask(id, { status });
      });
    });
  }, 100);
}

export function exportTasks() {
  const data = JSON.stringify(tasks, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'novatasks_export_' + new Date().toISOString().slice(0, 19) + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importTasks(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) throw 'Invalid';
        if (confirm(`Import ${imported.length} tasks from file?`)) {
          imported.forEach(it => {
            it.id = it.id || uid();
            tasks.push(it);
          });
          save();
          if (onRender) onRender();
          resolve(imported.length);
        } else {
          reject('Cancelled');
        }
      } catch (err) {
        reject('Invalid file');
      }
    };
    reader.readAsText(file);
  });
}


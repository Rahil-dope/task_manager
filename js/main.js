import { $, $$, formatForInput, priorityRank } from './utils.js';
import { 
  initTaskManager, getTasks, addTask, updateTask, removeTask, clearAllTasks,
  getFilteredTasks, setActiveFilter, setActivePriorityFilter, setCurrentView, getCurrentView,
  createTaskCard, exportTasks, importTasks
} from './taskManager.js';
import { initCalendar, renderCalendar } from './calendar.js';
import { initNotifications } from './notifications.js';
import { initSync } from './sync.js';
import { checkRecurringTasks } from './recurring.js';

// Global state
let editingId = null;
let currentTheme = localStorage.getItem('novatasks.theme') || 'dark';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  try {
    initApp();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Show error to user
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:20px;text-align:center;z-index:10000;';
    errorDiv.textContent = 'Error loading application. Please check console for details.';
    document.body.appendChild(errorDiv);
  }
});

function initApp() {
  applyTheme(currentTheme);
  initTaskManager(handleTasksChange, render);
  initCalendar();
  initNotifications();
  initSync();
  setupEventListeners();
  render();
  
  // Check recurring tasks periodically
  setInterval(() => {
    checkRecurringTasks(getTasks(), addTask);
  }, 60000);
}

function handleTasksChange(tasks) {
  renderStats();
  renderProgress();
  updateCategoryFilters();
  renderList();
  renderCalendar();
}

function render() {
  const view = getCurrentView();
  
  // Hide all views
  $$('.view-container').forEach(v => v.style.display = 'none');
  
  if (view === 'board') {
    renderBoard();
    $('#boardView').style.display = 'grid';
  } else if (view === 'list') {
    renderList();
    $('#listView').style.display = 'block';
  } else if (view === 'calendar') {
    renderCalendar();
    $('#calendarView').style.display = 'block';
  }
}

function renderBoard() {
  const filtered = getFilteredTasks();
  const sortVal = $('#sortSelect')?.value || 'custom';
  
  // Sort
  if (sortVal === 'deadline') {
    filtered.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  } else if (sortVal === 'priority') {
    filtered.sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority));
  } else if (sortVal === 'created') {
    filtered.sort((a, b) => a.createdAt - b.createdAt);
  } else if (sortVal === 'title') {
    filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else if (sortVal === 'category') {
    filtered.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
  } else {
    filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  
  // Clear board
  $$('.column .dropzone').forEach(z => z.innerHTML = '');
  
  // Populate columns
  const columns = { 'Pending': [], 'In-Process': [], 'Completed': [] };
  filtered.forEach(t => {
    if (columns[t.status]) {
      columns[t.status].push(t);
    }
  });
  
  Object.keys(columns).forEach(status => {
    const container = $(`.column[data-status="${status}"] .dropzone`);
    if (container) {
      columns[status].forEach(t => {
        container.appendChild(createTaskCard(t));
      });
    }
  });
  
  // Re-setup drag & drop
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
        const id = e.dataTransfer.getData('text/plain');
        if (!id) return;
        updateTask(id, { status });
      });
    });
  }, 100);
}

function renderList() {
  const container = $('#listContainer');
  if (!container) return;
  
  const filtered = getFilteredTasks();
  const sortVal = $('#sortSelect')?.value || 'custom';
  
  // Sort (same as board)
  if (sortVal === 'deadline') {
    filtered.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  } else if (sortVal === 'priority') {
    filtered.sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority));
  } else if (sortVal === 'created') {
    filtered.sort((a, b) => a.createdAt - b.createdAt);
  } else if (sortVal === 'title') {
    filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else if (sortVal === 'category') {
    filtered.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
  }
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="muted" style="text-align:center;padding:40px">No tasks found</div>';
    return;
  }
  
  container.innerHTML = filtered.map(t => {
    const deadline = t.deadline ? new Date(t.deadline).toLocaleString() : 'No deadline';
    const dueClass = t.deadline ? (new Date(t.deadline) < new Date() && t.status !== 'Completed' ? 'overdue' : '') : '';
    
    return `
      <div class="list-item" data-id="${t.id}">
        <input type="checkbox" ${t.status === 'Completed' ? 'checked' : ''} 
               onchange="window.toggleTaskStatus('${t.id}')" />
        <div>
          <div style="font-weight:600;margin-bottom:4px">${escapeHtml(t.title)}</div>
          <div class="muted" style="font-size:12px">${escapeHtml(t.desc || '')}</div>
          <div style="display:flex;gap:8px;margin-top:6px;font-size:12px">
            <span class="priority ${priorityClass(t.priority)}">${t.priority}</span>
            <span class="muted">${escapeHtml(t.category || '')}</span>
            <span class="deadline ${dueClass}">${deadline}</span>
          </div>
        </div>
        <div class="muted" style="font-size:11px">${(t.tags || []).map(x => `#${escapeHtml(x)}`).join(' ')}</div>
        <div style="display:flex;gap:4px">
          <button class="icon-btn" onclick="window.openModalForEdit('${t.id}')" title="Edit">✏️</button>
          <button class="icon-btn" onclick="window.removeTask('${t.id}')" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderStats() {
  const tasks = getTasks();
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'Completed').length;
  const overdue = tasks.filter(t => {
    if (!t.deadline || t.status === 'Completed') return false;
    return new Date(t.deadline) < new Date();
  }).length;
  
  const totalEl = $('#statTotal');
  const doneEl = $('#statDone');
  const overdueEl = $('#statOverdue');
  
  if (totalEl) totalEl.textContent = total;
  if (doneEl) doneEl.textContent = done;
  if (overdueEl) overdueEl.textContent = overdue;
}

function renderProgress() {
  const node = $('#progressNode');
  if (!node) return;
  
  const tasks = getTasks();
  const total = tasks.length || 1;
  const done = tasks.filter(t => t.status === 'Completed').length;
  const pct = Math.round(done / total * 100);
  
  node.innerHTML = `
    <svg viewBox="0 0 36 36" style="width:100%;height:100%">
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0%" stop-color="#6EE7B7"/>
          <stop offset="50%" stop-color="#60A5FA"/>
          <stop offset="100%" stop-color="#A78BFA"/>
        </linearGradient>
      </defs>
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3.2"/>
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="url(#g1)" stroke-width="3.2" stroke-dasharray="${pct} 100" stroke-linecap="round"/>
      <text x="18" y="20.5" fill="white" font-size="5" text-anchor="middle">${pct}%</text>
    </svg>
  `;
}

function updateCategoryFilters() {
  const container = $('#categoryFilters');
  if (!container) return;
  
  const tasks = getTasks();
  const categories = [...new Set(tasks.map(t => t.category).filter(Boolean))];
  
  if (categories.length === 0) {
    container.innerHTML = '<div class="muted" style="font-size:12px">No categories</div>';
    return;
  }
  
  container.innerHTML = categories.map(cat => 
    `<div class="chip" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</div>`
  ).join('');
  
  // Add event listeners
  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('.chip').forEach(x => x.classList.remove('active'));
      chip.classList.add('active');
      setActiveFilter(`cat:${chip.dataset.cat}`);
    });
  });
}

function setupEventListeners() {
  try {
    // Add task button
    const addTaskBtn = $('#addTaskBtn');
    if (addTaskBtn) {
      addTaskBtn.addEventListener('click', () => openModalForNew());
    }
    
    // Modal controls
    const cancelModal = $('#cancelModal');
    if (cancelModal) {
      cancelModal.addEventListener('click', () => closeModal());
    }
    
    const saveTaskBtn = $('#saveTaskBtn');
    if (saveTaskBtn) {
      saveTaskBtn.addEventListener('click', handleSaveTask);
    }
    
    // Search
    const searchInput = $('#searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => render());
    }
    
    // Filters
    $$('.chip[data-filter]').forEach(chip => {
      chip.addEventListener('click', () => {
        $$('.chip[data-filter]').forEach(x => x.classList.remove('active'));
        chip.classList.add('active');
        setActiveFilter(chip.dataset.filter);
      });
    });
    
    // Priority filters
    $$('.priority-filter').forEach(filter => {
      filter.addEventListener('click', () => {
        $$('.priority-filter').forEach(x => x.classList.remove('active'));
        filter.classList.add('active');
        setActivePriorityFilter(filter.dataset.priority);
      });
    });
    
    // Sort
    const sortSelect = $('#sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => render());
    }
    
    // View toggles
    $$('.toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        $$('.toggle').forEach(t => t.classList.remove('active'));
        toggle.classList.add('active');
        setCurrentView(toggle.dataset.view);
      });
    });
    
    // Export/Import
    const exportBtn = $('#exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportTasks);
    }
    
    const importBtn = $('#importBtn');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        const fileInput = $('#fileInput');
        if (fileInput) fileInput.click();
      });
    }
    
    const fileInput = $('#fileInput');
    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          await importTasks(file);
          alert('Tasks imported successfully!');
        } catch (err) {
          alert('Failed to import: ' + err);
        }
        e.target.value = '';
      });
    }
    
    // Clear all
    const clearAllBtn = $('#clearAllBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', clearAllTasks);
    }
    
    // Theme selector
    const themeBtn = $('#themeBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const selector = $('#themeSelector');
        if (selector) {
          selector.style.display = selector.style.display === 'none' ? 'block' : 'none';
        }
      });
    }
    
    $$('.theme-option').forEach(option => {
      option.addEventListener('click', () => {
        const theme = option.dataset.theme;
        applyTheme(theme);
        $$('.theme-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        const selector = $('#themeSelector');
        if (selector) selector.style.display = 'none';
      });
    });
    
    // Modal backdrop
    const modalBackdrop = $('#modalBackdrop');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target.id === 'modalBackdrop') closeModal();
      });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'n' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !e.target.isContentEditable) {
        e.preventDefault();
        openModalForNew();
      } else if (e.key === 'c' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault();
        setCurrentView('calendar');
        $$('.toggle').forEach(t => {
          t.classList.remove('active');
          if (t.dataset.view === 'calendar') t.classList.add('active');
        });
      } else if (e.key === 'Escape') {
        const modal = $('#modalBackdrop');
        if (modal && modal.style.display === 'flex') closeModal();
      }
    });
    
    // Recurring checkbox
    const taskRecurring = $('#taskRecurring');
    if (taskRecurring) {
      taskRecurring.addEventListener('change', (e) => {
        const options = $('#recurringOptions');
        if (options) options.style.display = e.target.checked ? 'block' : 'none';
      });
    }
    
    // Color picker
    $$('.color-option').forEach(option => {
      option.addEventListener('click', () => {
        $$('.color-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
      });
    });
  } catch (error) {
    console.error('Error setting up event listeners:', error);
  }
}

function openModalForNew(dateStr = null) {
  editingId = null;
  $('#modalTitle').textContent = 'New Task';
  $('#taskTitle').value = '';
  $('#taskDesc').value = '';
  $('#taskCategory').value = '';
  $('#taskPriority').value = 'Low';
  $('#taskStatus').value = 'Pending';
  $('#taskDeadline').value = dateStr ? dateStr + 'T09:00' : '';
  $('#taskTags').value = '';
  $('#taskRecurring').checked = false;
  $('#recurringOptions').style.display = 'none';
  $$('.color-option').forEach(o => o.classList.remove('active'));
  $$('.color-option[data-color="default"]').forEach(o => o.classList.add('active'));
  openModal();
}

function openModalForEdit(id) {
  const tasks = getTasks();
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  
  editingId = id;
  $('#modalTitle').textContent = 'Edit Task';
  $('#taskTitle').value = t.title;
  $('#taskDesc').value = t.desc;
  $('#taskCategory').value = t.category;
  $('#taskPriority').value = t.priority;
  $('#taskStatus').value = t.status;
  $('#taskDeadline').value = t.deadline ? formatForInput(t.deadline) : '';
  $('#taskTags').value = (t.tags || []).join(',');
  $('#taskRecurring').checked = !!t.recurring;
  $('#recurringOptions').style.display = t.recurring ? 'block' : 'none';
  if (t.recurring) {
    $('#recurringType').value = t.recurring.type;
    $('#recurringInterval').value = t.recurring.interval || 1;
  }
  $$('.color-option').forEach(o => o.classList.remove('active'));
  $$(`.color-option[data-color="${t.color || 'default'}"]`).forEach(o => o.classList.add('active'));
  openModal();
}

function openModal() {
  const modal = $('#modalBackdrop');
  if (modal) {
    modal.style.display = 'flex';
    setTimeout(() => {
      const modalContent = $('.modal');
      if (modalContent) modalContent.style.transform = 'translateY(0)';
    }, 50);
  }
}

function closeModal() {
  const modal = $('#modalBackdrop');
  if (modal) {
    modal.style.display = 'none';
    editingId = null;
    const modalContent = $('.modal');
    if (modalContent) modalContent.style.transform = 'translateY(-8px)';
  }
}

function handleSaveTask() {
  const title = $('#taskTitle')?.value.trim();
  if (!title) {
    alert('Title is required');
    return;
  }
  
  const recurring = $('#taskRecurring')?.checked ? {
    type: $('#recurringType')?.value || 'daily',
    interval: parseInt($('#recurringInterval')?.value || '1')
  } : null;
  
  const selectedColor = $('.color-option.active')?.dataset.color || 'default';
  
  const data = {
    title,
    desc: $('#taskDesc')?.value.trim() || '',
    category: $('#taskCategory')?.value.trim() || '',
    priority: $('#taskPriority')?.value || 'Low',
    status: $('#taskStatus')?.value || 'Pending',
    deadline: $('#taskDeadline')?.value || null,
    tags: ($('#taskTags')?.value || '').split(',').map(s => s.trim()).filter(Boolean),
    recurring,
    color: selectedColor
  };
  
  if (editingId) {
    updateTask(editingId, data);
  } else {
    addTask(data);
  }
  
  closeModal();
}

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('novatasks.theme', theme);
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#039;');
}

function priorityClass(p) {
  if (p === 'Low') return 'p-low';
  if (p === 'Medium') return 'p-med';
  if (p === 'High') return 'p-high';
  return 'p-crit';
}

// Global functions for inline handlers
window.openModalForNew = openModalForNew;
window.openModalForEdit = openModalForEdit;
window.removeTask = removeTask;
window.toggleTaskStatus = (id) => {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);
  if (task) {
    updateTask(id, { status: task.status === 'Completed' ? 'Pending' : 'Completed' });
  }
};

// Initialize with demo data if empty
setTimeout(() => {
  const tasks = getTasks();
  if (tasks.length === 0) {
    addTask({
      title: 'Complete Seminar Presentation',
      desc: 'Slides + Demo + Code',
      category: 'Assignment',
      priority: 'High',
      status: 'Pending',
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
      tags: ['seminar', 'presentation']
    });
    addTask({
      title: 'Implement Login Flow',
      desc: 'JWT + Refresh tokens + CSRF protection',
      category: 'Coding',
      priority: 'Critical',
      status: 'In-Process',
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString(),
      tags: ['auth', 'backend']
    });
    addTask({
      title: 'Read DBMS Chapter 5',
      desc: 'Study normalization and practice queries',
      category: 'Reading',
      priority: 'Medium',
      status: 'Pending',
      deadline: null,
      tags: ['dbms']
    });
  }
}, 500);


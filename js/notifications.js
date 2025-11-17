import { $, $$ } from './utils.js';
import { getTasks } from './taskManager.js';

let notifications = [];
const STORAGE_KEY = 'novatasks.notifications.v1';

export function initNotifications() {
  loadNotifications();
  checkTaskNotifications();
  renderNotifications();
  setupNotificationListeners();
  
  // Check for notifications every minute
  setInterval(() => {
    checkTaskNotifications();
  }, 60000);
}

export function addNotification(message, type = 'info', taskId = null) {
  const notification = {
    id: Date.now().toString(),
    message,
    type,
    taskId,
    timestamp: Date.now(),
    read: false
  };
  
  notifications.unshift(notification);
  if (notifications.length > 50) {
    notifications = notifications.slice(0, 50);
  }
  
  saveNotifications();
  renderNotifications();
  updateBadge();
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    markAsRead(notification.id);
  }, 5000);
}

export function markAsRead(id) {
  const notif = notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    saveNotifications();
    renderNotifications();
    updateBadge();
  }
}

export function markAllAsRead() {
  notifications.forEach(n => n.read = true);
  saveNotifications();
  renderNotifications();
  updateBadge();
}

export function removeNotification(id) {
  notifications = notifications.filter(n => n.id !== id);
  saveNotifications();
  renderNotifications();
  updateBadge();
}

export function checkTaskNotifications() {
  const tasks = getTasks();
  const now = Date.now();
  
  tasks.forEach(task => {
    if (!task.deadline || task.status === 'Completed') return;
    
    const deadline = new Date(task.deadline).getTime();
    const diff = deadline - now;
    
    // Notify if due within 1 hour
    if (diff > 0 && diff <= 1000 * 60 * 60) {
      const existing = notifications.find(n => 
        n.taskId === task.id && 
        n.type === 'warning' && 
        (now - n.timestamp) < 1000 * 60 * 60
      );
      
      if (!existing) {
        addNotification(`Task "${task.title}" is due in less than an hour!`, 'warning', task.id);
      }
    }
    
    // Notify if overdue
    if (diff < 0) {
      const existing = notifications.find(n => 
        n.taskId === task.id && 
        n.type === 'danger' && 
        (now - n.timestamp) < 1000 * 60 * 60
      );
      
      if (!existing) {
        addNotification(`Task "${task.title}" is overdue!`, 'danger', task.id);
      }
    }
  });
}

function loadNotifications() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    notifications = stored ? JSON.parse(stored) : [];
    // Remove old notifications (older than 7 days)
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    notifications = notifications.filter(n => n.timestamp > weekAgo);
  } catch (e) {
    notifications = [];
  }
}

function saveNotifications() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

function renderNotifications() {
  const container = $('#notificationsList');
  if (!container) return;
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  if (notifications.length === 0) {
    container.innerHTML = '<div class="muted" style="text-align:center;padding:20px">No notifications</div>';
    return;
  }
  
  container.innerHTML = notifications.slice(0, 20).map(n => {
    const timeAgo = getTimeAgo(n.timestamp);
    const readClass = n.read ? '' : 'unread';
    return `
      <div class="notification-item ${readClass}" data-id="${n.id}">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div style="flex:1">
            <div style="font-weight:${n.read ? '400' : '600'}">${escapeHtml(n.message)}</div>
            <div class="muted" style="font-size:11px;margin-top:4px">${timeAgo}</div>
          </div>
          <button class="icon-btn" data-action="remove" data-id="${n.id}" style="padding:4px;font-size:12px">×</button>
        </div>
      </div>
    `;
  }).join('');
  
  // Add event listeners
  container.querySelectorAll('[data-action="remove"]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeNotification(btn.dataset.id);
    });
  });
  
  container.querySelectorAll('.notification-item').forEach(item => {
    item.addEventListener('click', () => {
      markAsRead(item.dataset.id);
    });
  });
}

function updateBadge() {
  const badge = $('#notificationBadge');
  if (!badge) return;
  
  const unreadCount = notifications.filter(n => !n.read).length;
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

function getTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;');
}

function setupNotificationListeners() {
  const btn = $('#notificationsBtn');
  const panel = $('#notificationsPanel');
  const closeBtn = $('#closeNotifications');
  
  if (btn && panel) {
    btn.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
      renderNotifications();
    });
  }
  
  if (closeBtn && panel) {
    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }
  
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (panel && panel.style.display !== 'none') {
      if (!panel.contains(e.target) && !btn.contains(e.target)) {
        panel.style.display = 'none';
      }
    }
  });
  
  updateBadge();
}

export function getUnreadCount() {
  return notifications.filter(n => !n.read).length;
}


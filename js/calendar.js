import { $, $$, getDaysInMonth, getFirstDayOfMonth, formatDateShort, isToday } from './utils.js';
import { getFilteredTasks } from './taskManager.js';

let currentDate = new Date();

export function initCalendar() {
  renderCalendar();
  setupCalendarListeners();
}

export function renderCalendar() {
  const container = $('#calendarGrid');
  const monthLabel = $('#calendarMonth');
  if (!container || !monthLabel) return;
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  monthLabel.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  // Get previous month's last days
  const prevMonth = new Date(year, month, 0);
  const prevMonthDays = prevMonth.getDate();
  
  // Get tasks for this month
  const tasks = getFilteredTasks();
  const tasksByDate = {};
  
  tasks.forEach(task => {
    if (!task.deadline) return;
    const taskDate = new Date(task.deadline);
    if (taskDate.getMonth() === month && taskDate.getFullYear() === year) {
      const day = taskDate.getDate();
      if (!tasksByDate[day]) tasksByDate[day] = [];
      tasksByDate[day].push(task);
    }
  });
  
  container.innerHTML = '';
  
  // Day headers
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(day => {
    const header = document.createElement('div');
    header.style.textAlign = 'center';
    header.style.fontWeight = '600';
    header.style.fontSize = '12px';
    header.style.padding = '8px';
    header.textContent = day;
    container.appendChild(header);
  });
  
  // Previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const dayEl = createCalendarDay(day, true, month - 1, year, tasksByDate);
    container.appendChild(dayEl);
  }
  
  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEl = createCalendarDay(day, false, month, year, tasksByDate);
    container.appendChild(dayEl);
  }
  
  // Next month's leading days
  const totalCells = 42; // 6 weeks * 7 days
  const cellsUsed = firstDay + daysInMonth;
  const nextMonthDays = totalCells - cellsUsed;
  
  for (let day = 1; day <= nextMonthDays; day++) {
    const dayEl = createCalendarDay(day, true, month + 1, year, tasksByDate);
    container.appendChild(dayEl);
  }
}

function createCalendarDay(day, isOtherMonth, month, year, tasksByDate) {
  const dayEl = document.createElement('div');
  dayEl.className = 'calendar-day';
  if (isOtherMonth) dayEl.classList.add('other-month');
  
  const date = new Date(year, month, day);
  if (isToday(date)) dayEl.classList.add('today');
  
  const dayNumber = document.createElement('div');
  dayNumber.className = 'calendar-day-number';
  dayNumber.textContent = day;
  dayEl.appendChild(dayNumber);
  
  // Add tasks for this day
  if (!isOtherMonth && tasksByDate[day]) {
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'calendar-tasks';
    
    tasksByDate[day].slice(0, 3).forEach(task => {
      const taskEl = document.createElement('div');
      taskEl.className = 'calendar-task';
      taskEl.textContent = truncate(task.title, 15);
      taskEl.title = task.title;
      taskEl.style.cursor = 'pointer';
      taskEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.openModalForEdit) window.openModalForEdit(task.id);
      });
      tasksContainer.appendChild(taskEl);
    });
    
    if (tasksByDate[day].length > 3) {
      const moreEl = document.createElement('div');
      moreEl.className = 'calendar-task';
      moreEl.textContent = `+${tasksByDate[day].length - 3} more`;
      moreEl.style.opacity = '0.7';
      tasksContainer.appendChild(moreEl);
    }
    
    dayEl.appendChild(tasksContainer);
  }
  
  // Click to create task on this day
  dayEl.addEventListener('click', () => {
    if (window.openModalForNew) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      window.openModalForNew(dateStr);
    }
  });
  
  return dayEl;
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function setupCalendarListeners() {
  const prevBtn = $('#prevMonth');
  const nextBtn = $('#nextMonth');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });
  }
}

export function goToToday() {
  currentDate = new Date();
  renderCalendar();
}

export function goToDate(date) {
  currentDate = new Date(date);
  renderCalendar();
}


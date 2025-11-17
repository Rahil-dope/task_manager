import { addTask } from './taskManager.js';

export function checkRecurringTasks(tasks, addTaskCallback) {
  const now = Date.now();
  tasks.forEach(task => {
    if (!task.recurring || task.status !== 'Completed') return;
    
    const lastCompleted = task.completedAt || task.createdAt;
    const nextDue = calculateNextDueDate(lastCompleted, task.recurring);
    
    if (nextDue <= now) {
      // Create next occurrence
      const newTask = {
        ...task,
        id: undefined, // Will be generated
        status: 'Pending',
        completedAt: null,
        createdAt: Date.now(),
        deadline: task.deadline ? calculateNextDueDate(new Date(task.deadline).getTime(), task.recurring) : null
      };
      addTaskCallback(newTask);
    }
  });
}

export function calculateNextDueDate(lastDate, recurring) {
  if (!recurring) return null;
  
  const last = new Date(lastDate);
  const { type, interval = 1 } = recurring;
  const next = new Date(last);
  
  switch (type) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;
    case 'weekly':
      next.setDate(next.getDate() + (7 * interval));
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + interval);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + interval);
      break;
  }
  
  return next.getTime();
}

export function processRecurringTask(task) {
  if (!task.recurring) return null;
  
  const nextDue = calculateNextDueDate(Date.now(), task.recurring);
  return {
    ...task,
    deadline: nextDue ? new Date(nextDue).toISOString() : null
  };
}


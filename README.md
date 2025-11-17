# NovaTasks - Advanced Task Manager

A modern, feature-rich task management application with calendar view, recurring tasks, notifications, themes, and sync capabilities.

## Features

### Core Features
- ✅ **Task Management**: Create, edit, delete, and organize tasks
- ✅ **Kanban Board**: Drag and drop tasks between columns (Pending, In-Process, Completed)
- ✅ **List View**: View all tasks in a detailed list format
- ✅ **Calendar View**: Visual calendar showing tasks by deadline
- ✅ **Search & Filter**: Search tasks by title, description, tags, or category
- ✅ **Advanced Sorting**: Sort by deadline, priority, creation date, title, or category
- ✅ **Priority Filtering**: Filter tasks by priority level (Critical, High, Medium, Low)

### Advanced Features
- 🔄 **Recurring Tasks**: Set tasks to repeat daily, weekly, monthly, or yearly
- 🔔 **Notifications**: Get notified about upcoming deadlines and overdue tasks
- 🎨 **Multiple Themes**: Choose from 6 beautiful themes (Dark, Light, Blue, Green, Purple, Orange)
- 🎨 **Task Colors**: Assign colors to tasks for better organization
- 📅 **Calendar Integration**: View tasks in a monthly calendar format
- ☁️ **Sync Capabilities**: 
  - Export/Import tasks as JSON
  - Remote database sync (configurable API endpoint)
  - Google Calendar sync structure (requires API setup)

### UI/UX Features
- 🎯 **Responsive Design**: Works on desktop, tablet, and mobile devices
- ⚡ **Smooth Animations**: Beautiful transitions and hover effects
- ⌨️ **Keyboard Shortcuts**:
  - `n` - Create new task
  - `c` - Switch to calendar view
  - `Escape` - Close modal
- 📊 **Progress Tracking**: Visual progress ring showing completion percentage
- 📈 **Statistics**: View total tasks, completed tasks, and overdue tasks

## File Structure

```
task/
├── index.html              # Main HTML file
├── css/
│   ├── styles.css         # Main styles
│   └── themes.css         # Theme definitions
├── js/
│   ├── main.js            # Main application logic
│   ├── taskManager.js     # Task CRUD operations
│   ├── calendar.js        # Calendar view functionality
│   ├── notifications.js  # Notification system
│   ├── recurring.js      # Recurring tasks logic
│   ├── sync.js           # Sync functionality
│   └── utils.js           # Utility functions
└── README.md              # This file
```

## Getting Started

1. **Open the application**:
   - Simply open `index.html` in a modern web browser
   - No build process or server required!

2. **Create your first task**:
   - Click the "+ New Task" button or press `n`
   - Fill in the task details
   - Click "Save Task"

3. **Organize tasks**:
   - Drag tasks between columns to change status
   - Use filters to find specific tasks
   - Sort tasks by different criteria

## Usage Guide

### Creating Tasks
- Click "+ New Task" or press `n`
- Fill in title (required), description, category, priority, status, deadline, and tags
- Optionally set as recurring task
- Choose a color for visual organization
- Click "Save Task"

### Recurring Tasks
- Check "Recurring Task" when creating/editing a task
- Select recurrence type (Daily, Weekly, Monthly, Yearly)
- Set interval (e.g., every 2 days, every 3 weeks)
- When a recurring task is completed, the next occurrence is automatically created

### Notifications
- Notifications appear automatically for:
  - Tasks due within 1 hour
  - Overdue tasks
- Click the bell icon (🔔) to view all notifications
- Notifications auto-dismiss after 5 seconds

### Themes
- Click the theme button (🎨) in the header
- Choose from 6 available themes
- Your preference is saved automatically

### Calendar View
- Click "Calendar" in the view toggles or press `c`
- Navigate months with arrow buttons
- Click on a day to create a task for that date
- Click on a task in the calendar to edit it

### Export/Import
- **Export**: Click "Export" to download all tasks as JSON
- **Import**: Click "Import" and select a JSON file
- Imported tasks are appended to existing tasks

### Sync with Remote Database
1. Click "Sync" button
2. Enter your API endpoint URL
3. The app will sync every 5 minutes automatically
4. Your API should accept POST requests with task data

### Google Calendar Sync
- Currently requires API setup
- See `js/sync.js` for implementation details
- Requires OAuth 2.0 authentication

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Data Storage

All data is stored locally in your browser's localStorage. No data is sent to external servers unless you configure remote sync.

**Storage Keys**:
- `novatasks.tasks.v2` - Task data
- `novatasks.notifications.v1` - Notifications
- `novatasks.sync.v1` - Sync settings
- `novatasks.theme` - Selected theme

## Customization

### Adding Custom Themes
Edit `css/themes.css` and add a new theme:

```css
[data-theme="your-theme"] {
  --bg-1: #your-color;
  --bg-2: #your-color;
  --accent: linear-gradient(...);
  --muted: rgba(...);
}
```

Then add the theme option in `index.html`:

```html
<div class="theme-option" data-theme="your-theme">Your Theme</div>
```

### Remote Database API Format
Your API should accept POST requests with this format:

```json
{
  "tasks": [
    {
      "id": "task-id",
      "title": "Task title",
      "desc": "Description",
      "category": "Category",
      "priority": "High",
      "status": "Pending",
      "deadline": "2024-01-01T00:00:00.000Z",
      "tags": ["tag1", "tag2"],
      "createdAt": 1234567890,
      "order": 0,
      "color": "blue",
      "recurring": null,
      "completedAt": null
    }
  ]
}
```

## Troubleshooting

### Tasks not saving
- Check browser console for errors
- Ensure localStorage is enabled
- Try clearing browser cache

### Calendar not showing
- Ensure JavaScript is enabled
- Check browser console for errors
- Refresh the page

### Notifications not working
- Check browser notification permissions
- Ensure tasks have deadlines set
- Check browser console for errors

## Future Enhancements

Potential features for future versions:
- Task templates
- Subtasks
- Task dependencies
- Time tracking
- Collaboration features
- Mobile app
- Offline PWA support

## License

This project is open source and available for personal and educational use.

## Support

For issues or questions, please check the browser console for error messages.

---

**Enjoy managing your tasks with NovaTasks!** 🚀


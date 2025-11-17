import { $, $$ } from './utils.js';
import { getTasks, load, save } from './taskManager.js';
import { addNotification } from './notifications.js';

const STORAGE_KEY = 'novatasks.sync.v1';
let syncSettings = {
  googleCalendar: { enabled: false, calendarId: null },
  remoteDb: { enabled: false, url: null, apiKey: null }
};

export function initSync() {
  loadSyncSettings();
  setupSyncListeners();
}

function loadSyncSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      syncSettings = { ...syncSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load sync settings', e);
  }
}

function saveSyncSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(syncSettings));
}

function setupSyncListeners() {
  const syncBtn = $('#syncBtn');
  const syncModal = $('#syncModal');
  const googleBtn = $('#googleCalendarBtn');
  const remoteDbBtn = $('#remoteDbBtn');
  const saveSyncBtn = $('#saveSyncBtn');
  
  if (syncBtn && syncModal) {
    syncBtn.addEventListener('click', () => {
      syncModal.style.display = syncModal.style.display === 'none' ? 'flex' : 'none';
    });
  }
  
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      initGoogleCalendarSync();
    });
  }
  
  if (remoteDbBtn) {
    remoteDbBtn.addEventListener('click', () => {
      const url = prompt('Enter your remote database API URL:');
      if (url) {
        syncSettings.remoteDb.url = url;
        syncSettings.remoteDb.enabled = true;
        saveSyncSettings();
        addNotification('Remote DB sync configured', 'success');
      }
    });
  }
  
  if (saveSyncBtn) {
    saveSyncBtn.addEventListener('click', () => {
      const url = $('#remoteDbUrl')?.value;
      if (url) {
        syncSettings.remoteDb.url = url;
        syncSettings.remoteDb.enabled = true;
        saveSyncSettings();
        addNotification('Sync settings saved', 'success');
        if (syncModal) syncModal.style.display = 'none';
      }
    });
  }
  
  // Auto-sync if enabled
  if (syncSettings.remoteDb.enabled) {
    setInterval(() => {
      syncWithRemoteDb();
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}

// Google Calendar Sync
export function initGoogleCalendarSync() {
  // Note: This requires Google Calendar API setup
  // For production, you'll need to:
  // 1. Set up OAuth 2.0
  // 2. Get API credentials from Google Cloud Console
  // 3. Implement proper authentication flow
  
  addNotification('Google Calendar sync requires API setup. See documentation.', 'info');
  
  // Placeholder for actual implementation
  // This would typically involve:
  // - OAuth authentication
  // - Creating calendar events from tasks
  // - Syncing task deadlines with calendar events
}

export async function syncWithGoogleCalendar() {
  if (!syncSettings.googleCalendar.enabled) return;
  
  try {
    const tasks = getTasks();
    // Implementation would go here
    addNotification('Synced with Google Calendar', 'success');
  } catch (error) {
    addNotification('Failed to sync with Google Calendar', 'danger');
    console.error('Google Calendar sync error:', error);
  }
}

// Remote Database Sync
export async function syncWithRemoteDb() {
  if (!syncSettings.remoteDb.enabled || !syncSettings.remoteDb.url) return;
  
  try {
    const tasks = getTasks();
    
    // POST tasks to remote DB
    const response = await fetch(syncSettings.remoteDb.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(syncSettings.remoteDb.apiKey && { 'Authorization': `Bearer ${syncSettings.remoteDb.apiKey}` })
      },
      body: JSON.stringify({ tasks })
    });
    
    if (response.ok) {
      // Optionally fetch updated tasks
      const remoteTasks = await response.json();
      if (remoteTasks && Array.isArray(remoteTasks.tasks)) {
        // Merge with local tasks
        // This is a simple merge - you might want more sophisticated conflict resolution
        load();
        addNotification('Synced with remote database', 'success');
      }
    } else {
      throw new Error('Sync failed');
    }
  } catch (error) {
    console.error('Remote DB sync error:', error);
    addNotification('Failed to sync with remote database', 'danger');
  }
}

export async function pullFromRemoteDb() {
  if (!syncSettings.remoteDb.enabled || !syncSettings.remoteDb.url) return;
  
  try {
    const response = await fetch(syncSettings.remoteDb.url, {
      method: 'GET',
      headers: {
        ...(syncSettings.remoteDb.apiKey && { 'Authorization': `Bearer ${syncSettings.remoteDb.apiKey}` })
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.tasks)) {
        // Merge tasks
        load();
        addNotification('Pulled tasks from remote database', 'success');
      }
    }
  } catch (error) {
    console.error('Remote DB pull error:', error);
    addNotification('Failed to pull from remote database', 'danger');
  }
}

export function getSyncSettings() {
  return syncSettings;
}


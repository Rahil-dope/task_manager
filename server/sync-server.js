// Simple Express sync server using Supabase service_role key
// Usage: set SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables
// Install deps: npm install express body-parser @supabase/supabase-js

const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// POST /api/sync
// Headers: Authorization: Bearer <user_access_token>
// Body: { tasks: [ ... ] }
app.post('/api/sync', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Malformed Authorization header' });

    // Validate the user's token and obtain user id
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData || !userData.user) return res.status(401).json({ error: 'Invalid token' });
    const user = userData.user;

    const tasks = Array.isArray(req.body.tasks) ? req.body.tasks : null;
    if (!tasks) return res.status(400).json({ error: 'Invalid or missing tasks array' });

    const toUpsert = tasks.map(t => ({ ...t, user_id: user.id }));
    const { data, error } = await supabase.from('tasks').upsert(toUpsert, { onConflict: 'id' });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ inserted: Array.isArray(data) ? data.length : data });
  } catch (err) {
    console.error('Sync error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Sync server listening on ${port}`));

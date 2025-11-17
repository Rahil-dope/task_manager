const { createClient } = require('@supabase/supabase-js');

// This Netlify Function securely upserts tasks into Supabase using the service_role key.
// Environment variables required (set in Netlify dashboard):
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE must be set in environment');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

exports.handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Expect Authorization: Bearer <access_token>
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Missing Authorization header' }) };
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Malformed Authorization header' }) };
    }

    // Validate user token with Supabase to obtain user id
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData || !userData.user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
    }

    const user = userData.user;

    // Parse payload
    const payload = event.body ? JSON.parse(event.body) : {};
    const tasks = Array.isArray(payload.tasks) ? payload.tasks : null;
    if (!tasks) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid or missing tasks array' }) };
    }

    // Attach user_id to every row so data is per-user
    const toUpsert = tasks.map(t => ({ ...t, user_id: user.id }));

    const { data, error } = await supabase.from('tasks').upsert(toUpsert, { onConflict: 'id' });
    if (error) {
      console.error('Supabase upsert error', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ inserted: Array.isArray(data) ? data.length : data }) };
  } catch (err) {
    console.error('Function error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};

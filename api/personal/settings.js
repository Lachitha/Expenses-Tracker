import { list, put } from '@vercel/blob';
import { getUserFromRequest } from '../auth/helpers.js';

const NO_CACHE = {
  'content-type': 'application/json',
  'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: NO_CACHE });
}

const DEFAULT_SETTINGS = {
  creditCards: {
    'credit-card-master': { name: 'Credit Card Master', creditLimit: 0 },
    'credit-card-visa': { name: 'Credit Card Visa', creditLimit: 0 },
  },
  billingCycleDay: 6,
};

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { blobs } = await list({ prefix: `settings/${user.id}/` });
    if (!blobs?.length) return json(DEFAULT_SETTINGS);

    const settingsFile = blobs.find(b => b.url.includes('settings.json'));
    if (!settingsFile) return json(DEFAULT_SETTINGS);

    const resp = await fetch(settingsFile.url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!resp.ok) return json(DEFAULT_SETTINGS);
    const settings = await resp.json();
    return json({ ...DEFAULT_SETTINGS, ...settings });
  } catch (e) {
    console.error('GET settings error:', e.message);
    return json({ error: e.message }, 500);
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await request.json();
    const key = `settings/${user.id}/settings.json`;
    const data = JSON.stringify(body);

    await put(key, data, {
      contentType: 'application/json',
      access: 'public',
      addRandomSuffix: false,
    });

    return json(body);
  } catch (e) {
    console.error('POST settings error:', e.message);
    return json({ error: e.message }, 500);
  }
}

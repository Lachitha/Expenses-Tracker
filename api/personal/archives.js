import { list, put, del } from '@vercel/blob';
import { getUserFromRequest } from '../auth/helpers.js';

const NO_CACHE = {
  'content-type': 'application/json',
  'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: NO_CACHE });
}

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { blobs } = await list({ prefix: `archives/${user.id}/` });
    if (!blobs?.length) return json([]);

    const items = await Promise.all(
      blobs
        .filter(b => b.url.endsWith('.json'))
        .map(b => fetch(b.url, {
          headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
        }).then(r => r.json()))
    );
    items.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));
    return json(items);
  } catch (e) {
    console.error('GET archives error:', e.message);
    return json({ error: e.message }, 500);
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await request.json();
    const archive = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      label: body.label || `Archive ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
      archivedAt: new Date().toISOString(),
      transactions: body.transactions || [],
      savings: body.savings || [],
      settings: body.settings || {},
    };

    const key = `archives/${user.id}/${archive.id}.json`;
    await put(key, JSON.stringify(archive), {
      contentType: 'application/json',
      access: 'public',
      allowOverwrite: true,
    });
    return json(archive, 201);
  } catch (e) {
    console.error('POST archive error:', e.message);
    return json({ error: e.message }, 500);
  }
}

export async function DELETE(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await del(`archives/${user.id}/${id}.json`);
    return json({ success: true });
  } catch (e) {
    console.error('DELETE archive error:', e.message);
    return json({ error: e.message }, 500);
  }
}

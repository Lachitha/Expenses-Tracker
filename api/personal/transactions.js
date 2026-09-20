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

    const prefix = `personal/${user.id}/`;
    const { blobs } = await list({ prefix });
    if (!blobs?.length) return json([]);

    const items = await Promise.all(
      blobs
        .filter(b => b.url.endsWith('.json'))
        .map(b => fetch(b.url, {
          headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
        }).then(r => r.json()))
    );
    items.sort((a, b) => a.id - b.id);
    return json(items);
  } catch (e) {
    console.error('GET personal error:', e.message);
    return json({ error: e.message }, 500);
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await request.json();
    const key = `personal/${user.id}/${body.id}.json`;
    await put(key, JSON.stringify(body), {
      contentType: 'application/json',
      access: 'private',
      allowOverwrite: true,
    });
    return json(body, 201);
  } catch (e) {
    console.error('POST personal error:', e.message);
    return json({ error: e.message }, 500);
  }
}

export async function DELETE(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await del(`personal/${user.id}/${id}.json`);
    return json({ success: true });
  } catch (e) {
    console.error('DELETE personal error:', e.message);
    return json({ error: e.message }, 500);
  }
}

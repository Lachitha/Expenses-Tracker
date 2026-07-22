import { list, put, del } from '@vercel/blob';

const PREFIX = 'transactions/';
const NO_CACHE = {
  'content-type': 'application/json',
  'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'pragma': 'no-cache',
  'expires': '0',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: NO_CACHE });
}

export async function GET() {
  try {
    const { blobs } = await list({ prefix: PREFIX });
    if (!blobs?.length) return json([]);
    const items = await Promise.all(
      blobs.map(b => fetch(b.url, {
        headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
      }).then(r => r.json()))
    );
    items.sort((a, b) => a.id - b.id);
    return json(items);
  } catch (e) {
    console.error('GET error:', e.message);
    return json({ error: e.message }, 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const key = `${PREFIX}${body.id}.json`;
    const result = await put(key, JSON.stringify(body), {
      contentType: 'application/json',
      access: 'private',
    });
    if (!result.url) throw new Error('Blob put returned no url');
    return json(body, 201);
  } catch (e) {
    console.error('POST error:', e.message);
    return json({ error: e.message }, 500);
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await del(`${PREFIX}${id}.json`);
    return json({ success: true });
  } catch (e) {
    console.error('DELETE error:', e.message);
    return json({ error: e.message }, 500);
  }
}

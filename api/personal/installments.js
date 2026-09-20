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

    const { blobs } = await list({ prefix: `installments/${user.id}/` });
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
    console.error('GET installments error:', e.message);
    return json({ error: e.message }, 500);
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await request.json();
    const installment = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      cardId: body.cardId,
      cardName: body.cardName,
      name: body.name,
      monthlyAmount: Number(body.monthlyAmount),
      totalMonths: Number(body.totalMonths),
      startDate: body.startDate,
      createdAt: new Date().toISOString(),
    };

    const key = `installments/${user.id}/${installment.id}.json`;
    await put(key, JSON.stringify(installment), {
      contentType: 'application/json',
      access: 'private',
    });
    return json(installment, 201);
  } catch (e) {
    console.error('POST installment error:', e.message);
    return json({ error: e.message }, 500);
  }
}

export async function DELETE(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await del(`installments/${user.id}/${id}.json`);
    return json({ success: true });
  } catch (e) {
    console.error('DELETE installment error:', e.message);
    return json({ error: e.message }, 500);
  }
}

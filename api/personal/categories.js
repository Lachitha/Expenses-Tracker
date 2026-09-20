import { list, put, del } from '@vercel/blob';
import { getUserFromRequest } from '../auth/helpers.js';

const NO_CACHE = {
  'content-type': 'application/json',
  'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: NO_CACHE });
}

const DEFAULT_CATEGORIES = [
  { id: 'food', name: 'Food', type: 'expense', builtin: true },
  { id: 'fuel-bike', name: 'Fuel (Bike)', type: 'expense', builtin: true },
  { id: 'fuel-vehicle', name: 'Fuel (Vehicle)', type: 'expense', builtin: true },
  { id: 'travel', name: 'Travel', type: 'expense', builtin: true },
  { id: 'cloths', name: 'Cloths', type: 'expense', builtin: true },
  { id: 'medicine', name: 'Medicine', type: 'expense', builtin: true },
  { id: 'salary', name: 'Salary', type: 'income', builtin: true },
  { id: 'other-income', name: 'Other Income', type: 'income', builtin: true },
];

const DEFAULT_PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', builtin: true },
  { id: 'credit-card-master', name: 'Credit Card Master', builtin: true },
  { id: 'credit-card-visa', name: 'Credit Card Visa', builtin: true },
  { id: 'debit-card-flash', name: 'Debit Card Flash', builtin: true },
  { id: 'debit-card-usd', name: 'Debit Card USD', builtin: true },
];

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { blobs } = await list({ prefix: `categories/${user.id}/` });

    let customCategories = [];
    let customPaymentMethods = [];

    if (blobs?.length) {
      const items = await Promise.all(
        blobs.map(b => fetch(b.url, {
          headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
        }).then(r => r.json()))
      );
      customCategories = items.filter(i => i.itemType === 'category');
      customPaymentMethods = items.filter(i => i.itemType === 'paymentMethod');
    }

    return json({
      categories: [...DEFAULT_CATEGORIES, ...customCategories],
      paymentMethods: [...DEFAULT_PAYMENT_METHODS, ...customPaymentMethods],
    });
  } catch (e) {
    console.error('GET categories error:', e.message);
    return json({ error: e.message }, 500);
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await request.json();
    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: body.name,
      type: body.type,
      itemType: body.itemType,
      builtin: false,
    };

    const key = `categories/${user.id}/${item.id}.json`;
    await put(key, JSON.stringify(item), {
      contentType: 'application/json',
      access: 'public',
      allowOverwrite: true,
    });
    return json(item, 201);
  } catch (e) {
    console.error('POST categories error:', e.message);
    return json({ error: e.message }, 500);
  }
}

export async function PUT(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await request.json();
    const key = `categories/${user.id}/${body.id}.json`;
    
    const { blobs } = await list({ prefix: `categories/${user.id}/${body.id}` });
    if (!blobs?.length) return json({ error: 'Not found' }, 404);

    const existingResp = await fetch(blobs[0].url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    const existing = await existingResp.json();
    const updated = { ...existing, ...body };

    await put(key, JSON.stringify(updated), {
      contentType: 'application/json',
      access: 'public',
      allowOverwrite: true,
    });
    return json(updated);
  } catch (e) {
    console.error('PUT categories error:', e.message);
    return json({ error: e.message }, 500);
  }
}

export async function DELETE(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await del(`categories/${user.id}/${id}.json`);
    return json({ success: true });
  } catch (e) {
    console.error('DELETE categories error:', e.message);
    return json({ error: e.message }, 500);
  }
}

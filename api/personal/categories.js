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

function isBuiltinId(id) {
  return [...DEFAULT_CATEGORIES, ...DEFAULT_PAYMENT_METHODS].some(d => d.id === id);
}

function isBuiltinCategory(id) {
  return DEFAULT_CATEGORIES.some(d => d.id === id);
}

function isBuiltinPayment(id) {
  return DEFAULT_PAYMENT_METHODS.some(d => d.id === id);
}

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { blobs } = await list({ prefix: `categories/${user.id}/` });

    let allItems = [];

    if (blobs?.length) {
      allItems = await Promise.all(
        blobs.map(b => fetch(b.url, {
          headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
        }).then(r => r.json()))
      );
    }

    const customCategories = allItems.filter(i => i.itemType === 'category' && !isBuiltinId(i.id));
    const customPaymentMethods = allItems.filter(i => i.itemType === 'paymentMethod' && !isBuiltinId(i.id));
    const overrides = allItems.filter(i => isBuiltinId(i.id));
    const deletedBuiltins = new Set(overrides.filter(i => i.deleted).map(i => i.id));

    const mergedCategories = DEFAULT_CATEGORIES.filter(c => !deletedBuiltins.has(c.id)).map(c => {
      const override = overrides.find(o => o.id === c.id);
      return override ? { ...c, name: override.name, type: override.type || c.type } : c;
    }).concat(customCategories);

    const mergedPaymentMethods = DEFAULT_PAYMENT_METHODS.filter(p => !deletedBuiltins.has(p.id)).map(p => {
      const override = overrides.find(o => o.id === p.id);
      return override ? { ...p, name: override.name, creditCardId: override.creditCardId || '' } : p;
    }).concat(customPaymentMethods);

    return json({
      categories: mergedCategories,
      paymentMethods: mergedPaymentMethods,
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
      creditCardId: body.creditCardId || '',
      balanceTreatment: body.balanceTreatment || '',
      builtin: false,
    };

    const key = `categories/${user.id}/${item.id}.json`;
    await put(key, JSON.stringify(item), {
      contentType: 'application/json',
      access: 'private',
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
    const id = body.id;
    const key = `categories/${user.id}/${id}.json`;

    const isBuiltin = isBuiltinId(id);
    let existing = null;

    if (!isBuiltin) {
      const { blobs } = await list({ prefix: `categories/${user.id}/${id}` });
      if (blobs?.length) {
        const resp = await fetch(blobs[0].url, {
          headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
        });
        existing = await resp.json();
      }
    }

    let updated;
    if (existing) {
      updated = { ...existing, ...body };
    } else if (isBuiltin) {
      updated = {
        id,
        name: body.name,
        itemType: isBuiltinCategory(id) ? 'category' : 'paymentMethod',
        type: body.type,
      };
    } else {
      return json({ error: 'Not found' }, 404);
    }

    await put(key, JSON.stringify(updated), {
      contentType: 'application/json',
      access: 'private',
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
    if (!id) return json({ error: 'Item ID is required' }, 400);

    if (isBuiltinId(id)) {
      const defaultItem = [...DEFAULT_CATEGORIES, ...DEFAULT_PAYMENT_METHODS].find(item => item.id === id);
      await put(`categories/${user.id}/${id}.json`, JSON.stringify({
        id,
        itemType: isBuiltinCategory(id) ? 'category' : 'paymentMethod',
        name: defaultItem.name,
        deleted: true,
      }), {
        contentType: 'application/json',
        access: 'private',
        allowOverwrite: true,
      });
      return json({ success: true });
    }
    await del(`categories/${user.id}/${id}.json`);
    return json({ success: true });
  } catch (e) {
    console.error('DELETE categories error:', e.message);
    return json({ error: e.message }, 500);
  }
}

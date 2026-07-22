import { list, put } from '@vercel/blob';

const BLOB_KEY = 'transactions.json';

async function getTransactions() {
  const { blobs } = await list({ prefix: BLOB_KEY });
  if (blobs.length === 0) return [];
  const res = await fetch(blobs[0].url);
  return res.json();
}

async function saveTransactions(transactions) {
  await put(BLOB_KEY, JSON.stringify(transactions), {
    contentType: 'application/json',
    access: 'public',
  });
}

export async function GET() {
  try {
    return Response.json(await getTransactions());
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const transactions = await getTransactions();
    transactions.push(body);
    await saveTransactions(transactions);
    return Response.json(body, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    const transactions = await getTransactions();
    await saveTransactions(transactions.filter(t => t.id !== id));
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

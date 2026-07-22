import { list, put } from '@vercel/blob';

const BLOB_KEY = 'transactions.json';
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

async function getTransactions() {
  const { blobs } = await list({ prefix: BLOB_KEY, token: TOKEN });
  if (blobs.length === 0) return [];
  const res = await fetch(blobs[0].url);
  return res.json();
}

async function saveTransactions(transactions) {
  await put(BLOB_KEY, JSON.stringify(transactions), {
    contentType: 'application/json',
    access: 'public',
    token: TOKEN,
  });
}

export async function GET() {
  try {
    const data = await getTransactions();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message, name: e.name }, { status: 500 });
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
    return Response.json({ error: e.message, name: e.name }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    const transactions = await getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    await saveTransactions(filtered);
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message, name: e.name }, { status: 500 });
  }
}

const BLOB_KEY = 'transactions.json';
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_API = 'https://blob.vercel-storage.com';

async function getTransactions() {
  const url = `${BLOB_API}/?prefix=${BLOB_KEY}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (res.status === 404) return [];
  const { blobs } = await res.json();
  if (!blobs || blobs.length === 0) return [];
  const data = await fetch(blobs[0].url);
  return data.json();
}

async function saveTransactions(transactions) {
  await fetch(`${BLOB_API}/${BLOB_KEY}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transactions),
  });
}

export async function GET() {
  try {
    const data = await getTransactions();
    return Response.json(data);
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
    const filtered = transactions.filter(t => t.id !== id);
    await saveTransactions(filtered);
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

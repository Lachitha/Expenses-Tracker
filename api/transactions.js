import { put, get } from '@vercel/blob';

const BLOB_KEY = 'transactions.json';

async function getTransactions() {
  const result = await get(BLOB_KEY, { access: 'private' });
  if (!result) return [];
  return new Response(result.stream).json();
}

async function saveTransactions(transactions) {
  const result = await put(BLOB_KEY, JSON.stringify(transactions), {
    contentType: 'application/json',
    access: 'private',
    allowOverwrite: true,
  });
  if (!result.url) throw new Error('Blob put returned no url');
}

export async function GET() {
  try {
    return Response.json(await getTransactions());
  } catch (e) {
    console.error('GET error:', e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const transactions = await getTransactions();
    transactions.push(body);
    await saveTransactions(transactions);
    console.log('POST success:', body.id);
    return Response.json(body, { status: 201 });
  } catch (e) {
    console.error('POST error:', e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    const transactions = await getTransactions();
    await saveTransactions(transactions.filter(t => t.id !== id));
    console.log('DELETE success:', id);
    return Response.json({ success: true });
  } catch (e) {
    console.error('DELETE error:', e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

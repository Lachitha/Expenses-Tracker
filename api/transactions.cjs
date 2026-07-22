const { list, put } = require('@vercel/blob');

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

module.exports = {
  async GET() {
    try {
      return new Response(JSON.stringify(await getTransactions()), {
        headers: { 'content-type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  },

  async POST(request) {
    try {
      const body = await request.json();
      const transactions = await getTransactions();
      transactions.push(body);
      await saveTransactions(transactions);
      return new Response(JSON.stringify(body), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  },

  async DELETE(request) {
    try {
      const { searchParams } = new URL(request.url);
      const id = Number(searchParams.get('id'));
      const transactions = await getTransactions();
      await saveTransactions(transactions.filter(t => t.id !== id));
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'content-type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  },
};

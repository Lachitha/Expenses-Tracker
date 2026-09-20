import { list } from '@vercel/blob';
import bcrypt from 'bcryptjs';
import { sign } from './helpers.js';

const NO_CACHE = {
  'content-type': 'application/json',
  'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: NO_CACHE });
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return json({ error: 'Email and password are required' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { blobs } = await list({ prefix: `users/${normalizedEmail}` });

    if (!blobs?.length) {
      return json({ error: 'Invalid email or password' }, 401);
    }

    const userResp = await fetch(blobs[0].url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    const user = await userResp.json();

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return json({ error: 'Invalid email or password' }, 401);
    }

    const token = sign({ id: user.id, email: user.email, name: user.name });

    return json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    console.error('Login error:', e.message);
    return json({ error: e.message }, 500);
  }
}

import { list, put } from '@vercel/blob';
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
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return json({ error: 'Name, email and password are required' }, 400);
    }

    if (password.length < 4) {
      return json({ error: 'Password must be at least 4 characters' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { blobs } = await list({ prefix: `users/${normalizedEmail}` });
    if (blobs?.length > 0) {
      return json({ error: 'Email already registered' }, 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    await put(`users/${normalizedEmail}.json`, JSON.stringify(user), {
      contentType: 'application/json',
      access: 'private',
      allowOverwrite: true,
    });

    const token = sign({ id: user.id, email: user.email, name: user.name });

    return json({ token, user: { id: user.id, name: user.name, email: user.email } }, 201);
  } catch (e) {
    console.error('Register error:', e.message);
    return json({ error: e.message }, 500);
  }
}

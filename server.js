import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs'
import { createServer } from 'http'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

const NO_CACHE = 'no-store, no-cache, must-revalidate, proxy-revalidate'

function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': NO_CACHE,
  })
  res.end(JSON.stringify(data))
}

function sign(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify({ ...payload, iat: Date.now() }))
  const signature = btoa(bcrypt.hashSync(`${header}.${body}`, 8))
  return `${header}.${body}.${signature}`
}

function verify(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(atob(parts[1]))
  } catch { return null }
}

function getUser(req) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  return verify(auth.slice(7))
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
]

const DEFAULT_PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', builtin: true },
  { id: 'credit-card-master', name: 'Credit Card Master', builtin: true },
  { id: 'credit-card-visa', name: 'Credit Card Visa', builtin: true },
  { id: 'debit-card-flash', name: 'Debit Card Flash', builtin: true },
  { id: 'debit-card-usd', name: 'Debit Card USD', builtin: true },
]

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => { try { resolve(JSON.parse(body)) } catch { reject(new Error('Invalid JSON')) } })
  })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const { pathname, searchParams } = url

  // Shared transactions
  if (pathname === '/api/transactions') {
    const file = join(DATA_DIR, 'transactions.json')
    if (req.method === 'GET') {
      return json(res, existsSync(file) ? JSON.parse(readFileSync(file, 'utf-8')) : [])
    }
    if (req.method === 'POST') {
      const t = await parseBody(req)
      const list = existsSync(file) ? JSON.parse(readFileSync(file, 'utf-8')) : []
      list.push(t)
      ensureDir(DATA_DIR)
      writeFileSync(file, JSON.stringify(list))
      return json(res, t, 201)
    }
    if (req.method === 'DELETE') {
      const id = Number(searchParams.get('id'))
      const list = existsSync(file) ? JSON.parse(readFileSync(file, 'utf-8')) : []
      writeFileSync(file, JSON.stringify(list.filter(t => t.id !== id)))
      return json(res, { success: true })
    }
  }

  // Auth: Register
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    const { name, email, password } = await parseBody(req)
    if (!name || !email || !password) return json(res, { error: 'Name, email and password are required' }, 400)
    const norm = email.toLowerCase().trim()
    ensureDir(join(DATA_DIR, 'users'))
    const userFile = join(DATA_DIR, 'users', `${norm}.json`)
    if (existsSync(userFile)) return json(res, { error: 'Email already registered' }, 409)
    const hashed = await bcrypt.hash(password, 10)
    const user = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), name: name.trim(), email: norm, password: hashed, createdAt: new Date().toISOString() }
    writeFileSync(userFile, JSON.stringify(user))
    const token = sign({ id: user.id, email: user.email, name: user.name })
    return json(res, { token, user: { id: user.id, name: user.name, email: user.email } }, 201)
  }

  // Auth: Login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const { email, password } = await parseBody(req)
    if (!email || !password) return json(res, { error: 'Email and password are required' }, 400)
    const norm = email.toLowerCase().trim()
    const userFile = join(DATA_DIR, 'users', `${norm}.json`)
    if (!existsSync(userFile)) return json(res, { error: 'Invalid email or password' }, 401)
    const user = JSON.parse(readFileSync(userFile, 'utf-8'))
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return json(res, { error: 'Invalid email or password' }, 401)
    const token = sign({ id: user.id, email: user.email, name: user.name })
    return json(res, { token, user: { id: user.id, name: user.name, email: user.email } })
  }

  // Personal transactions
  if (pathname === '/api/personal/transactions') {
    const user = getUser(req)
    if (!user) return json(res, { error: 'Unauthorized' }, 401)
    const dir = join(DATA_DIR, 'personal', user.id)
    if (req.method === 'GET') {
      ensureDir(dir)
      const files = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json')) : []
      const items = files.map(f => JSON.parse(readFileSync(join(dir, f), 'utf-8')))
      items.sort((a, b) => a.id - b.id)
      return json(res, items)
    }
    if (req.method === 'POST') {
      const t = await parseBody(req)
      ensureDir(dir)
      writeFileSync(join(dir, `${t.id}.json`), JSON.stringify(t))
      return json(res, t, 201)
    }
    if (req.method === 'DELETE') {
      const id = searchParams.get('id')
      const f = join(dir, `${id}.json`)
      if (existsSync(f)) unlinkSync(f)
      return json(res, { success: true })
    }
  }

  // Personal categories
  if (pathname === '/api/personal/categories') {
    const user = getUser(req)
    if (!user) return json(res, { error: 'Unauthorized' }, 401)
    const dir = join(DATA_DIR, 'categories', user.id)
    if (req.method === 'GET') {
      ensureDir(dir)
      const files = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json')) : []
      const items = files.map(f => JSON.parse(readFileSync(join(dir, f), 'utf-8')))
      const customCategories = items.filter(i => i.itemType === 'category')
      const customPayment = items.filter(i => i.itemType === 'paymentMethod')
      return json(res, { categories: [...DEFAULT_CATEGORIES, ...customCategories], paymentMethods: [...DEFAULT_PAYMENT_METHODS, ...customPayment] })
    }
    if (req.method === 'POST') {
      const body = await parseBody(req)
      const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), name: body.name, type: body.type, itemType: body.itemType, builtin: false }
      ensureDir(dir)
      writeFileSync(join(dir, `${item.id}.json`), JSON.stringify(item))
      return json(res, item, 201)
    }
    if (req.method === 'PUT') {
      const body = await parseBody(req)
      const f = join(dir, `${body.id}.json`)
      if (existsSync(f)) {
        const existing = JSON.parse(readFileSync(f, 'utf-8'))
        const updated = { ...existing, ...body }
        writeFileSync(f, JSON.stringify(updated))
        return json(res, updated)
      }
      return json(res, { error: 'Not found' }, 404)
    }
    if (req.method === 'DELETE') {
      const id = searchParams.get('id')
      const f = join(dir, `${id}.json`)
      if (existsSync(f)) unlinkSync(f)
      return json(res, { success: true })
    }
  }

  // Personal settings (credit card balances, billing cycle)
  if (pathname === '/api/personal/settings') {
    const user = getUser(req)
    if (!user) return json(res, { error: 'Unauthorized' }, 401)
    const dir = join(DATA_DIR, 'settings', user.id)
    const settingsFile = join(dir, 'settings.json')
    const defaultSettings = {
      creditCards: {
        'credit-card-master': { name: 'Credit Card Master', creditLimit: 0 },
        'credit-card-visa': { name: 'Credit Card Visa', creditLimit: 0 },
      },
      billingCycleDay: 6,
    }
    if (req.method === 'GET') {
      ensureDir(dir)
      const settings = existsSync(settingsFile) ? JSON.parse(readFileSync(settingsFile, 'utf-8')) : defaultSettings
      return json(res, { ...defaultSettings, ...settings })
    }
    if (req.method === 'POST') {
      const body = await parseBody(req)
      ensureDir(dir)
      writeFileSync(settingsFile, JSON.stringify(body))
      return json(res, body)
    }
  }

  // Personal installments
  if (pathname === '/api/personal/installments') {
    const user = getUser(req)
    if (!user) return json(res, { error: 'Unauthorized' }, 401)
    const dir = join(DATA_DIR, 'installments', user.id)
    if (req.method === 'GET') {
      ensureDir(dir)
      const files = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json')) : []
      const items = files.map(f => JSON.parse(readFileSync(join(dir, f), 'utf-8')))
      items.sort((a, b) => a.id - b.id)
      return json(res, items)
    }
    if (req.method === 'POST') {
      const body = await parseBody(req)
      const installment = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        cardId: body.cardId,
        cardName: body.cardName,
        name: body.name,
        monthlyAmount: Number(body.monthlyAmount),
        totalMonths: Number(body.totalMonths),
        startDate: body.startDate,
        createdAt: new Date().toISOString(),
      }
      ensureDir(dir)
      writeFileSync(join(dir, `${installment.id}.json`), JSON.stringify(installment))
      return json(res, installment, 201)
    }
    if (req.method === 'DELETE') {
      const id = searchParams.get('id')
      const f = join(dir, `${id}.json`)
      if (existsSync(f)) unlinkSync(f)
      return json(res, { success: true })
    }
  }

  // Personal archives
  if (pathname === '/api/personal/archives') {
    const user = getUser(req)
    if (!user) return json(res, { error: 'Unauthorized' }, 401)
    const dir = join(DATA_DIR, 'archives', user.id)
    if (req.method === 'GET') {
      ensureDir(dir)
      const files = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json')) : []
      const items = files.map(f => JSON.parse(readFileSync(join(dir, f), 'utf-8')))
      items.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt))
      return json(res, items)
    }
    if (req.method === 'POST') {
      const body = await parseBody(req)
      const archive = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        label: body.label || `Archive ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
        archivedAt: new Date().toISOString(),
        transactions: body.transactions || [],
        savings: body.savings || [],
        settings: body.settings || {},
      }
      ensureDir(dir)
      writeFileSync(join(dir, `${archive.id}.json`), JSON.stringify(archive))
      return json(res, archive, 201)
    }
    if (req.method === 'DELETE') {
      const id = searchParams.get('id')
      const f = join(dir, `${id}.json`)
      if (existsSync(f)) unlinkSync(f)
      return json(res, { success: true })
    }
  }

  json(res, { error: 'Not found' }, 404)
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})

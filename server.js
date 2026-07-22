import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { createServer } from 'http'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const DATA_FILE = join(DATA_DIR, 'transactions.json')

function readTransactions() {
  if (!existsSync(DATA_FILE)) return []
  return JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
}

function writeTransactions(data) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(data), 'utf-8')
}

const server = createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json')

  const url = new URL(req.url, `http://${req.headers.host}`)
  const { pathname, searchParams } = url

  if (pathname === '/api/transactions') {
    if (req.method === 'GET') {
      res.end(JSON.stringify(readTransactions()))
    } else if (req.method === 'POST') {
      let body = ''
      req.on('data', chunk => body += chunk)
      req.on('end', () => {
        const t = JSON.parse(body)
        const transactions = readTransactions()
        transactions.push(t)
        writeTransactions(transactions)
        res.statusCode = 201
        res.end(JSON.stringify(t))
      })
    } else if (req.method === 'DELETE') {
      const id = Number(searchParams.get('id'))
      const transactions = readTransactions().filter(t => t.id !== id)
      writeTransactions(transactions)
      res.end(JSON.stringify({ success: true }))
    } else {
      res.statusCode = 405
      res.end(JSON.stringify({ error: 'Method not allowed' }))
    }
  } else {
    res.statusCode = 404
    res.end(JSON.stringify({ error: 'Not found' }))
  }
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})

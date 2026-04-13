import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))

const sql = readFileSync(join(__dirname, '../supabase/schema.sql'), 'utf8')

const client = new Client({
  host: 'db.rcxhuctwimkabuyextka.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '!Anm!ei_+VQ8sY.',
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log('Connected to Supabase Postgres')
  await client.query(sql)
  console.log('✓ Schema applied successfully')
} catch (err) {
  console.error('Error applying schema:', err.message)
  process.exit(1)
} finally {
  await client.end()
}

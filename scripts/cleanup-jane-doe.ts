import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  // 1. Find the Jane Doe rows
  const janes = await sql`
    SELECT id, name, email
    FROM students
    WHERE name ILIKE '%jane%doe%'
       OR email ILIKE '%student@example%'
       OR email ILIKE '%theautomatedcmo%'
  `
  console.log('Found rows:', JSON.stringify(janes, null, 2))

  // 2. Delete the placeholder Jane Doe (student@example.com)
  const deleted = await sql`
    DELETE FROM students
    WHERE email = 'student@example.com'
    RETURNING id, name, email
  `
  console.log('Deleted:', deleted)

  // 3. Rename the real one to Adamma Ihemeson
  const updated = await sql`
    UPDATE students
    SET name = 'Adamma Ihemeson'
    WHERE email = 'theautomatedcmo@gmail.com'
    RETURNING id, name, email
  `
  console.log('Updated:', updated)
}

main().catch(err => { console.error(err); process.exit(1) })

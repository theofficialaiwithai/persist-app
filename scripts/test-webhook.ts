/**
 * Test the Persist webhook endpoint locally.
 *
 * Usage:
 *   npm run test:webhook <creatorId> <webhookSecret>
 *
 * Example:
 *   npm run test:webhook xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx abc123def456...
 */

import crypto from 'node:crypto'

const [, , creatorId, webhookSecret] = process.argv

if (!creatorId || !webhookSecret) {
  console.error(
    'Usage: npm run test:webhook <creatorId> <webhookSecret>\n\n' +
    'Get your creatorId and webhookSecret from GET /api/webhook/info (requires auth).'
  )
  process.exit(1)
}

async function main() {
  const payload = {
    studentEmail: 'student@example.com',
    studentName: 'Jane Doe',
    courseTitle: 'My Flagship Course',
    courseExternalId: 'course_test_123',
    completionPercent: 45,
    eventType: 'lesson_complete',
    eventTimestamp: new Date().toISOString(),
  }

  const body = JSON.stringify(payload)

  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  const url = `http://localhost:3000/api/webhook/progress?creatorId=${creatorId}`

  console.log('\n──────────────────────────────────────────')
  console.log('  Persist webhook test')
  console.log('──────────────────────────────────────────')
  console.log(`  URL       : ${url}`)
  console.log(`  Signature : ${signature}`)
  console.log(`  Payload   :\n${JSON.stringify(payload, null, 4)}`)
  console.log('──────────────────────────────────────────\n')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-persist-signature': signature,
    },
    body,
  })

  const responseBody = await response.json()

  console.log(`  Status : ${response.status} ${response.statusText}`)
  console.log(`  Body   : ${JSON.stringify(responseBody, null, 4)}`)
  console.log('──────────────────────────────────────────\n')

  if (!response.ok) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})

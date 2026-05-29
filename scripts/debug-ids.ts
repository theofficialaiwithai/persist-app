/**
 * Debug script — inspect creator/student ID relationships in Neon.
 * Run with: npx tsx scripts/debug-ids.ts
 *
 * NOTE: students are linked to creators THROUGH courses, not directly.
 * This script shows both the raw rows and the resolved chain.
 */

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../db/schema'
import { eq } from 'drizzle-orm'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function main() {
  // ── 1. All creators ─────────────────────────────────────────────────────────
  const allCreators = await db
    .select({
      id:     schema.creators.id,
      userId: schema.creators.userId,
      email:  schema.creators.email,
    })
    .from(schema.creators)

  console.log('\n══ CREATORS ══════════════════════════════════════════')
  if (allCreators.length === 0) {
    console.log('  (no rows)')
  }
  for (const c of allCreators) {
    console.log(`  id      : ${c.id}`)
    console.log(`  userId  : ${c.userId}`)
    console.log(`  email   : ${c.email}`)
    console.log('  ──────────────────────────────────────────────────')
  }

  // ── 2. All courses (the bridge between students and creators) ────────────────
  const allCourses = await db
    .select({
      id:        schema.courses.id,
      creatorId: schema.courses.creatorId,
      name:      schema.courses.name,
    })
    .from(schema.courses)

  console.log('\n══ COURSES ═══════════════════════════════════════════')
  if (allCourses.length === 0) {
    console.log('  (no rows)')
  }
  for (const c of allCourses) {
    console.log(`  id        : ${c.id}`)
    console.log(`  creatorId : ${c.creatorId}`)
    console.log(`  name      : ${c.name}`)
    console.log('  ──────────────────────────────────────────────────')
  }

  // ── 3. All students ──────────────────────────────────────────────────────────
  //    NOTE: students have NO direct creatorId column.
  //    Ownership chain: student.courseId → course.creatorId → creator.id
  const allStudents = await db
    .select({
      id:          schema.students.id,
      courseId:    schema.students.courseId,   // ← the actual FK
      email:       schema.students.email,
      progressPct: schema.students.progressPct,
      lastActiveAt:schema.students.lastActiveAt,
    })
    .from(schema.students)

  console.log('\n══ STUDENTS ══════════════════════════════════════════')
  console.log('  ⚠  students have no direct creatorId — linked via courseId → courses.creatorId')
  if (allStudents.length === 0) {
    console.log('  (no rows)')
  }
  for (const s of allStudents) {
    console.log(`  id           : ${s.id}`)
    console.log(`  courseId     : ${s.courseId}`)
    console.log(`  email        : ${s.email}`)
    console.log(`  progressPct  : ${s.progressPct}`)
    console.log(`  lastActiveAt : ${s.lastActiveAt}`)
    console.log('  ──────────────────────────────────────────────────')
  }

  // ── 4. Resolve student → course → creator chain ──────────────────────────────
  console.log('\n══ OWNERSHIP CHAIN (student → course → creator) ═════')
  if (allStudents.length === 0) {
    console.log('  (no students to check)')
  }

  const courseMap = new Map(allCourses.map(c => [c.id, c]))
  const creatorMap = new Map(allCreators.map(c => [c.id, c]))

  for (const s of allStudents) {
    const course  = courseMap.get(s.courseId)
    const creator = course ? creatorMap.get(course.creatorId) : undefined

    const resolved = !!creator
    console.log(`  student ${s.email}`)
    console.log(`    courseId        : ${s.courseId}`)
    console.log(`    course found    : ${!!course}  (name: ${course?.name ?? 'N/A'})`)
    console.log(`    course.creatorId: ${course?.creatorId ?? 'N/A'}`)
    console.log(`    creator found   : ${!!creator}  (email: ${creator?.email ?? 'N/A'})`)
    console.log(`    chain resolves  : ${resolved}`)
    console.log('  ──────────────────────────────────────────────────')
  }
}

main()
  .then(() => {
    console.log('\n✓ Done\n')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n✗ Error:', err)
    process.exit(1)
  })

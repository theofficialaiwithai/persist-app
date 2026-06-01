/**
 * Seed script — inserts realistic demo data into Neon.
 *
 * Usage:  npm run seed
 *
 * Behaviour:
 *   - Reads .env.local for DATABASE_URL
 *   - Finds the first creator record (does NOT create a new one)
 *   - Upserts 3 courses  (ON CONFLICT DO UPDATE)
 *   - Upserts 12 students (ON CONFLICT DO UPDATE)
 *   - Deletes existing nudges for those students, then inserts 8 fresh ones
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { neon } from '@neondatabase/serverless'

// ── Load .env.local ──────────────────────────────────────────────────────────

const envPath = resolve(process.cwd(), '.env.local')
const envVars: Record<string, string> = {}
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([^=\s#][^=]*)=(.*)$/)
  if (m) envVars[m[1].trim()] = m[2].trim()
}

const DATABASE_URL = envVars['DATABASE_URL']
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL not found in .env.local')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 3_600_000)
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱  Starting seed…\n')

  // ── 1. Get first creator ──────────────────────────────────────────────────
  const [creator] = await sql`
    SELECT id, name, email, sender_name, sender_email
    FROM creators
    LIMIT 1
  `
  if (!creator) {
    console.error('❌  No creator found. Sign up first, then run seed.')
    process.exit(1)
  }
  console.log(`✅  Using creator: ${creator.sender_name || creator.name} (${creator.email})`)

  // ── 2. Upsert courses ─────────────────────────────────────────────────────
  console.log('\n📚  Upserting courses…')

  const courseDefs = [
    { name: 'Build AI Products with Claude', platformCourseId: 'course-ai-claude-001' },
    { name: 'The Freelance OS',              platformCourseId: 'course-freelance-os-002' },
    { name: 'Notion for Creators',           platformCourseId: 'course-notion-creators-003' },
  ]

  const courses: Array<{ id: string; name: string }> = []
  for (const c of courseDefs) {
    const [row] = await sql`
      INSERT INTO courses (id, creator_id, name, platform_course_id, active, created_at)
      VALUES (
        gen_random_uuid(),
        ${creator.id},
        ${c.name},
        ${c.platformCourseId},
        true,
        NOW()
      )
      ON CONFLICT (creator_id, platform_course_id)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
    `
    courses.push(row as { id: string; name: string })
    console.log(`   ✓  ${row.name}  (${row.id})`)
  }

  const [aiCourse, freelanceCourse, notionCourse] = courses

  // ── 3. Upsert students ────────────────────────────────────────────────────
  console.log('\n👩‍🎓  Upserting students…')

  type StudentDef = {
    email: string
    name: string
    courseId: string
    progressPct: number
    lastActiveAt: Date
    enrolledAt: Date
    streakDays: number
    lessonsCompleted: number
    status: string
    nextLessonTitle: string | null
  }

  const studentDefs: StudentDef[] = [
    // ── AI course: 4 students ──────────────────────────────────────────────
    {
      email: 'priya.sharma@example.com',
      name: 'Priya Sharma',
      courseId: aiCourse.id,
      progressPct: 8,
      lastActiveAt: daysAgo(3),      // slightly at-risk
      enrolledAt: daysAgo(45),
      streakDays: 0,
      lessonsCompleted: 2,
      status: 'active',
      nextLessonTitle: 'Module 2: Your First Claude API Call',
    },
    {
      email: 'james.okonkwo@example.com',
      name: 'James Okonkwo',
      courseId: aiCourse.id,
      progressPct: 28,
      lastActiveAt: daysAgo(14),     // high risk
      enrolledAt: daysAgo(62),
      streakDays: 0,
      lessonsCompleted: 7,
      status: 'active',
      nextLessonTitle: 'Module 4: Prompt Engineering Patterns',
    },
    {
      email: 'mei.chen@example.com',
      name: 'Mei Chen',
      courseId: aiCourse.id,
      progressPct: 52,
      lastActiveAt: hoursAgo(6),     // active — on streak
      enrolledAt: daysAgo(50),
      streakDays: 5,
      lessonsCompleted: 13,
      status: 'active',
      nextLessonTitle: 'Module 7: Tool Use & Function Calling',
    },
    {
      email: 'daniel.martin@example.com',
      name: 'Daniel Martin',
      courseId: aiCourse.id,
      progressPct: 100,
      lastActiveAt: daysAgo(1),      // just completed — triggers celebration modal
      enrolledAt: daysAgo(78),
      streakDays: 12,
      lessonsCompleted: 25,
      status: 'active',
      nextLessonTitle: null,
    },

    // ── Freelance course: 4 students ───────────────────────────────────────
    {
      email: 'aisha.johnson@example.com',
      name: 'Aisha Johnson',
      courseId: freelanceCourse.id,
      progressPct: 28,
      lastActiveAt: daysAgo(8),      // at-risk
      enrolledAt: daysAgo(38),
      streakDays: 0,
      lessonsCompleted: 5,
      status: 'active',
      nextLessonTitle: 'Week 3: Pricing Your Services',
    },
    {
      email: 'tom.nakamura@example.com',
      name: 'Tom Nakamura',
      courseId: freelanceCourse.id,
      progressPct: 45,
      lastActiveAt: daysAgo(8),      // at-risk
      enrolledAt: daysAgo(55),
      streakDays: 0,
      lessonsCompleted: 9,
      status: 'active',
      nextLessonTitle: 'Week 5: Client Acquisition',
    },
    {
      email: 'laura.dos-santos@example.com',
      name: 'Laura Dos Santos',
      courseId: freelanceCourse.id,
      progressPct: 87,
      lastActiveAt: hoursAgo(18),    // active — on streak
      enrolledAt: daysAgo(68),
      streakDays: 8,
      lessonsCompleted: 18,
      status: 'active',
      nextLessonTitle: 'Week 11: Scaling Beyond Solo',
    },
    {
      email: 'kevin.adeyemi@example.com',
      name: 'Kevin Adeyemi',
      courseId: freelanceCourse.id,
      progressPct: 100,
      lastActiveAt: hoursAgo(2),     // active — completed
      enrolledAt: daysAgo(72),
      streakDays: 7,
      lessonsCompleted: 20,
      status: 'active',
      nextLessonTitle: null,
    },

    // ── Notion course: 4 students ──────────────────────────────────────────
    {
      email: 'rachel.kim@example.com',
      name: 'Rachel Kim',
      courseId: notionCourse.id,
      progressPct: 8,
      lastActiveAt: daysAgo(3),      // slightly at-risk
      enrolledAt: daysAgo(35),
      streakDays: 0,
      lessonsCompleted: 1,
      status: 'active',
      nextLessonTitle: 'Lesson 2: Your First Database',
    },
    {
      email: 'omar.hassan@example.com',
      name: 'Omar Hassan',
      courseId: notionCourse.id,
      progressPct: 28,
      lastActiveAt: daysAgo(8),      // at-risk
      enrolledAt: daysAgo(48),
      streakDays: 0,
      lessonsCompleted: 4,
      status: 'active',
      nextLessonTitle: 'Lesson 5: Templates & Linked Databases',
    },
    {
      email: 'sofia.petrov@example.com',
      name: 'Sofia Petrov',
      courseId: notionCourse.id,
      progressPct: 87,
      lastActiveAt: daysAgo(3),      // slightly at-risk (high progress, slow lately)
      enrolledAt: daysAgo(60),
      streakDays: 3,
      lessonsCompleted: 11,
      status: 'active',
      nextLessonTitle: 'Lesson 13: Sharing with Your Audience',
    },
    {
      email: 'alex.turner@example.com',
      name: 'Alex Turner',
      courseId: notionCourse.id,
      progressPct: 52,
      lastActiveAt: daysAgo(14),     // high risk
      enrolledAt: daysAgo(52),
      streakDays: 0,
      lessonsCompleted: 7,
      status: 'active',
      nextLessonTitle: 'Lesson 8: Building a Content OS',
    },
  ]

  const studentIds: Record<string, string> = {}

  for (const s of studentDefs) {
    const [row] = await sql`
      INSERT INTO students (
        id, email, name, course_id, progress_pct,
        last_active_at, enrolled_at, status,
        lessons_completed, next_lesson_title,
        streak_days, created_at
      )
      VALUES (
        gen_random_uuid(),
        ${s.email},
        ${s.name},
        ${s.courseId},
        ${s.progressPct},
        ${s.lastActiveAt.toISOString()},
        ${s.enrolledAt.toISOString()},
        ${s.status},
        ${s.lessonsCompleted},
        ${s.nextLessonTitle},
        ${s.streakDays},
        NOW()
      )
      ON CONFLICT (course_id, email)
      DO UPDATE SET
        name              = EXCLUDED.name,
        progress_pct      = EXCLUDED.progress_pct,
        last_active_at    = EXCLUDED.last_active_at,
        lessons_completed = EXCLUDED.lessons_completed,
        next_lesson_title = EXCLUDED.next_lesson_title,
        streak_days       = EXCLUDED.streak_days
      RETURNING id, name, progress_pct
    `
    studentIds[s.email] = row.id
    const bar = '█'.repeat(Math.round(row.progress_pct / 5)).padEnd(20, '░')
    console.log(`   ✓  ${row.name.padEnd(22)} ${bar} ${row.progress_pct}%`)
  }

  // ── 4. Nudges ─────────────────────────────────────────────────────────────
  console.log('\n📬  Seeding nudges…')

  // Clear existing nudges for these students so re-runs stay clean
  const ids = Object.values(studentIds)
  await sql`DELETE FROM nudges WHERE student_id = ANY(${ids}::uuid[])`

  type NudgeDef = {
    studentEmail: string
    subject: string
    body: string
    triggerReason: string
    nudgeType: string
    status: 'sent' | 'failed' | 'pending'
    createdAt: Date
    sentAt: Date | null
  }

  const nudgeDefs: NudgeDef[] = [
    {
      studentEmail: 'james.okonkwo@example.com',
      subject: "James, Module 4 is waiting for you 🎯",
      body: "Hey James,\n\nI noticed you've been away for two weeks — and you were making such great progress!\n\nYou're at 28% and Module 4 is genuinely the most fun part of the whole course. Prompt Engineering Patterns is where everything clicks.\n\nCome back when you're ready. I'll be here.\n\n— Adamma",
      triggerReason: 'auto:inactivity',
      nudgeType: 'nudge',
      status: 'sent',
      createdAt: daysAgo(1),
      sentAt: daysAgo(1),
    },
    {
      studentEmail: 'tom.nakamura@example.com',
      subject: "Tom — the 45% slump is real. Here's how to push through.",
      body: "Hey Tom,\n\nYou're at exactly 45% — and I'm going to be honest with you: this is the spot where most people stop.\n\nNot because the course gets harder. Because life gets busy.\n\nBut you've already proven you can do this. Week 5 is the turning point. Let's get you there.\n\nSee you inside,\n— Adamma",
      triggerReason: 'auto:inactivity',
      nudgeType: 'nudge',
      status: 'sent',
      createdAt: daysAgo(2),
      sentAt: daysAgo(2),
    },
    {
      studentEmail: 'aisha.johnson@example.com',
      subject: "Aisha, your pricing strategy is ready when you are",
      body: "Hey Aisha,\n\nWeek 3 is about pricing — and I know that's the part a lot of people dread.\n\nBut here's the thing: after watching hundreds of freelancers go through this, I can tell you that getting your pricing right is what changes everything. It's not about charging more. It's about charging correctly.\n\nYou're close. Come finish it.\n\n— Adamma",
      triggerReason: 'auto:inactivity',
      nudgeType: 'nudge',
      status: 'sent',
      createdAt: daysAgo(3),
      sentAt: daysAgo(3),
    },
    {
      studentEmail: 'omar.hassan@example.com',
      subject: "Omar — Lesson 5 is where Notion gets magical ✨",
      body: "Hey Omar,\n\nI see you haven't been in for a week, and I wanted to check in.\n\nLesson 5 — linked databases — is the one that makes everything you've learned so far come alive. Students who reach it always say the same thing: \"Why didn't I do this sooner?\"\n\nWhenever you're ready,\n— Adamma",
      triggerReason: 'auto:inactivity',
      nudgeType: 'nudge',
      status: 'sent',
      createdAt: daysAgo(4),
      sentAt: daysAgo(4),
    },
    {
      studentEmail: 'mei.chen@example.com',
      subject: "🎉 Great work today, Mei!",
      body: "Hey Mei,\n\nYou just hit 52% — that's more than halfway through, and you're making it look easy.\n\nFunction calling in Module 7 is genuinely impressive to watch people unlock. Keep that momentum going.\n\nSo proud of your progress,\n— Adamma",
      triggerReason: 'auto:daily-recap',
      nudgeType: 'recap',
      status: 'sent',
      createdAt: hoursAgo(8),
      sentAt: hoursAgo(8),
    },
    {
      studentEmail: 'laura.dos-santos@example.com',
      subject: "🎉 Laura — 87%! You're almost there.",
      body: "Hey Laura,\n\nEighty-seven percent.\n\nI just had to send this because: WOW. You're one module away from completing The Freelance OS, and you've been on a streak for 8 days.\n\nScaling Beyond Solo is going to blow your mind. See you there!\n\n— Adamma",
      triggerReason: 'auto:daily-recap',
      nudgeType: 'recap',
      status: 'sent',
      createdAt: hoursAgo(20),
      sentAt: hoursAgo(20),
    },
    {
      studentEmail: 'priya.sharma@example.com',
      subject: "Priya, your API key is waiting 🔑",
      body: "Hey Priya,\n\nModule 2 is where it gets real — your first actual Claude API call. It's the moment the whole course becomes tangible.\n\nI noticed you stepped away after Module 1 and I totally get it. Starting anything new is the hardest part.\n\nYou've already started. Come finish the next step.\n\n— Adamma",
      triggerReason: 'auto:inactivity',
      nudgeType: 'nudge',
      status: 'failed',
      createdAt: daysAgo(5),
      sentAt: null,
    },
    {
      studentEmail: 'rachel.kim@example.com',
      subject: "Rachel — Lesson 2 takes 12 minutes. That's it.",
      body: "Hey Rachel,\n\nYou enrolled a week ago and finished Lesson 1 — great start!\n\nLesson 2 is literally 12 minutes long. Your first Notion database. It's the foundation everything else is built on.\n\nWhenever you have a spare 12 minutes,\n— Adamma",
      triggerReason: 'auto:inactivity',
      nudgeType: 'nudge',
      status: 'pending',
      createdAt: new Date(),
      sentAt: null,
    },
  ]

  for (const n of nudgeDefs) {
    const studentId = studentIds[n.studentEmail]
    if (!studentId) {
      console.warn(`   ⚠  No student found for ${n.studentEmail}, skipping nudge`)
      continue
    }
    await sql`
      INSERT INTO nudges (
        id, student_id, subject, body, trigger_reason,
        nudge_type, status, sent_at, created_at
      )
      VALUES (
        gen_random_uuid(),
        ${studentId},
        ${n.subject},
        ${n.body},
        ${n.triggerReason},
        ${n.nudgeType},
        ${n.status},
        ${n.sentAt?.toISOString() ?? null},
        ${n.createdAt.toISOString()}
      )
    `
    const icon = n.status === 'sent' ? '✉' : n.status === 'failed' ? '✗' : '⏳'
    console.log(`   ${icon}  [${n.status.padEnd(7)}] ${n.subject.slice(0, 60)}`)
  }

  // ── 5. Learning Sprints ───────────────────────────────────────────────────
  console.log('\n⚡  Seeding learning sprints…')

  function dateStr(offsetDays: number): string {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    return d.toISOString().slice(0, 10)
  }

  // Clear existing sprint data for this creator
  const existingSprints = await sql`
    SELECT id FROM learning_sprints WHERE creator_id = ${creator.id}
  `
  for (const s of existingSprints) {
    await sql`DELETE FROM learning_sprints WHERE id = ${s.id}`
  }

  // ── Sprint 1: AI Marketing Sprint ─────────────────────────────────────────
  const [sprint1] = await sql`
    INSERT INTO learning_sprints (
      creator_id, course_id, title, description, skill_focus,
      start_date, end_date, join_deadline, max_members, status
    ) VALUES (
      ${creator.id},
      ${aiCourse.id},
      'AI Marketing Sprint',
      'A 14-day intensive where we use AI to transform how you market your course. From automated content to personalised outreach — you''ll come out with a full marketing stack.',
      null,
      ${dateStr(7)},
      ${dateStr(21)},
      ${dateStr(5)},
      20,
      'open'
    ) RETURNING id
  `
  console.log(`   ✓  Sprint 1: AI Marketing Sprint (${sprint1.id})`)

  // Add 4 members to Sprint 1
  const sprint1Members = [
    { email: 'mei.chen@example.com',      pct: 15 },
    { email: 'james.okonkwo@example.com', pct: 32 },
    { email: 'priya.sharma@example.com',  pct: 48 },
    { email: 'daniel.martin@example.com', pct: 67 },
  ]
  for (const m of sprint1Members) {
    const sid = studentIds[m.email]
    if (!sid) continue
    await sql`
      INSERT INTO sprint_members (sprint_id, student_id, progress_pct)
      VALUES (${sprint1.id}, ${sid}, ${m.pct})
      ON CONFLICT (sprint_id, student_id) DO UPDATE SET progress_pct = EXCLUDED.progress_pct
    `
  }
  console.log(`   ✓  Added ${sprint1Members.length} members to Sprint 1`)

  // Add 3 forum posts to Sprint 1
  const [post1a] = await sql`
    INSERT INTO sprint_posts (sprint_id, author_name, author_initials, content)
    VALUES (
      ${sprint1.id},
      'Adamma (Creator)',
      'AC',
      E'Welcome to the AI Marketing Sprint! 🚀\n\nOver the next 14 days we''re going to completely reimagine how you market your course using AI.\n\nDay 1 challenge: Use Claude to generate 30 content ideas for your course topic. Post your favourites below!'
    ) RETURNING id
  `
  await sql`
    INSERT INTO sprint_posts (sprint_id, author_name, author_initials, content)
    VALUES (
      ${sprint1.id},
      'Mei Chen',
      'MC',
      E'Just did the Day 1 challenge and I''m blown away 🤯 Claude came up with angles I never would have thought of. My favourite: "What would happen if your students did NOT take your course?" — turning the negative into content gold.\n\nAlso starting to see how I can batch-create a whole month of content in one afternoon!'
    ) RETURNING id
  `
  await sql`
    INSERT INTO sprint_posts (sprint_id, author_name, author_initials, content)
    VALUES (
      ${sprint1.id},
      'James Okonkwo',
      'JO',
      E'Question for the group: has anyone tried using AI for email subject lines? I''ve been A/B testing and the AI-generated ones are consistently outperforming my manual ones.\n\nSharing my prompt below if anyone wants to use it:\n\n"Write 10 email subject lines for a course about [topic]. Target audience: [audience]. Tone: conversational and direct. Avoid clickbait."'
    ) RETURNING id
  `
  // Add a reply to the first post
  await sql`
    INSERT INTO sprint_replies (post_id, author_name, author_initials, content)
    VALUES (
      ${post1a.id},
      'Priya Sharma',
      'PS',
      'So excited to be here! Already have Claude open in another tab 😄 The 30 ideas challenge is going to be fun — see you all on the other side!'
    )
  `
  console.log(`   ✓  Added 3 posts + 1 reply to Sprint 1`)

  // ── Sprint 2: Freelance OS Bootcamp ──────────────────────────────────────
  const [sprint2] = await sql`
    INSERT INTO learning_sprints (
      creator_id, course_id, title, description, skill_focus,
      start_date, end_date, join_deadline, max_members, status
    ) VALUES (
      ${creator.id},
      ${freelanceCourse.id},
      'Freelance OS Bootcamp',
      'A 3-week sprint to build your complete freelance operating system. By the end you''ll have your pricing, client pipeline, proposals, and delivery workflow all locked in.',
      null,
      ${dateStr(14)},
      ${dateStr(35)},
      ${dateStr(10)},
      15,
      'open'
    ) RETURNING id
  `
  console.log(`   ✓  Sprint 2: Freelance OS Bootcamp (${sprint2.id})`)

  // Add 3 members to Sprint 2
  const sprint2Members = [
    { email: 'aisha.johnson@example.com',    pct: 22 },
    { email: 'tom.nakamura@example.com',     pct: 45 },
    { email: 'laura.dos-santos@example.com', pct: 71 },
  ]
  for (const m of sprint2Members) {
    const sid = studentIds[m.email]
    if (!sid) continue
    await sql`
      INSERT INTO sprint_members (sprint_id, student_id, progress_pct)
      VALUES (${sprint2.id}, ${sid}, ${m.pct})
      ON CONFLICT (sprint_id, student_id) DO UPDATE SET progress_pct = EXCLUDED.progress_pct
    `
  }
  console.log(`   ✓  Added ${sprint2Members.length} members to Sprint 2`)

  // Add 2 forum posts to Sprint 2
  await sql`
    INSERT INTO sprint_posts (sprint_id, author_name, author_initials, content)
    VALUES (
      ${sprint2.id},
      'Adamma (Creator)',
      'AC',
      E'Welcome to the Freelance OS Bootcamp! 🎯\n\nThis sprint is all about execution. Not just learning — actually building the systems that will run your freelance business.\n\nWeek 1 focus: Your pricing model and first proposal template.\n\nDrop a message below: what''s your #1 challenge with pricing right now?'
    )
  `
  await sql`
    INSERT INTO sprint_posts (sprint_id, author_name, author_initials, content)
    VALUES (
      ${sprint2.id},
      'Laura Dos Santos',
      'LD',
      E'My pricing challenge: I always underprice out of fear, then resent the project halfway through. Looking forward to fixing this properly in week 1.\n\nAlso — for anyone who hasn''t watched the Week 3 pricing module yet, it''s genuinely the best explanation of value-based pricing I''ve seen. Worth watching before the sprint starts!'
    )
  `
  console.log(`   ✓  Added 2 posts to Sprint 2`)

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n✅  Seed complete!')
  console.log(`   ${courses.length} courses`)
  console.log(`   ${studentDefs.length} students`)
  console.log(`   ${nudgeDefs.length} nudges`)
  console.log(`   2 learning sprints\n`)
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err)
  process.exit(1)
})

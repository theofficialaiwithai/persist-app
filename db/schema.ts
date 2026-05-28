import {
  pgTable, text, integer, boolean, timestamp, jsonb, uuid, numeric, date, uniqueIndex
} from 'drizzle-orm/pg-core'

export const creators = pgTable('creators', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  userId:                text('user_id').notNull().unique(),
  name:                  text('name').notNull(),
  email:                 text('email').notNull(),
  coursePlatform:        text('course_platform').notNull().default('other'),
  senderName:            text('sender_name').notNull().default(''),
  senderEmail:           text('sender_email').notNull().default(''),
  nudgeTone:             text('nudge_tone').notNull().default('encouraging'),
  minDaysBetweenNudges:  integer('min_days_between_nudges').notNull().default(5),
  blackoutWeekends:      boolean('blackout_weekends').notNull().default(false),
  stripeCustomerId:      text('stripe_customer_id'),
  stripeSubscriptionId:  text('stripe_subscription_id'),
  webhookSecret:         text('webhook_secret').notNull(),
  createdAt:             timestamp('created_at').notNull().defaultNow(),
})

export const courses = pgTable('courses', {
  id:               uuid('id').primaryKey().defaultRandom(),
  creatorId:        uuid('creator_id').references(() => creators.id, { onDelete: 'cascade' }).notNull(),
  name:             text('name').notNull(),
  totalLessons:     integer('total_lessons'),
  platformCourseId: text('platform_course_id'),
  active:           boolean('active').notNull().default(true),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  // Enables upsert by (creatorId, platformCourseId) in the webhook receiver
  creatorPlatformCourseUniq: uniqueIndex('courses_creator_platform_course_idx')
    .on(t.creatorId, t.platformCourseId),
}))

export const students = pgTable('students', {
  id:                      uuid('id').primaryKey().defaultRandom(),
  courseId:                uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  email:                   text('email').notNull(),
  name:                    text('name'),
  platformStudentId:       text('platform_student_id'),
  enrolledAt:              timestamp('enrolled_at'),
  lastActiveAt:            timestamp('last_active_at'),
  progressPct:             numeric('progress_pct', { precision: 5, scale: 2 }).notNull().default('0'),
  lastLessonCompleted:     text('last_lesson_completed'),
  nextLessonTitle:         text('next_lesson_title'),
  lessonsCompleted:        integer('lessons_completed').notNull().default(0),
  status:                  text('status').notNull().default('active'),
  avgDaysBetweenSessions:  numeric('avg_days_between_sessions', { precision: 5, scale: 2 }),
  createdAt:               timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  // Enables upsert by (courseId, email) in the webhook receiver
  courseEmailUniq: uniqueIndex('students_course_email_idx').on(t.courseId, t.email),
}))

export const progressEvents = pgTable('progress_events', {
  id:           uuid('id').primaryKey().defaultRandom(),
  studentId:    uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  eventType:    text('event_type').notNull(),
  lessonNumber: integer('lesson_number'),
  lessonTitle:  text('lesson_title'),
  progressPct:  numeric('progress_pct', { precision: 5, scale: 2 }),
  rawPayload:   jsonb('raw_payload'),
  receivedAt:   timestamp('received_at').notNull().defaultNow(),
})

export const nudges = pgTable('nudges', {
  id:              uuid('id').primaryKey().defaultRandom(),
  studentId:       uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  subject:         text('subject').notNull(),
  body:            text('body').notNull(),
  triggerReason:   text('trigger_reason').notNull(),
  status:          text('status').notNull().default('pending'),
  sentAt:          timestamp('sent_at'),
  openedAt:        timestamp('opened_at'),
  clickedAt:       timestamp('clicked_at'),
  resendMessageId: text('resend_message_id'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
})

export const billingSnapshots = pgTable('billing_snapshots', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  creatorId:          uuid('creator_id').references(() => creators.id, { onDelete: 'cascade' }).notNull(),
  billingMonth:       date('billing_month').notNull(),
  activeStudentCount: integer('active_student_count').notNull(),
  pricePerStudent:    numeric('price_per_student', { precision: 8, scale: 2 }).notNull(),
  totalCharged:       numeric('total_charged', { precision: 10, scale: 2 }).notNull(),
  stripeInvoiceId:    text('stripe_invoice_id'),
  createdAt:          timestamp('created_at').notNull().defaultNow(),
})

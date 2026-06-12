import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// Serial is a PostgreSQL specific notational convention for an INTEGER that is
// generated using a sequence.
// https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-SERIAL

export const users = pgTable(
  'users',
  {
    id: serial().primaryKey(),
    number: integer().unique(),
    email: varchar().notNull().unique(),
    encodedPassword: varchar('encoded_password', { length: 380 }),
    name: varchar({ length: 255 }),
    surname: varchar({ length: 255 }),
    enrollmentYear: smallint('enrollment_year'),
    outstandingOtp: integer('outstanding_otp'),
    outstandingOtpExpiresAt: timestamp('outstanding_otp_expires_at'),
    newEmail: varchar('new_email'),
    mfaSecret: uuid('mfa_secret'),
    accepted: boolean().default(false),
    registeredAt: timestamp('registered_at').notNull().defaultNow(),
    role: text({ enum: ['admin', 'student'] }).default('student').notNull(),
  },
  (users) => [
    uniqueIndex('email_index').on(users.email),
    uniqueIndex('number_index').on(users.number),
    uniqueIndex('mfa_secret').on(users.mfaSecret),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: integer().references(() => users.id, { onDelete: 'cascade' }).notNull(),
    expiresAt: timestamp('expires_at').default(sql`CURRENT_TIMESTAMP + INTERVAL '2 hours'`).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
);

export const sites = pgTable('sites', {
  id: serial().primaryKey(),
  name: varchar().notNull().unique(),
}, (site) => [uniqueIndex('site_name').on(site.name)]);

export const structures = pgTable('structures', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).unique().notNull(),
  ward: varchar({ length: 255 }),
  area: varchar({ length: 255 }),
  kind: varchar({ length: 255 }),
  siteId: integer('site_id').references(() => sites.id),
}, (structure) => [uniqueIndex('structure_name').on(structure.name)]);

export const capacities = pgTable(
  'capacities',
  {
    structureId: integer('structure_id').references(() => structures.id, { onDelete: 'cascade' }),
    year: smallint(),
    capacity: integer().notNull(),
  },
  (capacities) => [
    primaryKey({ columns: [capacities.structureId, capacities.year] }),
  ],
);

export const preferenceCollectionIntervals = pgTable('preference_collection_intervals', {
  id: serial().primaryKey(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  numberOfPreferences: smallint('number_of_preferences').notNull(),
  year: smallint().notNull(),
});

export const preferences = pgTable(
  'preferences',
  {
    studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }),
    collectionId: integer('collection_id').references(() => preferenceCollectionIntervals.id, { onDelete: 'cascade' }),
    siteId: integer('site_id').references(() => sites.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    month: smallint().notNull(),
    weight: smallint().notNull(),
  },
  (preferences) => [
    // The same SITE can be expressed as a preference by a STUDENT in a COLLECTION for multiple MONTHS.
    // For each MONTH, each SITE can appear only once.
    primaryKey({ columns: [preferences.studentId, preferences.collectionId, preferences.siteId, preferences.month] }),
  ],
);

// https://orm.drizzle.team/docs/rqb
export const usersRelations = relations(users, ({ many }) => ({
  preferences: many(preferences),
}));

export const preferencesRelations = relations(preferences, ({ one }) => ({
  student: one(users, { fields: [preferences.studentId], references: [users.id] }),
}));

export const assignments = pgTable(
  'assignments',
  {
    studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }),
    structureId: integer('structure_id').references(() => structures.id, { onDelete: 'cascade' }),
    collectionId: integer('collection_id').references(() => preferenceCollectionIntervals.id, { onDelete: 'cascade' }),
    year: smallint().notNull(),
    month: smallint().notNull(),
  },
  (assignments) => [
    primaryKey({
      columns: [assignments.studentId, assignments.structureId, assignments.collectionId, assignments.month],
    }),
  ],
);

/** App settings, readable and writable by administrators */
export const settings = pgTable(
  'settings',
  {
    key: varchar().primaryKey(),
    value: text(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
);

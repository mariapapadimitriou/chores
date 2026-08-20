import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    emoji: text("emoji").notNull().default("🙂"),
    color: text("color").notNull().default("#5B8CBE"),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  })
);

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    inviteCode: text("invite_code").notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    inviteIdx: uniqueIndex("groups_invite_code_idx").on(t.inviteCode),
  })
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "member"] }).notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("memberships_user_group_idx").on(t.userId, t.groupId),
    byGroup: index("memberships_group_idx").on(t.groupId),
  })
);

export const chores = pgTable(
  "chores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    notes: text("notes"),
    cadence: text("cadence", { enum: ["once", "daily", "weekly", "monthly"] })
      .notNull()
      .default("weekly"),
    assignment: text("assignment", { enum: ["anyone", "fixed", "rotate"] })
      .notNull()
      .default("anyone"),
    // A member leaving must not delete their chores.
    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
    archived: boolean("archived").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byGroup: index("chores_group_archived_idx").on(t.groupId, t.archived),
  })
);

export const completions = pgTable(
  "completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    // set null, not cascade: deleting a chore must not erase the record that
    // someone did it. choreTitle below is the snapshot that keeps it readable.
    choreId: uuid("chore_id").references(() => chores.id, { onDelete: "set null" }),
    choreTitle: text("chore_title").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    note: text("note"),
  },
  (t) => ({
    byGroup: index("completions_group_at_idx").on(t.groupId, t.at),
    byChore: index("completions_chore_idx").on(t.choreId),
  })
);

export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    completionId: uuid("completion_id")
      .notNull()
      .references(() => completions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("reactions_unique_idx").on(t.completionId, t.userId, t.emoji),
    byCompletion: index("reactions_completion_idx").on(t.completionId),
  })
);

export const shoppingItems = pgTable(
  "shopping_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    notes: text("notes"),
    addedBy: uuid("added_by").references(() => users.id, { onDelete: "set null" }),
    boughtBy: uuid("bought_by").references(() => users.id, { onDelete: "set null" }),
    boughtAt: timestamp("bought_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byGroup: index("shopping_group_bought_idx").on(t.groupId, t.boughtAt),
  })
);

export type UserRow = typeof users.$inferSelect;
export type GroupRow = typeof groups.$inferSelect;
export type MembershipRow = typeof memberships.$inferSelect;
export type ChoreRow = typeof chores.$inferSelect;
export type CompletionRow = typeof completions.$inferSelect;
export type ShoppingItemRow = typeof shoppingItems.$inferSelect;

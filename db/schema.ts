import { relations } from "drizzle-orm"
import { boolean, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  activeOrganizationId: text("active_organization_id"),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
})

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
  taxId: text("tax_id"),
})

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
}))

export type Organization = typeof organization.$inferSelect

export const role = pgEnum("role", ["member", "admin", "owner", "driver"])

export type Role = (typeof role.enumValues)[number]

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: role("role").default("member").notNull(),
  createdAt: timestamp("created_at").notNull(),
})

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}))

export type Member = typeof member.$inferSelect & {
  user: typeof user.$inferSelect
}

export type User = typeof user.$inferSelect

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const routeMode = pgEnum("route_mode", ["REGISTRATION", "AUTHORIZATION"])

export const route = pgTable("route", {
  id: text("id").primaryKey(),
  routeId: text("route_id").notNull(),
  routeName: text("route_name").notNull(),
  routeDescription: text("route_description"),
  routeMode: routeMode("route_mode").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
})

export const routeRelations = relations(route, ({ one }) => ({
  organization: one(organization, {
    fields: [route.organizationId],
    references: [organization.id],
  }),
}))

export type Route = typeof route.$inferSelect & {
  organization: typeof organization.$inferSelect
}

export const cardType = pgEnum("card_type", ["NFC", "RFID", "QR_CODE"])

export const cardStatus = pgEnum("card_status", [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
])

export const accessCard = pgTable("access_card", {
  id: text("id").primaryKey(),
  cardId: text("card_id").notNull(),
  nameOnCard: text("name_on_card"),
  cardType: cardType("card_type").notNull(),
  cardStatus: cardStatus("card_status"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
})

export const accessCardRelations = relations(accessCard, ({ one }) => ({
  organization: one(organization, {
    fields: [accessCard.organizationId],
    references: [organization.id],
  }),
}))

export type AccessCard = typeof accessCard.$inferSelect & {
  organization: Organization
}

export const bus = pgTable("bus", {
  id: text("id").primaryKey(),
  busPlateNumber: text("bus_plate_number").notNull(),
  busDescription: text("bus_description"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  routeId: text("route_id")
    .notNull()
    .references(() => route.id, { onDelete: "cascade" }),
})

export const busRelations = relations(bus, ({ one }) => ({
  organization: one(organization, {
    fields: [bus.organizationId],
    references: [organization.id],
  }),
  route: one(route, {
    fields: [bus.routeId],
    references: [route.id],
  }),
}))

export type Bus = typeof bus.$inferSelect & {
  organization: Organization
  route: Route
}

export const application = pgTable("application", {
  id: text("id").primaryKey(),
  deviceId: text("device_id"),
  appDescription: text("app_description"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const applicationRelations = relations(application, ({ one }) => ({
  user: one(user, {
    fields: [application.userId],
    references: [user.id],
  }),
}))

export type Application = typeof application.$inferSelect & {
  user: typeof user.$inferSelect
}

export const journeyStatus = pgEnum("journey_status", [
  "REGISTRATION_OK",
  "REGISTRATION_ERROR",
  "AUTHORIZATION_OK",
  "AUTHORIZATION_FAILED",
  "AUTHORIZATION_ERROR",
])

export const journey = pgTable("journey", {
  id: text("id").primaryKey(),
  journeyTimeStamp: timestamp("journey_time_stamp").notNull(),
  coordinatesLattitude: text("coordinates_lattitude"),
  coordinatesLongitude: text("coordinates_longitude"),
  journeyStatus: journeyStatus("journey_status"),
  createdAt: timestamp("created_at").notNull(),
  accessCardId: text("access_card_id")
    .notNull()
    .references(() => accessCard.id, { onDelete: "cascade" }),
  busId: text("bus_id")
    .notNull()
    .references(() => bus.id, { onDelete: "cascade" }),
  routeId: text("route_id")
    .notNull()
    .references(() => route.id, { onDelete: "cascade" }),
  applicationId: text("application_id")
    .notNull()
    .references(() => application.id, { onDelete: "cascade" }),
})

export const journeyRelations = relations(journey, ({ one }) => ({
  accessCard: one(accessCard, {
    fields: [journey.accessCardId],
    references: [accessCard.id],
  }),
  bus: one(bus, {
    fields: [journey.busId],
    references: [bus.id],
  }),
  route: one(route, {
    fields: [journey.routeId],
    references: [route.id],
  }),
  application: one(application, {
    fields: [journey.applicationId],
    references: [application.id],
  }),
}))

export type Journey = typeof journey.$inferSelect & {
  accessCard: typeof accessCard.$inferSelect
  bus: typeof bus.$inferSelect
  route: typeof route.$inferSelect & {
    organization: typeof organization.$inferSelect
  }
  application: typeof application.$inferSelect
}

export const logActionType = pgEnum("log_action_type", [
  "CREATE",
  "UPDATE",
  "GET",
  "ACCESS",
])

export const log = pgTable("log", {
  id: text("id").primaryKey(),
  timeStamp: timestamp("time_stamp").notNull(),
  logActionType: logActionType("log_action_type").notNull(),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  applicationId: text("application_id").references(() => application.id, {
    onDelete: "cascade",
  }),
})

export const logRelations = relations(log, ({ one }) => ({
  user: one(user, {
    fields: [log.userId],
    references: [user.id],
  }),
  application: one(application, {
    fields: [log.applicationId],
    references: [application.id],
  }),
}))

export type Log = typeof log.$inferSelect & {
  user: typeof user.$inferSelect
  application?: typeof application.$inferSelect
}

export const schema = {
  user,
  session,
  account,
  verification,
  organization,
  member,
  invitation,
  route,
  accessCard,
  bus,
  application,
  journey,
  log,
  organizationRelations,
  memberRelations,
  routeRelations,
  accessCardRelations,
  busRelations,
  applicationRelations,
  journeyRelations,
  logRelations,
}

// Model generic entities

export interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  expiresAt: Date
  token: string
  createdAt: Date
  updatedAt: Date
  ipAddress?: string
  userAgent?: string
  userId: string
  activeOrganizationId?: string
}

export interface Account {
  id: string
  accountId: string
  providerId: string
  userId: string
  accessToken?: string
  refreshToken?: string
  idToken?: string
  accessTokenExpiresAt?: Date
  refreshTokenExpiresAt?: Date
  scope?: string
  password?: string
  createdAt: Date
  updatedAt: Date
}

export interface Verification {
  id: string
  identifier: string
  value: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface Organization {
  id: string
  name: string
  slug?: string
  logo?: string
  createdAt: Date
  metadata?: string
}

export interface Member {
  id: string
  organizationId: string
  userId: string
  role: Role
  createdAt: Date
}

export interface Invitation {
  id: string
  organizationId: string
  email: string
  role?: string
  status: string
  expiresAt: Date
  inviterId: string
}

export type Role = "member" | "admin" | "owner"

// Business-specific entities are added below

export interface Route {
  id: string
  routeId: string
  routeName: string
  routeDescription?: string
  routeMode: RouteMode
  createdAt: Date
  updatedAt: Date
  organizationId: string // Route can refer to single organization only
  organization: Organization
}

export type RouteMode = "REGISTRATION" | "AUTHORIZATION"

export interface AccessCard {
  id: string
  cardId: string
  nameOnCard?: string
  cardType: CardType
  cardStatus?: CardStatus
  createdAt: Date
  updatedAt: Date
  organizationId: string // Access card can refer to single organization only
  organization: Organization
}

export type CardType = "NFC" | "RFID" | "QR_CODE"

export type CardStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"

export interface Bus {
  id: string
  busPlateNumber: string
  busDescription?: string
  createdAt: Date
  updatedAt: Date
  organizationId: string // Bus can refer to single organization only
  organization: Organization
  routeId: string
  route: Route // Bus can refer to single route at a time only
}

export interface Application {
  id: string
  phoneIMEI: string
  addDescription: string
  createdAt: Date
  updatedAt: Date
  userId: string // Application refers to single user only at a time
  user: User
  organizationId: string // Application refers to single organization only
  organization: Organization
}

export interface Journey {
  id: string
  journeyTimeStamp: Date
  coordinatesLattitude: number
  coordinatesLongitude: number
  journeyStatus: JourneyStatus
  createdAt: Date
  acceessCardId: string // Journey refers to single access card only
  accessCard: AccessCard
  busId: string // Journey refers to single bus only
  bus: Bus
  routeId: string // Journey refers to single route only
  route: Route
  organizationId: string // Journey refers to single organization only
  organization: Organization
  applicationId: string
  application: Application
}

export type JourneyStatus =
  | "REGISTRATION_OK"
  | "REGISTRATION_FAILED"
  | "AUTHORIZATION_OK"
  | "AUTHORIZATION_FAILED"
  | "ERROR"

export interface Log {
  id: string
  timeStamp: Date
  logMessage?: string
  logActionType: "CREATE" | "UPDATE" | "DELETE" | "ACCESS"
  createdAt: Date
  userId: string
  user: User
  organizationId: string
  organization: Organization
  applicationId?: string
  application?: Application
}

export { db } from "./client";
export * from "./services";
// Plain-JS module shared with the (.mjs) seed script; typed via JSDoc.
export { hashPassword, verifyPassword } from "./password.js";

// Re-export generated Prisma types so consumers don't reach into the
// generated folder directly.
export {
  OrderStatus,
  EmailStatus,
  Prisma,
} from "./generated/prisma/client";
export type {
  Order,
  WebhookEvent,
  AdminUser,
  Service,
  ServiceTranslation,
  EmailMessage,
} from "./generated/prisma/client";

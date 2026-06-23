// Seed script. Runs on plain Node (no TypeScript), so it talks to Postgres
// directly via `pg` instead of the generated Prisma client (which is emitted as
// TypeScript by the `prisma-client` generator).
//
//   npm run db:seed            (from repo root)
//
// Idempotent: re-running won't duplicate rows. Existing service copy is left
// untouched on re-seed so it won't clobber edits made in the admin dashboard.
import { randomBytes } from "node:crypto";
import pg from "pg";
import { hashPassword } from "../src/password.js";

const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME ?? "superuser";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "password";

/** App-generated id (Prisma's cuid default is client-side, so raw SQL must supply one). */
const genId = () => "c" + randomBytes(16).toString("hex");

// --- Service data imported from the previous hard-coded site config ---------
const SERVICES = [
  {
    slug: "clarity-session",
    active: true,
    sortOrder: 0,
    durationMinutes: 45,
    capacity: null,
    deliveryFrom: null,
    deliveryTo: null,
    eventDates: [],
    eventTime: null,
    priceCents: 7900,
    currency: "EUR",
    content: {
      title: "Clarity Session",
      shortBlurb:
        "A focused, one-to-one session designed to help you gain direction, understand your next steps, and move forward with confidence.",
      description: [
        "Sometimes, feeling stuck in you career is not caused by a lack of options — it's a lack of clarity about which option matches who you actually are right now. We spend the time cutting through that.",
        "You bring the situation: a return after a break, a pivot you're weighing, an offer on the table, or a vague sense that you're drifting. We end with a written one-page plan you can act on this week.",
      ],
      outcomes: [
        "A clear read on what's actually driving your dissatisfaction or ambition",
        "Three concrete next moves, prioritized",
        "A written summary delivered within 24 hours",
      ],
      forWhom: [
        "Anyone weighing a return, a pivot, or a hard career decision and needing structured thinking — fast.",
      ],
    },
  },
  {
    slug: "restart-framework-workshop",
    active: true,
    sortOrder: 1,
    durationMinutes: 180,
    capacity: null,
    deliveryFrom: null,
    deliveryTo: null,
    eventDates: ["2026-09-08", "2026-09-10"],
    eventTime: "20:30 CEST",
    priceCents: 6900,
    currency: "EUR",
    content: {
      title: "Restart Framework Workshop",
      shortBlurb:
        "A practical, supportive workshop that walks you through the essential steps of restarting your career — from mindset to strategy to action.",
      description: [
        "Three hours, two sessions, one shared goal: turning a career restart from a fuzzy intention into a real plan. We work through the Restart Framework I've developed working with returners, and you leave with a draft plan and a small cohort of women doing the same work.",
        "Format: short teaching segments on mindset, positioning, and action; paired exercises; and live coaching of two volunteer participants.",
      ],
      outcomes: [
        "A drafted restart plan",
        "A repeatable framework for evaluating future moves",
        "Connections with others on the same journey",
      ],
      forWhom: [
        "Professionals who are mid-restart and learn best with others in the room",
      ],
    },
  },
  {
    slug: "cv-review",
    active: true,
    sortOrder: 2,
    durationMinutes: null,
    capacity: null,
    deliveryFrom: 3,
    deliveryTo: 5,
    eventDates: [],
    eventTime: null,
    priceCents: 9900,
    currency: "EUR",
    content: {
      title: "CV Review & Positioning",
      shortBlurb:
        "A 30 minute call to understand your areas of interest and a professional review of your CV with tailored recommendations, updated wording for key sections, and one round of edits.",
      description: [
        "Your CV gets read in under thirty seconds. I rewrite it to survive that and earn the second read — repositioning your experience around the value you actually create, not just the tasks you've done.",
        "You send me your current CV and the kind of role you're targeting. I return tailored recommendations, updated wording for your key sections, and one round of edits to incorporate your feedback.",
      ],
      outcomes: [],
      forWhom: [
        "Anyone whose CV needs to make the case for a new chapter.",
        "If you’re preparing for your next step and want your CV to reflect who you are today — not who you were years ago — this service is for you.",
      ],
    },
  },
  {
    slug: "test-50",
    active: true,
    sortOrder: 3,
    durationMinutes: 15,
    capacity: null,
    deliveryFrom: null,
    deliveryTo: null,
    eventDates: [],
    eventTime: null,
    priceCents: 50,
    currency: "EUR",
    content: {
      title: "Production test (€0.50)",
      shortBlurb: "Internal end-to-end payment test — not a real service.",
      description: [
        "This service exists only to verify the live payment flow with a small real charge. If you've reached this page outside of an internal test, please ignore it and head back to the main services.",
      ],
      outcomes: [],
      forWhom: ["Internal use only."],
    },
  },
];

function schemaFromUrl(connectionString) {
  try {
    return new URL(connectionString).searchParams.get("schema");
  } catch {
    return null;
  }
}

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DIRECT_URL or DATABASE_URL must be set");
  }

  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const schema = schemaFromUrl(connectionString);
    if (schema) {
      await client.query(`SET search_path TO "${schema}"`);
    }

    // --- Admin user -------------------------------------------------------
    const passwordHash = hashPassword(ADMIN_PASSWORD);
    const adminRes = await client.query(
      `INSERT INTO "AdminUser" ("id", "username", "passwordHash", "updatedAt")
       VALUES ($1, $2, $3, now())
       ON CONFLICT ("username") DO NOTHING
       RETURNING "id"`,
      [genId(), ADMIN_USERNAME, passwordHash],
    );
    console.log(
      adminRes.rowCount > 0
        ? `✔ Created admin user "${ADMIN_USERNAME}"`
        : `• Admin user "${ADMIN_USERNAME}" already exists — left unchanged`,
    );

    // --- Services + translations -----------------------------------------
    for (const svc of SERVICES) {
      // Upsert the service; the no-op DO UPDATE lets RETURNING give us the id
      // even when the row already existed.
      const svcRes = await client.query(
        `INSERT INTO "Service"
           ("id","slug","active","sortOrder","durationMinutes","capacity",
            "deliveryFrom","deliveryTo","eventDates","eventTime","priceCents","currency","updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now())
         ON CONFLICT ("slug") DO UPDATE SET "slug" = EXCLUDED."slug"
         RETURNING "id"`,
        [
          genId(),
          svc.slug,
          svc.active,
          svc.sortOrder,
          svc.durationMinutes,
          svc.capacity,
          svc.deliveryFrom,
          svc.deliveryTo,
          svc.eventDates,
          svc.eventTime,
          svc.priceCents,
          svc.currency,
        ],
      );
      const serviceId = svcRes.rows[0].id;

      const trRes = await client.query(
        `INSERT INTO "ServiceTranslation"
           ("id","serviceId","locale","title","shortBlurb","description","outcomes","forWhom")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT ("serviceId","locale") DO NOTHING
         RETURNING "id"`,
        [
          genId(),
          serviceId,
          "en",
          svc.content.title,
          svc.content.shortBlurb,
          svc.content.description,
          svc.content.outcomes,
          svc.content.forWhom,
        ],
      );
      console.log(
        `✔ Service "${svc.slug}"` +
          (trRes.rowCount > 0 ? " (+ en copy)" : " (copy already present)"),
      );
    }

    console.log("\nSeed complete.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

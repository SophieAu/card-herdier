import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  pokemonCardsRelations as cardsRelations,
  trackedPokemonRelations as pokemonRelations,
} from "../../drizzle/relations.ts";
import {
  pokemonCards as cardsSchema,
  notificationEmailLog as notificationEmailLogSchema,
  trackedPokemon as pokemonSchema
} from "../../drizzle/schema.ts";
import { logger } from "./logging.ts";

export type TrackedPokemon = typeof pokemonSchema.$inferSelect;
export type Card = Omit<typeof cardsSchema.$inferInsert, "createdAt">;
type NotificationEmailLog = typeof notificationEmailLogSchema.$inferInsert

const DATABASE_URL = `postgresql://${Deno.env.get("PGUSER")}:${Deno.env.get("PGPASSWORD")
  }@${Deno.env.get("PGHOST")}:5432/${Deno.env.get("PGDATABASE")}`;

// Use pg driver.
const { Pool } = pg;

// Instantiate Drizzle client with pg driver and schema.
const db = drizzle({
  client: new Pool({ connectionString: DATABASE_URL, ssl: true }),
  schema: { cardsSchema, pokemonSchema, cardsRelations, pokemonRelations },
  logger: { logQuery: (query, params) => logger.info(`DB Query: ${query} | Params: `, { params }) }
});

// Get all Pokemon
export const getAllTrackedPokemon = async () =>
  await db.select().from(pokemonSchema);

// Get all Cards
export const getAllCards = async () =>
  await db.select({ cardId: cardsSchema.cardId }).from(cardsSchema);

// Add new Card
export const insertCards = async (
  ...newCards: Card[]
) => await db.insert(cardsSchema).values(newCards);


// NOTE: After regenerating the db schema, replace `mode: 'string'` with `mode: 'date'` for the `attempted_at` column
// This lets us use Date objects instead of ISO strings for timestamps
export const logNotificationEmail = async ({ attemptedAt, emailBody, success }: NotificationEmailLog) =>
  await db.insert(notificationEmailLogSchema).values({ attemptedAt, emailBody, success })
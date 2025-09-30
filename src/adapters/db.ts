import { drizzle } from "drizzle-orm/node-postgres";
import {
  pokemonCards as cardsSchema,
  trackedPokemon as pokemonSchema,
} from "../../drizzle/schema.ts";
import {
  pokemonCardsRelations as cardsRelations,
  trackedPokemonRelations as pokemonRelations,
} from "../../drizzle/relations.ts";
import pg from "pg";

export type TrackedPokemon = typeof pokemonSchema.$inferSelect;
export type Card = Omit<typeof cardsSchema.$inferInsert, "createdAt">;

const DATABASE_URL = `postgresql://${Deno.env.get("PGUSER")}:${
  Deno.env.get("PGPASSWORD")
}@${Deno.env.get("PGHOST")}:5432/${Deno.env.get("PGDATABASE")}`;

// Use pg driver.
const { Pool } = pg;

// Instantiate Drizzle client with pg driver and schema.
export const db = drizzle({
  client: new Pool({ connectionString: DATABASE_URL, ssl: true }),
  schema: { cardsSchema, pokemonSchema, cardsRelations, pokemonRelations },
  logger: true,
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

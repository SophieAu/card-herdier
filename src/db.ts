import { drizzle } from "drizzle-orm/node-postgres";
import {
  pokemonCards as cardsSchema,
  trackedPokemon as pokemonSchema,
} from "../drizzle/schema.ts";
import {
  pokemonCardsRelations as cardsRelations,
  trackedPokemonRelations as pokemonRelations,
} from "../drizzle/relations.ts";
import pg from "pg";
import { Card } from "@tcgdex/sdk";

export type TrackedPokemon = typeof pokemonSchema.$inferSelect;

// Use pg driver.
const { Pool } = pg;

// Instantiate Drizzle client with pg driver and schema.
export const db = drizzle({
  client: new Pool({ connectionString: Deno.env.get("DATABASE_URL") }),
  schema: { cardsSchema, pokemonSchema, cardsRelations, pokemonRelations },
});

// Get all Pokemon
export const getAllTrackedPokemon = async () =>
  await db.select().from(pokemonSchema);

// Get all Cards
export const getAllCards = async () =>
  await db.select({ cardId: cardsSchema.cardId }).from(cardsSchema);

// Add new card
export const insertCard = async (pokemonId: number, card: Card) =>
  await db.insert(cardsSchema).values({
    pokemonId,
    cardId: card.id,
    pokemonInfo: card,
  });

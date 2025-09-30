import {
  foreignKey,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const trackedPokemon = pgTable("tracked_pokemon", {
  id: integer().primaryKey().generatedAlwaysAsIdentity({
    name: "tracked_pokemon_id_seq",
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1,
  }),
  name: text().notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
}, (table) => [
  unique("tracked_pokemon_name_key").on(table.name),
]);

export const pokemonCards = pgTable("pokemon_cards", {
  id: integer().primaryKey().generatedAlwaysAsIdentity({
    name: "pokemon_cards_id_seq",
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1,
  }),
  pokemonId: integer("pokemon_id").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  cardId: text("card_id").notNull(),
  cardInfo: jsonb("card_info").notNull(),
}, (table) => [
  foreignKey({
    columns: [table.pokemonId],
    foreignColumns: [trackedPokemon.id],
    name: "tracked_pokemon_id",
  }).onUpdate("cascade").onDelete("cascade"),
  unique("pokemon_cards_card_id_key").on(table.cardId),
]);

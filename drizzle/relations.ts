import { relations } from "drizzle-orm/relations";
import { trackedPokemon, pokemonCards } from "./schema";

export const pokemonCardsRelations = relations(pokemonCards, ({one}) => ({
	trackedPokemon: one(trackedPokemon, {
		fields: [pokemonCards.pokemonId],
		references: [trackedPokemon.id]
	}),
}));

export const trackedPokemonRelations = relations(trackedPokemon, ({many}) => ({
	pokemonCards: many(pokemonCards),
}));
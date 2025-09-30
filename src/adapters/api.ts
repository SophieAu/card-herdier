import TCGdex, { Query } from "@tcgdex/sdk";

const tcgdex = new TCGdex("en");

export const getCardById = async (cardId: string) =>
  await tcgdex.card.get(cardId);

export const getAllCardsForPokemon = async (pokemonName: string) =>
  await tcgdex.card.list(
    Query.create().like("name", pokemonName),
  );

import * as db from "./db.ts";
import { Card, CardResume } from "@tcgdex/sdk";
import { Resend } from "resend";
import { logger } from "./logging.ts";
import console from "node:console";
import * as tcgApi from "./tcgApi.ts";

type CardResumeTuple = [db.TrackedPokemon, CardResume[]];
type SingleCardResumeTuple = [db.TrackedPokemon, CardResume];

type SingleCardThrouple = [db.TrackedPokemon, string, Card];

// const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

export const fetchAllPokemon = async () => {
  // 1. Ping DB and get all "followed pokemon"
  const followedPokemon = await loadFollowedPokemon();
  if (!followedPokemon.length) return;
  console.info(`${followedPokemon.length} Pokémon followed`);

  // 2. ping Pokemon API and get all responses that include the pokemon name
  const fetchedCards = await getAllCards(followedPokemon);
  if (!fetchedCards.length) return;

  // 3. check API ids against ids in "seen card" table in db
  const knownCardIds = await loadKnownCardIds();
  if (!knownCardIds) return;
  const newCards = getNewCardsPerPokemon(knownCardIds, fetchedCards);

  // 4. get extended info on those new cards
  const newExtendedCards = await getFullNewCards(newCards);

  // 5. add new cards to Database
  const didInsertSuccessfully = await saveNewCards(newExtendedCards);
  if (!didInsertSuccessfully) {
    logger.warn("Probably something I want to add to the email?");
  }
};

const getFullNewCards = async (cards: CardResumeTuple[]) => {
  const flatNewCards = cards.flatMap(([pokemon, cards]) =>
    cards.map((card) => [pokemon, card] as SingleCardResumeTuple)
  );

  try {
    const fetchResults = await Promise.allSettled(
      flatNewCards.map((
        card,
      ) => getCard(card[0], card[1].id)),
    );

    const newCards = fetchResults.reduce((acc, fetchResult) => {
      if (fetchResult.status != "fulfilled") {
        logger.error(fetchResult.reason);
        return acc;
      }

      const [pokemon, cardId, card] = fetchResult.value;
      if (!card) {
        console.error(`Card ${cardId} (${pokemon.name}) not found`);
        return acc;
      }

      if (card.id != cardId) {
        console.error(`Card ${cardId} does not match with found id ${card.id}`);
        return acc;
      }

      return [...acc, fetchResult.value];
    }, [] as SingleCardThrouple[]);

    return newCards;
  } catch (e: unknown) {
    logger.error((e as Error).message);
    return [];
  }
};

const loadFollowedPokemon = async () => {
  try {
    const pokemon = await db.getAllTrackedPokemon();
    if (!pokemon.length) {
      logger.warn("No Pokémon tracked");
    }

    return pokemon;
  } catch (e: unknown) {
    logger.error((e as Error).message);
    return [];
  }
};

const getAllCards = async (pokemon: db.TrackedPokemon[]) => {
  try {
    const fetchResults = await Promise.allSettled(
      pokemon.map(getAllCardsForPokemon),
    );

    const cardsByPokemon = fetchResults.reduce((acc, fetchResult) => {
      if (fetchResult.status != "fulfilled") {
        logger.error(fetchResult.reason);
        return acc;
      }

      const [pokemon, cardsForPokemon] = fetchResult.value;
      if (!cardsForPokemon.length) {
        console.warn(`No Cards found for ${pokemon.name}`);
        return acc;
      }

      return [...acc, fetchResult.value];
    }, [] as CardResumeTuple[]);

    return cardsByPokemon;
  } catch (e: unknown) {
    logger.error((e as Error).message);
    return [];
  }
};

const getCard = async (pokemon: db.TrackedPokemon, cardId: string) => {
  return [
    pokemon,
    cardId,
    await tcgApi.getCardById(cardId),
  ] as SingleCardThrouple;
};

const getAllCardsForPokemon = async (pokemon: db.TrackedPokemon) => {
  return [
    pokemon,
    await tcgApi.getAllCardsForPokemon(pokemon.name),
  ] as CardResumeTuple;
};

const loadKnownCardIds = async () => {
  try {
    const knownCards = await db.getAllCards();

    return knownCards.map(({ cardId }) => cardId);
  } catch (e: unknown) {
    logger.error(`Known Cards could not be loaded: ${(e as Error).message}`);
    return;
  }
};

const getNewCardsPerPokemon = (
  knownCards: string[],
  allCardsByPokemon: CardResumeTuple[],
) =>
  allCardsByPokemon.reduce((acc, [pokemon, cards]) => {
    const newCards = cards.filter((card) => !knownCards.includes(card.id));
    if (!newCards.length) return acc;

    // Tuple seems to not like destructuring? Unsure what's the problem here...
    acc.push([pokemon, newCards]);
    return acc;
  }, [] as CardResumeTuple[]);

const saveNewCards = async (newCards: SingleCardThrouple[]) => {
  try {
    const cleanInsert = newCards.map((cardInfo) => {
      return ({
        pokemonId: cardInfo[0].id,
        cardId: cardInfo[1],
        pokemonInfo: cardInfo[2],
      } as db.Card);
    });

    await db.insertCards(...cleanInsert);
    return true;
  } catch (e: unknown) {
    logger.error(`Cards could not (all) be saved: ${(e as Error).message}`);
    return false;
  }
};
// const notify = async () => {
//   try {
//     const data = await resend.emails.send({
//       from: "Acme <onboarding@resend.dev>",
//       to: ["delivered@resend.dev"],
//       subject: "Hello World",
//       html: "<strong>It works!</strong>",
//     });

//     console.log(data);
//   } catch (error) {
//     console.error(error);
//   }
// };

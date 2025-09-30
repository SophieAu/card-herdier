import * as db from "./adapters/db.ts";
import { logger } from "./adapters/logging.ts";
import * as tcgApi from "./adapters/api.ts";
import {
  Card,
  CardResumeTuple,
  SeenCard,
  SingleCardResumeTuple,
  SingleCardThrouple,
  TrackedPokemon,
} from "./types.ts";
import { sendEmail } from "./adapters/email.ts";

export const fetchAllPokemon = async () => {
  logger.info("Started updating card list");

  // 1. ping DB and get all "followed pokemon"
  const followedPokemon = await loadFollowedPokemon();
  if (!followedPokemon.length) return;
  logger.info(`${followedPokemon.length} Pokemon followed`);

  // 2. ping Pokemon API and get all responses that include the pokemon name
  const fetchedCards = await getAllCards(followedPokemon);
  if (!fetchedCards.length) return;

  // 3. check API ids against ids in "seen card" table in db
  const knownCardIds = await loadKnownCardIds();
  if (!knownCardIds) return;
  const newCards = getNewCardsPerPokemon(knownCardIds, fetchedCards);
  if (!newCards.length) {
    logger.info("There are no new cards");
    logger.info("Finished updating card list");
    return;
  }

  // 4. get extended info on those new cards
  const newExtendedCards = await getFullNewCards(newCards);
  logger.info(
    `${knownCardIds.length} already seen, ${newExtendedCards.length} new cards to be added`,
  );

  // 5. add new cards to Database
  const didInsertSuccessfully = await saveNewCards(newExtendedCards);

  // 6. send update email
  await sendNotificationEmail(newExtendedCards, {
    showSaveWarning: !didInsertSuccessfully,
  });

  logger.info("Finished updating card list");
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
        logger.error(`Card ${cardId} (${pokemon.name}) not found`);
        return acc;
      }

      if (card.id != cardId) {
        logger.error(`Card ${cardId} does not match with found id ${card.id}`);
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
      logger.warn("No Pokemon tracked");
    }

    return pokemon;
  } catch (e: unknown) {
    logger.error((e as Error).message);
    return [];
  }
};

const getAllCards = async (pokemon: TrackedPokemon[]) => {
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
        logger.warn(`No Cards found for ${pokemon.name}`);
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

const getCard = async (pokemon: TrackedPokemon, cardId: string) => {
  return [
    pokemon,
    cardId,
    await tcgApi.getCardById(cardId),
  ] as SingleCardThrouple;
};

const getAllCardsForPokemon = async (pokemon: TrackedPokemon) => {
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

    return [...acc, [pokemon, newCards]] as CardResumeTuple[];
  }, [] as CardResumeTuple[]);

const saveNewCards = async (newCards: SingleCardThrouple[]) => {
  type ExtendedCard = Card & { sdk: object };

  try {
    const cleanInsert = newCards.map((newCard) => {
      const { sdk: _sdk, ...cardInfo } = newCard[2] as ExtendedCard;

      return ({
        pokemonId: newCard[0].id,
        cardId: newCard[1],
        cardInfo: cardInfo,
      } as SeenCard);
    });

    await db.insertCards(...cleanInsert);
    return true;
  } catch (e: unknown) {
    logger.error(`Cards could not (all) be saved: ${(e as Error).message}`);
    return false;
  }
};

const sendNotificationEmail = async (
  newCards: SingleCardThrouple[],
  options: { showSaveWarning: boolean },
) => {
  const EMAIL_SUBJECT = "There are new Pokémon Cards!";

  const EMAIL_BODY = (newCards: string) =>
    `<p>Heya!<p><p>New Pokémon cards have been released:<ul>${newCards}</ul></p>`;

  const IMAGE = (imgUrl: string) => ` (<a href=${imgUrl}/high.jpg>image</a>)`;

  const SAVE_WARNING =
    '<p>Just a heads up that there were some issues updating the database so you might "re-see" some cards tomorrow</p>';

  const newCardString = newCards.reduce((acc, c) => {
    const cardInfo = c[2];

    const line =
      `<li>${cardInfo.name} - ${cardInfo.set.name} #${cardInfo.localId}${
        cardInfo.image ? IMAGE(cardInfo.image) : ""
      }</li>`;

    return acc + line;
  }, "");

  const body = EMAIL_BODY(newCardString) +
    (options.showSaveWarning ? SAVE_WARNING : "");

  try {
    await sendEmail(EMAIL_SUBJECT, body);
  } catch (error) {
    logger.error(error);
  }
};

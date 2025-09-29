import * as db from "./db.ts";
import TCGdex, { Query } from "@tcgdex/sdk";
import { Resend } from "resend";

const tcgdex = new TCGdex("en");
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

export const fetchAllPokemon = async () => {
  // 1. Ping DB and get all "followed pokemon"
  const followedPokemon = await db.getAllTrackedPokemon();

  // 2. Get all cards for "followed pokemon"
  followedPokemon?.forEach(checkAndUpdatePokemon);
};

const checkAndUpdatePokemon = async (pokemon: db.TrackedPokemon) => {
  // 2. ping Pokemon API and get all responses that include the pokemon name
  const allCards = await getAllCardsForFollowedPokemon(pokemon.name);

  // 3. check API ids against ids in "seen card" table in db
  const knownCardIds = (await db.getAllCards()).map(({ cardId }) => cardId);
  const newCardIds = allCards.filter(({ id }) => knownCardIds.includes(id));

  // 4. For all "non-seen" pokemon
  newCardIds.forEach((card) => addCardToSystem(pokemon.id, card.id));
};

const getAllCardsForFollowedPokemon = async (pokemon: string) => {
  try {
    return await tcgdex.card.list(Query.create().like("name", pokemon));
  } catch (error) {
    console.log(error);
  }
  return [];
};

const addCardToSystem = async (pokemon: number, cardId: string) => {
  const fullCard = await tcgdex.card.get(cardId);
  if (!fullCard) return;

  // 4.1 add to db
  const merp = await db.insertCard(pokemon, fullCard);

  // 4.2 send email
};

const notify = async () => {
  try {
    const data = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: ["delivered@resend.dev"],
      subject: "Hello World",
      html: "<strong>It works!</strong>",
    });

    console.log(data);
  } catch (error) {
    console.error(error);
  }
};

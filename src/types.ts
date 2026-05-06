import type * as tcgApi from "@tcgdex/sdk";
import type { DBCard, DBTrackedPokemon } from "./adapters/db.ts";

export type CardResumeTuple = [DBTrackedPokemon, tcgApi.CardResume[]];
export type SingleCardResumeTuple = [DBTrackedPokemon, tcgApi.CardResume];
export type SingleCardThrouple = [DBTrackedPokemon, string, tcgApi.Card];

export type Card = tcgApi.Card;
export type TrackedPokemon = DBTrackedPokemon;
export type SeenCard = DBCard;

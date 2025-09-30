import * as tcgApi from "@tcgdex/sdk";
import * as db from "./adapters/db.ts";

export type CardResumeTuple = [db.TrackedPokemon, tcgApi.CardResume[]];
export type SingleCardResumeTuple = [db.TrackedPokemon, tcgApi.CardResume];
export type SingleCardThrouple = [db.TrackedPokemon, string, tcgApi.Card];

export type Card = tcgApi.Card;
export type TrackedPokemon = db.TrackedPokemon;
export type SeenCard = db.Card;

import { fetchAllPokemon } from "./handler.ts";

Deno.cron("Check Pokémon API for new releases", { hour: 24 }, {
  backoffSchedule: [60000], // retry after a minute if it failed
}, fetchAllPokemon);

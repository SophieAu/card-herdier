import { fetchAllPokemon } from "./handler.ts";

Deno.cron(
  "Check Pokemon API for new releases",
  { hour: { exact: 7 } },
  {},
  fetchAllPokemon,
);

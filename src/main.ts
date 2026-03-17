import { fetchAllPokemon } from "./handler.ts";

Deno.cron(
  "Check Pokemon API for new releases",
  { hour: { exact: 7 } },
  {},
  fetchAllPokemon,
);


// Add a test endpoint
Deno.serve(async (req) => {
  if (req.url.endsWith("/test-cron")) {
    await fetchAllPokemon();
    return new Response("Done");
  }
  return new Response("Not found", { status: 404 });
});
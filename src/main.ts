import { logger } from "./adapters/logging.ts";
import { fetchAllPokemon } from "./handler.ts";

// Add this
Deno.serve(() => new Response("Card Herdier is running"));

Deno.cron(
  "Check Pokemon API for new releases",
  // { hour: { exact: 7 } },
  { minute: { every: 30 } },
  {},
  async () => {
    try {
      logger.info("Checking Pokemon API for new releases")
      await fetchAllPokemon();
    } catch (error) {
      logger.error("CRON FAILED:", error); // This should at least log
    }
  }
);
import { logger } from "./adapters/logging.ts";
import { fetchAllPokemon } from "./handler.ts";

// Dummy Server so Deno Deploy doesn't break
Deno.serve(() => new Response("Card Herdier is running"));

Deno.cron(
  "Check Pokemon API for new releases",
  // { hour: { exact: 7 } },
  { minute: { every: 5 } },
  {},
  async () => {
    if (Deno.env.get("IS_PRODUCTION") !== "true") {
      logger.info("Skipping non-production cron");
      return;
    }

    try {
      logger.info("Checking Pokemon API for new releases")
      await fetchAllPokemon();
    } catch (error) {
      logger.error("CRON FAILED:", error); // This should at least log
    }
  }
);

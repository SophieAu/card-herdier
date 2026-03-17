import { logger } from "./adapters/logging.ts";
import { fetchAllPokemon } from "./handler.ts";

Deno.cron(
  "Check Pokemon API for new releases",
  { hour: { exact: 7 } },
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
// deno-lint-ignore-file no-explicit-any
/** biome-ignore-all lint/suspicious/noExplicitAny: just passing along the original console log type */
import { Axiom } from '@axiomhq/js';

const AXIOM_DATASET_NAME = "card-herdier"

// biome-ignore lint/style/noNonNullAssertion: we're just praying that this guy is set in the env.
const axiom = new Axiom({ token: Deno.env.get('AXIOM_TOKEN')! });

const formatMessage = (...data: any[]) => data.map(d =>
    typeof d === 'object' ? JSON.stringify(d) : String(d)
).join(' ');

const logToAxiom = (level: "error" | "warn" | "info", message: string) => {
    if (Deno.env.get("IS_PRODUCTION") !== "true") return

    axiom.ingest(AXIOM_DATASET_NAME, [{ level, message, timestamp: new Date().toISOString() }]);
}


const error = (...data: any[]) => {
    const message = formatMessage(...data)

    console.log(`ERROR: ${message}`, "color: red")
    logToAxiom('error', message);
};

const info = (...data: any[]) => {
    const message = formatMessage(...data)

    console.log(`INFO: ${data}`)
    logToAxiom('info', message);
};

const warn = (...data: any[]) => {
    const message = formatMessage(...data)

    console.log(`WARN: ${data}`, "color: orange")
    logToAxiom('warn', message);
};

export const logger = { error, info, warn };

// deno-lint-ignore-file no-explicit-any
/** biome-ignore-all lint/suspicious/noExplicitAny: just passing along the original console log type */
const error = (...data: any[]) => console.log(`ERROR: ${data}`, "color: red");

const info = (...data: any[]) => console.log(`INFO: ${data}`);

const warn = (...data: any[]) => console.log(`WARN: ${data}`, "color: orange");

export const logger = { error, info, warn };

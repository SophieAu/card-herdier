import { Resend } from "resend";
import { logger } from "./logging.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const RECIPIENT = Deno.env.get("EMAIL_RECIPIENT");
const SENDER = "Card Herdier <newcards@cardherdier.com>";

export const sendEmail = async (subject: string, body: string) => {
  if (!RECIPIENT) {
    logger.error("No email recipient found");
    return;
  }

  await resend.emails.send({
    from: SENDER,
    to: [RECIPIENT],
    subject: subject,
    html: body,
  });
};

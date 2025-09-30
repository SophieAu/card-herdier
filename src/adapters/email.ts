import { Resend } from "resend";
import { logger } from "./logging.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const RECIPIENT = Deno.env.get("EMAIL_RECIPIENT");

export const sendEmail = async (subject: string, body: string) => {
  if (!RECIPIENT) {
    logger.error("No email recipient found");
    return;
  }

  try {
    await resend.emails.send({
      from: "Card Herdier <onboarding@resend.dev>",
      to: [RECIPIENT],
      subject: subject,
      html: body,
    });
  } catch (error) {
    logger.error(error);
  }
};

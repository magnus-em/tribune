import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "hello@usetribune.org";

  try {
    const { data, error } = await resend.emails.send({
      from: `Tribune <${fromEmail}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("Email sending error:", err);
    return { error: String(err) };
  }
}

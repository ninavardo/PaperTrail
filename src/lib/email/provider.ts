export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  headers?: Record<string, string>;
};

/**
 * Anything that can deliver a message. To add a provider (SES, Postmark, SMTP...),
 * implement this interface and register it in PROVIDERS under the name used in EMAIL_PROVIDER.
 */
export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage & { from: string }): Promise<void>;
}

/** Prints messages instead of sending them. The default, for development. */
export const consoleProvider: EmailProvider = {
  name: "console",
  async send(message) {
    const headers = Object.entries(message.headers ?? {}).map(([k, v]) => `${k}: ${v}`);
    console.log(
      [`From: ${message.from}`, `To: ${message.to}`, `Subject: ${message.subject}`, ...headers, "", message.text, "---"].join("\n"),
    );
  },
};

const PROVIDERS: Record<string, EmailProvider> = { console: consoleProvider };

export function getEmailProvider(name = process.env.EMAIL_PROVIDER ?? "console"): EmailProvider {
  const provider = PROVIDERS[name];
  if (!provider) throw new Error(`Unknown EMAIL_PROVIDER "${name}". Known: ${Object.keys(PROVIDERS).join(", ")}.`);
  return provider;
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "Paper Trail <ledger@localhost>";
}

export async function sendEmail(message: EmailMessage, provider: EmailProvider = getEmailProvider()): Promise<void> {
  await provider.send({ ...message, from: emailFrom() });
}

/**
 * Sends today's entry to every confirmed subscriber. Run once per day from cron, e.g.
 *   0 7 * * *  cd /srv/paper-trail && npm run -s email:send-daily
 * Pass --dry-run to render the messages through the console provider instead.
 */
import { getDb } from "@/db/client";
import { isoDay } from "@/lib/dates";
import { consoleProvider, getEmailProvider, sendEmail } from "@/lib/email/provider";
import { dailyEmail } from "@/lib/email/templates";
import { getDailyFact } from "@/lib/queries";
import { confirmedSubscribers, siteUrl } from "@/lib/subscriptions";

async function main(): Promise<number> {
  const dryRun = process.argv.includes("--dry-run");
  const provider = dryRun ? consoleProvider : getEmailProvider();
  const db = getDb();

  const now = new Date();
  const fact = await getDailyFact(db, now);
  if (!fact) {
    console.error("No verified fact is available; nothing sent.");
    return 1;
  }

  const recipients = await confirmedSubscribers(db);
  let failed = 0;
  for (const subscriber of recipients) {
    try {
      await sendEmail(dailyEmail(fact, subscriber, siteUrl(), isoDay(now)), provider);
    } catch (error) {
      failed += 1;
      console.error(`Failed to send to subscriber ${subscriber.id}:`, error);
    }
  }

  console.log(
    `${isoDay(now)}: entry ${fact.id} sent to ${recipients.length - failed} of ${recipients.length} subscribers via ${provider.name}.`,
  );
  return failed > 0 ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);

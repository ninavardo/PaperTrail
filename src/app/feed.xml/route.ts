import type { NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { addDays, isoDay, startOfUtcDay } from "@/lib/dates";
import { entryNumber } from "@/lib/format";
import { getDailyFact } from "@/lib/queries";

export const dynamic = "force-dynamic";

const FEED_DAYS = 30;

const escapeXml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c] ?? c);

/** The daily entry for each of the last 30 UTC days, newest first. */
export function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const db = getDb();
  const today = startOfUtcDay(new Date());

  const items = Array.from({ length: FEED_DAYS }, (_, i) => addDays(today, -i)).flatMap((day) => {
    const fact = getDailyFact(db, day);
    if (!fact) return [];
    const link = `${origin}/archive/${fact.id}`;
    const sources = fact.sources
      .map(
        (s) =>
          `<li>${escapeXml(s.publisher)}: &#8220;${escapeXml(s.quote)}&#8221; <a href="${escapeXml(s.url)}">source</a>${
            s.archiveUrl ? ` · <a href="${escapeXml(s.archiveUrl)}">archived copy</a>` : ""
          }</li>`,
      )
      .join("");
    const description = `<p>${escapeXml(fact.sentence)}</p><p>Grade ${fact.grade} · ${escapeXml(fact.category)} · ${fact.year}</p><ol>${sources}</ol>`;
    return [
      `<item>
  <title>${escapeXml(`Entry ${entryNumber(fact.id)} · ${isoDay(day)}`)}</title>
  <link>${escapeXml(link)}</link>
  <guid isPermaLink="false">${escapeXml(`${link}#${isoDay(day)}`)}</guid>
  <pubDate>${day.toUTCString()}</pubDate>
  <category>${escapeXml(fact.category)}</category>
  <description><![CDATA[${description.replaceAll("]]>", "]]]]><![CDATA[>")}]]></description>
</item>`,
    ];
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Paper Trail</title>
  <link>${escapeXml(origin)}/today</link>
  <atom:link href="${escapeXml(origin)}/feed.xml" rel="self" type="application/rss+xml"/>
  <description>One sourced fact a day about money, markets and economics.</description>
  <language>en</language>
  <lastBuildDate>${today.toUTCString()}</lastBuildDate>
${items.join("\n")}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

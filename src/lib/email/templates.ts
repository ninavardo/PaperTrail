import type { FactWithSources, Subscriber } from "@/db/schema";
import { entryNumber } from "../format";
import { confirmUrl, unsubscribeUrl } from "../subscriptions";
import type { EmailMessage } from "./provider";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

const SERIF = "'Source Serif 4', Georgia, serif";
const MONO = "'IBM Plex Mono', Menlo, monospace";
const META = `font-family:${MONO};font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#5a5648`;

function layout(body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="color-scheme" content="light"></head><body style="margin:0;background:#f2eee3;color:#1b1b18">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:${SERIF};font-size:17px;line-height:1.5">
<p style="${META};margin:0 0 8px;padding-bottom:8px;border-bottom:3px double #1b1b18">Paper Trail</p>
${body}
</div></body></html>`;
}

export function confirmationEmail(s: Subscriber, origin: string): EmailMessage {
  const url = confirmUrl(origin, s);
  return {
    to: s.email,
    subject: "Confirm your Paper Trail subscription",
    text: [
      "Someone, presumably you, asked to receive one sourced fact a day from Paper Trail.",
      "",
      `Confirm here: ${url}`,
      "",
      "If this was not you, ignore this message and nothing will be sent.",
    ].join("\n"),
    html: layout(`<p>Someone, presumably you, asked to receive one sourced fact a day from Paper Trail.</p>
<p><a href="${escapeHtml(url)}" style="color:#1b1b18">Confirm the subscription</a></p>
<p style="${META}">If this was not you, ignore this message and nothing will be sent.</p>`),
  };
}

export function dailyEmail(fact: FactWithSources, s: Subscriber, origin: string, day: string): EmailMessage {
  const permalink = `${origin}/archive/${fact.id}`;
  const unsubscribe = unsubscribeUrl(origin, s);
  const entry = `Entry ${entryNumber(fact.id)}`;

  const textSources = fact.sources.flatMap((src, i) => [
    `${String(i + 1).padStart(2, "0")}. ${src.publisher}: "${src.quote}"`,
    `    ${src.url}`,
    ...(src.archiveUrl ? [`    Archived: ${src.archiveUrl}`] : []),
  ]);

  const htmlSources = fact.sources
    .map(
      (src) => `<li style="padding:8px 0;border-top:1px solid #cfc8b4">
<p style="${META};margin:0">${escapeHtml(src.publisher)}</p>
<p style="margin:4px 0;font-style:italic;font-size:15px">&ldquo;${escapeHtml(src.quote)}&rdquo;</p>
<p style="${META};margin:0"><a href="${escapeHtml(src.url)}" style="color:#1b1b18">Source</a>${
        src.archiveUrl ? ` &nbsp; <a href="${escapeHtml(src.archiveUrl)}" style="color:#1b1b18">Archived copy</a>` : ""
      }</p></li>`,
    )
    .join("");

  return {
    to: s.email,
    subject: `${entry}: ${fact.sentence.length > 70 ? `${fact.sentence.slice(0, 67)}...` : fact.sentence}`,
    headers: {
      "List-Unsubscribe": `<${unsubscribe}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    text: [
      `${entry} · ${day}`,
      "",
      fact.sentence,
      "",
      `Grade ${fact.grade} · ${fact.category} · ${fact.year}`,
      "",
      "Sources",
      ...textSources,
      "",
      `Permalink: ${permalink}`,
      "",
      `Unsubscribe: ${unsubscribe}`,
    ].join("\n"),
    html: layout(`<p style="${META};margin:16px 0 0">${escapeHtml(entry)} · ${escapeHtml(day)}</p>
<p style="font-size:24px;line-height:1.3;margin:12px 0 16px">${escapeHtml(fact.sentence)}</p>
<p style="${META}"><span style="color:#b3261e;border:2px solid #b3261e;padding:2px 8px">Grade ${fact.grade}</span> &nbsp; ${escapeHtml(fact.category)} · ${fact.year}</p>
<ol style="list-style:none;margin:20px 0 0;padding:0;border-bottom:1px solid #cfc8b4">${htmlSources}</ol>
<p style="${META};margin-top:16px"><a href="${escapeHtml(permalink)}" style="color:#1b1b18">Permalink</a></p>
<p style="${META};margin-top:32px;border-top:1px solid #1b1b18;padding-top:8px"><a href="${escapeHtml(unsubscribe)}" style="color:#5a5648">Unsubscribe</a> in one click.</p>`),
  };
}

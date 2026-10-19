import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { entryNumber } from "@/lib/format";
import { factFromParam } from "@/lib/permalink";

export const dynamic = "force-dynamic";
export const alt = "A Paper Trail entry typed on an archival index card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori reads WOFF but not WOFF2, so the image uses the .woff copies of the site fonts.
const font = (file: string) => readFile(join(process.cwd(), "public/fonts", file));
const fonts = Promise.all([
  font("source-serif-4-latin-400-normal.woff"),
  font("ibm-plex-mono-latin-400-normal.woff"),
  font("ibm-plex-mono-latin-500-normal.woff"),
]);

const PAPER = "#f2eee3";
const INK = "#1b1b18";
const MUTED = "#5a5648";
const RULE = "#cfc8b4";
const STAMP = "#b3261e";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const fact = await factFromParam((await params).id);
  const [serif, mono, monoMedium] = await fonts;

  const sentence = fact?.sentence ?? "Entry not found.";
  const fontSize = sentence.length > 150 ? 46 : sentence.length > 100 ? 52 : 60;
  const metaStyle = { fontFamily: "Plex Mono", fontSize: 22, letterSpacing: 2, textTransform: "uppercase" as const };

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PAPER, padding: 48 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            border: `1px solid ${INK}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "28px 40px 22px",
              color: MUTED,
              ...metaStyle,
            }}
          >
            <span>Paper Trail</span>
            <span>
              {fact ? `Entry ${entryNumber(fact.id)} · ${fact.category} · ${fact.year}` : "Archive"}
            </span>
          </div>
          {/* Satori has no `double` border style, so the index card's top rule is two 1px lines. */}
          <div style={{ display: "flex", height: 4, borderTop: `1px solid ${STAMP}`, borderBottom: `1px solid ${STAMP}` }} />
          <div style={{ display: "flex", flex: 1, padding: "34px 40px 0", position: "relative" }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Source Serif",
                fontSize,
                lineHeight: 1.25,
                color: INK,
                maxWidth: 900,
              }}
            >
              {sentence}
            </div>
            {fact && (
              <div
                style={{
                  position: "absolute",
                  right: 40,
                  bottom: 36,
                  display: "flex",
                  fontFamily: "Plex Mono Medium",
                  fontSize: 26,
                  letterSpacing: 3,
                  color: STAMP,
                  border: `3px solid ${STAMP}`,
                  padding: "6px 16px",
                  transform: "rotate(2deg)",
                  background: PAPER,
                }}
              >
                GRADE {fact.grade}
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              margin: "0 40px",
              padding: "14px 0 24px",
              borderTop: `1px solid ${RULE}`,
              color: MUTED,
              ...metaStyle,
              fontSize: 18,
            }}
          >
            {fact ? `${fact.sources.length} ${fact.sources.length === 1 ? "source" : "sources"} on file` : ""}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Source Serif", data: serif, weight: 400, style: "normal" },
        { name: "Plex Mono", data: mono, weight: 400, style: "normal" },
        { name: "Plex Mono Medium", data: monoMedium, weight: 500, style: "normal" },
      ],
    },
  );
}

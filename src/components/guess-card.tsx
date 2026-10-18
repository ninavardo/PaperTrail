"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { FactMarginalia } from "@/components/fact-marginalia";
import { Typewriter, TYPE_INTERVAL_MS } from "@/components/typewriter";
import { YEAR_TOLERANCE, type Puzzle } from "@/lib/puzzle";
import type { GuessState, RevealData } from "@/lib/today";

type Props = {
  action: (prev: GuessState, formData: FormData) => Promise<GuessState>;
  factId: number;
  entryLabel: string;
  redactedSentence: string;
  category: string;
  puzzle: Puzzle;
  initialReveal: RevealData | null;
  /** Rendered under the result once the answer is revealed. */
  afterReveal?: ReactNode;
};

export function GuessCard({ action, factId, entryLabel, redactedSentence, category, puzzle, initialReveal, afterReveal }: Props) {
  const [state, formAction, pending] = useActionState<GuessState, FormData>(action, { reveal: null, error: null });
  const reveal = state.reveal ?? initialReveal;

  if (reveal) return <Reveal data={reveal} entryLabel={entryLabel} animate={state.reveal !== null} afterReveal={afterReveal} />;

  return (
    <div className="ledger">
      <article>
        <p className="meta mb-4 text-muted">{entryLabel}</p>
        <h1 className="font-serif text-fact">
          <Redacted sentence={redactedSentence} />
        </h1>
        <form action={formAction} className="mt-10 max-w-xl space-y-8">
          <input type="hidden" name="factId" value={factId} />
          {puzzle.kind === "number" ? <YearField min={puzzle.min} max={puzzle.max} /> : <TrueFalseField decoyYear={puzzle.decoyYear} />}
          <ConfidenceField />
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="btn" disabled={pending}>
              {pending ? "Entering" : "Enter guess"}
            </button>
            <p className="meta text-muted">The answer and its sources appear once a guess is entered.</p>
          </div>
          {state.error && (
            <p role="alert" className="meta text-stamp">
              {state.error}
            </p>
          )}
        </form>
      </article>
      <aside className="marginalia" aria-label="Entry details">
        <dl className="meta grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt className="text-muted">Year</dt>
          <dd>Withheld</dd>
          <dt className="text-muted">Filed</dt>
          <dd>{category}</dd>
          <dt className="text-muted">Grade</dt>
          <dd>Sealed</dd>
        </dl>
        <p className="meta mt-5 border-t border-rule pt-2 text-muted">Sources are listed after your answer.</p>
      </aside>
    </div>
  );
}

function Redacted({ sentence }: { sentence: string }) {
  const parts = sentence.split("████");
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <>
              <span aria-hidden="true" className="inline-block h-[0.8em] w-[2.6em] translate-y-[0.08em] bg-ink" />
              <span className="sr-only-text">[year withheld]</span>
            </>
          )}
        </span>
      ))}
    </>
  );
}

function YearField({ min, max }: { min: number; max: number }) {
  const [year, setYear] = useState(String(Math.round((min + max) / 2)));
  const numeric = Number(year);
  const valid = Number.isInteger(numeric) && numeric >= min && numeric <= max;
  return (
    <fieldset>
      <legend className="meta mb-3">In what year is this entry filed?</legend>
      <div className="flex flex-wrap items-center gap-4">
        <label htmlFor="year-range" className="sr-only-text">
          Year slider
        </label>
        <input
          id="year-range"
          type="range"
          min={min}
          max={max}
          step={1}
          value={valid ? numeric : min}
          onChange={(e) => setYear(e.target.value)}
          className="rule-range w-full max-w-sm"
        />
        <label className="meta flex items-center gap-2">
          <span className="text-muted">Year</span>
          <input
            name="guess"
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            required
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="field w-24"
          />
        </label>
      </div>
      <p className="meta mt-2 text-muted">Counts as correct within {YEAR_TOLERANCE} years of the recorded year.</p>
    </fieldset>
  );
}

function TrueFalseField({ decoyYear }: { decoyYear: number }) {
  return (
    <fieldset>
      <legend className="meta mb-3">True or false: this happened before {decoyYear}.</legend>
      <div className="flex gap-6">
        <label className="meta flex items-center gap-2">
          <input type="radio" name="guess" value="1" required className="accent-ink" /> True
        </label>
        <label className="meta flex items-center gap-2">
          <input type="radio" name="guess" value="0" required className="accent-ink" /> False
        </label>
      </div>
    </fieldset>
  );
}

function ConfidenceField() {
  const [confidence, setConfidence] = useState(70);
  return (
    <fieldset>
      <legend className="meta mb-3">How sure are you?</legend>
      <div className="flex items-center gap-4">
        <label htmlFor="confidence" className="sr-only-text">
          Confidence, 50 to 100 percent
        </label>
        <input
          id="confidence"
          name="confidence"
          type="range"
          min={50}
          max={100}
          step={5}
          value={confidence}
          aria-valuetext={`${confidence} percent`}
          onChange={(e) => setConfidence(Number(e.target.value))}
          className="rule-range w-full max-w-sm"
        />
        <output htmlFor="confidence" className="meta w-12 text-right">
          {confidence}%
        </output>
      </div>
      <p className="meta mt-2 text-muted">50 is a coin toss. 100 is certainty.</p>
    </fieldset>
  );
}

function Reveal({
  data,
  entryLabel,
  animate,
  afterReveal,
}: {
  data: RevealData;
  entryLabel: string;
  animate: boolean;
  afterReveal?: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (animate) headingRef.current?.focus();
  }, [animate]);

  const typingMs = animate ? data.sentence.length * TYPE_INTERVAL_MS : 0;
  const r = data.result;
  const answer =
    r.kind === "number"
      ? `You entered ${r.guess} at ${r.confidence} percent confidence. Recorded year: ${r.truth}.`
      : `You answered ${r.guess === 1 ? "true" : "false"} to "before ${r.decoyYear}" at ${r.confidence} percent confidence. Recorded year: ${data.year}.`;

  return (
    <div className="ledger">
      <article>
        <p className="meta mb-4 text-muted">{entryLabel}</p>
        <h1 ref={headingRef} tabIndex={-1} className="font-serif text-fact focus:outline-none">
          <Typewriter text={data.sentence} animate={animate} />
        </h1>
        <div className="mt-10 max-w-xl border-t border-ink pt-3" role="status">
          <p className="meta">
            <span className={r.correct ? "text-ledger" : "text-stamp"}>{r.correct ? "Correct" : "Incorrect"}</span>
            <span className="text-muted"> · </span>
            {answer}
          </p>
          <p className="meta mt-2">
            <Link href={`/archive/${data.factId}`}>Permalink to this entry</Link>
          </p>
        </div>
        {afterReveal && <div className="mt-8">{afterReveal}</div>}
      </article>
      <FactMarginalia
        year={data.year}
        category={data.category}
        grade={data.grade}
        sources={data.sources}
        animateStamp={animate}
        stampDelayMs={typingMs}
      />
    </div>
  );
}

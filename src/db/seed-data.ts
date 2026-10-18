import type { FactInput, SourceInput } from "@/lib/validation";
import type { Verdict } from "./schema";

// Every quote below is verbatim from the linked page as fetched on 2026-10-18.
// Archive URLs are Wayback Machine snapshots confirmed available on the same date.
// Anything that could not be sourced this way is listed in SEED_TODO.md instead.

type Page = Omit<SourceInput, "quote">;

const page = (publisher: string, url: string, archiveUrl: string): Page => ({ publisher, url, archiveUrl });
const wb = (timestamp: string, url: string) => `https://web.archive.org/web/${timestamp}/${url}`;

const FRH = "Federal Reserve History";
const fedHistory = (slug: string, ts: string) =>
  page(FRH, `https://www.federalreservehistory.org/essays/${slug}`, wb(ts, `https://www.federalreservehistory.org/essays/${slug}`));

const P = {
  fedAct: fedHistory("federal-reserve-act-signed", "20261011222508"),
  goldEnds: fedHistory("gold-convertibility-ends", "20261012162332"),
  crash1987: fedHistory("stock-market-crash-of-1987", "20261017174610"),
  crash1929: fedHistory("stock-market-crash-of-1929", "20261009170227"),
  panic1907: fedHistory("panic-of-1907", "20261005112459"),
  glassSteagall: fedHistory("glass-steagall-act", "20261009021059"),
  greatInflation: fedHistory("great-inflation", "20260910214748"),
  greatRecession: fedHistory("great-recession-of-200709", "20261007104554"),
  nobel1969: page(
    "NobelPrize.org",
    "https://www.nobelprize.org/prizes/economic-sciences/1969/summary/",
    wb("20261013032447", "https://www.nobelprize.org/prizes/economic-sciences/1969/summary/"),
  ),
  nobelEcon: page(
    "NobelPrize.org",
    "https://www.nobelprize.org/prizes/economic-sciences/",
    wb("20261012182155", "https://www.nobelprize.org/prizes/economic-sciences/"),
  ),
  riksbank: page(
    "Sveriges Riksbank",
    "https://www.riksbank.se/en-gb/about-the-riksbank/history/",
    wb("20261007084601", "https://www.riksbank.se/en-gb/about-the-riksbank/history/"),
  ),
  boe: page(
    "Bank of England",
    "https://www.bankofengland.co.uk/about/history",
    wb("20261017005114", "https://www.bankofengland.co.uk/about/history"),
  ),
  brettonWoods: page(
    "U.S. Department of State, Office of the Historian",
    "https://history.state.gov/milestones/1937-1945/bretton-woods",
    wb("20260910044221", "https://history.state.gov/milestones/1937-1945/bretton-woods"),
  ),
  marshall: page(
    "U.S. National Archives",
    "https://www.archives.gov/milestone-documents/marshall-plan",
    wb("20261012211010", "https://www.archives.gov/milestone-documents/marshall-plan"),
  ),
  sixteenth: page(
    "U.S. National Archives",
    "https://www.archives.gov/milestone-documents/16th-amendment",
    wb("20261005022247", "https://www.archives.gov/milestone-documents/16th-amendment"),
  ),
  socialSecurity: page(
    "U.S. National Archives",
    "https://www.archives.gov/milestone-documents/social-security-act",
    wb("20261005022244", "https://www.archives.gov/milestone-documents/social-security-act"),
  ),
  eo6102: page(
    "The American Presidency Project, UC Santa Barbara",
    "https://www.presidency.ucsb.edu/documents/executive-order-6102-forbidding-the-hoarding-gold-coin-gold-bullion-and-gold-certificates",
    wb(
      "20261016170125",
      "https://www.presidency.ucsb.edu/documents/executive-order-6102-forbidding-the-hoarding-gold-coin-gold-bullion-and-gold-certificates",
    ),
  ),
  tulips: page(
    "Smithsonian Magazine",
    "https://www.smithsonianmag.com/history/there-never-was-real-tulip-fever-180964915/",
    wb("20260829214751", "https://www.smithsonianmag.com/history/there-never-was-real-tulip-fever-180964915/"),
  ),
  euro: page(
    "European Central Bank",
    "https://www.ecb.europa.eu/euro/intro/html/index.en.html",
    wb("20261008130607", "https://www.ecb.europa.eu/euro/intro/html/index.en.html"),
  ),
  wtoGatt: page(
    "World Trade Organization",
    "https://www.wto.org/english/thewto_e/whatis_e/tif_e/fact4_e.htm",
    wb("20261013043540", "https://www.wto.org/English/thewto_e/whatis_e/tif_e/fact4_e.htm"),
  ),
  wealthOfNations: page(
    "Encyclopaedia Britannica",
    "https://www.britannica.com/topic/The-Wealth-of-Nations",
    wb("20260709235200", "https://www.britannica.com/topic/the-Wealth-of-Nations"),
  ),
} satisfies Record<string, Page>;

const cite = (p: Page, quote: string): SourceInput => ({ ...p, quote });

export const SEED_FACTS: FactInput[] = [
  {
    sentence: "President Woodrow Wilson signed the Federal Reserve Act, creating the US central bank, on December 23, 1913.",
    category: "central-banking", year: 1913, grade: "B",
    sources: [cite(P.fedAct, "The Federal Reserve Act was signed by President Wilson on December 23, 1913.")],
  },
  {
    sentence: "In November 1910, bankers met in secret on Jekyll Island, Georgia, to begin planning a US central bank, telling others they were duck hunting.",
    category: "central-banking", year: 1910, grade: "B",
    sources: [cite(P.fedAct, "they made extraordinary efforts to keep the meeting secret, using only first names and telling others they were on a duck hunting trip")],
  },
  {
    sentence: "On August 15, 1971, the United States closed the gold window, so foreign governments could no longer exchange their dollars for gold.",
    category: "money", year: 1971, grade: "B",
    sources: [cite(P.goldEnds, "The first order was for the gold window to be closed. Foreign governments could no longer exchange their dollars for gold")],
  },
  {
    sentence: "The 90-day wage and price freeze of August 1971 was the first time the US government imposed such controls outside wartime.",
    category: "policy", year: 1971, grade: "B",
    sources: [cite(P.goldEnds, "This marked the first time the government enacted wage and price controls outside of wartime.")],
  },
  {
    sentence: "On October 19, 1987, known as Black Monday, the Dow Jones Industrial Average fell 22.6 percent in a single trading session.",
    category: "markets", year: 1987, grade: "B",
    sources: [cite(P.crash1987, "the Dow Jones Industrial Average (DJIA) dropped 22.6 percent in a single trading session")],
  },
  {
    sentence: "After the crash of 1929, the Dow Jones Industrial Average did not return to its pre-crash high until November 1954.",
    category: "markets", year: 1954, grade: "B",
    sources: [cite(P.crash1929, "The Dow did not return to its pre-crash heights until November 1954.")],
  },
  {
    sentence: "The Banking Act of 1933, known as Glass-Steagall, separated commercial banking from investment banking and created the FDIC.",
    category: "policy", year: 1933, grade: "B",
    sources: [cite(P.glassSteagall, "The Glass-Steagall Act effectively separated commercial banking from investment banking and created the Federal Deposit Insurance Corporation")],
  },
  {
    sentence: "US federal deposit insurance began in January 1934 with a temporary fund that covered deposits up to $2,500.",
    category: "policy", year: 1934, grade: "B",
    sources: [cite(P.glassSteagall, "A temporary fund became effective in January 1934, insuring deposits up to $2,500.")],
  },
  {
    sentence: "On October 22, 1907, the day Knickerbocker Trust closed, the call money rate at the New York Stock Exchange jumped from 9.5 to 70 percent.",
    category: "crises", year: 1907, grade: "B",
    sources: [cite(P.panic1907, "On the day Knickerbocker closed, October 22, the annualized rate jumped from 9.5 percent to 70 percent")],
  },
  {
    sentence: "The first economics prize in memory of Alfred Nobel, awarded in 1969, was shared by Ragnar Frisch and Jan Tinbergen.",
    category: "ideas", year: 1969, grade: "A",
    sources: [cite(P.nobel1969, "was awarded jointly to Ragnar Frisch and Jan Tinbergen")],
  },
  {
    sentence: "Sweden's Riksbank, founded by decision of the Riksdag in 1668, is the world's oldest central bank.",
    category: "central-banking", year: 1668, grade: "B",
    sources: [cite(P.riksbank, "The Riksbank is thus the world's oldest central bank.")],
  },
  {
    sentence: "Delegates from 44 nations met at Bretton Woods, New Hampshire, in July 1944 and created the IMF and the World Bank.",
    category: "money", year: 1944, grade: "B",
    sources: [cite(P.brettonWoods, "a gathering of delegates from 44 nations that met in Bretton Woods, New Hampshire")],
  },
  {
    sentence: "The General Agreement on Tariffs and Trade was signed on 30 October 1947 by 23 countries.",
    category: "trade", year: 1947, grade: "B",
    sources: [cite(P.wtoGatt, "The group had expanded to 23 by the time the deal was signed on 30 October 1947.")],
  },
  {
    sentence: "The International Trade Organization never came into being: in 1950 the US government said it would not seek ratification of its charter.",
    category: "trade", year: 1950, grade: "B",
    sources: [cite(P.wtoGatt, "In 1950, the United States government announced that it would not seek Congressional ratification of the Havana Charter, and the ITO was effectively dead.")],
  },
  {
    sentence: "President Truman signed the act that became known as the Marshall Plan on April 3, 1948.",
    category: "policy", year: 1948, grade: "A",
    sources: [cite(P.marshall, "On April 3, 1948, President Truman signed the Economic Recovery Act of 1948.")],
  },
  {
    sentence: "The Bank of England opened for business on 1 August 1694 with a staff of 17 clerks and two gatekeepers.",
    category: "central-banking", year: 1694, grade: "B",
    sources: [cite(P.boe, "It had a staff of just 17 clerks and two gatekeepers.")],
  },
  {
    sentence: "The Bank of England was nationalised in 1946, passing from private stockholders to government ownership.",
    category: "central-banking", year: 1946, grade: "B",
    sources: [cite(P.boe, "When the Bank was nationalised in 1946, it meant that it was now owned by the Government rather than by private stockholders.")],
  },
  {
    sentence: "Until March 1960, when Queen Elizabeth II first appeared, Britannia was the only character on Bank of England banknotes.",
    category: "money", year: 1960, grade: "B",
    sources: [cite(P.boe, "Up until this point, Britannia had been the only character to appear on our banknotes.")],
  },
  {
    sentence: "In 1968 the Bank of England printed its first 'Giant' banknotes, each with a face value of one million pounds.",
    category: "money", year: 1968, grade: "B",
    sources: [cite(P.boe, "In 1968, we printed our first ‘Giant’ banknotes. With a face value of £1 million")],
  },
  {
    sentence: "Executive Order 6102 of April 5, 1933, required Americans to deliver most gold coin, bullion and certificates to the banking system by May 1.",
    category: "money", year: 1933, grade: "A",
    sources: [cite(P.eo6102, "All persons are hereby required to deliver on or before May 1, 1933, to a Federal Reserve Bank")],
  },
  {
    sentence: "Wilful violators of Executive Order 6102 faced fines of up to $10,000, up to ten years in prison, or both.",
    category: "money", year: 1933, grade: "A",
    sources: [cite(P.eo6102, "may be fined not more than $10,000, or, if a natural person, may be imprisoned for not more than ten years")],
  },
  {
    sentence: "The 16th Amendment, ratified in February 1913, gave Congress the power to tax incomes without apportionment among the states.",
    category: "policy", year: 1913, grade: "A",
    sources: [cite(P.sixteenth, "The Congress shall have the power to lay and collect taxes on incomes, from whatever source derived, without apportionment among the several States")],
  },
  {
    sentence: "The first American income tax was imposed in 1861 to meet the financial requirements of the Civil War.",
    category: "policy", year: 1861, grade: "B",
    sources: [cite(P.sixteenth, "The financial requirements of the Civil War prompted the first American income tax in 1861.")],
  },
  {
    sentence: "Historian Anne Goldgar, researching the 1637 Dutch tulip crash in the archives, could not find anyone who went bankrupt from it.",
    category: "markets", year: 1637, grade: "C",
    sources: [cite(P.tulips, "I couldn’t find anybody that went bankrupt.")],
  },
  {
    sentence: "The United Kingdom suspended the gold standard in September 1931 after a run on sterling.",
    category: "money", year: 1931, grade: "B",
    sources: [cite(P.boe, "In September 1931, the UK suspended the gold standard.")],
  },
  {
    sentence: "More than 300 people were hanged for forging Bank of England notes during the Restriction Period of 1797 to 1821.",
    category: "money", year: 1797, grade: "B",
    sources: [cite(P.boe, "Forgery of Bank of England banknotes was considered a capital offence, and over 300 people were hanged during this period.")],
  },
  {
    sentence: "In 1797, fear of a French invasion set off a run that cut the Bank of England's gold from £16 million to £2 million.",
    category: "crises", year: 1797, grade: "B",
    sources: [cite(P.boe, "The amount of gold held by the Bank dropped from £16 million to just £2 million.")],
  },
  {
    sentence: "On 9 May 1866 the Bank of England refused to help the discount house Overend Gurney, which suspended payments the next day.",
    category: "crises", year: 1866, grade: "B",
    sources: [cite(P.boe, "The Bank refused on the basis of the broker’s insolvency.")],
  },
  {
    sentence: "In 1720 the South Sea Company was granted part of Britain's national debt; its stock soared, then crashed, ruining thousands.",
    category: "markets", year: 1720, grade: "B",
    sources: [cite(P.boe, "prices eventually crashed and thousands of people were ruined")],
  },
  {
    sentence: "US consumer price inflation peaked in March 1980 at close to 15 percent.",
    category: "money", year: 1980, grade: "B",
    sources: [cite(P.greatInflation, "peaked in March 1980 at close to 15 percent")],
  },
  {
    sentence: "In October 1979, under chairman Paul Volcker, the Federal Reserve began targeting reserve growth instead of the federal funds rate.",
    category: "central-banking", year: 1979, grade: "B",
    sources: [cite(P.greatInflation, "In October 1979, the FOMC announced its intention to target reserve growth rather than the fed funds rate as its policy instrument.")],
  },
  {
    sentence: "The US Social Security Act, establishing federal old-age benefits and unemployment insurance, was approved on August 14, 1935.",
    category: "policy", year: 1935, grade: "A",
    sources: [cite(P.socialSecurity, "Approved, August 14, 1935.")],
  },
  {
    sentence: "The euro launched on 1 January 1999 as an invisible currency for accounting and electronic payments; euro cash arrived on 1 January 2002.",
    category: "money", year: 1999, grade: "B",
    sources: [cite(P.euro, "For the first three years it was an invisible currency, only used for accounting purposes, e.g. in electronic payments.")],
  },
  {
    sentence: "The World Trade Organization was created on 1 January 1995, ending almost half a century of the GATT as a provisional arrangement.",
    category: "trade", year: 1995, grade: "B",
    sources: [cite(P.wtoGatt, "The WTO’s creation on 1 January 1995 marked the biggest reform of international trade since after the Second World War.")],
  },
  {
    sentence: "Adam Smith's The Wealth of Nations was first published in 1776.",
    category: "ideas", year: 1776, grade: "B",
    sources: [cite(P.wealthOfNations, "work by the Scottish economist and philosopher Adam Smith, first published in 1776")],
  },
  {
    sentence: "The Wealth of Nations opens with a pin factory in which 10 workers, each specialising, turn out 48,000 pins a day.",
    category: "ideas", year: 1776, grade: "B",
    sources: [cite(P.wealthOfNations, "a pin factory in which 10 persons, by specializing in various tasks, turn out 48,000 pins a day")],
  },
  {
    sentence: "The Great Recession ran from December 2007 to June 2009, the longest US recession since World War II.",
    category: "crises", year: 2007, grade: "B",
    sources: [cite(P.greatRecession, "The Great Recession began in December 2007 and ended in June 2009, which makes it the longest recession since World War II.")],
  },
  {
    sentence: "Between September 2007 and December 2008 the Federal Reserve cut the federal funds rate from 5.25 percent to a range of 0 to 0.25 percent.",
    category: "central-banking", year: 2008, grade: "B",
    sources: [cite(P.greatRecession, "reducing the federal funds rate from 5.25 percent in September 2007 to a range of 0-0.25 percent in December 2008")],
  },
  {
    sentence: "During the Arab oil embargo that began in October 1973, crude oil prices quadrupled.",
    category: "crises", year: 1973, grade: "B",
    sources: [cite(P.greatInflation, "During this period, crude oil prices quadrupled to a plateau that held until the Iranian revolution")],
  },
  {
    sentence: "Sveriges Riksbank established the economics prize in memory of Alfred Nobel in 1968, on the occasion of the bank's 300th anniversary.",
    category: "ideas", year: 1968, grade: "B",
    sources: [cite(P.nobelEcon, "The prize is based on a donation received by the Nobel Foundation in 1968 from Sveriges Riksbank on the occasion of the bank’s 300th anniversary.")],
  },
];

/** Claims cite seed sources by the URL and quote they were seeded with. */
export const SEED_CLAIMS: Array<{
  text: string;
  verdict: Verdict;
  oneLineVerdict: string;
  cites: Array<{ url: string; quote: string }>;
}> = [
  {
    text: "Tulip mania bankrupted the Dutch economy in 1637.",
    verdict: "MISLEADING",
    oneLineVerdict: "Bulb prices did collapse in 1637, but archival research found few people involved and no one who went bankrupt.",
    cites: [{ url: P.tulips.url, quote: "I couldn’t find anybody that went bankrupt." }],
  },
  {
    text: "The US dollar can still be exchanged for gold.",
    verdict: "FALSE",
    oneLineVerdict: "Foreign governments lost the ability to exchange dollars for gold when the gold window closed in August 1971.",
    cites: [{ url: P.goldEnds.url, quote: "The first order was for the gold window to be closed. Foreign governments could no longer exchange their dollars for gold" }],
  },
  {
    text: "The federal income tax is unconstitutional.",
    verdict: "FALSE",
    oneLineVerdict: "The 16th Amendment, ratified in 1913, expressly gives Congress the power to tax incomes.",
    cites: [{ url: P.sixteenth.url, quote: "The Congress shall have the power to lay and collect taxes on incomes, from whatever source derived, without apportionment among the several States" }],
  },
  {
    text: "In 1933 Roosevelt confiscated Americans' gold without compensation.",
    verdict: "MISLEADING",
    oneLineVerdict: "Executive Order 6102 required gold to be delivered to banks, which paid an equivalent amount in other currency; up to $100 was exempt.",
    cites: [{ url: P.eo6102.url, quote: "All persons are hereby required to deliver on or before May 1, 1933, to a Federal Reserve Bank" }],
  },
  {
    text: "Black Monday in 1987 was the largest one-day fall in the Dow's history.",
    verdict: "TRUE",
    oneLineVerdict: "The Dow fell 22.6 percent on October 19, 1987, which Federal Reserve History calls the largest one-day stock market decline in history.",
    cites: [{ url: P.crash1987.url, quote: "the Dow Jones Industrial Average (DJIA) dropped 22.6 percent in a single trading session" }],
  },
];

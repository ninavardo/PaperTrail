/*
 * Paper Trail embed.
 *
 *   <script src="https://YOUR-HOST/embed.js" data-category="markets" async></script>
 *
 * Renders today's entry in a shadow root directly after the script tag.
 * Restyle it from the host page with CSS variables on .paper-trail-embed:
 *   --pt-paper, --pt-ink, --pt-muted, --pt-rule, --pt-stamp,
 *   --pt-font-serif, --pt-font-mono, --pt-max-width
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script || !script.src) return;

  var origin = new URL(script.src).origin;
  var category = script.getAttribute("data-category");

  var FONT_STYLE_ID = "paper-trail-embed-fonts";
  // @font-face is ignored inside shadow roots in some browsers, so it goes in the host document once.
  if (!document.getElementById(FONT_STYLE_ID)) {
    var faces = document.createElement("style");
    faces.id = FONT_STYLE_ID;
    faces.textContent = [
      ["Paper Trail Serif", "normal", 400, "source-serif-4-latin-400-normal"],
      ["Paper Trail Serif", "italic", 400, "source-serif-4-latin-400-italic"],
      ["Paper Trail Mono", "normal", 400, "ibm-plex-mono-latin-400-normal"],
      ["Paper Trail Mono", "normal", 500, "ibm-plex-mono-latin-500-normal"],
    ]
      .map(function (f) {
        return (
          '@font-face{font-family:"' + f[0] + '";font-style:' + f[1] + ";font-weight:" + f[2] +
          ';font-display:swap;src:url("' + origin + "/fonts/" + f[3] + '.woff2") format("woff2");}'
        );
      })
      .join("");
    document.head.appendChild(faces);
  }

  var host = document.createElement("div");
  host.className = "paper-trail-embed";
  script.insertAdjacentElement("afterend", host);
  var root = host.attachShadow({ mode: "open" });

  var css =
    ":host{display:block;max-width:var(--pt-max-width,36rem);" +
    "--_paper:var(--pt-paper,#f2eee3);--_ink:var(--pt-ink,#1b1b18);--_muted:var(--pt-muted,#5a5648);" +
    "--_rule:var(--pt-rule,#cfc8b4);--_stamp:var(--pt-stamp,#b3261e);" +
    '--_serif:var(--pt-font-serif,"Paper Trail Serif",serif);--_mono:var(--pt-font-mono,"Paper Trail Mono",monospace);}' +
    "*{box-sizing:border-box;margin:0;padding:0;border-radius:0}" +
    ".card{background:var(--_paper);color:var(--_ink);border:1px solid var(--_ink);padding:1.25rem 1.25rem 1rem;" +
    "font-family:var(--_serif);font-variant-numeric:tabular-nums lining-nums;text-align:left}" +
    ".meta{font-family:var(--_mono);font-size:.7rem;line-height:1.5;letter-spacing:.06em;text-transform:uppercase;color:var(--_muted)}" +
    ".head{display:flex;justify-content:space-between;gap:1rem;padding-bottom:.6rem;border-bottom:3px double var(--_ink)}" +
    ".fact{font-size:1.35rem;line-height:1.3;margin:1rem 0}" +
    ".row{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem 1.25rem}" +
    ".stamp{display:inline-block;font-family:var(--_mono);font-weight:500;font-size:.75rem;letter-spacing:.12em;" +
    "text-transform:uppercase;color:var(--_stamp);border:2px solid var(--_stamp);outline:1px solid var(--_stamp);" +
    "outline-offset:2px;padding:.15rem .5rem;transform:rotate(2deg)}" +
    "ol{list-style:none;margin-top:1rem;border-top:1px solid var(--_rule)}" +
    "li{padding:.5rem 0;border-bottom:1px solid var(--_rule)}" +
    "q{display:block;font-style:italic;font-size:.9rem;line-height:1.45;margin:.2rem 0}" +
    "a{color:inherit;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}" +
    "a:focus-visible{outline:2px solid var(--_stamp);outline-offset:2px}" +
    ".links{display:flex;gap:.9rem}.foot{margin-top:.75rem}";

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  }

  function link(href, text, label) {
    var a = el("a", null, text);
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    if (label) a.setAttribute("aria-label", label);
    return a;
  }

  function hostOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  }

  function render(children) {
    var style = el("style", null, css);
    var card = el("article", "card");
    card.setAttribute("aria-label", "Paper Trail, today's entry");
    children.forEach(function (c) {
      card.appendChild(c);
    });
    root.replaceChildren(style, card);
  }

  function header(right) {
    var head = el("div", "head meta");
    head.appendChild(link(origin + "/today", "Paper Trail"));
    head.appendChild(el("span", null, right));
    return head;
  }

  function renderFact(data) {
    var f = data.fact;
    var entry = "Entry " + String(f.id).padStart(3, "0");

    var row = el("div", "row");
    var stamp = el("span", "stamp", "Grade " + f.grade);
    row.appendChild(stamp);
    row.appendChild(el("span", "meta", f.category + " · " + f.year));

    var list = el("ol");
    f.sources.forEach(function (s) {
      var item = el("li");
      item.appendChild(el("p", "meta", s.publisher));
      item.appendChild(el("q", null, s.quote));
      var links = el("p", "meta links");
      links.appendChild(link(s.url, hostOf(s.url)));
      if (s.archiveUrl) links.appendChild(link(s.archiveUrl, "Archived copy", "Archived copy of " + hostOf(s.url)));
      item.appendChild(links);
      list.appendChild(item);
    });

    var foot = el("p", "meta foot");
    foot.appendChild(link(f.permalink, "Permalink · " + entry));

    render([header(data.date), el("p", "fact", f.sentence), row, list, foot]);
  }

  function renderUnavailable() {
    render([header(""), el("p", "fact", "Today's entry is unavailable."), el("p", "meta", "The ledger could not be reached.")]);
  }

  var url = new URL("/api/v1/fact/today", origin);
  if (category) url.searchParams.set("category", category);

  fetch(url.toString(), { headers: { Accept: "application/json" } })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      if (!data || !data.fact || !Array.isArray(data.fact.sources) || data.fact.sources.length === 0) {
        throw new Error("Malformed response");
      }
      renderFact(data);
    })
    .catch(renderUnavailable);
})();

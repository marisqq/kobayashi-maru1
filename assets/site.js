(() => {
  "use strict";

  const entriesRoot = document.querySelector("#entries");
  const dayCount = document.querySelector("#day-count");
  const runStatus = document.querySelector("#run-status");
  const statusText = document.querySelector("#status-text");

  if (!entriesRoot || !dayCount || !runStatus || !statusText) return;

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const row = (term, value, code = false) => {
    const wrapper = document.createElement("div");
    wrapper.append(element("dt", "", term));
    const definition = document.createElement("dd");
    const content = code ? element("code", "", value) : document.createTextNode(value);
    definition.append(content);
    wrapper.append(definition);
    return wrapper;
  };

  const formatDate = (date) => {
    const parsed = new Date(`${date}T12:00:00Z`);
    if (Number.isNaN(parsed.valueOf())) return date;
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    }).format(parsed);
  };

  const formatDuration = (seconds) => {
    const total = Number(seconds);
    if (!Number.isFinite(total) || total < 0) return "—";
    const minutes = Math.floor(total / 60);
    const remaining = Math.floor(total % 60);
    return `${minutes}m ${String(remaining).padStart(2, "0")}s`;
  };

  const renderTransmission = (entry, latest) => {
    const article = element("article", `transmission${latest ? "" : " archived-transmission"}`);
    const titleId = `transmission-${entry.date}`;
    article.setAttribute("aria-labelledby", titleId);

    const heading = element("header", "transmission-heading");
    heading.append(element("p", "entry-number", `Day ${entry.day}${latest ? " · latest" : ""}`));
    const time = element("time", "", formatDate(entry.date));
    time.dateTime = entry.date;
    heading.append(time);

    const title = element("h3", "", latest ? "Current public note" : `Public note from day ${entry.day}`);
    title.id = titleId;

    const quote = document.createElement("blockquote");
    quote.append(element("p", "", entry.public_transmission));

    const provenance = element("dl", "provenance");
    provenance.append(
      row("Model", entry.model),
      row("Reasoning", entry.reasoning_effort),
      row("Duration", formatDuration(entry.duration_seconds)),
      row("Codex version", entry.codex_version)
    );

    const hashes = element("dl", "hashes");
    hashes.append(
      row("Private ledger SHA-256", entry.ledger_sha256, true),
      row("Public record SHA-256", entry.record_sha256, true),
      row("Previous record SHA-256", entry.previous_record_sha256, true),
      row("Private commit", entry.private_commit, true)
    );

    const details = element("details", "record-details");
    details.append(element("summary", "", "Verification details"), hashes);

    article.append(heading, title, quote, provenance, details);
    return article;
  };

  const render = (payload) => {
    if (!payload || payload.schema_version !== 1 || !Array.isArray(payload.entries) || payload.entries.length === 0) return;
    const entries = payload.entries.slice().sort((a, b) => b.date.localeCompare(a.date));
    entriesRoot.replaceChildren(...entries.map((entry, index) => renderTransmission(entry, index === 0)));
    dayCount.textContent = String(entries.length);
    runStatus.classList.add("active");
    statusText.textContent = "Record active";
  };

  fetch("/entries/index.json", { cache: "no-store", credentials: "omit" })
    .then((response) => {
      if (!response.ok) throw new Error("entry index unavailable");
      return response.json();
    })
    .then(render)
    .catch(() => {
      statusText.textContent = "Record temporarily unavailable";
    });
})();

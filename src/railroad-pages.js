import { railroadUrl } from "./navigation.js?v=railroad-relationships-1";
import { useArchiveOnError } from "./image-archive.js";

function railroadYears(railroad) {
  if (railroad.startYear == null && railroad.endYear == null) return "Dates unknown";
  return `${railroad.startYear ?? "?"}–${railroad.endYear ?? "present"}`;
}

export function railroadRelationships(railroad, railroads) {
  const byId = new Map(railroads.map((item) => [item.id, item]));
  return {
    predecessorLabel: railroad.predecessorLabel || "Predecessors",
    predecessors: (railroad.predecessors || []).map((id) => byId.get(id)).filter(Boolean),
    successor: byId.get(railroad.successor) ?? null,
  };
}

function relationshipLink(railroad, onOpenRailroad) {
  const link = document.createElement("a");
  link.href = railroadUrl(railroad.slug);
  link.textContent = railroad.name;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    onOpenRailroad(railroad);
  });
  return link;
}

function appendRelationshipValue(container, railroads, emptyText, onOpenRailroad) {
  if (!railroads.length) {
    container.textContent = emptyText;
    return;
  }
  railroads.forEach((railroad) => container.append(relationshipLink(railroad, onOpenRailroad)));
}

function nodeClass(railroad) {
  if (railroad.type === "final" || railroad.type.includes("major") || railroad.id === "burlington-northern") return `railroad-node railroad-node-major${railroad.id === "bnsf" ? " railroad-node-bnsf" : ""}`;
  if (railroad.type.includes("regional")) return "railroad-node railroad-node-regional";
  return "railroad-node railroad-node-local";
}

function layoutRailroads(railroads) {
  const byId = new Map(railroads.map((railroad) => [railroad.id, railroad]));
  const depthMemo = new Map();
  const depth = (railroad) => {
    if (depthMemo.has(railroad.id)) return depthMemo.get(railroad.id);
    const value = railroad.successor ? depth(byId.get(railroad.successor)) + 1 : 0;
    depthMemo.set(railroad.id, value);
    return value;
  };
  const leaves = railroads.filter((railroad) => !railroad.predecessors?.length);
  const y = new Map(leaves.map((railroad, index) => [railroad.id, 72 + index * 112]));
  const pending = new Set(railroads.filter((railroad) => !y.has(railroad.id)).map(({ id }) => id));
  while (pending.size) {
    let progressed = false;
    for (const id of [...pending]) {
      const railroad = byId.get(id);
      const predecessorYs = (railroad.predecessors || []).map((predecessor) => y.get(predecessor));
      if (predecessorYs.length && predecessorYs.every(Number.isFinite)) {
        y.set(id, predecessorYs.reduce((sum, value) => sum + value, 0) / predecessorYs.length);
        pending.delete(id); progressed = true;
      }
    }
    if (!progressed) {
      for (const id of pending) y.set(id, 72 + y.size * 94);
      break;
    }
  }
  const maxDepth = Math.max(...railroads.map(depth));
  const positions = railroads.map((railroad) => ({
    railroad,
    x: 36 + (maxDepth - depth(railroad)) * 250,
    y: y.get(railroad.id),
  }));
  const positionById = new Map(positions.map((position) => [position.railroad.id, position]));
  for (let currentDepth = maxDepth - 1; currentDepth >= 0; currentDepth -= 1) {
    for (const position of positions.filter(({ railroad }) => depth(railroad) === currentDepth)) {
      const predecessorYs = (position.railroad.predecessors || []).map((id) => positionById.get(id)?.y).filter(Number.isFinite);
      if (predecessorYs.length === 1) position.y = predecessorYs[0];
      else if (predecessorYs.length > 1) position.y = (Math.min(...predecessorYs) + Math.max(...predecessorYs)) / 2;
    }
  }
  const fwd = positionById.get("fwd");
  const cbq = positionById.get("chicago-burlington-quincy");
  const cs = positionById.get("cs");
  if (fwd && cbq && cs) fwd.y = (cbq.y + cs.y) / 2;
  for (const position of positions) position.baseY = position.y;
  return positions;
}

export function verticalScaleForColumns(positions, heights, minimumGap = 20) {
  const columns = new Map();
  for (const position of positions) {
    const column = columns.get(position.x) || [];
    column.push(position);
    columns.set(position.x, column);
  }
  let scale = 1;
  for (const column of columns.values()) {
    column.sort((a, b) => a.baseY - b.baseY);
    for (let index = 1; index < column.length; index += 1) {
      const previous = column[index - 1];
      const current = column[index];
      const baseDistance = current.baseY - previous.baseY;
      if (baseDistance <= 0) continue;
      const requiredDistance = (heights.get(previous.railroad.id) + heights.get(current.railroad.id)) / 2 + minimumGap;
      scale = Math.max(scale, requiredDistance / baseDistance);
    }
  }
  return scale;
}

function fitVerticalSpacing(canvas, positions) {
  const heights = new Map();
  for (const position of positions) {
    const node = canvas.querySelector(`[data-railroad-id="${position.railroad.id}"]`);
    heights.set(position.railroad.id, node.getBoundingClientRect().height);
  }
  const scale = verticalScaleForColumns(positions, heights);
  const anchor = Math.min(...positions.map(({ baseY }) => baseY));
  for (const position of positions) {
    position.y = anchor + (position.baseY - anchor) * scale;
    canvas.querySelector(`[data-railroad-id="${position.railroad.id}"]`).style.top = `${position.y}px`;
  }
  const bottom = Math.max(...positions.map(({ railroad, y }) => y + heights.get(railroad.id) / 2));
  canvas.style.height = `${bottom + 48}px`;
}

function drawEdges(canvas, positions) {
  const svg = canvas.querySelector("svg");
  const canvasRect = canvas.getBoundingClientRect();
  const byId = new Map(positions.map((position) => [position.railroad.id, position]));
  const successors = positions.filter(({ railroad }) => railroad.predecessors?.length);
  svg.replaceChildren();
  for (const successor of successors) {
    const to = canvas.querySelector(`[data-railroad-id="${successor.railroad.id}"]`).getBoundingClientRect();
    const parents = successor.railroad.predecessors.map((id) => {
      const position = byId.get(id);
      const rect = canvas.querySelector(`[data-railroad-id="${position.railroad.id}"]`).getBoundingClientRect();
      return { x: rect.right - canvasRect.left, y: rect.top + rect.height / 2 - canvasRect.top };
    });
    const x2 = to.left - canvasRect.left;
    const y2 = to.top + to.height / 2 - canvasRect.top;
    const parentRight = Math.max(...parents.map(({ x }) => x));
    const bend = parentRight + (x2 - parentRight) / 2;
    const commands = parents.length === 1
      ? [`M ${parents[0].x} ${parents[0].y} H ${x2}`]
      : [
          ...parents.map(({ x, y }) => `M ${x} ${y} H ${bend}`),
          `M ${bend} ${Math.min(...parents.map(({ y }) => y))} V ${Math.max(...parents.map(({ y }) => y))}`,
          `M ${bend} ${y2} H ${x2}`,
        ];
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", commands.join(" "));
    path.setAttribute("class", "railroad-edge");
    path.dataset.successorId = successor.railroad.id;
    svg.append(path);
  }
}

export function renderBnsfGenealogy(main, railroads, onOpenRailroad) {
  const section = document.createElement("section");
  section.className = "bnsf-genealogy";
  section.innerHTML = `
    <header class="section-heading">
      <p class="eyebrow">Railroad genealogy</p>
      <h2>BNSF genealogy</h2>
      <p>Thirty railroads in the curated lineage of today’s BNSF Railway. Select any company to open its record.</p>
    </header>
  `;
  const viewport = document.createElement("div");
  viewport.className = "genealogy-viewport";
  viewport.setAttribute("aria-label", "BNSF railroad genealogy");
  const canvas = document.createElement("div"); canvas.className = "genealogy-canvas";
  const positions = layoutRailroads(railroads);
  const maxY = Math.max(...positions.map(({ y }) => y));
  canvas.style.height = `${maxY + 110}px`;
  canvas.innerHTML = '<svg aria-hidden="true"></svg>';
  for (const { railroad, x, y } of positions) {
    const link = document.createElement("a");
    link.href = railroadUrl(railroad.slug);
    link.className = nodeClass(railroad);
    link.dataset.railroadId = railroad.id;
    link.style.left = `${x}px`; link.style.top = `${y}px`;
    link.setAttribute("aria-label", `${railroad.name}, ${railroadYears(railroad)}`);
    const mark = railroad.reportingMarks?.length ? `<span>${railroad.reportingMarks.join(" · ")}</span>` : "";
    const displayName = railroad.id === "bnsf" ? "Burlington Northern Santa Fe Railway" : railroad.commonName || railroad.name;
    link.innerHTML = `${mark}<strong>${displayName}</strong><small>${railroadYears(railroad)}</small>`;
    link.addEventListener("click", (event) => { event.preventDefault(); onOpenRailroad(railroad); });
    canvas.append(link);
  }
  viewport.append(canvas); section.append(viewport); main.append(section);
  const fitAndDraw = () => requestAnimationFrame(() => {
    if (!canvas.isConnected) {
      window.removeEventListener("resize", fitAndDraw);
      window.visualViewport?.removeEventListener("resize", fitAndDraw);
      return;
    }
    fitVerticalSpacing(canvas, positions);
    drawEdges(canvas, positions);
  });
  window.addEventListener("resize", fitAndDraw);
  window.visualViewport?.addEventListener("resize", fitAndDraw);
  fitAndDraw();
}

const commonStatisticLabels = {
  routeMiles: "System mileage",
  employees: "Employees",
  locomotives: "Locomotives",
  rollingStock: "Non-locomotive rolling stock",
  capitalization: "Capitalization",
};

export function statisticEntriesFor(railroad) {
  return Object.entries(commonStatisticLabels);
}

export function sourceReferenceFor(source) {
  return {
    label: `${source.title} — ${source.publisher}`,
    url: source.url ?? null,
  };
}

export function railroadNarrativeParagraphs(railroad) {
  if (railroad.history?.length) return railroad.history;
  return railroad.description ? [railroad.description] : [];
}

export function paintSchemeEyebrow(scheme) {
  const period = scheme.periodLabel ?? `${scheme.startYear}–${scheme.endYear ?? "present"}`;
  return [period, scheme.category].filter(Boolean).join(" · ");
}

function renderStatistics(railroad, sources) {
  const article = document.createElement("article");
  article.className = "railroad-statistics";
  const snapshots = railroad.statistics?.snapshots;
  if (!snapshots?.length) {
    article.innerHTML = '<p class="eyebrow">Reference</p><h2>Statistics</h2><p class="muted">Historical statistics have not yet been supplied.</p>';
    return article;
  }
  article.innerHTML = '<p class="eyebrow">Then and now</p><h2>Operating scale</h2><p class="muted">Two dated snapshots; approximate and greater-than figures retain the precision reported by the company.</p>';
  if (railroad.statistics.intro) article.querySelector("p.muted").textContent = railroad.statistics.intro;
  const grid = document.createElement("div"); grid.className = "railroad-snapshot-grid";
  const labels = Object.fromEntries(statisticEntriesFor(railroad));
  for (const [column, snapshot] of snapshots.entries()) {
    const heading = document.createElement("div"); heading.className = "railroad-snapshot-heading";
    heading.style.gridColumn = column + 1;
    const year = document.createElement("strong"); year.textContent = snapshot.year;
    const label = document.createElement("span"); label.textContent = snapshot.label;
    const date = document.createElement("small"); date.textContent = snapshot.date;
    heading.append(year, label, date); grid.append(heading);
    for (const [row, [key, fallbackLabel]] of Object.entries(labels).entries()) {
      const metric = snapshot.metrics?.[key];
      const item = document.createElement("div"); item.className = `railroad-metric${["employees", "routeMiles", "locomotives", "freightCars"].includes(key) ? " railroad-metric-primary" : ""}${["marketCapitalization", "bookEquity", "capitalization"].includes(key) ? " railroad-metric-financial" : ""}`;
      item.style.gridColumn = column + 1;
      item.style.gridRow = row + 2;
      const term = document.createElement("span"); term.className = "railroad-metric-label"; term.textContent = metric?.label || fallbackLabel;
      const value = document.createElement("strong"); value.className = "railroad-metric-value"; value.textContent = metric?.value || "—";
      item.append(term, value);
      if (key === "locomotives" && snapshot.metrics.steam && snapshot.metrics.diesel) {
        item.classList.add("railroad-metric-propulsion");
        const bar = document.createElement("div"); bar.className = `railroad-propulsion-bar${snapshot.metrics.steam.value === "0" ? " railroad-propulsion-diesel" : ""}`;
        bar.setAttribute("aria-hidden", "true");
        const steam = document.createElement("span"); steam.className = "railroad-propulsion-steam";
        const diesel = document.createElement("span"); diesel.className = "railroad-propulsion-diesel-segment";
        bar.append(steam, diesel);
        const detail = document.createElement("small"); detail.className = "railroad-propulsion-detail";
        detail.textContent = `Steam ${snapshot.metrics.steam.value} · Diesel-electric ${snapshot.metrics.diesel.value} · ${snapshot.metrics.dieselShare.value} diesel`;
        item.append(bar, detail);
      }
      if (metric?.note) { const note = document.createElement("small"); note.textContent = metric.note; item.append(note); }
      grid.append(item);
    }
  }
  article.append(grid);
  for (const snapshot of snapshots) {
    if (!snapshot.context) continue;
    const context = document.createElement("p"); context.className = "muted railroad-statistics-note";
    context.textContent = snapshot.context; article.append(context);
  }
  for (const noteText of railroad.statistics.notes || []) {
    const note = document.createElement("p"); note.className = "muted railroad-statistics-note"; note.textContent = noteText; article.append(note);
  }
  const cited = (railroad.sourceIds || []).map((id) => sources.find((source) => source.id === id)).filter(Boolean);
  if (cited.length) {
    const heading = document.createElement("h3"); heading.textContent = "Sources";
    const list = document.createElement("ul"); list.className = "source-list";
    for (const source of cited) {
      const item = document.createElement("li");
      const reference = sourceReferenceFor(source);
      if (reference.url) {
        const link = document.createElement("a");
        link.href = reference.url; link.target = "_blank"; link.rel = "noopener noreferrer";
        link.textContent = reference.label; item.append(link);
      } else {
        item.textContent = reference.label;
      }
      list.append(item);
    }
    article.append(heading, list);
  }
  return article;
}

export function renderRailroadPage(main, railroad, railroads, onOpenRailroad, sources = []) {
  const section = document.createElement("section"); section.className = "railroad-detail-prototype";
  const marks = railroad.reportingMarks?.join(" · ") || "Reporting marks unknown";
  section.innerHTML = `<div class="railroad-hero entity-page-heading"><p class="eyebrow">${railroad.type.replaceAll("-", " ")}</p><h1>${railroad.name}</h1><p class="railroad-meta">${marks} <b>·</b> ${railroadYears(railroad)}${railroad.status ? ` <b>·</b> ${railroad.status}` : ""}${railroad.headquarters ? ` <b>·</b> ${railroad.headquarters}` : ""}</p></div>`;
  const hero = section.querySelector(".railroad-hero");
  for (const paragraph of railroadNarrativeParagraphs(railroad)) {
    const lede = document.createElement("p"); lede.className = "railroad-lede"; lede.textContent = paragraph;
    hero.append(lede);
  }
  const relationships = document.createElement("div"); relationships.className = "railroad-detail-grid";
  const relationshipArticle = document.createElement("article");
  relationshipArticle.innerHTML = '<p class="eyebrow">Lineage</p><h2>Relationships</h2><dl><dt class="railroad-predecessor-label">Predecessors</dt><dd class="railroad-predecessors"></dd><dt>Successor</dt><dd class="railroad-successor"></dd></dl>';
  const resolved = railroadRelationships(railroad, railroads);
  relationshipArticle.querySelector(".railroad-predecessor-label").textContent = resolved.predecessorLabel;
  appendRelationshipValue(relationshipArticle.querySelector(".railroad-predecessors"), resolved.predecessors, "None in this curated set", onOpenRailroad);
  appendRelationshipValue(relationshipArticle.querySelector(".railroad-successor"), resolved.successor ? [resolved.successor] : [], "Final company", onOpenRailroad);
  const statistics = renderStatistics(railroad, sources);
  relationships.append(relationshipArticle, statistics);
  const schemes = document.createElement("article"); schemes.className = "railroad-schemes";
  schemes.innerHTML = `<p class="eyebrow">Visual identity</p><h2>${railroad.preDiesel ? "Pre-diesel railroad" : "Paint schemes"}</h2>`;
  if (railroad.id === "santa-fe") {
    schemes.classList.add("atsf-paint-schemes");
    schemes.innerHTML = '<p class="eyebrow">Visual identity</p><h2>Paint schemes</h2><p>Santa Fe\'s diesel identity evolved from 1935 to 1995 through passenger, freight, switching, experimental, commemorative, and merger-era paint schemes. Variants are shown separately where documented rather than collapsed into a single representative scheme.</p>';
    const list = document.createElement("div"); list.className = "atsf-paint-list";
    const sorted = [...railroad.paintSchemes].sort((a, b) => (a.startYear ?? Infinity) - (b.startYear ?? Infinity));
    let undatedHeadingAdded = false;
    for (const scheme of sorted) {
      if (scheme.startYear == null && !undatedHeadingAdded) {
        const heading = document.createElement("p"); heading.className = "atsf-undated-heading";
        heading.textContent = "Documented variants without a supplied start year";
        list.append(heading); undatedHeadingAdded = true;
      }
      const card = document.createElement("section"); card.className = "railroad-paint-history";
      let image;
      if (scheme.images?.length) {
        image = document.createElement("div"); image.className = "atsf-paint-media";
        if (scheme.images.length > 1) { image.classList.add("atsf-paint-media-multi"); card.classList.add("atsf-paint-history-multi"); }
        for (const asset of scheme.images) {
          const figure = document.createElement("figure"); figure.className = "railroad-paint-photo atsf-paint-figure";
          const frame = document.createElement("div"); frame.className = "atsf-paint-frame";
          const photo = document.createElement("img"); photo.src = asset.src; photo.alt = asset.caption; photo.loading = "lazy";
          if (asset.type === "historical" && asset.sourceUrl) {
            const link = document.createElement("a"); link.href = asset.sourceUrl; link.target = "_blank"; link.rel = "noopener noreferrer";
            link.append(photo); frame.append(link);
            const fallback = document.createElement("a"); fallback.href = asset.sourceUrl;
            fallback.target = "_blank"; fallback.rel = "noopener noreferrer";
            fallback.textContent = "View original photograph →"; fallback.hidden = true;
            photo.addEventListener("error", useArchiveOnError(photo, () => { link.hidden = true; fallback.hidden = false; }));
            frame.append(fallback);
          } else frame.append(photo);
          const caption = document.createElement("figcaption");
          const kind = document.createElement("span"); kind.className = "image-kind";
          kind.textContent = asset.type === "historical" ? "Historical photograph" : "Historical color reconstruction";
          const title = document.createElement("strong"); title.textContent = asset.caption;
          const description = document.createElement("span"); description.textContent = asset.description;
          const credit = document.createElement("small");
          if (asset.sourceUrl) {
            const creditLink = document.createElement("a"); creditLink.href = asset.sourceUrl;
            creditLink.target = "_blank"; creditLink.rel = "noopener noreferrer";
            creditLink.textContent = asset.credit; credit.append(creditLink);
          } else credit.textContent = asset.credit;
          caption.append(kind, title, description, credit);
          if (asset.note) {
            const note = document.createElement("small"); note.textContent = asset.note; caption.append(note);
          }
          if (asset.originalSourceUrl) {
            const original = document.createElement("small"); original.className = "atsf-original-source";
            const context = document.createElement("span"); context.textContent = "Original historical photograph";
            const attribution = document.createElement("span"); attribution.textContent = asset.originalSourceCredit;
            const originalLink = document.createElement("a"); originalLink.href = asset.originalSourceUrl;
            originalLink.target = "_blank"; originalLink.rel = "noopener noreferrer";
            originalLink.textContent = asset.originalSourceLabel || "View original";
            original.append(context, attribution, originalLink); caption.append(original);
          }
          if (asset.sourceUrl) {
            const source = document.createElement("a"); source.className = "image-source-link";
            source.href = asset.sourceUrl; source.target = "_blank"; source.rel = "noopener noreferrer";
            source.textContent = asset.sourceLabel || "View source"; caption.append(source);
          }
          figure.append(frame, caption); image.append(figure);
        }
      } else {
        image = document.createElement("figure"); image.className = "railroad-paint-photo atsf-paint-image";
        const pending = document.createElement("span"); pending.textContent = "Image pending"; image.append(pending);
      }
      const body = document.createElement("div"); body.className = "railroad-paint-body";
      const period = document.createElement("p"); period.className = "eyebrow"; period.textContent = `${scheme.periodLabel} · ${scheme.category}`;
      const name = document.createElement("h3"); name.textContent = scheme.name;
      const code = document.createElement("p"); code.className = "atsf-paint-code";
      if (scheme.paintCode) code.textContent = `ATSF paint code · ${scheme.paintCode}`;
      const prototype = document.createElement("p"); prototype.className = "atsf-paint-prototype";
      prototype.textContent = scheme.prototypeLabel
        ? `${scheme.prototypeLabel} · ${scheme.representativeLocomotive}`
        : scheme.representativeLocomotive || "Prototype reference not supplied";
      const description = document.createElement("p"); description.textContent = scheme.description;
      body.append(period, name);
      if (scheme.paintCode) body.append(code);
      body.append(prototype, description);
      card.append(image, body); list.append(card);
    }
    schemes.append(list);
  } else if (railroad.preDiesel) {
    const note = document.createElement("p"); note.className = "muted";
    note.textContent = "No diesel-livery gallery is planned unless later research supplies relevant motor equipment.";
    schemes.append(note);
  } else if (railroad.paintSchemes?.some((scheme) => typeof scheme === "object")) {
    for (const scheme of railroad.paintSchemes) {
      if (typeof scheme !== "object") continue;
      const block = document.createElement("section"); block.className = "railroad-paint-history";
      const figure = document.createElement("figure"); figure.className = "railroad-paint-photo";
      if ((scheme.photo?.localPath || scheme.photo?.remoteImageUrl) && scheme.photo?.sourcePage) {
        const link = document.createElement("a"); link.href = scheme.photo.sourcePage;
        link.target = "_blank"; link.rel = "noopener noreferrer";
        const image = document.createElement("img"); image.src = scheme.photo.localPath || scheme.photo.remoteImageUrl;
        image.alt = scheme.photo.alt || scheme.photo.caption; image.loading = "lazy";
        link.append(image); figure.append(link);
        const fallback = document.createElement("a"); fallback.className = "railroad-paint-fallback";
        fallback.href = scheme.photo.sourcePage; fallback.target = "_blank";
        fallback.rel = "noopener noreferrer"; fallback.textContent = "View original photograph →";
        fallback.hidden = true;
        image.addEventListener("error", scheme.photo.localPath
          ? () => { link.hidden = true; fallback.hidden = false; }
          : useArchiveOnError(image, () => { link.hidden = true; fallback.hidden = false; }));
        figure.append(fallback);
        const caption = document.createElement("figcaption");
        const kind = document.createElement("span"); kind.className = "image-kind";
        kind.textContent = scheme.photo.kind || "Historical photograph";
        const captionText = document.createElement("span"); captionText.textContent = scheme.photo.caption;
        const credit = document.createElement("small");
        const photoDate = /^\d{4}-\d{2}-\d{2}$/.test(scheme.photo.date ?? "")
          ? new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
            .format(new Date(`${scheme.photo.date}T00:00:00Z`))
          : null;
        credit.textContent = [scheme.photo.credit, photoDate].filter(Boolean).join(" · ");
        const source = document.createElement("a"); source.className = "image-source-link";
        source.href = scheme.photo.sourcePage; source.target = "_blank";
        source.rel = "noopener noreferrer"; source.textContent = "View original";
        caption.append(kind, captionText, credit, source);
        figure.append(caption);
      }
      const body = document.createElement("div"); body.className = "railroad-paint-body";
      const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow";
      eyebrow.textContent = paintSchemeEyebrow(scheme);
      const title = document.createElement("h3"); title.textContent = scheme.name;
      const identity = document.createElement("p"); identity.className = "railroad-paint-identity";
      identity.textContent = scheme.paintIdentity;
      const locomotive = document.createElement("p"); locomotive.className = "railroad-paint-locomotive";
      locomotive.textContent = scheme.representativeLocomotive;
      const description = document.createElement("p"); description.textContent = scheme.description;
      body.append(eyebrow, title);
      if (scheme.paintIdentity) body.append(identity);
      body.append(locomotive, description);
      block.append(figure, body); schemes.append(block);
    }
  } else if (railroad.paintSchemes?.length) {
    const list = document.createElement("ul");
    for (const name of railroad.paintSchemes) {
      const item = document.createElement("li"); item.textContent = name; list.append(item);
    }
    schemes.append(list);
  } else {
    const note = document.createElement("p"); note.className = "muted";
    note.textContent = "Paint-scheme artwork will be supplied separately.";
    schemes.append(note);
  }
  relationships.append(schemes);
  section.append(relationships); main.append(section);
}

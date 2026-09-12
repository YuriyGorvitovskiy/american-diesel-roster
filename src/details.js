import { formatPrototypeName } from "./model.js";

export function displayValue(value) {
  return value == null || value === "" ? "Unknown" : String(value);
}

export function buildDetailFields(prototype) {
  return [
    ["Role", prototype.role],
    ["Years", prototype.years],
    ["Horsepower", prototype.horsepower],
    ["Axles", prototype.axleConfiguration],
    ["Traction", prototype.tractionType],
    ["Prime mover", prototype.primeMover],
    ["Engine", prototype.engineConfiguration],
    ["Production", prototype.productionCount],
  ].filter(([, value]) => value != null).map(([label, value]) => ({ label, value: displayValue(value) }));
}

function formatMonth(value) {
  if (!/^\d{4}-\d{2}$/.test(value ?? "")) return value;
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1)));
}

export function buildTimelineItems(events = []) {
  return events.flatMap(({ date, event }) => {
    if (!/^\d{4}-\d{2}$/.test(date ?? "") || !event) return [];
    const [year, month] = date.split("-").map(Number);
    const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" })
      .format(new Date(Date.UTC(year, month - 1)));
    return [{ date, label: `${year}, ${monthName}`, event }];
  });
}

function fields(entries) {
  return entries.filter(([, value]) => value != null && value !== "").map(([label, value]) => ({ label, value: String(value) }));
}

export function buildHistoricalFields(locomotive) {
  const laterIdentity = (locomotive.laterIdentities ?? [])
    .map(({ railroadName, roadNumber }) => [railroadName, roadNumber].filter(Boolean).join(" "))
    .filter(Boolean).join(", ");
  return fields([
    ["Railroad", locomotive.railroadName], ["Road number", locomotive.roadNumber],
    ["Built", formatMonth(locomotive.builtDate)], ["Serial number", locomotive.serialNumber],
    ["EMD order", locomotive.orderNumber], ["Frame number", locomotive.frameNumber],
    ["Built as", locomotive.builtAs], ["Later identity", laterIdentity],
    ["Retired", formatMonth(locomotive.retiredDate)],
  ]);
}

export function buildCollectionFields(item) {
  return fields([
    ["Manufacturer", item.manufacturer], ["Product number", item.manufacturerProductNumber],
    ["Scale", item.scale], ["Railroad", item.railroadName], ["Road number", item.roadNumber],
    ["Livery", item.livery], ["Walthers part number", item.walthersPartNumber],
    ["Sound / control", item.soundControl],
  ]);
}

export function createNarrativeSections(prototype) {
  return (prototype.narrative ?? []).filter(Boolean);
}

export function buildImageItems(images = []) {
  return images.flatMap(({ path, kind, caption, credit = null }) => {
    return path && caption ? [{ src: path, kind, caption, credit }] : [];
  });
}

function relationshipGroup(label, records, onSelect) {
  const group = document.createElement("div");
  group.className = "relationship-group";
  const heading = document.createElement("h3");
  heading.textContent = label;
  group.append(heading);
  if (!records.length) {
    const empty = document.createElement("span");
    empty.className = "muted";
    empty.textContent = "None recorded";
    group.append(empty);
  }
  for (const prototype of records) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "text-button";
    button.textContent = formatPrototypeName(prototype);
    button.addEventListener("click", () => onSelect(prototype.id));
    group.append(button);
  }
  return group;
}

function renderFacts(container, factList) {
  if (!factList.length) return;
  const list = document.createElement("dl");
  list.className = "fact-grid";
  for (const { label, value } of factList) {
    const row = document.createElement("div"); row.className = "fact-row";
    const term = document.createElement("dt"); term.textContent = label;
    const description = document.createElement("dd"); description.textContent = value;
    row.append(term, description); list.append(row);
  }
  container.append(list);
}

function renderImageGallery(container, images) {
  const items = buildImageItems(images);
  if (!items.length) return;
  const gallery = document.createElement("div"); gallery.className = "detail-gallery";
  for (const { src, kind, caption, credit } of items) {
    const figure = document.createElement("figure"); figure.className = "detail-image";
    const image = document.createElement("img");
    image.src = src; image.alt = caption; image.loading = "lazy";
    const figcaption = document.createElement("figcaption");
    const label = document.createElement("span"); label.className = "image-kind";
    label.textContent = kind === "model" ? "Collection model" : "Historical prototype";
    const text = document.createElement("span"); text.textContent = caption;
    figcaption.append(label, text);
    if (credit) {
      const creditText = document.createElement("small"); creditText.textContent = credit; figcaption.append(creditText);
    }
    figure.append(image, figcaption); gallery.append(figure);
  }
  container.append(gallery);
}

function renderNarrative(container, paragraphs) {
  for (const paragraph of paragraphs ?? []) {
    const element = document.createElement("p"); element.textContent = paragraph; container.append(element);
  }
}

function renderTimeline(container, events) {
  const timelineItems = buildTimelineItems(events);
  if (!timelineItems.length) return false;
  const list = document.createElement("ol"); list.className = "historical-timeline";
  for (const { date, label, event } of timelineItems) {
    const item = document.createElement("li");
    const time = document.createElement("time"); time.dateTime = date; time.textContent = label;
    const description = document.createElement("span"); description.textContent = event;
    item.append(time, description); list.append(item);
  }
  container.append(list);
  return true;
}

function detailSection(titleText) {
  const section = document.createElement("section"); section.className = "entity-section";
  const title = document.createElement("h3"); title.textContent = titleText; section.append(title);
  return section;
}

export function renderDetails(container, { prototype, status, related, historicalLocomotives = [], collectionItems = [], sources = [], onSelect }) {
  container.replaceChildren();
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = `${prototype.builder} prototype`;
  const title = document.createElement("h2");
  title.textContent = formatPrototypeName(prototype);
  const badge = document.createElement("span");
  badge.className = `status-badge status-${status}`;
  badge.textContent = status.replace("_", " ");
  container.append(eyebrow, title, badge);

  renderImageGallery(container, [
    ...historicalLocomotives.flatMap(({ images = [] }) => images),
    ...collectionItems.flatMap(({ images = [] }) => images),
  ]);

  const fields = buildDetailFields(prototype);
  if (fields.length) {
    renderFacts(container, fields);
  } else {
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = "Technical facts await verified research.";
    container.append(note);
  }
  renderNarrative(container, createNarrativeSections(prototype));

  for (const locomotive of historicalLocomotives) {
    const section = detailSection("Historical locomotive");
    renderFacts(section, buildHistoricalFields(locomotive));
    if (!renderTimeline(section, locomotive.timeline)) renderNarrative(section, locomotive.narrative);
    container.append(section);
  }
  for (const item of collectionItems) {
    const section = detailSection("Collection model");
    const owned = document.createElement("span");
    owned.className = "status-badge status-owned"; owned.textContent = "owned";
    section.append(owned);
    renderFacts(section, buildCollectionFields(item));
    container.append(section);
  }
  if (sources.length) {
    const section = detailSection("Sources");
    const list = document.createElement("ul"); list.className = "source-list";
    for (const source of sources) {
      const item = document.createElement("li"); const link = document.createElement("a");
      link.href = source.url; link.target = "_blank"; link.rel = "noreferrer";
      link.textContent = `${source.title} — ${source.publisher}`; item.append(link); list.append(item);
    }
    section.append(list); container.append(section);
  }
  const relationships = document.createElement("div");
  relationships.className = "relationships";
  relationships.append(
    relationshipGroup("Predecessors", related.predecessors, onSelect),
    relationshipGroup("Successors", related.successors, onSelect),
  );
  container.append(relationships);
}

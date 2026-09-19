import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const FILES = {
  prototypes: "data/locomotives.json",
  items: "data/collection.json",
  orders: "data/orders.json",
  historicalLocomotives: "data/historical-locomotives.json",
  sources: "data/sources.json",
};

export async function loadDataFiles(rootPath) {
  const root = rootPath instanceof URL ? rootPath : new URL(`file://${rootPath}/`);
  const entries = await Promise.all(Object.entries(FILES).map(async ([key, path]) => {
    const document = JSON.parse(await readFile(new URL(path, root), "utf8"));
    return [key, document[key]];
  }));
  const data = Object.fromEntries(entries);
  const railroadIndex = JSON.parse(await readFile(new URL("data/railroads/index.json", root), "utf8"));
  const railroads = await Promise.all(railroadIndex.railroads.map(async (fileId) => (
    JSON.parse(await readFile(new URL(`data/railroads/${fileId}.json`, root), "utf8"))
  )));
  return { ...data, railroads };
}

export function validateData({ prototypes = [], items = [], orders = [], railroads = [], historicalLocomotives = [], sources = [] }) {
  const errors = [];
  const checkDuplicates = (records, label) => {
    const seen = new Set();
    for (const { id } of records) {
      if (seen.has(id)) errors.push(`Duplicate ${label} id "${id}".`);
      seen.add(id);
    }
  };
  checkDuplicates(prototypes, "prototype");
  checkDuplicates(items, "collection item");
  checkDuplicates(orders, "order");
  checkDuplicates(railroads, "railroad");
  checkDuplicates(historicalLocomotives, "historical locomotive");
  checkDuplicates(sources, "source");

  const prototypeIds = new Set(prototypes.map(({ id }) => id));
  const railroadIds = new Set(railroads.map(({ id }) => id));
  const historicalLocomotiveIds = new Set(historicalLocomotives.map(({ id }) => id));
  const historicalLocomotivesById = new Map(historicalLocomotives.map((record) => [record.id, record]));
  const sourceIds = new Set(sources.map(({ id }) => id));
  const checkReference = (record, kind, field, ids, target) => {
    if (record[field] != null && !ids.has(record[field])) {
      errors.push(`${kind} "${record.id}" references unknown ${target} "${record[field]}".`);
    }
  };
  const checkSources = (record, kind) => {
    for (const id of record.sourceIds ?? []) {
      if (!sourceIds.has(id)) errors.push(`${kind} "${record.id}" references unknown source "${id}".`);
    }
    for (const image of record.images ?? []) {
      if (!["collection-model", "manufacturer-product", "historical-prototype"].includes(image.type)) {
        errors.push(`${kind} "${record.id}" has invalid image type "${image.type}".`);
      }
      if (!["local-owner", "remote"].includes(image.storage)) {
        errors.push(`${kind} "${record.id}" has invalid image storage "${image.storage}".`);
      }
      if (!image.caption?.trim()) errors.push(`${kind} "${record.id}" image requires an image caption.`);
      if (!image.credit?.trim()) errors.push(`${kind} "${record.id}" image requires an image credit.`);
      if (image.storage === "local-owner") {
        if (!image.localPath?.trim()) errors.push(`${kind} "${record.id}" local-owner image requires a localPath.`);
        if (image.remoteImageUrl != null) errors.push(`${kind} "${record.id}" local-owner image cannot use a remoteImageUrl.`);
        if (image.sourcePage != null) errors.push(`${kind} "${record.id}" local-owner image cannot use a sourcePage.`);
      }
      if (image.storage === "remote") {
        if (image.localPath != null) errors.push(`${kind} "${record.id}" remote image cannot use a localPath.`);
        if (!image.sourcePage?.trim()) errors.push(`${kind} "${record.id}" remote image requires a sourcePage.`);
        if (!image.remoteImageUrl?.trim()) errors.push(`${kind} "${record.id}" remote image requires a remoteImageUrl.`);
        if (image.type === "historical-prototype" && !/^\d{4}-\d{2}-\d{2}$/.test(image.date ?? "")) errors.push(`${kind} "${record.id}" has invalid image date "${image.date}".`);
      }
      for (const id of image.sourceIds ?? []) {
        if (!sourceIds.has(id)) errors.push(`${kind} "${record.id}" image references unknown source "${id}".`);
      }
    }
  };
  const checkServiceSpans = (record, kind, spans) => {
    for (const span of spans ?? []) {
      if (span.railroadId && !railroadIds.has(span.railroadId)) {
        errors.push(`${kind} "${record.id}" timeline references unknown railroad "${span.railroadId}".`);
      }
      if (!Number.isInteger(span.start) || (span.end !== null && !Number.isInteger(span.end))) {
        errors.push(`${kind} "${record.id}" timeline requires an integer start year and an integer or null end year.`);
      } else if (span.end !== null && span.start > span.end) {
        errors.push(`${kind} "${record.id}" timeline has reversed span ${span.start}–${span.end}.`);
      }
      for (const id of span.sourceIds ?? []) {
        if (!sourceIds.has(id)) errors.push(`${kind} "${record.id}" timeline references unknown source "${id}".`);
      }
    }
  };
  for (const prototype of prototypes) {
    if (!["wanted", "historical_only"].includes(prototype.collectionRelevance)) {
      errors.push(`Prototype "${prototype.id}" has invalid collection intent "${prototype.collectionRelevance}".`);
    }
    for (const id of [...(prototype.predecessors ?? []), ...(prototype.successors ?? [])]) {
      if (!prototypeIds.has(id)) errors.push(`Prototype "${prototype.id}" references unknown prototype "${id}".`);
    }
    for (const id of prototype.operatorIds ?? []) {
      if (!railroadIds.has(id)) errors.push(`Prototype "${prototype.id}" references unknown railroad "${id}".`);
    }
    if (prototype.timeline?.manufacturing) checkServiceSpans(prototype, "Prototype", [prototype.timeline.manufacturing]);
    checkServiceSpans(prototype, "Prototype", prototype.timeline?.lineageService);
    checkSources(prototype, "Prototype");
  }
  for (const item of items) {
    checkReference(item, "Collection item", "prototypeId", prototypeIds, "prototype");
    checkReference(item, "Collection item", "railroadId", railroadIds, "railroad");
    checkReference(item, "Collection item", "historicalLocomotiveId", historicalLocomotiveIds, "historical locomotive");
    checkSources(item, "Collection item");
  }
  for (const locomotive of historicalLocomotives) {
    checkReference(locomotive, "Historical locomotive", "prototypeId", prototypeIds, "prototype");
    checkReference(locomotive, "Historical locomotive", "railroadId", railroadIds, "railroad");
    for (const identity of locomotive.laterIdentities ?? []) {
      if (!railroadIds.has(identity.railroadId)) errors.push(`Historical locomotive "${locomotive.id}" references unknown railroad "${identity.railroadId}".`);
    }
    checkServiceSpans(locomotive, "Historical locomotive", locomotive.serviceTimeline);
    let previousDate = "";
    for (const event of locomotive.timeline ?? []) {
      const match = /^(\d{4})-(\d{2})$/.exec(event.date ?? "");
      const validDate = match && Number(match[2]) >= 1 && Number(match[2]) <= 12;
      if (!validDate) errors.push(`Historical locomotive "${locomotive.id}" has invalid timeline date "${event.date}".`);
      if (!event.event?.trim()) errors.push(`Historical locomotive "${locomotive.id}" has an empty timeline event.`);
      if (validDate && previousDate && event.date < previousDate) errors.push(`Historical locomotive "${locomotive.id}" timeline is not chronological.`);
      if (validDate) previousDate = event.date;
    }
    checkSources(locomotive, "Historical locomotive");
  }
  for (const order of orders) {
    checkReference(order, "Order", "prototypeId", prototypeIds, "prototype");
    checkReference(order, "Order", "railroadId", railroadIds, "railroad");
    checkReference(order, "Order", "historicalLocomotiveId", historicalLocomotiveIds, "historical locomotive");
    const historicalLocomotive = historicalLocomotivesById.get(order.historicalLocomotiveId);
    if (historicalLocomotive && (
      historicalLocomotive.prototypeId !== order.prototypeId
      || historicalLocomotive.railroadId !== order.railroadId
      || historicalLocomotive.roadNumber !== order.roadNumber
    )) errors.push(`Order "${order.id}" does not match historical locomotive "${order.historicalLocomotiveId}".`);
    checkSources(order, "Order");
  }
  for (const railroad of railroads) {
    checkSources(railroad, "Railroad");
    const successorIds = railroad.successor == null ? (railroad.successors ?? []) : [railroad.successor];
    for (const id of [...(railroad.predecessors ?? []), ...successorIds]) {
      if (!railroadIds.has(id)) errors.push(`Railroad "${railroad.id}" references unknown railroad "${id}".`);
    }
    if (railroad.parentSystem != null && !railroadIds.has(railroad.parentSystem)) {
      errors.push(`Railroad "${railroad.id}" references unknown parent system "${railroad.parentSystem}".`);
    }
    for (const snapshot of railroad.statistics?.snapshots ?? []) {
      for (const id of snapshot.sourceIds ?? []) {
        if (!sourceIds.has(id)) errors.push(`Railroad "${railroad.id}" snapshot ${snapshot.year} references unknown source "${id}".`);
      }
    }
    const schemes = (railroad.paintSchemes ?? []).filter((scheme) => scheme && typeof scheme === "object");
    const schemeIds = new Set();
    let previousYear = -Infinity;
    for (const scheme of schemes) {
      if (!scheme.id?.trim()) errors.push(`Railroad "${railroad.id}" paint scheme requires an id.`);
      else if (schemeIds.has(scheme.id)) errors.push(`Duplicate ${railroad.id.toUpperCase()} paint scheme id "${scheme.id}".`);
      schemeIds.add(scheme.id);
      checkSources(scheme, "Railroad paint scheme");
      if (scheme.startYear != null) {
        if (!Number.isInteger(scheme.startYear)) errors.push(`Railroad paint scheme "${scheme.id}" has invalid startYear.`);
        else if (scheme.startYear < previousYear) errors.push(`Railroad "${railroad.id}" paint schemes are not chronological at "${scheme.id}".`);
        else previousYear = scheme.startYear;
      } else if (!scheme.periodLabel?.trim()) {
        errors.push(`Railroad paint scheme "${scheme.id}" requires a periodLabel when startYear is unknown.`);
      }
      for (const field of ["sourcePage", "remoteImageUrl", "caption", "credit"]) {
        if (!scheme.photo?.[field]?.trim()) errors.push(`Railroad paint scheme "${scheme.id}" photo requires ${field}.`);
      }
      if (scheme.photo?.date != null && !/^\d{4}-\d{2}-\d{2}$/.test(scheme.photo.date)) {
        errors.push(`Railroad paint scheme "${scheme.id}" has invalid photo date "${scheme.photo.date}".`);
      }
    }
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const errors = validateData(data);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Data validation passed: ${data.prototypes.length} prototypes, ${data.items.length} collection items, ${data.orders.length} orders, ${data.railroads.length} railroads, ${data.historicalLocomotives.length} historical locomotive, ${data.sources.length} sources.`);
  }
}

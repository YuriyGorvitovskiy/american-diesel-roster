import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const FILES = {
  prototypes: "data/locomotives.json",
  items: "data/collection.json",
  orders: "data/orders.json",
  railroads: "data/railroads.json",
  historicalLocomotives: "data/historical-locomotives.json",
  sources: "data/sources.json",
};

export async function loadDataFiles(rootPath) {
  const root = rootPath instanceof URL ? rootPath : new URL(`file://${rootPath}/`);
  const entries = await Promise.all(Object.entries(FILES).map(async ([key, path]) => {
    const document = JSON.parse(await readFile(new URL(path, root), "utf8"));
    return [key, document[key]];
  }));
  return Object.fromEntries(entries);
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
      for (const id of image.sourceIds ?? []) {
        if (!sourceIds.has(id)) errors.push(`${kind} "${record.id}" image references unknown source "${id}".`);
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
    checkSources(locomotive, "Historical locomotive");
  }
  for (const order of orders) {
    checkReference(order, "Order", "prototypeId", prototypeIds, "prototype");
    checkReference(order, "Order", "railroadId", railroadIds, "railroad");
  }
  for (const railroad of railroads) {
    for (const id of [...(railroad.predecessors ?? []), ...(railroad.successors ?? [])]) {
      if (!railroadIds.has(id)) errors.push(`Railroad "${railroad.id}" references unknown railroad "${id}".`);
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

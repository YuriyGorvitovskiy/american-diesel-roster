import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const FILES = {
  prototypes: "data/locomotives.json",
  items: "data/collection.json",
  orders: "data/orders.json",
  railroads: "data/railroads.json",
};

export async function loadDataFiles(rootPath) {
  const root = rootPath instanceof URL ? rootPath : new URL(`file://${rootPath}/`);
  const entries = await Promise.all(Object.entries(FILES).map(async ([key, path]) => {
    const document = JSON.parse(await readFile(new URL(path, root), "utf8"));
    return [key, document[key]];
  }));
  return Object.fromEntries(entries);
}

export function validateData({ prototypes = [], items = [], orders = [], railroads = [] }) {
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

  const prototypeIds = new Set(prototypes.map(({ id }) => id));
  const railroadIds = new Set(railroads.map(({ id }) => id));
  const checkReference = (record, kind, field, ids, target) => {
    if (record[field] != null && !ids.has(record[field])) {
      errors.push(`${kind} "${record.id}" references unknown ${target} "${record[field]}".`);
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
  }
  for (const item of items) {
    checkReference(item, "Collection item", "prototypeId", prototypeIds, "prototype");
    checkReference(item, "Collection item", "railroadId", railroadIds, "railroad");
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
    console.log(`Data validation passed: ${data.prototypes.length} prototypes, ${data.items.length} collection item, ${data.orders.length} orders, ${data.railroads.length} railroads.`);
  }
}

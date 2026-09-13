const paths = {
  prototypes: "./data/locomotives.json",
  items: "./data/collection.json",
  orders: "./data/orders.json",
  railroads: "./data/railroads.json",
  historicalLocomotives: "./data/historical-locomotives.json",
  sources: "./data/sources.json",
};

export async function loadData() {
  const entries = await Promise.all(Object.entries(paths).map(async ([key, path]) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    const document = await response.json();
    return [key, document[key]];
  }));
  return Object.fromEntries(entries);
}

export function findDanglingReferences(data) {
  const errors = [];
  const prototypeIds = new Set(data.prototypes.map(({ id }) => id));
  for (const prototype of data.prototypes) {
    for (const id of [...prototype.predecessors, ...prototype.successors]) {
      if (!prototypeIds.has(id)) errors.push(`${prototype.id} references missing prototype ${id}`);
    }
  }
  return errors;
}

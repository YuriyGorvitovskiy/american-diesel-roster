const paths = {
  prototypes: "/data/locomotives.json?v=et44ach-3674-3",
  items: "/data/collection.json",
  orders: "/data/orders.json?v=et44ach-3674-2",
  railroadIndex: "/data/railroads/index.json?v=bnsf-prototype-13",
  historicalLocomotives: "/data/historical-locomotives.json?v=et44ach-3674-3",
  sources: "/data/sources.json?v=et44ach-3674-2",
};

export async function loadData() {
  const entries = await Promise.all(Object.entries(paths).map(async ([key, path]) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    const document = await response.json();
    return [key, key === "railroadIndex" ? document.railroads : document[key]];
  }));
  const data = Object.fromEntries(entries);
  const railroads = await Promise.all(data.railroadIndex.map(async (id) => {
    const response = await fetch(`/data/railroads/${id}.json?v=bnsf-prototype-13`);
    if (!response.ok) throw new Error(`/data/railroads/${id}.json: HTTP ${response.status}`);
    return response.json();
  }));
  delete data.railroadIndex;
  return { ...data, railroads };
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

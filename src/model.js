export function indexById(records) {
  return new Map(records.map((record) => [record.id, record]));
}

export function formatPrototypeName(prototype) {
  return [prototype.builder, prototype.model, prototype.variant].filter(Boolean).join(" ");
}

const builderNames = {
  EMC: "Electro-Motive Corporation",
  EMD: "Electro-Motive Division",
  ALCO: "American Locomotive Company",
  GE: "General Electric",
};

export function prototypePageHeading(prototype) {
  return {
    builderName: builderNames[prototype.builder] ?? prototype.builder,
    modelName: [prototype.model, prototype.variant].filter(Boolean).join(" "),
  };
}

export function derivePrototypeStatus(prototypeId, data) {
  if (data.items.some((item) => item.prototypeId === prototypeId)) return "owned";
  if (data.orders.some((order) => order.prototypeId === prototypeId && order.status === "ordered")) return "ordered";
  const intent = data.prototypes.find(({ id }) => id === prototypeId)?.collectionRelevance;
  return intent === "wanted" ? "wanted" : "historical_only";
}

export function buildRosterRows(data) {
  const prototypes = indexById(data.prototypes);
  const railroads = indexById(data.railroads);
  const toRow = (record, sourceType, status) => ({
    id: record.id,
    sourceType,
    status,
    prototypeId: record.prototypeId,
    prototypeName: formatPrototypeName(prototypes.get(record.prototypeId)),
    railroadName: railroads.get(record.railroadId)?.name ?? null,
    roadNumber: record.roadNumber ?? null,
    manufacturer: record.manufacturer ?? null,
    manufacturerUrl: record.manufacturerUrl ?? null,
    livery: record.livery ?? null,
    retailer: record.retailer ?? null,
    retailerUrl: record.retailerUrl ?? null,
    image: (record.images ?? []).find(({ type, storage, localPath }) => type === "collection-model" && storage === "local-owner" && localPath) ?? null,
  });
  return [
    ...data.items.map((item) => toRow(item, "collection", "owned")),
    ...data.orders.filter(({ status }) => status === "ordered").map((order) => toRow(order, "order", "ordered")),
  ].sort((a, b) => {
    const statusOrder = { owned: 0, ordered: 1 };
    return statusOrder[a.status] - statusOrder[b.status] || a.prototypeName.localeCompare(b.prototypeName);
  });
}

export function getRelatedPrototypes(prototype, prototypeById) {
  const resolve = (ids) => ids.map((id) => prototypeById.get(id)).filter(Boolean);
  return {
    predecessors: resolve(prototype.predecessors ?? []),
    successors: resolve(prototype.successors ?? []),
  };
}

export function buildPrototypeDetail(prototypeId, data) {
  const prototypeById = indexById(data.prototypes);
  const railroadById = indexById(data.railroads);
  const prototype = prototypeById.get(prototypeId);
  if (!prototype) return null;

  const historicalLocomotives = (data.historicalLocomotives ?? [])
    .filter((locomotive) => locomotive.prototypeId === prototypeId)
    .map((locomotive) => ({
      ...locomotive,
      railroadName: railroadById.get(locomotive.railroadId)?.name ?? null,
      laterIdentities: (locomotive.laterIdentities ?? []).map((identity) => ({
        ...identity,
        railroadName: railroadById.get(identity.railroadId)?.name ?? null,
      })),
    }));
  const collectionItems = data.items
    .filter((item) => item.prototypeId === prototypeId)
    .map((item) => ({ ...item, railroadName: railroadById.get(item.railroadId)?.name ?? null }));
  const citedIds = new Set([
    ...(prototype.sourceIds ?? []),
    ...historicalLocomotives.flatMap(({ sourceIds = [] }) => sourceIds),
    ...collectionItems.flatMap(({ sourceIds = [] }) => sourceIds),
  ]);

  return {
    prototype,
    status: derivePrototypeStatus(prototypeId, data),
    related: getRelatedPrototypes(prototype, prototypeById),
    historicalLocomotives,
    collectionItems,
    sources: (data.sources ?? []).filter(({ id }) => citedIds.has(id)),
  };
}

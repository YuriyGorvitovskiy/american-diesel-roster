export function indexById(records) {
  return new Map(records.map((record) => [record.id, record]));
}

export function formatPrototypeName(prototype) {
  return [prototype.builder, prototype.model, prototype.variant].filter(Boolean).join(" ");
}

export function derivePrototypeStatus(prototypeId, data) {
  if (data.items.some((item) => item.prototypeId === prototypeId)) return "owned";
  if (data.orders.some((order) => order.prototypeId === prototypeId && order.status === "ordered")) return "ordered";
  return data.prototypes.find(({ id }) => id === prototypeId)?.collectionRelevance ?? "historical_only";
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
    livery: record.livery ?? null,
    retailer: record.retailer ?? null,
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

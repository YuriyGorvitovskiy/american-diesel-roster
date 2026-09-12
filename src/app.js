import { buildPrototypeDetail, buildRosterRows, derivePrototypeStatus, indexById } from "./model.js";
import { renderDetails } from "./details.js";
import { renderRoster } from "./roster.js";
import { renderTree, updateTreeSelection } from "./tree.js";

const paths = {
  prototypes: "./data/locomotives.json",
  items: "./data/collection.json",
  orders: "./data/orders.json",
  railroads: "./data/railroads.json",
  historicalLocomotives: "./data/historical-locomotives.json",
  sources: "./data/sources.json",
};

async function loadData() {
  const entries = await Promise.all(Object.entries(paths).map(async ([key, path]) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    const document = await response.json();
    return [key, document[key]];
  }));
  return Object.fromEntries(entries);
}

function findDanglingReferences(data) {
  const errors = [];
  const prototypeIds = new Set(data.prototypes.map(({ id }) => id));
  for (const prototype of data.prototypes) {
    for (const id of [...prototype.predecessors, ...prototype.successors]) {
      if (!prototypeIds.has(id)) errors.push(`${prototype.id} references missing prototype ${id}`);
    }
  }
  return errors;
}

async function start() {
  const loading = document.querySelector("#loading");
  try {
    const data = await loadData();
    findDanglingReferences(data).forEach((error) => console.error(error));
    const prototypeById = indexById(data.prototypes);
    const tree = document.querySelector("#evolution-tree");
    const details = document.querySelector("#locomotive-details");
    let selectedId = prototypeById.has("emd-f3") ? "emd-f3" : data.prototypes[0]?.id;
    const statusFor = (id) => derivePrototypeStatus(id, data);
    const select = (id) => {
      const prototype = prototypeById.get(id);
      if (!prototype) return;
      selectedId = id;
      updateTreeSelection(tree, id);
      renderDetails(details, { ...buildPrototypeDetail(id, data), onSelect: select });
    };
    renderTree(tree, { prototypes: data.prototypes, selectedId, getStatus: statusFor, onSelect: select });
    renderRoster(document.querySelector("#collection-roster"), buildRosterRows(data));
    select(selectedId);
    loading.hidden = true;
  } catch (error) {
    console.error(error);
    loading.className = "load-error";
    loading.textContent = "Unable to load roster data. Start a local server from the repository root (for example: python3 -m http.server 8000) and reload this page.";
  }
}

start();

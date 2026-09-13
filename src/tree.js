const LANES = [
  ["switcher", "NW", "N = Nine hundred horsepower\nW = Welded frame"],
  ["freight-cab", "F", "Fourteen Hundred Horsepower"],
  ["passenger-cab", "E", "Eighteen Hundred Horsepower"],
  ["gp", "GP", "General Purpose"],
  ["sd", "SD", "Special Duty"],
];
const LEFT = 170;
const TOP = 70;
const X_GAP = 126;
const Y_GAP = 142;

const GE_ROWS = [
  ["universal-four-axle", "U · B-B", "Universal Series\nFour powered axles", 20, 0],
  ["universal-six-axle", "U · C-C", "Universal Series\nSix powered axles", 20, 1.5],
  ["dash-four-axle", "Dash · B-B", "Dash Series\nFour powered axles", 20, 3],
  ["dash-six-axle", "Dash · C-C", "Dash Series\nSix powered axles", 20, 4],
  ["evolution-dc", "Evo · DC · C-C", "Evolution Series\nSix powered axles", 20, 5],
  ["evolution-ac", "Evo · AC · C-C", "Evolution Series\nSix powered axles", 20, 6],
  ["evolution-c4", "Evo · AC · A1A-A1A", "Evolution C4 Series\nFour powered axles", 20, 7],
];

const GE_COLUMNS = {
  "universal-four-axle": ["U25B", "U28B", "U30B", "U33B", "U36B"],
  "universal-six-axle": ["U25C", "U28C", "U30C", "U33C", "U36C"],
  "dash-four-axle": ["B23-7", "B30-7", "B36-7", "B32-8", "B36-8", "B40-8", "B40-9"],
  "dash-six-axle": ["C30-7", "C36-7", "C32-8", "C39-8", "C40-8", "C44-8", "C40-9", "C44-9"],
  "evolution-dc": ["ES44DC"],
  "evolution-ac": ["ES44AC", "ET44AC"],
  "evolution-c4": ["ES44C4", "ET44C4"],
};

import { locomotiveUrl } from "./navigation.js";

export function formatProductionCount(value) {
  return value == null ? "—" : new Intl.NumberFormat("en-US").format(value);
}

export function treeNodeView(prototype, status) {
  const production = formatProductionCount(prototype.productionCount);
  const spokenProduction = prototype.productionCount == null ? "production unknown" : `${production} produced`;
  const spokenStatus = status === "historical_only" ? "historical context" : status;
  return {
    href: locomotiveUrl(prototype.id), model: prototype.model, production, status,
    accessibleLabel: `${prototype.model}, ${spokenProduction}, ${spokenStatus}`,
  };
}

function layoutEmdTree(prototypes) {
  const nodes = [];
  for (const [laneIndex, [branch]] of LANES.entries()) {
    prototypes.filter((prototype) => prototype.branch === branch).forEach((prototype, index) => {
      nodes.push({ ...prototype, x: LEFT + index * X_GAP, y: TOP + laneIndex * Y_GAP });
    });
  }
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edges = nodes.flatMap((source) => (source.successors ?? []).flatMap((targetId) => {
    const target = nodeById.get(targetId);
    return target && target.branch === source.branch
      ? [{ sourceId: source.id, targetId, x1: source.x + 43, y1: source.y + 27, x2: target.x + 43, y2: target.y + 27 }]
      : [];
  }));
  const longestLane = Math.max(1, ...LANES.map(([branch]) => nodes.filter((node) => node.branch === branch).length));
  return { nodes, edges, width: LEFT + longestLane * X_GAP + 40, height: TOP + LANES.length * Y_GAP - 50 };
}

function layoutGeTree(prototypes) {
  const positions = new Map();
  for (const [defaultRowIndex, [branch, , , , configuredRowIndex]] of GE_ROWS.entries()) {
    const rowIndex = configuredRowIndex ?? defaultRowIndex;
    const models = GE_COLUMNS[branch];
    models.forEach((model, index) => positions.set(`${branch}:${model}`, {
      x: LEFT + index * X_GAP,
      y: TOP + rowIndex * Y_GAP,
    }));
    const branchModel = branch === "universal-four-axle" ? "U23B"
      : branch === "universal-six-axle" ? "U23C"
        : null;
    if (branchModel) positions.set(`${branch}:${branchModel}`, {
      x: LEFT + X_GAP,
      y: TOP + rowIndex * Y_GAP + 90,
    });
  }
  const nodes = prototypes.flatMap((prototype) => {
    const position = positions.get(`${prototype.branch}:${prototype.model}`);
    return position ? [{ ...prototype, ...position }] : [];
  });
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edges = nodes.flatMap((source) => (source.successors ?? []).flatMap((targetId) => {
    const target = nodeById.get(targetId);
    return target && target.branch === source.branch
      ? [{ sourceId: source.id, targetId, x1: source.x + 43, y1: source.y + 27, x2: target.x + 43, y2: target.y + 27, angled: target.model === "U23B" || target.model === "U23C" }]
      : [];
  }));
  const longestLane = Math.max(...Object.values(GE_COLUMNS).map((models) => models.length));
  return { nodes, edges, width: LEFT + longestLane * X_GAP + 40, height: TOP + 8 * Y_GAP - 50, lanes: GE_ROWS };
}

export function layoutTree(prototypes, manufacturer = "emd") {
  return manufacturer === "ge" ? layoutGeTree(prototypes) : { ...layoutEmdTree(prototypes), lanes: LANES };
}

export function renderTree(container, { prototypes, getStatus, manufacturer = "emd" }) {
  const layout = layoutTree(prototypes, manufacturer);
  container.replaceChildren();
  const canvas = document.createElement("div");
  canvas.className = "tree-canvas";
  canvas.style.width = `${layout.width}px`;
  canvas.style.height = `${layout.height}px`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
  svg.style.width = `${layout.width}px`;
  svg.style.height = `${layout.height}px`;
  svg.setAttribute("aria-hidden", "true");
  for (const edge of layout.edges) {
    const path = document.createElementNS(svg.namespaceURI, "path");
    const middle = (edge.x1 + edge.x2) / 2;
    path.setAttribute("d", edge.angled
      ? `M ${edge.x1} ${edge.y1 + 30} V ${edge.y2} H ${edge.x2 - 43}`
      : `M ${edge.x1} ${edge.y1} C ${middle} ${edge.y1}, ${middle} ${edge.y2}, ${edge.x2} ${edge.y2}`);
    path.classList.add("tree-edge");
    svg.append(path);
  }
  canvas.append(svg);

  for (const [laneIndex, [, label, subtitle, labelLeft = 20, rowIndex = laneIndex]] of layout.lanes.entries()) {
    const heading = document.createElement("span");
    heading.className = "tree-lane-label";
    heading.style.left = `${labelLeft}px`;
    heading.style.top = `${TOP + rowIndex * Y_GAP + 17}px`;
    const title = document.createElement("strong");
    title.textContent = label;
    heading.append(title);
    if (subtitle) {
      const expansion = document.createElement("small");
      expansion.textContent = subtitle;
      heading.append(expansion);
    }
    canvas.append(heading);
  }
  for (const node of layout.nodes) {
    const view = treeNodeView(node, getStatus(node.id));
    const button = document.createElement("a");
    button.className = `tree-node status-${view.status}`;
    button.href = view.href;
    button.style.left = `${node.x}px`;
    button.style.top = `${node.y}px`;
    button.setAttribute("aria-label", view.accessibleLabel);
    const model = document.createElement("strong");
    model.textContent = view.model;
    const statusText = document.createElement("small");
    statusText.textContent = view.production;
    button.append(model, statusText);
    canvas.append(button);
  }
  const note = document.createElement("p");
  note.className = "tree-note";
  note.textContent = "Number in each node = total prototype production.";
  container.append(canvas, note);
}

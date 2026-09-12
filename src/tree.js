const LANES = [
  ["switcher", "Switchers", null],
  ["freight-cab", "F Units", "Fourteen Hundred Horsepower"],
  ["passenger-cab", "E Units", "Eighteen Hundred Horsepower"],
  ["gp", "GP", "General Purpose"],
  ["sd", "SD", "Special Duty"],
];
const LEFT = 170;
const TOP = 70;
const X_GAP = 126;
const Y_GAP = 142;

export function layoutTree(prototypes) {
  const nodes = [];
  for (const [laneIndex, [branch]] of LANES.entries()) {
    prototypes.filter((prototype) => prototype.branch === branch).forEach((prototype, index) => {
      nodes.push({ ...prototype, x: LEFT + index * X_GAP, y: TOP + laneIndex * Y_GAP });
    });
  }
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edges = nodes.flatMap((source) => (source.successors ?? []).flatMap((targetId) => {
    const target = nodeById.get(targetId);
    return target ? [{ sourceId: source.id, targetId, x1: source.x + 43, y1: source.y + 27, x2: target.x + 43, y2: target.y + 27 }] : [];
  }));
  const longestLane = Math.max(1, ...LANES.map(([branch]) => nodes.filter((node) => node.branch === branch).length));
  return { nodes, edges, width: LEFT + longestLane * X_GAP + 40, height: TOP + LANES.length * Y_GAP - 50 };
}

export function renderTree(container, { prototypes, selectedId, getStatus, onSelect }) {
  const layout = layoutTree(prototypes);
  container.replaceChildren();
  const canvas = document.createElement("div");
  canvas.className = "tree-canvas";
  canvas.style.width = `${layout.width}px`;
  canvas.style.height = `${layout.height}px`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
  svg.setAttribute("aria-hidden", "true");
  for (const edge of layout.edges) {
    const path = document.createElementNS(svg.namespaceURI, "path");
    const middle = (edge.x1 + edge.x2) / 2;
    path.setAttribute("d", `M ${edge.x1} ${edge.y1} C ${middle} ${edge.y1}, ${middle} ${edge.y2}, ${edge.x2} ${edge.y2}`);
    path.classList.add("tree-edge");
    svg.append(path);
  }
  canvas.append(svg);

  for (const [laneIndex, [, label, subtitle]] of LANES.entries()) {
    const heading = document.createElement("span");
    heading.className = "tree-lane-label";
    heading.style.top = `${TOP + laneIndex * Y_GAP + 17}px`;
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
    const status = getStatus(node.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tree-node status-${status}`;
    button.dataset.prototypeId = node.id;
    button.style.left = `${node.x}px`;
    button.style.top = `${node.y}px`;
    button.setAttribute("aria-pressed", String(node.id === selectedId));
    const model = document.createElement("strong");
    model.textContent = node.model;
    const statusText = document.createElement("small");
    statusText.textContent = status.replace("_", " ");
    button.append(model, statusText);
    button.addEventListener("click", () => onSelect(node.id));
    canvas.append(button);
  }
  container.append(canvas);
}

export function updateTreeSelection(container, selectedId) {
  for (const button of container.querySelectorAll("[data-prototype-id]")) {
    button.setAttribute("aria-pressed", String(button.dataset.prototypeId === selectedId));
  }
  container.querySelector(`[data-prototype-id="${selectedId}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
}

import { railroadUrl } from "./navigation.js?v=railroad-relationships-1";

function railroadYears(railroad) {
  if (railroad.startYear == null && railroad.endYear == null) return "Dates unknown";
  return `${railroad.startYear ?? "?"}–${railroad.endYear ?? "present"}`;
}

export function railroadRelationships(railroad, railroads) {
  const byId = new Map(railroads.map((item) => [item.id, item]));
  return {
    predecessors: (railroad.predecessors || []).map((id) => byId.get(id)).filter(Boolean),
    successor: byId.get(railroad.successor) ?? null,
  };
}

function relationshipLink(railroad, onOpenRailroad) {
  const link = document.createElement("a");
  link.href = railroadUrl(railroad.slug);
  link.textContent = railroad.name;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    onOpenRailroad(railroad);
  });
  return link;
}

function appendRelationshipValue(container, railroads, emptyText, onOpenRailroad) {
  if (!railroads.length) {
    container.textContent = emptyText;
    return;
  }
  railroads.forEach((railroad) => container.append(relationshipLink(railroad, onOpenRailroad)));
}

function nodeClass(railroad) {
  if (railroad.type === "final" || railroad.type.includes("major") || railroad.id === "burlington-northern") return `railroad-node railroad-node-major${railroad.id === "bnsf" ? " railroad-node-bnsf" : ""}`;
  if (railroad.type.includes("regional")) return "railroad-node railroad-node-regional";
  return "railroad-node railroad-node-local";
}

function layoutRailroads(railroads) {
  const byId = new Map(railroads.map((railroad) => [railroad.id, railroad]));
  const depthMemo = new Map();
  const depth = (railroad) => {
    if (depthMemo.has(railroad.id)) return depthMemo.get(railroad.id);
    const value = railroad.successor ? depth(byId.get(railroad.successor)) + 1 : 0;
    depthMemo.set(railroad.id, value);
    return value;
  };
  const leaves = railroads.filter((railroad) => !railroad.predecessors?.length);
  const y = new Map(leaves.map((railroad, index) => [railroad.id, 72 + index * 112]));
  const pending = new Set(railroads.filter((railroad) => !y.has(railroad.id)).map(({ id }) => id));
  while (pending.size) {
    let progressed = false;
    for (const id of [...pending]) {
      const railroad = byId.get(id);
      const predecessorYs = (railroad.predecessors || []).map((predecessor) => y.get(predecessor));
      if (predecessorYs.length && predecessorYs.every(Number.isFinite)) {
        y.set(id, predecessorYs.reduce((sum, value) => sum + value, 0) / predecessorYs.length);
        pending.delete(id); progressed = true;
      }
    }
    if (!progressed) {
      for (const id of pending) y.set(id, 72 + y.size * 94);
      break;
    }
  }
  const maxDepth = Math.max(...railroads.map(depth));
  const positions = railroads.map((railroad) => ({
    railroad,
    x: 36 + (maxDepth - depth(railroad)) * 250,
    y: y.get(railroad.id),
  }));
  const positionById = new Map(positions.map((position) => [position.railroad.id, position]));
  for (let currentDepth = maxDepth - 1; currentDepth >= 0; currentDepth -= 1) {
    for (const position of positions.filter(({ railroad }) => depth(railroad) === currentDepth)) {
      const predecessorYs = (position.railroad.predecessors || []).map((id) => positionById.get(id)?.y).filter(Number.isFinite);
      if (predecessorYs.length === 1) position.y = predecessorYs[0];
      else if (predecessorYs.length > 1) position.y = (Math.min(...predecessorYs) + Math.max(...predecessorYs)) / 2;
    }
  }
  const fwd = positionById.get("fwd");
  const cbq = positionById.get("chicago-burlington-quincy");
  const cs = positionById.get("cs");
  if (fwd && cbq && cs) fwd.y = (cbq.y + cs.y) / 2;
  for (const position of positions) position.baseY = position.y;
  return positions;
}

export function verticalScaleForColumns(positions, heights, minimumGap = 20) {
  const columns = new Map();
  for (const position of positions) {
    const column = columns.get(position.x) || [];
    column.push(position);
    columns.set(position.x, column);
  }
  let scale = 1;
  for (const column of columns.values()) {
    column.sort((a, b) => a.baseY - b.baseY);
    for (let index = 1; index < column.length; index += 1) {
      const previous = column[index - 1];
      const current = column[index];
      const baseDistance = current.baseY - previous.baseY;
      if (baseDistance <= 0) continue;
      const requiredDistance = (heights.get(previous.railroad.id) + heights.get(current.railroad.id)) / 2 + minimumGap;
      scale = Math.max(scale, requiredDistance / baseDistance);
    }
  }
  return scale;
}

function fitVerticalSpacing(canvas, positions) {
  const heights = new Map();
  for (const position of positions) {
    const node = canvas.querySelector(`[data-railroad-id="${position.railroad.id}"]`);
    heights.set(position.railroad.id, node.getBoundingClientRect().height);
  }
  const scale = verticalScaleForColumns(positions, heights);
  const anchor = Math.min(...positions.map(({ baseY }) => baseY));
  for (const position of positions) {
    position.y = anchor + (position.baseY - anchor) * scale;
    canvas.querySelector(`[data-railroad-id="${position.railroad.id}"]`).style.top = `${position.y}px`;
  }
  const bottom = Math.max(...positions.map(({ railroad, y }) => y + heights.get(railroad.id) / 2));
  canvas.style.height = `${bottom + 48}px`;
}

function drawEdges(canvas, positions) {
  const svg = canvas.querySelector("svg");
  const canvasRect = canvas.getBoundingClientRect();
  const byId = new Map(positions.map((position) => [position.railroad.id, position]));
  const successors = positions.filter(({ railroad }) => railroad.predecessors?.length);
  svg.replaceChildren();
  for (const successor of successors) {
    const to = canvas.querySelector(`[data-railroad-id="${successor.railroad.id}"]`).getBoundingClientRect();
    const parents = successor.railroad.predecessors.map((id) => {
      const position = byId.get(id);
      const rect = canvas.querySelector(`[data-railroad-id="${position.railroad.id}"]`).getBoundingClientRect();
      return { x: rect.right - canvasRect.left, y: rect.top + rect.height / 2 - canvasRect.top };
    });
    const x2 = to.left - canvasRect.left;
    const y2 = to.top + to.height / 2 - canvasRect.top;
    const parentRight = Math.max(...parents.map(({ x }) => x));
    const bend = parentRight + (x2 - parentRight) / 2;
    const commands = parents.length === 1
      ? [`M ${parents[0].x} ${parents[0].y} H ${x2}`]
      : [
          ...parents.map(({ x, y }) => `M ${x} ${y} H ${bend}`),
          `M ${bend} ${Math.min(...parents.map(({ y }) => y))} V ${Math.max(...parents.map(({ y }) => y))}`,
          `M ${bend} ${y2} H ${x2}`,
        ];
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", commands.join(" "));
    path.setAttribute("class", "railroad-edge");
    path.dataset.successorId = successor.railroad.id;
    svg.append(path);
  }
}

export function renderBnsfGenealogy(main, railroads, onOpenRailroad) {
  const section = document.createElement("section");
  section.className = "bnsf-genealogy";
  section.innerHTML = `
    <header class="section-heading">
      <p class="eyebrow">Railroad genealogy</p>
      <h2>BNSF genealogy</h2>
      <p>Thirty railroads in the curated lineage of today’s BNSF Railway. Select any company to open its record.</p>
    </header>
  `;
  const viewport = document.createElement("div");
  viewport.className = "genealogy-viewport";
  viewport.setAttribute("aria-label", "BNSF railroad genealogy");
  const canvas = document.createElement("div"); canvas.className = "genealogy-canvas";
  const positions = layoutRailroads(railroads);
  const maxY = Math.max(...positions.map(({ y }) => y));
  canvas.style.height = `${maxY + 110}px`;
  canvas.innerHTML = '<svg aria-hidden="true"></svg>';
  for (const { railroad, x, y } of positions) {
    const link = document.createElement("a");
    link.href = railroadUrl(railroad.slug);
    link.className = nodeClass(railroad);
    link.dataset.railroadId = railroad.id;
    link.style.left = `${x}px`; link.style.top = `${y}px`;
    link.setAttribute("aria-label", `${railroad.name}, ${railroadYears(railroad)}`);
    const mark = railroad.reportingMarks?.length ? `<span>${railroad.reportingMarks.join(" · ")}</span>` : "";
    const displayName = railroad.id === "bnsf" ? "Burlington Northern Santa Fe Railway" : railroad.commonName || railroad.name;
    link.innerHTML = `${mark}<strong>${displayName}</strong><small>${railroadYears(railroad)}</small>`;
    link.addEventListener("click", (event) => { event.preventDefault(); onOpenRailroad(railroad); });
    canvas.append(link);
  }
  viewport.append(canvas); section.append(viewport); main.append(section);
  const fitAndDraw = () => requestAnimationFrame(() => {
    if (!canvas.isConnected) {
      window.removeEventListener("resize", fitAndDraw);
      window.visualViewport?.removeEventListener("resize", fitAndDraw);
      return;
    }
    fitVerticalSpacing(canvas, positions);
    drawEdges(canvas, positions);
  });
  window.addEventListener("resize", fitAndDraw);
  window.visualViewport?.addEventListener("resize", fitAndDraw);
  fitAndDraw();
}

export function renderRailroadPage(main, railroad, railroads, onOpenRailroad) {
  const section = document.createElement("section"); section.className = "railroad-detail-prototype";
  const marks = railroad.reportingMarks?.join(" · ") || "Reporting marks unknown";
  section.innerHTML = `<div class="railroad-hero entity-page-heading"><p class="eyebrow">${railroad.type.replaceAll("-", " ")}</p><h1>${railroad.name}</h1><p class="railroad-meta">${marks} <b>·</b> ${railroadYears(railroad)}</p>${railroad.description ? `<p class="railroad-lede">${railroad.description}</p>` : ""}</div>`;
  const relationships = document.createElement("div"); relationships.className = "railroad-detail-grid";
  const relationshipArticle = document.createElement("article");
  relationshipArticle.innerHTML = '<p class="eyebrow">Lineage</p><h2>Relationships</h2><dl><dt>Predecessors</dt><dd class="railroad-predecessors"></dd><dt>Successor</dt><dd class="railroad-successor"></dd></dl>';
  const resolved = railroadRelationships(railroad, railroads);
  appendRelationshipValue(relationshipArticle.querySelector(".railroad-predecessors"), resolved.predecessors, "None in this curated set", onOpenRailroad);
  appendRelationshipValue(relationshipArticle.querySelector(".railroad-successor"), resolved.successor ? [resolved.successor] : [], "Final company", onOpenRailroad);
  const statistics = document.createElement("article");
  statistics.innerHTML = '<p class="eyebrow">Reference</p><h2>Statistics</h2><p class="muted">Historical statistics have not yet been supplied.</p>';
  relationships.append(relationshipArticle, statistics);
  const schemes = document.createElement("article"); schemes.className = "railroad-schemes";
  schemes.innerHTML = `<p class="eyebrow">Visual identity</p><h2>${railroad.preDiesel ? "Pre-diesel railroad" : "Paint schemes"}</h2>${railroad.preDiesel ? '<p class="muted">No diesel-livery gallery is planned unless later research supplies relevant motor equipment.</p>' : railroad.paintSchemes?.length ? `<ul>${railroad.paintSchemes.map((scheme) => `<li>${scheme}</li>`).join("")}</ul>` : '<p class="muted">Paint-scheme artwork will be supplied separately.</p>'}`;
  relationships.append(schemes); section.append(relationships); main.append(section);
}

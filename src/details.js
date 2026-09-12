import { formatPrototypeName } from "./model.js";

export function displayValue(value) {
  return value == null || value === "" ? "Unknown" : String(value);
}

export function buildDetailFields(prototype) {
  return [
    ["Years", prototype.years],
    ["Horsepower", prototype.horsepower],
    ["Axles", prototype.axleConfiguration],
    ["Traction", prototype.tractionType],
    ["Production", prototype.productionCount],
  ].filter(([, value]) => value != null).map(([label, value]) => ({ label, value: displayValue(value) }));
}

export function createNarrativeSections(prototype) {
  return (prototype.narrative ?? []).filter(Boolean);
}

function relationshipGroup(label, records, onSelect) {
  const group = document.createElement("div");
  group.className = "relationship-group";
  const heading = document.createElement("h3");
  heading.textContent = label;
  group.append(heading);
  if (!records.length) {
    const empty = document.createElement("span");
    empty.className = "muted";
    empty.textContent = "None recorded";
    group.append(empty);
  }
  for (const prototype of records) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "text-button";
    button.textContent = formatPrototypeName(prototype);
    button.addEventListener("click", () => onSelect(prototype.id));
    group.append(button);
  }
  return group;
}

export function renderDetails(container, { prototype, status, related, onSelect }) {
  container.replaceChildren();
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = `${prototype.builder} prototype`;
  const title = document.createElement("h2");
  title.textContent = formatPrototypeName(prototype);
  const badge = document.createElement("span");
  badge.className = `status-badge status-${status}`;
  badge.textContent = status.replace("_", " ");
  container.append(eyebrow, title, badge);

  const fields = buildDetailFields(prototype);
  if (fields.length) {
    const list = document.createElement("dl");
    for (const { label, value } of fields) {
      const term = document.createElement("dt");
      term.textContent = label;
      const description = document.createElement("dd");
      description.textContent = value;
      list.append(term, description);
    }
    container.append(list);
  } else {
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = "Technical facts await verified research.";
    container.append(note);
  }
  for (const paragraph of createNarrativeSections(prototype)) {
    const element = document.createElement("p");
    element.textContent = paragraph;
    container.append(element);
  }
  const relationships = document.createElement("div");
  relationships.className = "relationships";
  relationships.append(
    relationshipGroup("Predecessors", related.predecessors, onSelect),
    relationshipGroup("Successors", related.successors, onSelect),
  );
  container.append(relationships);
}

export function groupRosterRows(rows) {
  return {
    owned: rows.filter(({ status }) => status === "owned"),
    ordered: rows.filter(({ status }) => status === "ordered"),
  };
}

const COLUMNS = [
  ["prototypeName", "Prototype"],
  ["railroadName", "Railroad"],
  ["roadNumber", "Road number"],
  ["manufacturer", "HO manufacturer"],
  ["livery", "Livery"],
];

function rosterTable(rows, label) {
  const section = document.createElement("section");
  const heading = document.createElement("h3");
  heading.textContent = `${label} (${rows.length})`;
  section.append(heading);
  const table = document.createElement("table");
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const [, columnLabel] of COLUMNS) {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = columnLabel;
    headRow.append(cell);
  }
  head.append(headRow);
  const body = document.createElement("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    for (const [key, columnLabel] of COLUMNS) {
      const cell = document.createElement("td");
      cell.dataset.label = columnLabel;
      cell.textContent = row[key] ?? "Unknown";
      tr.append(cell);
    }
    body.append(tr);
  }
  table.append(head, body);
  section.append(table);
  return section;
}

export function renderRoster(container, rows) {
  container.replaceChildren();
  const groups = groupRosterRows(rows);
  container.append(rosterTable(groups.owned, "Owned"), rosterTable(groups.ordered, "Ordered / incoming"));
}

import { locomotiveUrl } from "./navigation.js";
import { useArchiveOnError } from "./image-archive.js";

export function groupRosterRows(rows) {
  return {
    owned: rows.filter(({ status }) => status === "owned"),
    ordered: rows.filter(({ status }) => status === "ordered"),
  };
}

export const rosterColumns = [
  ["prototypeName", "Prototype"],
  ["railroadName", "Railroad"],
  ["livery", "Livery"],
  ["roadNumber", "Road number"],
  ["manufacturer", "HO manufacturer"],
  ["retailer", "Store"],
];

export function rosterRowView(row) {
  const image = row.image ? {
    src: row.image.remoteImageUrl ?? row.image.localPath,
    alt: row.image.credit ? `${row.image.caption}. Credit: ${row.image.credit}` : row.image.caption,
  } : null;
  if (image && row.image.sourcePage) image.sourcePage = row.image.sourcePage;
  return {
    prototypeHref: locomotiveUrl(row.prototypeId),
    manufacturerHref: row.manufacturerUrl ?? null,
    retailerHref: row.retailerUrl ?? null,
    image,
  };
}

function externalLink(label, href) {
  const link = document.createElement("a");
  link.className = "external-table-link";
  link.href = href; link.target = "_blank"; link.rel = "noopener noreferrer";
  link.textContent = label;
  return link;
}

function rosterTable(rows, label) {
  const section = document.createElement("section");
  const heading = document.createElement("h3");
  heading.textContent = `${label} (${rows.length})`;
  section.append(heading);
  const table = document.createElement("table");
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const [, columnLabel] of rosterColumns) {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = columnLabel;
    headRow.append(cell);
  }
  head.append(headRow);
  const body = document.createElement("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    const view = rosterRowView(row);
    for (const [key, columnLabel] of rosterColumns) {
      const cell = document.createElement("td");
      cell.dataset.label = columnLabel;
      if (key === "prototypeName") {
        if (view.image) {
          const image = document.createElement("img"); image.className = "roster-thumbnail";
          image.src = view.image.src; image.alt = view.image.alt; image.loading = "lazy";
          image.addEventListener("error", useArchiveOnError(image, () => { image.hidden = true; }));
          if (view.image.sourcePage) {
            const imageLink = document.createElement("a");
            imageLink.href = view.image.sourcePage; imageLink.target = "_blank"; imageLink.rel = "noopener noreferrer";
            imageLink.append(image); cell.append(imageLink);
          } else cell.append(image);
        }
        const link = document.createElement("a");
        link.className = "roster-link"; link.href = view.prototypeHref; link.textContent = row[key];
        cell.append(link);
      } else if (key === "manufacturer" && view.manufacturerHref) {
        cell.append(externalLink(row[key], view.manufacturerHref));
      } else if (key === "retailer" && view.retailerHref) {
        cell.append(externalLink(row[key], view.retailerHref));
      } else cell.textContent = row[key] ?? "Unknown";
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

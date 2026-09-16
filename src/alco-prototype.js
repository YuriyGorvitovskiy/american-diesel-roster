import { formatProductionCount } from "./tree.js";

// Production count = ALCO-built units only.
// MLW-built units are excluded, as are units built by other licensees.
// ALCO demonstrators and ALCO-built export orders remain part of ALCO production.
//
// ALCO-only audit (2026-09-16), cross-checked against model builder rosters in The
// Diesel Shop and the corresponding American-Rails production rosters:
// - HH 78/43/34; S 543/1,462/651/126; DL 8/3; PA/PB 169/39 are ALCO-built.
// - S-2 displayed 1,462 (MLW 40 excluded); S-4 displayed 651 (MLW 146 excluded).
// - FA/FB displayed 417/229 and 331/182. Separately rostered MLW FA/FB units and
//   the distinct FPA/FPB passenger variants are excluded.
// - RS-1 displayed 466 (MLW 3 excluded); RS-2 368 (MLW 9 excluded); RS-3 1,272
//   (MLW 146 excluded); RS-11 356 (MLW production excluded).
// - RSD 36/204/29/75 are ALCO-built. RSD-7 combines the two ALCO DL-600 variants
//   cataloged as RSD-7; the MLW RSD-17 is a separate model and is excluded.
// - Century displayed 26/98/91/34. C424 excludes 92 MLW units; C636 excludes 35
//   Australian Goodwin license-built units and the separate MLW M636 model.
export const ALCO_PRODUCTION_CAPTION = "Number in each node = ALCO-built production.";

export const ALCO_PROTOTYPE_FAMILIES = [
  {
    id: "early-switchers",
    label: "HH",
    subtitle: "Early high-hood switchers",
    models: [["HH600", 78], ["HH660", 43], ["HH1000", 34]],
  },
  {
    id: "switchers",
    label: "S",
    subtitle: "Switchers",
    models: [["S-1", 543], ["S-2", 1462], ["S-4", 651], ["S-6", 126]],
  },
  {
    id: "freight-cabs",
    label: "FA · FB",
    subtitle: "Freight cab units",
    models: [["FA-1", 417], ["FB-1", 229], ["FA-2", 331], ["FB-2", 182]],
  },
  {
    id: "early-passenger-cabs",
    label: "DL",
    subtitle: "Early passenger cab units",
    models: [["DL-107", 8], ["DL-108", 3]],
  },
  {
    id: "passenger-cabs",
    label: "PA · PB",
    subtitle: "Passenger cab units",
    models: [["PA-1", 169], ["PB-1", 39]],
  },
  {
    id: "road-switchers",
    label: "RS",
    subtitle: "Four-axle road switchers",
    models: [["RS-1", 466], ["RS-2", 368], ["RS-3", 1272], ["RS-11", 356]],
  },
  {
    id: "six-axle-road-switchers",
    label: "RSD",
    subtitle: "Six-axle road switchers",
    models: [["RSD-4", 36], ["RSD-5", 204], ["RSD-7", 29], ["RSD-15", 75]],
  },
  {
    id: "century",
    label: "Century",
    subtitle: "251-powered road locomotives",
    models: [["C415", 26], ["C424", 98], ["C425", 91], ["C636", 34]],
  },
];

export function alcoPrototypeId(model) {
  return `alco-${model.toLowerCase().replaceAll("-", "")}`;
}

export function resolveAlcoPrototypeStatus(model, getStatus) {
  return getStatus(alcoPrototypeId(model));
}

export function findAlcoPrototype(id) {
  for (const family of ALCO_PROTOTYPE_FAMILIES) {
    const entry = family.models.find(([model]) => alcoPrototypeId(model) === id);
    if (entry) return { id, builder: "ALCO", model: entry[0] };
  }
  return null;
}

export function renderAlcoPrototype(container, { getStatus }) {
  container.replaceChildren();
  const grid = document.createElement("div");
  grid.className = "alco-family-grid";

  for (const family of ALCO_PROTOTYPE_FAMILIES) {
    const section = document.createElement("section");
    section.className = "alco-family";

    const heading = document.createElement("header");
    const title = document.createElement("h3");
    title.textContent = family.label;
    const subtitle = document.createElement("p");
    subtitle.textContent = family.subtitle;
    heading.append(title, subtitle);

    const sequence = document.createElement("div");
    const pairedFamily = ["freight-cabs", "passenger-cabs"].includes(family.id);
    sequence.className = pairedFamily ? "alco-family-pairs" : "alco-family-sequence";

    const createNode = ([model, production]) => {
      const id = alcoPrototypeId(model);
      const status = resolveAlcoPrototypeStatus(model, getStatus);
      const link = document.createElement("a");
      link.className = `tree-node alco-family-node status-${status}`;
      link.href = `./locomotive.html?id=${id}`;
      link.setAttribute("aria-label", `${model}, ${formatProductionCount(production)} produced, ${status.replaceAll("_", " ")}`);
      const name = document.createElement("strong");
      name.textContent = model;
      const count = document.createElement("small");
      count.textContent = formatProductionCount(production);
      link.append(name, count);
      return link;
    };

    if (pairedFamily) {
      for (let index = 0; index < family.models.length; index += 2) {
        const pair = family.models.slice(index, index + 2);
        const column = document.createElement("div");
        column.className = "alco-family-pair";
        column.append(...pair.map(createNode));
        sequence.append(column);
      }
    } else {
      sequence.append(...family.models.map(createNode));
    }

    section.append(heading, sequence);
    grid.append(section);
  }

  const note = document.createElement("p");
  note.className = "tree-note";
  note.textContent = ALCO_PRODUCTION_CAPTION;
  container.append(grid, note);

  const alignFamilyColumns = () => {
    const labelWidths = [...grid.querySelectorAll(".alco-family header p")].map((label) => {
      const range = document.createRange();
      range.selectNodeContents(label);
      return range.getBoundingClientRect().width;
    });
    const widestLabel = Math.max(...labelWidths);
    if (widestLabel > 0) {
      grid.style.setProperty("--alco-label-width", `${Math.ceil(widestLabel)}px`);
    }
  };
  requestAnimationFrame(alignFamilyColumns);
  document.fonts?.ready.then(alignFamilyColumns);
  window.addEventListener("resize", alignFamilyColumns, { passive: true });
}

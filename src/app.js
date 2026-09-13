import { loadData, findDanglingReferences } from "./data.js";
import { buildRosterRows, derivePrototypeStatus } from "./model.js";
import { normalizeView, prototypesForManufacturer, renderNavigation } from "./navigation.js";
import { renderRoster } from "./roster.js";
import { renderTree } from "./tree.js";

function heading(eyebrow, title, copy) {
  const wrapper = document.createElement("div"); wrapper.className = "section-heading";
  const overline = document.createElement("p"); overline.className = "eyebrow"; overline.textContent = eyebrow;
  const pageTitle = document.createElement("h2"); pageTitle.textContent = title;
  const description = document.createElement("p"); description.textContent = copy;
  wrapper.append(overline, pageTitle, description); return wrapper;
}

function renderHome(main) {
  const section = document.createElement("section"); section.className = "home-intro";
  const overline = document.createElement("p"); overline.className = "eyebrow"; overline.textContent = "A collection with a point of view";
  const title = document.createElement("h1"); title.append("Diesel history,", document.createElement("br"), "told through a collection.");
  const copy = document.createElement("p"); copy.className = "home-lede";
  copy.textContent = "American Diesel Roster traces the development of American diesel locomotives through historically important prototypes and the HO-scale models that represent them.";
  const actions = document.createElement("div"); actions.className = "home-actions";
  const emd = document.createElement("a"); emd.className = "primary-link"; emd.href = "./?view=emd"; emd.textContent = "Explore the EMD lineage →";
  const collection = document.createElement("a"); collection.href = "./?view=collection"; collection.textContent = "View the collection";
  actions.append(emd, collection); section.append(overline, title, copy, actions); main.append(section);
}

function renderCollection(main, data) {
  const section = document.createElement("section");
  section.append(heading("Physical models and incoming orders", "Collection", "Owned models and active orders from the physical roster."));
  const roster = document.createElement("div"); roster.className = "roster-grid";
  renderRoster(roster, buildRosterRows(data)); section.append(roster); main.append(section);
}

function renderManufacturer(main, view, data) {
  const section = document.createElement("section");
  if (view !== "emd") {
    section.className = "empty-state";
    section.append(heading("Manufacturer evolution", view.toUpperCase(), "Not yet populated.")); main.append(section); return;
  }
  section.append(heading("Manufacturer evolution", "EMD evolution tree", "Choose a prototype to open its dedicated historical record."));
  const tree = document.createElement("div"); tree.className = "tree-viewport"; tree.setAttribute("aria-label", "Locomotive evolution tree");
  renderTree(tree, { prototypes: prototypesForManufacturer(data.prototypes, view), getStatus: (id) => derivePrototypeStatus(id, data) });
  section.append(tree); main.append(section);
}

function renderBnsf(main) {
  const section = document.createElement("section"); section.className = "empty-state";
  section.append(heading("Railroad history", "BNSF", "This section will contain BNSF predecessor genealogy, a railroad timeline, and locomotive purchases by predecessor roads."));
  main.append(section);
}

function renderLoadError(main) {
  const error = document.createElement("p"); error.className = "load-error";
  error.textContent = "Unable to load roster data. Start a local server from the repository root (for example: python3 -m http.server 8000) and reload this page.";
  main.replaceChildren(error);
}

async function start() {
  const main = document.querySelector("#page-content");
  const view = normalizeView(new URLSearchParams(window.location.search).get("view"));
  renderNavigation(document.querySelector("#site-navigation"), view);
  try {
    const data = await loadData();
    findDanglingReferences(data).forEach((error) => console.error(error));
    main.replaceChildren();
    if (view === "home") renderHome(main);
    else if (view === "collection") renderCollection(main, data);
    else if (["emd", "alco", "ge"].includes(view)) renderManufacturer(main, view, data);
    else renderBnsf(main);
  } catch (error) {
    console.error(error); renderLoadError(main);
  }
}

start();

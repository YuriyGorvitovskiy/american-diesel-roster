import { loadData, findDanglingReferences } from "./data.js?v=premerge-2";
import { buildRosterRows, derivePrototypeStatus } from "./model.js?v=order-thumbnails-1";
import { normalizeView, prototypesForManufacturer, renderNavigation } from "./navigation.js";
import { renderRoster } from "./roster.js?v=order-thumbnails-1";
import { renderTree } from "./tree.js?v=ge-tree-11";
import { renderAlcoPrototype } from "./alco-prototype.js?v=premerge-2";
import { renderManufacturerPrototype } from "./manufacturer-prototype.js?v=premerge-3";

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
  const manufacturerName = view.toUpperCase();
  section.append(heading(
    "Manufacturer evolution",
    `${manufacturerName} evolution tree`,
    `${manufacturerName} diesels represented in the BNSF family, grouped by product family.`,
  ));
  const tree = document.createElement("div"); tree.className = "tree-viewport"; tree.setAttribute("aria-label", "Locomotive evolution tree");
  if (view === "alco") renderAlcoPrototype(tree, { getStatus: (id) => derivePrototypeStatus(id, data) });
  else renderManufacturerPrototype(tree, { manufacturer: view, getStatus: (id) => derivePrototypeStatus(id, data) });
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

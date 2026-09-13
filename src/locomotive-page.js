import { loadData, findDanglingReferences } from "./data.js";
import { buildPrototypeDetail, formatPrototypeName, prototypePageHeading } from "./model.js";
import { manufacturerViewForPrototype, parsePrototypeId, renderNavigation } from "./navigation.js";
import { renderDetails } from "./details.js";

function renderError(main) {
  const section = document.createElement("section"); section.className = "empty-state";
  const title = document.createElement("h1"); title.textContent = "Record not found";
  const copy = document.createElement("p"); copy.textContent = "Choose a locomotive from the EMD evolution tree.";
  const link = document.createElement("a"); link.href = "./?view=emd"; link.textContent = "Open the EMD tree →";
  section.append(title, copy, link); main.replaceChildren(section);
}

function renderLoadError(main) {
  const error = document.createElement("p"); error.className = "load-error";
  error.textContent = "Unable to load roster data. Start a local server from the repository root (for example: python3 -m http.server 8000) and reload this page.";
  main.replaceChildren(error);
}

async function start() {
  const main = document.querySelector("#page-content");
  const navigation = document.querySelector("#site-navigation");
  renderNavigation(navigation, null);
  try {
    const data = await loadData();
    findDanglingReferences(data).forEach((error) => console.error(error));
    const detail = buildPrototypeDetail(parsePrototypeId(window.location.search), data);
    if (!detail) return renderError(main);
    renderNavigation(navigation, manufacturerViewForPrototype(detail.prototype));
    document.title = `${formatPrototypeName(detail.prototype)} — American Diesel Roster`;
    const { builderName, modelName } = prototypePageHeading(detail.prototype);
    const section = document.createElement("section");
    const heading = document.createElement("div"); heading.className = "section-heading";
    const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = builderName;
    const title = document.createElement("h1"); title.textContent = modelName;
    const badge = document.createElement("span"); badge.className = `status-badge status-${detail.status}`; badge.textContent = detail.status.replace("_", " ");
    heading.append(eyebrow, title, badge);
    const card = document.createElement("article"); card.className = "detail-card"; renderDetails(card, { ...detail, showHeader: false });
    section.append(heading, card); main.replaceChildren(section);
  } catch (error) {
    console.error(error); renderLoadError(main);
  }
}

start();

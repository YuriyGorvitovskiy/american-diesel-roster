import { loadData, findDanglingReferences } from "./data.js?v=et44ach-3674-2";
import { buildPrototypeDetail, formatPrototypeName, prototypePageHeading } from "./model.js?v=preorder-details-1";
import { manufacturerViewForPrototype, parsePrototypeId, renderNavigation } from "./navigation.js";
import { renderDetails } from "./details.js?v=preorder-details-1";
import { findAlcoPrototype } from "./alco-prototype.js?v=1";
import { findManufacturerPrototype } from "./manufacturer-prototype.js?v=1";

function renderPrototypeTemplate(main, prototype) {
  document.title = `${prototype.model} — American Diesel Roster`;
  const section = document.createElement("section");
  section.className = "alco-template-page";
  const heading = document.createElement("div");
  heading.className = "section-heading";
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = prototype.builder === "ALCO" ? "American Locomotive Company"
    : prototype.builder === "EMD" ? "Electro-Motive Division"
      : "General Electric";
  const title = document.createElement("h1");
  title.textContent = prototype.model;
  heading.append(eyebrow, title);
  section.append(heading);
  main.replaceChildren(section);
}

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
    const prototypeId = parsePrototypeId(window.location.search);
    const detail = buildPrototypeDetail(prototypeId, data);
    if (!detail) {
      const prototype = findAlcoPrototype(prototypeId) ?? findManufacturerPrototype(prototypeId);
      if (prototype) {
        renderNavigation(navigation, manufacturerViewForPrototype(prototype));
        return renderPrototypeTemplate(main, prototype);
      }
      return renderError(main);
    }
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
    const timeline = card.querySelector(".service-timeline-prototype");
    if (timeline) timeline.classList.add("timeline-between-header-card");
    const hero = document.createElement("div"); hero.className = "locomotive-hero";
    hero.append(...[heading, timeline].filter(Boolean));
    section.append(hero, card); main.replaceChildren(section);
  } catch (error) {
    console.error(error); renderLoadError(main);
  }
}

start();

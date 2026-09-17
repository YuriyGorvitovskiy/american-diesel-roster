export const TOP_LEVEL_VIEWS = ["collection", "emd", "alco", "ge", "bnsf"];

const LABELS = { collection: "Collection", emd: "EMD", alco: "ALCO", ge: "GE", bnsf: "BNSF" };

export function normalizeView(value) {
  return TOP_LEVEL_VIEWS.includes(value) ? value : "home";
}

export function navigationItems(activeView) {
  return TOP_LEVEL_VIEWS.map((id) => ({
    id,
    label: LABELS[id],
    href: `/?view=${id}`,
    current: id === activeView,
  }));
}

export function locomotiveUrl(id) {
  return `/locomotive.html?id=${encodeURIComponent(id)}`;
}

export function railroadUrl(slug) {
  return `/railroads/${encodeURIComponent(slug)}`;
}

export function parsePrototypeId(search) {
  return new URLSearchParams(search).get("id");
}

export function manufacturerViewForPrototype(prototype) {
  const builder = prototype?.builder?.toUpperCase();
  if (["EMC", "EMD"].includes(builder)) return "emd";
  if (builder === "ALCO") return "alco";
  if (builder === "GE") return "ge";
  return null;
}

export function prototypesForManufacturer(prototypes, view) {
  return prototypes.filter((prototype) => manufacturerViewForPrototype(prototype) === view);
}

export function renderNavigation(container, activeView) {
  const brand = document.createElement("a");
  brand.className = "site-brand";
  brand.href = "/";
  brand.setAttribute("aria-label", "American Diesel Roster home");
  const name = document.createElement("strong"); name.textContent = "American Diesel Roster";
  const tagline = document.createElement("small"); tagline.textContent = "Historical reference";
  brand.append(name, tagline);
  const links = navigationItems(activeView).map((item) => {
    const link = document.createElement("a");
    link.href = item.href; link.textContent = item.label;
    if (item.current) link.setAttribute("aria-current", "page");
    return link;
  });
  container.replaceChildren(brand, ...links);
}

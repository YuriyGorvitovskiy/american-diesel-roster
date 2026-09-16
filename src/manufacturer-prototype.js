// Research-backed visual candidate for the EMD and GE manufacturer pages.
// Selection follows the locomotive genealogy feeding BNSF: ATSF, GN, NP, CB&Q,
// SP&S, SLSF/Frisco, BN, and BNSF. It is a lineage, not a fixed predecessor count.
// Connecting lines group a product family; they do not assert direct ancestry.
//
// EMD convention: totals normally count EMD-built production, including EMD
// demonstrators and export orders. EMC-era production is included because EMC is
// EMD's direct corporate predecessor. GMD/GMDD production is included only for
// explicitly noted EMD-lineage exceptions such as SD75M and SD75I. License-built
// derivatives and railroad rebuild classes are excluded. Model-specific variants
// remain separate even when a source also publishes a combined series total.
//
// GE convention: totals follow GE Transportation model production, including
// demonstrators and exports, but not license-built derivatives. Evolution-series
// totals follow the completed GE product designation; post-2019 Wabtec continuation
// is noted by the source where applicable rather than silently mixed by family.

const SOURCES = {
  atsf: "https://spazioinwind.libero.it/cajon/roster/sfdiesel.htm",
  gn: "https://www.greatnorthernempire.net/GNEGNDieselRosters.htm",
  np: "https://www.thedieselshop.us/NorPac.HTML",
  cbq: "https://thedieselshop.us/CB%26Q.HTML",
  sps: "https://www.spshs.org/resources/diesel-roster/",
  slsf: "https://www.thedieselshop.us/Frisco.HTML",
  emdSwitchers: "https://dieselshop.us/DataEMDIndexYD.HTML",
  emdCabs: "https://www.thedieselshop.us/DataEMDIndex.HTML",
  emdRoad: "https://thedieselshop.us/DataEMDIndexRS.HTML",
  ge: "https://thedieselshop.us/GE%20DataIndex.HTML",
  geModern: "https://www.american-rails.com/es44ac.html",
};

const model = (name, production, years, railroadIds, source, id = null, notes = null, productionIncludesGmdd = false) => ({
  model: name, production, years, railroadIds, source, id, notes, productionIncludesGmdd,
});

export const MANUFACTURER_PROTOTYPES = {
  emd: {
    caption: "Number in each node = EMD-built production.",
    productionNote: "* GMD/GMDD-built production is included where noted for EMD-lineage models.",
    families: [
      {
        id: "emd-nw-switchers", label: "NW", subtitle: "Early switchers",
        models: [
          model("NW1", 27, "1937–1939", ["GN", "CB&Q"], SOURCES.emdSwitchers, "emc-nw1"),
          model("NW2", 1145, "1939–1949", ["ATSF", "GN", "NP", "CB&Q", "SP&S", "SLSF"], SOURCES.emdSwitchers),
          model("NW3", 7, "1939–1942", ["GN"], SOURCES.emdSwitchers),
          model("NW5", 13, "1946–1947", ["GN"], SOURCES.emdSwitchers),
        ],
      },
      {
        id: "emd-sw-early", label: "SW · EARLY", subtitle: "567-series switchers",
        models: [
          model("SW1", 661, "1939–1953", ["GN", "CB&Q"], SOURCES.emdSwitchers),
          model("SW7", 489, "1949–1951", ["ATSF", "NP", "CB&Q", "SLSF"], SOURCES.emdSwitchers),
          model("SW8", 302, "1950–1954", ["GN", "BN"], "https://www.american-rails.com/11371.html", null,
            "302 new locomotives were EMD-built; seven rebuilds and 65 GMD-built units are excluded."),
          model("SW9", 808, "1951–1953", ["GN", "NP", "CB&Q", "SP&S", "SLSF"], SOURCES.emdSwitchers),
          model("SW1200", 764, "1954–1966", ["ATSF", "GN", "NP", "CB&Q"], "https://www.american-rails.com/19486.html", null,
            "EMD built 732 domestic and 32 export units; one rebuild and 274 GMD-built units are excluded."),
        ],
      },
      {
        id: "emd-sw-late", label: "SW · LATE", subtitle: "645-series switchers",
        models: [
          model("SW1000", 119, "1966–1972", ["CB&Q", "BN"], "https://www.american-rails.com/31696.html", null,
            "The displayed corporate total includes 114 domestic and five EMD-built export units."),
          model("SW1500", 807, "1966–1974", ["GN", "SLSF", "BN"], SOURCES.emdSwitchers),
        ],
      },
      {
        id: "emd-mp-switchers", label: "MP", subtitle: "Multipurpose switcher",
        models: [
          model("MP15DC", 351, "1974–1980", ["SLSF", "BN", "BNSF"], "https://utahrails.net/loconotes/MP15.html"),
        ],
      },
      {
        id: "emd-e-early", label: "E · EARLY", subtitle: "Early passenger cab units",
        models: [
          model("E1", 11, "1937–1938", ["ATSF"], SOURCES.emdCabs),
          model("E3", 19, "1938–1940", ["ATSF"], "https://www.trains-and-railroads.com/emc-e3-diesel-electric-locomotive", null,
            "Seventeen A units and two B units; one E3A was wrecked before delivery and rebuilt as an E6A."),
          model("E6", 118, "1939–1942", ["ATSF"], SOURCES.emdCabs, null,
            "Introduced before the customer-specific E5 despite overlapping production periods."),
          model("E5", 16, "1940–1941", ["CB&Q"], SOURCES.emdCabs),
        ],
      },
      {
        id: "emd-e-late", label: "E · LATE", subtitle: "Postwar passenger cab units",
        models: [
          model("E7", 510, "1945–1949", ["GN", "CB&Q", "SP&S", "SLSF"], SOURCES.emdCabs),
          model("E8", 460, "1949–1953", ["CB&Q", "SLSF"], SOURCES.emdCabs),
          model("E9", 144, "1954–1963", ["CB&Q"], SOURCES.emdCabs),
        ],
      },
      {
        id: "emd-f-units", label: "F", subtitle: "Freight cab units",
        models: [
          model("FT", 1096, "1939–1945", ["ATSF", "GN", "NP"], SOURCES.emdCabs),
          model("F3", 1807, "1945–1949", ["ATSF", "GN", "NP", "CB&Q", "SP&S", "SLSF"], SOURCES.emdCabs),
          model("F7", 3808, "1949–1953", ["ATSF", "GN", "NP", "CB&Q", "SP&S", "SLSF"], SOURCES.emdCabs),
          model("FP7", 378, "1949–1953", ["NP", "SLSF"], SOURCES.emdCabs),
          model("F9", 235, "1954–1956", ["GN", "NP", "SLSF"], SOURCES.emdCabs),
        ],
      },
      {
        id: "emd-cowl-units", label: "COWL", subtitle: "Passenger and freight cowl units",
        models: [
          model("FP45", 14, "1967–1968", ["ATSF"], SOURCES.emdCabs),
          model("F45", 86, "1968–1971", ["ATSF", "GN"], SOURCES.emdCabs),
          model("SDP40F", 150, "1973–1974", ["ATSF"], SOURCES.emdCabs, null,
            "Santa Fe operated 18 former Amtrak units; the displayed count is total EMD production."),
        ],
      },
      {
        id: "emd-gp-early", label: "GP · EARLY", subtitle: "Four-axle road",
        models: [
          model("GP7", 2729, "1949–1954", ["ATSF", "GN", "NP", "CB&Q", "SLSF"], SOURCES.emdRoad),
          model("GP9", 4257, "1954–1959", ["ATSF", "GN", "NP", "CB&Q", "SP&S"], SOURCES.emdRoad),
          model("GP20", 260, "1959–1962", ["ATSF", "GN"], SOURCES.emdRoad, null,
            "Introduced in November 1959, one month before GP18 production began."),
          model("GP18", 390, "1959–1963", ["NP"], SOURCES.emdRoad),
          model("GP30", 948, "1961–1963", ["ATSF", "GN", "CB&Q"], SOURCES.emdRoad),
          model("GP35", 1334, "1963–1966", ["ATSF", "GN", "CB&Q", "SLSF"], SOURCES.emdRoad),
        ],
      },
      {
        id: "emd-gp-645", label: "GP · 645", subtitle: "Pre-Dash-2 road power",
        models: [
          model("GP40", 1243, "1965–1971", ["ATSF", "GN", "CB&Q"], SOURCES.emdRoad),
          model("GP38", 706, "1966–1971", ["ATSF"], SOURCES.emdRoad),
          model("GP38AC", 261, "1970–1971", ["SLSF", "BN"], "https://www.thedieselshop.us/Frisco.HTML"),
        ],
      },
      {
        id: "emd-gp-dash2", label: "GP · DASH-2 ERA", subtitle: "Dash-2 electrical generation",
        models: [
          model("GP38-2", 2213, "1972–1986", ["ATSF", "SLSF", "BN", "BNSF"], SOURCES.emdRoad),
          model("GP40-2", 1231, "1972–1986", ["ATSF", "SLSF", "BN"], SOURCES.emdRoad),
          model("GP39-2", 249, "1974–1984", ["ATSF"], SOURCES.emdRoad),
          model("GP15-1", 310, "1976–1982", ["SLSF", "BN", "BNSF"], "https://www.trains-and-railroads.com/emd-gp15", null,
            "Not marketed with a -2 suffix, but belongs to the Dash-2 electrical era."),
          model("GP40X", 23, "1977–1978", ["ATSF"], SOURCES.emdRoad),
        ],
      },
      {
        id: "emd-gp-modern", label: "GP · LATE", subtitle: "High-horsepower road",
        models: [
          model("GP50", 278, "1980–1985", ["ATSF", "SLSF", "BN"], SOURCES.emdRoad, null,
            "Frisco ordered ten; the first was delivered in Frisco colors and the balance after the BN merger."),
          model("GP60", 294, "1985–1994", ["ATSF"], SOURCES.emdRoad),
          model("GP60M", 63, "1990", ["ATSF"], "https://en.wikipedia.org/wiki/EMD_GP60"),
          model("GP60B", 23, "1991", ["ATSF"], "https://en.wikipedia.org/wiki/EMD_GP60"),
        ],
      },
      {
        id: "emd-sd-early", label: "SD · EARLY", subtitle: "Early six-axle road",
        models: [
          model("SD7", 188, "1952–1953", ["GN", "SP&S"], SOURCES.emdRoad),
          model("SD9", 515, "1954–1959", ["GN", "CB&Q"], SOURCES.emdRoad),
          model("SD24", 224, "1958–1963", ["ATSF"], SOURCES.emdRoad),
        ],
      },
      {
        id: "emd-sd-645", label: "SD · 645", subtitle: "Second-generation road",
        models: [
          model("SD45", 1260, "1965–1971", ["ATSF", "GN", "NP", "SLSF"], SOURCES.emdRoad, null,
            "Catalogued before the SD40; sources differ between February and December 1965 for production start."),
          model("SD40", 1268, "1966–1972", ["ATSF", "GN"], SOURCES.emdRoad),
          model("SDP40", 20, "1966–1970", ["GN", "BN"], SOURCES.emdRoad),
          model("SDP45", 52, "1967–1970", ["GN", "BN"], SOURCES.emdRoad),
          model("SD39", 54, "1968–1970", ["ATSF"], SOURCES.emdRoad),
        ],
      },
      {
        id: "emd-sd-dash2", label: "SD · DASH-2", subtitle: "Dash-2 generation",
        models: [
          model("SD40-2", 3949, "1972–1986", ["ATSF", "SLSF", "BN"], SOURCES.emdRoad),
          model("SD45-2", 136, "1972–1974", ["ATSF"], SOURCES.emdRoad),
          model("SD38-2", 81, "1972–1979", ["SLSF", "BN", "BNSF"], SOURCES.emdRoad),
        ],
      },
      {
        id: "emd-sd-modern", label: "SD · LATE", subtitle: "Late high-horsepower",
        models: [
          model("SD50", 361, "1981–1985", ["BNSF"], SOURCES.emdRoad),
          model("SD60M", 460, "1989–1993", ["BN"], "https://www.thedieselshop.us/BN.HTML"),
          model("SD70MAC", 1109, "1993–2007", ["BN", "BNSF"], "https://www.irm.org/in-the-news/sd70mac-acquired-by-irm/"),
          model("SD75M", 76, "1995–1996", ["ATSF", "BNSF"], "https://www.american-rails.com/946503.html", null,
            "All 76 were GMDD-built; the separate SD75I total is not included.", true),
          model("SD75I", 207, "1996–1999", ["BNSF"], "https://www.american-rails.com/946503.html", null,
            "BNSF received 26 directly; all 207 corporate-line units were GMDD-built.", true),
          model("SD70ACe", 2134, "2004–2015", ["BNSF"], "https://en.wikipedia.org/wiki/EMD_SD70_series"),
        ],
      },
    ],
  },
  ge: {
    caption: "Number in each node = GE-built production.",
    families: [
      {
        id: "ge-switchers", label: "GE", subtitle: "Early industrial switchers",
        models: [
          model("44-ton", 348, "1940–1956", ["ATSF", "GN", "NP", "CB&Q", "SLSF"], SOURCES.ge),
          // Industrial builder lists sometimes mix 43-, 45-, and 50-ton variants;
          // 347 follows the standard 45-ton classification used for the Frisco/AT&N unit.
          model("45-ton", 347, "1940–1956", ["SLSF"], "https://www.thedieselshop.us/GE_45Ton.HTML"),
        ],
      },
      {
        id: "ge-u-b", label: "U · B-B", subtitle: "Universal Series four-axle",
        models: [
          model("U25B", 478, "1959–1966", ["ATSF", "GN", "CB&Q", "SLSF"], SOURCES.ge),
          model("U30B", 295, "1966–1975", ["CB&Q", "SLSF", "BN"], "https://www.thedieselshop.us/GE_U30B.HTML"),
          model("U23B", 481, "1968–1977", ["ATSF"], SOURCES.ge),
        ],
      },
      {
        id: "ge-u-c", label: "U · C-C", subtitle: "Universal Series six-axle",
        models: [
          model("U25C", 113, "1963–1965", ["NP"], SOURCES.ge),
          model("U28C", 71, "1965–1966", ["NP"], SOURCES.ge),
          model("U28CG", 10, "1966", ["ATSF"], SOURCES.ge),
          model("U30CG", 6, "1967", ["ATSF"], SOURCES.ge),
          model("U23C", 223, "1968–1970", ["ATSF"], SOURCES.ge),
          model("U30C", 594, "1966–1976", ["BN"], SOURCES.ge),
          model("U33C", 375, "1968–1975", ["ATSF", "NP"], SOURCES.ge),
          model("U36C", 218, "1971–1975", ["ATSF"], SOURCES.ge),
        ],
      },
      {
        id: "ge-dash7-b", label: "Dash 7 · B-B", subtitle: "Four-axle Dash 7",
        models: [
          model("B23-7", 546, "1977–1984", ["ATSF", "BN"], SOURCES.ge),
          model("B30-7", 279, "1977–1984", ["SLSF", "BN"], SOURCES.ge),
          model("B30-7A", 50, "1982", ["BN"], "https://www.thedieselshop.us/BN.HTML"),
          model("B36-7", 222, "1980–1985", ["ATSF"], SOURCES.ge),
        ],
      },
      {
        id: "ge-dash8-b", label: "Dash 8 · B-B", subtitle: "Four-axle Dash 8",
        models: [
          model("B39-8", 143, "1984–1988", ["ATSF"], SOURCES.ge),
          model("B40-8", 151, "1988–1989", ["ATSF"], "https://commons.wikimedia.org/wiki/Category:GE_B40-8_locomotives"),
          model("B40-8W", 84, "1990–1992", ["ATSF"], "https://railfan.com/restored-super-fleet-b40-8w-makes-debut-at-silvis/"),
        ],
      },
      {
        id: "ge-dash7-c", label: "Dash 7 · C-C", subtitle: "Six-axle Dash 7",
        models: [
          model("C30-7", 1187, "1976–1984", ["ATSF", "BN"], SOURCES.ge),
          model("C33-7", 10, "1984", ["BN"], "https://www.thedieselshop.us/BN.HTML"),
        ],
      },
      {
        id: "ge-dash8-9", label: "Dash 8 · Dash 9", subtitle: "Wide-cab six-axle road power",
        models: [
          model("C40-8W", 756, "1989–1994", ["ATSF"], "https://www.trains-and-railroads.com/ge-c40-8w"),
          model("C41-8W", 108, "1993", ["ATSF"], "https://www.american-rails.com/45734.html"),
          model("C44-9W", 1795, "1993–2004", ["ATSF", "BNSF"], SOURCES.ge),
        ],
      },
      {
        id: "ge-ac", label: "AC", subtitle: "AC-traction road power",
        models: [model("AC4400CW", 3018, "1993–2004", ["BNSF"], "https://www.trains.com/wp-content/uploads/2022/10/BNSF-2022-Locomotive-Roster.pdf", null,
          "BNSF rostered AC4400CW 5600–5717 and warranty-protection units 5838–5840.")],
      },
      {
        id: "ge-evolution", label: "Evolution", subtitle: "GEVO road locomotives",
        models: [
          model("ES44DC", 1066, "2005–2010", ["BNSF"], "https://en.wikipedia.org/wiki/List_of_GE_locomotives"),
          model("ES44AC", 3764, "2003–2024", ["BNSF"], SOURCES.geModern),
          model("ES44C4", 1323, "2009–2020", ["BNSF"], "https://de.wikipedia.org/wiki/GE_ES44C4"),
          model("ET44C4", 300, "2015–2020", ["BNSF"], "https://www.american-rails.com/et44ac.html"),
          model("ET44AC/H", 884, "2015–present", ["BNSF"], "https://www.american-rails.com/et44ac.html", "ge-et44ac"),
        ],
      },
    ],
  },
};

export function prototypeId(manufacturer, modelName) {
  return `${manufacturer}-${modelName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "")}`;
}

export function findManufacturerPrototype(id) {
  for (const [manufacturer, page] of Object.entries(MANUFACTURER_PROTOTYPES)) {
    for (const family of page.families) {
      const entry = family.models.find((candidate) => (
        candidate.id ?? prototypeId(manufacturer, candidate.model)
      ) === id);
      if (entry) return { id, builder: manufacturer.toUpperCase(), model: entry.model };
    }
  }
  return null;
}

export function renderManufacturerPrototype(container, { manufacturer, getStatus }) {
  const page = MANUFACTURER_PROTOTYPES[manufacturer];
  container.replaceChildren();
  const grid = document.createElement("div");
  grid.className = `alco-family-grid manufacturer-family-grid ${manufacturer}-family-grid`;

  for (const family of page.families) {
    const section = document.createElement("section");
    section.className = "alco-family";
    const heading = document.createElement("header");
    const title = document.createElement("h3");
    title.textContent = family.label;
    const subtitle = document.createElement("p");
    subtitle.textContent = family.subtitle;
    heading.append(title, subtitle);

    const sequence = document.createElement("div");
    sequence.className = "alco-family-sequence";
    for (const entry of family.models) {
      const id = entry.id ?? prototypeId(manufacturer, entry.model);
      const status = getStatus(id);
      const link = document.createElement("a");
      link.className = `tree-node alco-family-node status-${status}`;
      link.href = `./locomotive.html?id=${id}`;
      link.setAttribute("aria-label", `${entry.model}, ${entry.production.toLocaleString("en-US")} produced, ${status.replaceAll("_", " ")}`);
      const name = document.createElement("strong");
      name.textContent = `${entry.model}${entry.productionIncludesGmdd ? "*" : ""}`;
      const count = document.createElement("small");
      count.textContent = entry.production.toLocaleString("en-US");
      link.append(name, count);
      sequence.append(link);
    }
    section.append(heading, sequence);
    grid.append(section);
  }

  const note = document.createElement("p");
  note.className = "tree-note";
  note.append(page.caption);
  if (page.productionNote) {
    note.append(document.createElement("br"), page.productionNote);
  }
  container.append(grid, note);

  const alignFamilyColumns = () => {
    const labels = [...grid.querySelectorAll(".alco-family header p")];
    const widths = labels.map((label) => {
      const range = document.createRange();
      range.selectNodeContents(label);
      return range.getBoundingClientRect().width;
    });
    const widestLabel = Math.max(...widths);
    if (widestLabel <= 0) return;
    const labelWidth = Math.ceil(widestLabel);
    const modelWidths = [...grid.querySelectorAll(".alco-family-node strong")].map((name) => {
      const range = document.createRange();
      range.selectNodeContents(name);
      return range.getBoundingClientRect().width;
    });
    const nodeWidth = Math.max(96, Math.ceil(Math.max(...modelWidths)) + 28);
    const longestFamily = Math.max(...page.families.map(({ models }) => models.length));
    grid.style.setProperty("--alco-label-width", `${labelWidth}px`);
    grid.style.setProperty("--manufacturer-node-width", `${nodeWidth}px`);
    grid.style.minWidth = `${20 + labelWidth + 32 + longestFamily * nodeWidth + (longestFamily - 1) * 36 + 28}px`;
  };
  requestAnimationFrame(alignFamilyColumns);
  document.fonts?.ready.then(alignFamilyColumns);
  window.addEventListener("resize", alignFamilyColumns, { passive: true });
}

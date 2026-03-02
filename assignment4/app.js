const EPISODES = [1, 2, 3, 4, 5, 6, 7];
const EPISODE_FILE = (episode) => `Data/starwars-episode-${episode}-interactions-allCharacters.json`;

const state = {
  episodeGraphs: new Map(),
  allNames: [],
  selectedName: null,
  filters: {
    minEdgeWeight: 0,
    minNodeValue: 0,
    showIsolated: true,
  },
  views: {
    left: { startEpisode: 1, endEpisode: 3, simulation: null, nodeSelection: null, linkSelection: null },
    right: { startEpisode: 4, endEpisode: 6, simulation: null, nodeSelection: null, linkSelection: null },
  },
};

const tooltip = document.getElementById("tooltip");
const searchInput = document.getElementById("character-search");
const searchSuggestions = document.getElementById("search-suggestions");
const searchButton = document.getElementById("search-btn");
const clearButton = document.getElementById("clear-btn");
const resetFiltersButton = document.getElementById("reset-filters-btn");
const minEdgeWeightInput = document.getElementById("min-edge-weight");
const minEdgeWeightValue = document.getElementById("min-edge-weight-value");
const minNodeValueInput = document.getElementById("min-node-value");
const minNodeValueValue = document.getElementById("min-node-value-value");
const showIsolatedInput = document.getElementById("show-isolated-nodes");
const bgMusic = document.getElementById("bg-music");
const muteButton = document.getElementById("mute-btn");

const viewDom = {
  left: {
    title: document.getElementById("left-title"),
    container: document.getElementById("left-graph"),
    from: document.getElementById("left-from"),
    to: document.getElementById("left-to"),
  },
  right: {
    title: document.getElementById("right-title"),
    container: document.getElementById("right-graph"),
    from: document.getElementById("right-from"),
    to: document.getElementById("right-to"),
  },
};

init().catch((error) => {
  console.error(error);
  alert("Failed to load graph data. Open browser console for details.");
});

async function init() {
  const loaded = await Promise.all(
    EPISODES.map(async (episode) => {
      const response = await fetch(EPISODE_FILE(episode));
      if (!response.ok) {
        throw new Error(`Could not load ${EPISODE_FILE(episode)} (${response.status}).`);
      }
      const json = await response.json();
      return [episode, normalizeGraph(json)];
    })
  );

  loaded.forEach(([episode, graph]) => state.episodeGraphs.set(episode, graph));
  state.allNames = buildAllNames();

  setupRangeControls();
  setupFilterControls();
  setupSearchControls();
  initializeAudio();
  renderAll();

  window.addEventListener("resize", debounce(renderAll, 200));
}

function normalizeGraph(raw) {
  const nodes = raw.nodes.map((node) => ({
    name: node.name,
    value: Number(node.value) || 0,
    colour: node.colour || "#999999",
  }));

  const links = raw.links
    .map((link) => ({
      sourceIndex: Number(link.source),
      targetIndex: Number(link.target),
      value: Number(link.value) || 0,
    }))
    .filter((link) => Number.isInteger(link.sourceIndex) && Number.isInteger(link.targetIndex))
    .filter((link) => link.sourceIndex >= 0 && link.sourceIndex < nodes.length)
    .filter((link) => link.targetIndex >= 0 && link.targetIndex < nodes.length)
    .map((link) => ({
      sourceName: nodes[link.sourceIndex].name,
      targetName: nodes[link.targetIndex].name,
      value: link.value,
    }));

  return { nodes, links };
}

function buildAllNames() {
  const names = new Set();
  state.episodeGraphs.forEach((graph) => {
    graph.nodes.forEach((node) => names.add(node.name));
  });
  return [...names].sort((a, b) => a.localeCompare(b));
}

function setupRangeControls() {
  ["left", "right"].forEach((side) => {
    const { from, to } = viewDom[side];
    EPISODES.forEach((episode) => {
      from.append(new Option(`E${episode}`, episode));
      to.append(new Option(`E${episode}`, episode));
    });

    from.value = String(state.views[side].startEpisode);
    to.value = String(state.views[side].endEpisode);

    from.addEventListener("change", () => {
      state.views[side].startEpisode = Number(from.value);
      if (state.views[side].startEpisode > state.views[side].endEpisode) {
        state.views[side].endEpisode = state.views[side].startEpisode;
        to.value = from.value;
      }
      renderAll();
    });

    to.addEventListener("change", () => {
      state.views[side].endEpisode = Number(to.value);
      if (state.views[side].endEpisode < state.views[side].startEpisode) {
        state.views[side].startEpisode = state.views[side].endEpisode;
        from.value = to.value;
      }
      renderAll();
    });
  });
}

function setupFilterControls() {
  const allNodeValues = [];
  const allLinkValues = [];
  state.episodeGraphs.forEach((graph) => {
    graph.nodes.forEach((node) => allNodeValues.push(node.value));
    graph.links.forEach((link) => allLinkValues.push(link.value));
  });
  
  //We use .max as we take the max value the slider can be set at, creating the minimum and maximum 
  // values for the sliders based on the data. We also ensure that 
  // the max is at least 0 to avoid negative slider ranges.
  //Also because we filter away based on the max value we then take the min value for the node that is connected. 
  minNodeValueInput.max = String(Math.max(...allNodeValues, 0)); 
  minEdgeWeightInput.max = String(Math.max(...allLinkValues, 0));

  resetFiltersButton.addEventListener("click", () => {
    minEdgeWeightInput.value = "0";
    minNodeValueInput.value = "0";
    showIsolatedInput.checked = true;
    applyFilters();
  });

  minEdgeWeightInput.addEventListener("input", applyFilters);
  minNodeValueInput.addEventListener("input", applyFilters);
  showIsolatedInput.addEventListener("change", applyFilters);

  applyFilters();
}

function applyFilters() {
  state.filters.minEdgeWeight = Number(minEdgeWeightInput.value) || 0;
  state.filters.minNodeValue = Number(minNodeValueInput.value) || 0;
  state.filters.showIsolated = showIsolatedInput.checked;

  minEdgeWeightValue.textContent = String(state.filters.minEdgeWeight);
  minNodeValueValue.textContent = String(state.filters.minNodeValue);
  renderAll();
}

function setupSearchControls() {
  searchInput.addEventListener("input", () => {
    updateSuggestions(searchInput.value.trim());
  });

  searchInput.addEventListener("keydown", (event) => {
    const visible = searchSuggestions.classList.contains("visible");
    if (event.key === "Escape") {
      hideSuggestions();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (visible && searchSuggestions.firstElementChild) {
        selectSuggestion(searchSuggestions.firstElementChild.textContent);
      } else {
        highlightFromSearch();
      }
    }
  });

  searchButton.addEventListener("click", highlightFromSearch);

  clearButton.addEventListener("click", () => {
    state.selectedName = null;
    searchInput.value = "";
    hideSuggestions();
    refreshHighlights();
  });

  document.addEventListener("click", (event) => {
    if (!searchSuggestions.contains(event.target) && event.target !== searchInput) {
      hideSuggestions();
    }
  });
}

function renderAll() {
  renderView("left");
  renderView("right");
  refreshHighlights();
}

function renderView(side) {
  const view = state.views[side];
  const dom = viewDom[side];

  if (view.simulation) {
    view.simulation.stop();
  }

  const combined = buildEpisodeRangeGraph(view.startEpisode, view.endEpisode);
  const filtered = buildFilteredGraph(combined, state.filters);

  const width = Math.max(dom.container.clientWidth, 320);
  const height = Math.max(dom.container.clientHeight, 400);

  dom.container.innerHTML = "";
  const svg = d3
    .select(dom.container)
    .append("svg")
    .attr("class", "graph-svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const root = svg.append("g");
  svg.call(d3.zoom().scaleExtent([0.3, 4]).on("zoom", (event) => root.attr("transform", event.transform)));

  const nodes = filtered.nodes.map((node) => ({ ...node }));
  const links = filtered.links.map((link) => ({ source: link.sourceName, target: link.targetName, value: link.value }));

  const valueExtent = d3.extent(nodes, (node) => node.value);
  const radiusScale = d3.scaleSqrt().domain([valueExtent[0] ?? 0, valueExtent[1] ?? 1]).range([4, 18]);

  const linkExtent = d3.extent(links, (link) => link.value);
  const linkStrokeScale = d3.scaleLinear().domain([linkExtent[0] ?? 0, linkExtent[1] ?? 1]).range([0.6, 3.2]);

  const linkSelection = root
    .append("g")
    .attr("stroke-linecap", "round")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "link")
    .attr("stroke-width", (d) => linkStrokeScale(d.value))
    .on("mousemove", (event, d) => {
      const { sourceName, targetName } = getLinkNames(d);
      showTooltip(event, `<strong>${sourceName}</strong> ↔ <strong>${targetName}</strong><br/>Weight: ${d.value}`);
    })
    .on("mouseleave", hideTooltip);

  const nodeSelection = root
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("class", "node")
    .attr("r", (d) => radiusScale(d.value))
    .attr("fill", (d) => d.colour)
    .on("click", (_, d) => {
      state.selectedName = state.selectedName === d.name ? null : d.name;
      searchInput.value = state.selectedName ?? "";
      refreshHighlights();
    })
    .on("mousemove", (event, d) => showTooltip(event, `<strong>${d.name}</strong><br/>Value: ${d.value}`))
    .on("mouseleave", hideTooltip);

  const simulation = d3
    .forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.name).distance(48).strength(0.18))
    .force("charge", d3.forceManyBody().strength(-95))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius((d) => radiusScale(d.value) + 2));

  nodeSelection.call(dragBehavior(simulation));

  simulation.on("tick", () => {
    linkSelection
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    nodeSelection.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  });

  dom.title.textContent = `${side === "left" ? "Left" : "Right"} Network — ${rangeLabel(view.startEpisode, view.endEpisode)}`;
  view.simulation = simulation;
  view.nodeSelection = nodeSelection;
  view.linkSelection = linkSelection;
}

function rangeLabel(start, end) {
  return start === end ? `Episode ${start}` : `Episodes ${start}-${end}`;
}

function buildEpisodeRangeGraph(startEpisode, endEpisode) {
  const start = Math.min(startEpisode, endEpisode);
  const end = Math.max(startEpisode, endEpisode);
  const nodeMap = new Map();
  const linkMap = new Map();

  for (let episode = start; episode <= end; episode += 1) {
    const graph = state.episodeGraphs.get(episode);
    if (!graph) continue;

    graph.nodes.forEach((node) => {
      if (!nodeMap.has(node.name)) {
        nodeMap.set(node.name, { name: node.name, value: 0, colour: node.colour });
      }
      const existing = nodeMap.get(node.name);
      existing.value += node.value;
      if (!existing.colour && node.colour) existing.colour = node.colour;
    });

    graph.links.forEach((link) => {
      const [a, b] = [link.sourceName, link.targetName].sort((left, right) => left.localeCompare(right));
      const key = `${a}||${b}`;
      if (!linkMap.has(key)) {
        linkMap.set(key, { sourceName: a, targetName: b, value: 0 });
      }
      linkMap.get(key).value += link.value;
    });
  }

  return { nodes: [...nodeMap.values()], links: [...linkMap.values()] };
}

function buildFilteredGraph(graph, filters) {
  const nodes = graph.nodes.filter((node) => node.value >= filters.minNodeValue);
  const nodeNames = new Set(nodes.map((node) => node.name));

  let links = graph.links.filter(
    (link) =>
      link.value >= filters.minEdgeWeight && nodeNames.has(link.sourceName) && nodeNames.has(link.targetName)
  );

  if (!filters.showIsolated) {
    const connectedNames = new Set();
    links.forEach((link) => {
      connectedNames.add(link.sourceName);
      connectedNames.add(link.targetName);
    });

    const connectedNodes = nodes.filter((node) => connectedNames.has(node.name));
    const connectedSet = new Set(connectedNodes.map((node) => node.name));
    links = links.filter((link) => connectedSet.has(link.sourceName) && connectedSet.has(link.targetName));
    return { nodes: connectedNodes, links };
  }

  return { nodes, links };
}

function refreshHighlights() {
  const selected = state.selectedName;

  ["left", "right"].forEach((side) => {
    const view = state.views[side];
    if (!view.nodeSelection || !view.linkSelection) return;

    view.nodeSelection
      .classed("highlighted", (d) => selected !== null && d.name === selected)
      .classed("dimmed", (d) => selected !== null && d.name !== selected);

    view.linkSelection
      .classed("link-highlighted", (d) => {
        if (!selected) return false;
        const { sourceName, targetName } = getLinkNames(d);
        return sourceName === selected || targetName === selected;
      })
      .classed("dimmed", (d) => {
        if (!selected) return false;
        const { sourceName, targetName } = getLinkNames(d);
        return !(sourceName === selected || targetName === selected);
      });
  });
}

function updateSuggestions(rawQuery) {
  const query = rawQuery.toLowerCase();
  searchSuggestions.innerHTML = "";

  if (!query) {
    hideSuggestions();
    return;
  }

  const matches = state.allNames.filter((name) => name.toLowerCase().includes(query)).slice(0, 12);
  if (!matches.length) {
    hideSuggestions();
    return;
  }

  matches.forEach((name, index) => {
    const item = document.createElement("li");
    item.className = `suggestion-item${index === 0 ? " active" : ""}`;
    item.textContent = name;
    item.tabIndex = 0;
    item.addEventListener("mousedown", (event) => {
      event.preventDefault();
      selectSuggestion(name);
    });
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        selectSuggestion(name);
      }
    });
    searchSuggestions.append(item);
  });

  searchSuggestions.classList.add("visible");
}

function selectSuggestion(name) {
  searchInput.value = name;
  hideSuggestions();
  state.selectedName = name;
  refreshHighlights();
}

function hideSuggestions() {
  searchSuggestions.classList.remove("visible");
}

function highlightFromSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  const exact = state.allNames.find((name) => name.toLowerCase() === query.toLowerCase());
  const fallback = state.allNames.find((name) => name.toLowerCase().includes(query.toLowerCase()));
  const chosen = exact ?? fallback;
  if (!chosen) return;

  state.selectedName = chosen;
  searchInput.value = chosen;
  hideSuggestions();
  refreshHighlights();
}

function initializeAudio() {
  if (!bgMusic || !muteButton) return;

  bgMusic.volume = 0.35;
  bgMusic.muted = false;
  bgMusic.play().catch(() => {});

  const syncMuteUI = () => {
    const muted = bgMusic.muted;
    muteButton.textContent = muted ? "🔇 Unmute" : "🔊 Mute";
    muteButton.classList.toggle("muted", muted);
    muteButton.setAttribute("aria-pressed", String(muted));
  };

  syncMuteUI();
  muteButton.addEventListener("click", () => {
    bgMusic.muted = !bgMusic.muted;
    if (bgMusic.paused) bgMusic.play().catch(() => {});
    syncMuteUI();
  });
}

function getLinkNames(link) {
  return {
    sourceName: typeof link.source === "string" ? link.source : link.source.name,
    targetName: typeof link.target === "string" ? link.target : link.target.name,
  };
}

function dragBehavior(simulation) {
  return d3
    .drag()
    .on("start", (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on("end", (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
}

function showTooltip(event, html) {
  tooltip.innerHTML = html;
  tooltip.style.visibility = "visible";
  tooltip.style.left = `${event.clientX + 12}px`;
  tooltip.style.top = `${event.clientY + 12}px`;
}

function hideTooltip() {
  tooltip.style.visibility = "hidden";
}

function debounce(fn, waitMs) {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), waitMs);
  };
}

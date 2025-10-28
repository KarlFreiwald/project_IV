import { drawMap } from "./mapChart.js";
import { drawBar } from "./barChart.js";

const tabState = { current: "incidents" };

Promise.all([
    d3.csv("data/climate.csv"),
    d3.json("data/world.geojson")
]).then(init);

function init([climate, world]) {
    climate.forEach(d => {
        d.year = +new Date(d.date).getFullYear();
        d.severity = +d.severity || 0;
        d.damage = +d.economic_impact_million_usd || 0;
        d.aid = +d.international_aid_million_usd || 0;
        d.casualties = +d.total_casualties || 0;
    });

    const eventTypes = [...new Set(climate.map(d => d.event_type))];
    const dropdown = d3.select("#event-dropdown");

    // Dropdown-Button
    dropdown.append("div")
      .attr("class", "dropdown-header")
      .text("Select Event Types");

    // Container für Checkboxen + Buttons
    const list = dropdown.append("div")
      .attr("class", "dropdown-list");

    // Buttons
    list.append("button")
      .text("Select All")
      .on("click", () => {
        list.selectAll("input[type=checkbox]").property("checked", true);
        update();
      });

    list.append("button")
      .text("Clear All")
      .on("click", () => {
        list.selectAll("input[type=checkbox]").property("checked", false);
        update();
      });

    // Checkboxen für alle Eventtypen
    list.selectAll("label")
      .data(eventTypes)
      .join("label")
      .html(d => `<input type="checkbox" value="${d}" checked> ${d}`)
      .on("change", update);

    // Öffnen/Schließen beim Klick auf Header
    dropdown.select(".dropdown-header").on("click", () => {
      const isOpen = dropdown.classed("open");
      d3.selectAll(".multi-select").classed("open", false); // schließt andere
      dropdown.classed("open", !isOpen);
    });

    // Dropdown schließen, wenn man außerhalb klickt
    document.addEventListener("click", (event) => {
      if (!dropdown.node().contains(event.target)) {
        dropdown.classed("open", false);
      }
    });

    // --- Activate Tabs ---
    d3.selectAll(".tabs button").on("click", function() {
      // Update button style
      d3.selectAll(".tabs button").classed("active", false);
      d3.select(this).classed("active", true);

      // Update current tab state
      tabState.current = this.dataset.tab;

      // Refresh charts
      update();
    });
    // Sliders
    d3.select("#year-slider").on("input", function() {
        d3.select("#year-label").text(this.value);
        update();
    });

    d3.select("#severity-slider").on("input", function() {
        d3.select("#severity-label").text(this.value + "+");
        update();
    });

    d3.select("#event-dropdown").on("change", update);
    function update() {
        const year = +d3.select("#year-slider").property("value");
        const sev = +d3.select("#severity-slider").property("value");
        const selectedTypes = dropdown
        .selectAll("input[type=checkbox]")
        .filter(function() { return this.checked; })
        .nodes()
        .map(d => d.value);

        const filtered = climate.filter(d =>
        d.year === year &&
        selectedTypes.includes(d.event_type) &&
        d.severity >= sev
);

        const rolled = d3.rollups(
        filtered,
        v => ({
            value: v.length,
        damage: d3.sum(v, d => d.damage),
        aid: d3.sum(v, d => d.aid),
        casualties: d3.sum(v, d => d.casualties)
          }),
        d => d.country
        );

        const arr = rolled.map(([country, o]) => ({
            country, ...o
        }));

        // Determine which metric to display based on active tab
        let metricKey = "value"; // default: incidents
        switch (tabState.current) {
            case "damage":
                metricKey = "damage";
                break;
            case "aid":
                metricKey = "aid";
                break;
            case "casualties":
                metricKey = "casualties";
                break;
        }

        // Pass the selected metric to drawMap() and drawBar()
        drawMap(world, arr, metricKey);
        drawBar(arr, tabState.current);

    }
    update();
}

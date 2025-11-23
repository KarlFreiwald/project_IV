import { drawMap } from "./mapChart.js";
import { drawBar } from "./barChart.js";
import { drawLine } from "./lineChart.js";

const d3 = window.d3;
const tabState = { current: "incidents" };
const barSortState = { current: "damage" };

Promise.all([
    d3.csv("data/climate.csv"),
    d3.json("data/world.geojson")
]).then(init);

// --- HELP TOOLTIP LOGIC ---
function showHelp(text, anchor) {
    d3.selectAll(".help-tooltip").remove();

    const box = d3.select(anchor)
        .append("div")
        .attr("class", "help-tooltip")
        .html(text);

    box.style("display", "block");

    // Hide when clicked anywhere else
    setTimeout(() => {
        document.addEventListener("click", function hide(ev) {
            if (!anchor.contains(ev.target)) {
                box.remove();
                document.removeEventListener("click", hide);
            }
        });
    }, 10);
}


function init([climate, world]) {

    // Prepare data
    climate.forEach(d => {
        d.year = +new Date(d.date).getFullYear();
        d.severity = +d.severity || 0;
        d.damage = +d.economic_impact_million_usd || 0;
        d.aid = +d.international_aid_million_usd || 0;
        d.casualties = +d.total_casualties || 0;
    });

    const eventTypes = [...new Set(climate.map(d => d.event_type))];
    const eventCheckboxContainer = d3.select("#event-checkbox-container");
    let selectedCountries = [];

    // Store selected event types (init: all)
    const selectedTypesSet = new Set(eventTypes);

    // Create clickable event boxes
    eventTypes.forEach(type => {
        const box = eventCheckboxContainer
            .append("div")
            .attr("class", "event-box active")
            .attr("data-type", type)
            .text(type);

        box.on("click", function () {
            const isActive = selectedTypesSet.has(type);

            if (isActive) {
                selectedTypesSet.delete(type);
                d3.select(this)
                    .classed("active", false)
                    .classed("inactive", true);
            } else {
                selectedTypesSet.add(type);
                d3.select(this)
                    .classed("inactive", false)
                    .classed("active", true);
            }

            update();
        });
    });

    // Select All
    document.getElementById("event-select-all").addEventListener("click", () => {
        selectedTypesSet.clear();
        eventTypes.forEach(t => selectedTypesSet.add(t));

        eventCheckboxContainer.selectAll(".event-box")
            .classed("active", true)
            .classed("inactive", false);

        update();
    });

    // Deselect All
    document.getElementById("event-deselect-all").addEventListener("click", () => {
        selectedTypesSet.clear();

        eventCheckboxContainer.selectAll(".event-box")
            .classed("active", false)
            .classed("inactive", true);

        update();
    });

    // Bar Chart Sort Switch
    d3.selectAll("#bar-sort-switch .switch-option").on("click", function () {
        d3.selectAll("#bar-sort-switch .switch-option").classed("active", false);
        d3.select(this).classed("active", true);
        barSortState.current = this.dataset.sort;
        update();
    });


    // Year range slider
    const yearSlider = document.getElementById("yearRange");

    noUiSlider.create(yearSlider, {
        start: [2020, 2025],
        connect: true,
        range: { min: 2020, max: 2025 },
        step: 1,
        tooltips: false
    });

    yearSlider.noUiSlider.on("update", function (values) {
        const start = Math.round(values[0]);
        const end = Math.round(values[1]);
        d3.select("#year-label").text(`${start} – ${end}`);
    });

    yearSlider.noUiSlider.on("change", update);

    // Severity Slider
    d3.select("#severity-slider").on("input", function () {
        d3.select("#severity-label").text(this.value + "+");
        update();
    });

    // Click on a country in the map
    window.addEventListener("countrySelected", e => {
        const c = e.detail;

        if (selectedCountries.includes(c)) {
            selectedCountries = selectedCountries.filter(x => x !== c);
        } else {
            selectedCountries.push(c);
        }

        update();
    });

    //Hover highlight (Map + Line Chart)
    window.addEventListener("countryHover", e => {
        const c = e.detail;

        d3.selectAll(".line-country")
            .attr("opacity", d => d.country === c ? 1 : 0.2);

        d3.selectAll("path")
            .attr("opacity", d => d.properties?.name === c ? 1 : 0.4);
    });

    window.addEventListener("countryHoverEnd", () => {
        d3.selectAll(".line-country").attr("opacity", 1);
        d3.selectAll("path").attr("opacity", 1);
    });

    //Legend click → remove selected country
    window.addEventListener("legendToggle", e => {
        const c = e.detail;
        selectedCountries = selectedCountries.filter(x => x !== c);
        update();
    });

    // Reset Line Chart Button
    document.getElementById("reset-line").addEventListener("click", () => {
        selectedCountries = [];         
        update();                     
    });

    // Initial draw
    update();

    // Resize handling
    window.addEventListener("resize", update);

    // Help button: Bar Sort Switch
   document.querySelectorAll(".help-button").forEach(btn => {
        btn.addEventListener("click", (event) => {
            event.stopPropagation();     
            event.preventDefault();

            const tooltipId = btn.dataset.help;
            const tooltip = document.getElementById(tooltipId);

        // Tooltip toggle
            document.querySelectorAll(".help-tooltip").forEach(t => {
               if (t !== tooltip) t.classList.remove("show");
            });

            tooltip.classList.toggle("show");
        });
    });

    // When click outter box close
    document.addEventListener("click", () => {
        document.querySelectorAll(".help-tooltip").forEach(t => t.classList.remove("show"));
    });

    d3.selectAll(".tabs button").on("click", function (event) {
    if (event.target.closest(".help-button")) return;
    if (event.target.classList.contains("help-button")) return;

    d3.selectAll(".tabs button").classed("active", false);
    d3.select(this).classed("active", true);

    tabState.current = this.dataset.tab;
    update();
    });

    // Main update function
    function update() {
        const yearRange = d3.select("#year-label").text().split(" – ").map(Number);
        const startYear = yearRange[0];
        const endYear = yearRange[1];
        const sev = +d3.select("#severity-slider").property("value");
        const selectedTypes = Array.from(selectedTypesSet);

        // Filter data
        const filtered = climate.filter(d =>
            d.year >= startYear &&
            d.year <= endYear &&
            selectedTypes.includes(d.event_type) &&
            d.severity >= sev
        );

        // Aggregate for map and bar
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

        const arr = rolled.map(([country, o]) => ({ country, ...o }));

        // Which metric is active?
        let metricKey = "value";
        if (tabState.current === "damage") metricKey = "damage";
        if (tabState.current === "aid") metricKey = "aid";
        if (tabState.current === "casualties") metricKey = "casualties";

        // Update charts
        drawMap(world, arr, metricKey);
        drawBar(arr, barSortState.current);
        drawLine(filtered, metricKey, selectedCountries);
    }
}
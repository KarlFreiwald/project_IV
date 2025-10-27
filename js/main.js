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
        d.damage = +d.economic_damage_usd || 0;
        d.aid = +d.international_aid_usd || 0;
        d.casualties = +d.casualties || 0;
    });

    const eventTypes = [...new Set(climate.map(d => d.event_type))];
    d3.select("#event-dropdown")
        .selectAll("option")
        .data(eventTypes)
        .join("option")
        .text(d => d);

    d3.selectAll(".tabs button").on("click", function() {
        d3.selectAll(".tabs button").classed("active", false);
        d3.select(this).classed("active", true);
        tabState.current = this.dataset.tab;
        update();
    });

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
        const type = d3.select("#event-dropdown").property("value");

        const filtered = climate.filter(d =>
            d.year === year &&
            d.event_type === type &&
            d.severity >= sev
        );

        const rolled = d3.rollups(
            filtered,
            v => ({
                value: v.length,
                damage: d3.sum(v, d => d.damage),
                aid:    d3.sum(v, d => d.aid),
                casualties: d3.sum(v, d => d.casualties)
            }),
            d => d.country
        );

        const arr = rolled.map(([country, o]) => ({
            country, ...o
        }));

        drawMap(world, arr);
        drawBar(arr, tabState.current);
    }

    update();
}

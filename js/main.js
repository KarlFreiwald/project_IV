import { drawMap } from "./mapChart.js";
import { drawBarChart } from "./barChart.js";

Promise.all([
    d3.csv("data/climate.csv"),
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
]).then(init);

function init([climate, world]) {
    const eventTypes = [...new Set(climate.map(d => d.event_type))];

    d3.select("#event-dropdown")
        .selectAll("option")
        .data(eventTypes)
        .join("option")
        .text(d => d)
        .attr("value", d => d);

    update();

    d3.select("#event-dropdown").on("change", update);
    d3.select("#year-slider").on("input", function() {
        d3.select("#year-label").text(this.value);
        update();
    });

    function update() {
        const year = +d3.select("#year-slider").property("value");
        const eventType = d3.select("#event-dropdown").property("value");

        const filtered = climate.filter(d => +d.year === year && d.event_type === eventType);

        const counts = d3.rollup(filtered, v => v.length, d => d.country);
        const countArr = Array.from(counts, ([country, value]) => ({country, value}));

        drawMap(world, countArr);
        drawBarChart(countArr);
    }
}

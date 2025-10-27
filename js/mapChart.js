export function drawMap(worldData, incidents) {
    const width = 800, height = 450;

    const svg = d3.select("#map")
        .html("")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoMercator().fitSize([width, height], worldData);
    const path = d3.geoPath().projection(projection);

    const color = d3.scaleSequential()
        .domain([0, d3.max(incidents, d => d.value)])
        .interpolator(d3.interpolateYlOrRd);

    const incidentMap = new Map(incidents.map(d => [d.country, d.value]));

    svg.selectAll("path")
        .data(worldData.features)
        .join("path")
        .attr("d", path)
        .attr("stroke", "#333")
        .attr("fill", d => color(incidentMap.get(d.properties.name) || 0));
}

export function drawMap(world, dataArr) {
    const width = 900, height = 450;
    const tooltip = d3.select("#tooltip");

    d3.select("#map").html("");

    const svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoMercator().fitSize([width, height], world);
    const path = d3.geoPath().projection(projection);

    const maxVal = d3.max(dataArr, d => d.value) || 0;
    const color = d3.scaleSequential()
        .domain([0, maxVal])
        .interpolator(d3.interpolateYlOrRd);

    const lookup = new Map(dataArr.map(d => [d.country, d.value]));

    svg.append("g")
        .selectAll("path")
        .data(world.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => color(lookup.get(d.properties.name) || 0))
        .attr("stroke", "#333")
        .on("mousemove", (event, d) => {
            const val = lookup.get(d.properties.name) || 0;
            tooltip.style("display", "block")
                   .style("left", (event.pageX + 8) + "px")
                   .style("top", (event.pageY + 8) + "px")
                   .html(`<strong>${d.properties.name}</strong><br>${val}`);
        })
        .on("mouseout", () => tooltip.style("display", "none"));

    svg.call(
        d3.zoom().scaleExtent([1, 5]).on("zoom", (e) =>
            svg.selectAll("path").attr("transform", e.transform)
        )
    );
}

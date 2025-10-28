export function drawMap(world, dataArr, metric = "value") {
    const width = 900, height = 450;
    const tooltip = d3.select("#tooltip");

    d3.select("#map").html("");

    const svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoMercator().fitSize([width, height], world);
    const path = d3.geoPath().projection(projection);

    const maxVal = d3.max(dataArr, d => d[metric]) || 0;
    const color = d3.scaleSequential()
        .domain([0, maxVal])
        .interpolator(d3.interpolateYlOrRd);

    const lookup = new Map(dataArr.map(d => [d.country, d[metric]]));

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

    // --- Zoom Setup ---
    const zoom = d3.zoom()
        .scaleExtent([1, 5])
        .on("zoom", (e) => svg.selectAll("path").attr("transform", e.transform));

    svg.call(zoom);
    // --- Initial Zoom ---
    const initialTranslate = [-300, -50];
    const initialScale = 1.7;
    svg.call(zoom.transform,
      d3.zoomIdentity
        .translate(initialTranslate[0], initialTranslate[1])
        .scale(initialScale)
    );
    // --- Zoom Buttons ---
    const buttonGroup = svg.append("g")
        .attr("class", "zoom-buttons")
        .attr("transform", `translate(${width - 50}, 40)`);
    const buttonData = [
        { label: "+", action: () => zoom.scaleBy(svg.transition().duration(300), 1.5) },
        { label: "−", action: () => zoom.scaleBy(svg.transition().duration(300), 1 / 1.5) },
        { label: "⟳", action: () => svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity) }
    ];

    buttonGroup.selectAll("g")
        .data(buttonData)
        .join("g")
        .attr("transform", (_, i) => `translate(0, ${i * 35})`)
        .each(function(d) {
            const g = d3.select(this);
            g.append("rect")
                .attr("width", 30)
                .attr("height", 30)
                .attr("rx", 5)
                .attr("fill", "#fff")
                .attr("stroke", "#333")
                .style("cursor", "pointer")
                .on("click", d.action);
            g.append("text")
                .attr("x", 15)
                .attr("y", 20)
                .attr("text-anchor", "middle")
                .attr("font-size", "18px")
                .text(d.label)
                .style("pointer-events", "none");
        });

    // --- End Zoom Setup ---
        // Add color bar
        // --- Color Legend ---
        const legendWidth = 200;
        const legendHeight = 10;
        const legendMargin = 40;

        // Create group for the legend (bottom-right corner)
        const legendGroup = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - legendWidth - legendMargin}, ${height - legendMargin})`);

        // Define gradient
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%");

        gradient.selectAll("stop")
        .data(d3.ticks(0, 1, 10))
        .join("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => color(d * maxVal));

        // Legend rectangle
        legendGroup.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)")
        .attr("stroke", "#333")
        .attr("rx", 3);

        // Legend scale + axis
        const legendScale = d3.scaleLinear()
        .domain([0, maxVal])
        .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickSize(4)
        .tickFormat(d3.format(".1f"));

        legendGroup.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis)
        .select(".domain").remove();

        const legendLabel = 
        metric === "value" ? "Incidents" :
        metric === "damage" ? "Economic Damage (USD)" :
        metric === "aid" ? "International Aid (USD)" :
        "Casualties";

        legendGroup.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", -6)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#333")
        .text(legendLabel);




}

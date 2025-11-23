const d3 = window.d3;
export function drawMap(world, dataArr, metric = "value") {
    const container = d3.select("#map").node();
    const width = container.getBoundingClientRect().width;
    const height = Math.round(width * 0.55);
    const unitLabel =
    metric === "damage" ? "US$ Mio." :
    metric === "aid" ? "US$ Mio." :
    "";
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

    const mapGroup = svg.append("g").attr("class", "map-group");
    mapGroup.selectAll("path")
        .data(world.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => color(lookup.get(d.properties.name) || 0))
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .on("mousemove", (event, d) => {
            const raw = lookup.get(d.properties.name) || 0;
            const displayVal = d3.format(",d")(Math.round(raw));
            tooltip.style("display", "block")
                   .style("left", (event.pageX + 8) + "px")
                   .style("top", (event.pageY + 8) + "px")
                   .html(
                    `<strong>${d.properties.name}</strong><br>` +
                    (unitLabel ? `${displayVal} (${unitLabel})` : displayVal)
        );

        })
        .on("mouseover", (event, d) => {
            const country = d.properties.name;

            //Dispatch hover event for line chart
            window.dispatchEvent(new CustomEvent("countryHover", { detail: country }));

            d3.select(event.target)
            .attr("stroke", "black")
            .attr("stroke-width", 1.5);
        })
        .on("mouseout", () => tooltip.style("display", "none"))
        .on("mouseout", (event, d) => {
             window.dispatchEvent(new CustomEvent("countryHoverEnd"));

            d3.select(event.target)
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5);
        })
        .on("click", (event, d) => {
            const countryName = d.properties.name;
            window.dispatchEvent(new CustomEvent("countrySelected", { detail: countryName }));
            });


    // --- Zoom Setup ---
    const zoom = d3.zoom()
        .scaleExtent([1, 10])
        .on("zoom", (e) => mapGroup.attr("transform", e.transform));

    svg.call(zoom);
    // --- Initial Zoom ---
    const initialTranslate = [-300, -50];
    const initialScale = 1.7;
    svg.call(
    zoom.transform,
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
    // COLOR LEGEND
    svg.selectAll(".legend-group").remove();

    const legendWidth = 180;
    const legendHeight = 12;

    const legendGroup = svg.append("g")
        .attr("class", "legend-group")
        .attr("transform", `translate(${20}, ${height - 40})`);  //bottom-left corner

    // Create gradient definition
    const defs = svg.append("defs");

    const gradient = defs.append("linearGradient")
        .attr("id", "color-legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%");

    // Fill gradient with sampled color values
    const steps = 10;
    d3.range(steps + 1).forEach(i => {
        gradient.append("stop")
            .attr("offset", `${(i / steps) * 100}%`)
            .attr("stop-color", color((i / steps) * maxVal));
    });

    // Gradient bar
    legendGroup.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#color-legend-gradient)")
        .attr("stroke", "#333")
        .attr("rx", 4);

    //Legend scale
    const legendScale = d3.scaleLinear()
        .domain([0, maxVal])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(4)
        .tickSize(4)
        .tickFormat(d3.format(".2s"));  // 1k, 10k, 1M etc.

    legendGroup.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis)
        .select(".domain").remove();

    // Legend label
    legendGroup.append("text")
    .attr("x", legendWidth / 2)
    .attr("y", -6)
    .attr("text-anchor", "middle")
    .attr("fill", "#333")
    .style("font-size", "12px")
    .text(
        metric === "value" ? "Incidents" :
        metric === "damage" ? "Economic Damage (in US$ Mio.)" :
        metric === "aid" ? "International Aid (in US$ Mio.)" :
        "Casualties"
    );




}

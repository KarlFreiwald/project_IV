const d3 = window.d3;

export function drawLine(data, metric, countries) {
    // Remove previous contents
    d3.select("#empty-space").html("");

    // --- If no countries are selected, show a neutral message ---
    if (!countries || countries.length === 0) {
        d3.select("#empty-space")
            .append("svg")
            .attr("width", 300)
            .attr("height", 150)
            .append("text")
            .attr("x", 150)
            .attr("y", 75)
            .attr("text-anchor", "middle")
            .attr("fill", "#666")
            .style("font-size", "16px")
            .text("Please select a country on the map");
        return;
    }

    // --- Filter dataset to only include selected countries ---
    const filtered = data.filter(d => countries.includes(d.country));

    // Group by country
    const grouped = d3.groups(filtered, d => d.country);

    // --- Chart setup ---
    const container = d3.select("#empty-space").node();
    const width = container.getBoundingClientRect().width;
    const containerHeight = container.getBoundingClientRect().height;
    const height = containerHeight - 50;  // leave 50px of space for the button
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };

    // Color scale for multiple country lines
    const color = d3.scaleOrdinal()
        .domain(countries)
        .range(d3.schemeCategory10);

    const svg = d3.select("#empty-space")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // --- Aggregate yearly data for each selected country ---
    const series = grouped.map(([country, values]) => {
        const yearly = d3.rollups(
            values,
            v => ({
                value: v.length,
                damage: d3.sum(v, d => d.damage),
                aid: d3.sum(v, d => d.aid),
                casualties: d3.sum(v, d => d.casualties)
            }),
            d => d.year
        )
        .map(([year, vals]) => ({ year, value: vals[metric] }))
        .sort((a, b) => a.year - b.year);

        return { country, values: yearly };
    });

    // --- Compute X & Y domains ---
    const allYears = series.flatMap(s => s.values.map(v => v.year));
    const x = d3.scaleLinear()
        .domain(d3.extent(allYears))
        .range([margin.left, width - margin.right]);

    const maxY = d3.max(series, s => d3.max(s.values, v => v.value));
    const y = d3.scaleLinear()
        .domain([0, maxY])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // --- Line generator ---
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value));

    // --- Draw X axis ---
    const [minYear, maxYear] = d3.extent(allYears);
    // Create ticks dynamically (1 tick per year)
    const yearTicks = d3.range(minYear, maxYear + 1);

    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(
            d3.axisBottom(x)
                .tickFormat(d3.format("d"))
                .tickValues(yearTicks) // dynamic ticks
        );


    // --- Draw Y axis ---
    const yAxisG = svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y).ticks(5));

    // Y label
    const metricLabel =
        metric === "value" ? "Incidents" :
        metric === "damage" ? "Economic Damage (M USD)" :
        metric === "aid" ? "International Aid (M USD)" :
        "Casualties";

    yAxisG.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height - margin.bottom + margin.top) / 2)
        .attr("y", -45)
        .attr("fill", "#333")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text(metricLabel);

    // --- Chart title ---
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .style("font-size", "15px")
        .style("font-weight", "bold")
        .text(`${metricLabel} - Selected Countries`);

    // --- Draw all country lines ---
    svg.selectAll(".line-country")
        .data(series)
        .enter()
        .append("path")
        .attr("class", "line-country")
        .attr("fill", "none")
        .attr("stroke", d => color(d.country))
        .attr("stroke-width", 2.5)
        .attr("d", d => line(d.values));

    // --- Add legend ---
    const legend = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    legend.selectAll("text")
        .data(series)
        .enter()
        .append("text")
        .attr("x", 15)
        .attr("y", (_, i) => i * 18)
        .attr("fill", d => color(d.country))
        .style("font-size", "12px")
        .text(d => d.country);
}

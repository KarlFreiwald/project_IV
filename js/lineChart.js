const d3 = window.d3;

export function drawLine(data, metric) {
    // 1. Setup
    const container = d3.select("#empty-space").node();
    const width = Math.max(300, container.getBoundingClientRect().width);
    const height = 350;
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };

    d3.select("#empty-space").html(""); // Clear the container

    const svg = d3.select("#empty-space")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // 2. Data Filtering and Aggregation
    // The input 'data' here is already filtered by year/type/severity.
    // We need to roll up this data *by year* for the line chart.
    
    // Filter for USA only
    const usaData = data.filter(d => d.country === "USA");
    
    // Rollup data by year to sum the metrics
    const yearlyData = d3.rollups(
        usaData,
        v => ({
            value: v.length, // Incidents
            damage: d3.sum(v, d => d.damage),
            aid: d3.sum(v, d => d.aid),
            casualties: d3.sum(v, d => d.casualties)
        }),
        d => d.year // Group by year
    )
    .map(([year, values]) => ({ year: year, value: values[metric] })); // Extract the relevant metric

    // Handle case where no data is available
    if (yearlyData.length === 0) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#666")
            .text(`No data available for USA in this selection.`);
        return;
    }

    // Sort by year for correct line drawing
    yearlyData.sort((a, b) => a.year - b.year);


    // 3. Define Scales
    const x = d3.scaleLinear()
        .domain(d3.extent(yearlyData, d => d.year)) // Use the min/max year in the filtered data
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(yearlyData, d => d.value) || 0])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // 4. Define Line Generator
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value));

    // 5. Draw Axes
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")).tickValues(d3.extent(yearlyData, d => d.year))); // Show only start/end year

    const yAxisG = svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y).ticks(5));

    // Y Axis Label
    const metricLabel = metric === 'value' ? 'Incidents' : 
                        metric === 'damage' ? 'Economic Damage (M USD)' : 
                        metric === 'aid' ? 'International Aid (M USD)' : 
                        'Casualties';
    
    yAxisG.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', - (height - margin.bottom + margin.top) / 2)
        .attr('y', -45)
        .attr('fill', '#333')
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .text(metricLabel);

    // Chart Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text(`Time Series for USA: ${metricLabel}`);

    // 6. Draw the Line
    svg.append("path")
        .datum(yearlyData)
        .attr("fill", "none")
        .attr("stroke", "#0077cc")
        .attr("stroke-width", 2.5)
        .attr("d", line);
}
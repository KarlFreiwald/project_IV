const d3 = window.d3;
export function drawBar(data, tab) {
    const container = d3.select("#bar").node();
    const width = Math.max(300, container.getBoundingClientRect().width);
    const height = 350;
    const margin = { top: 20, right: 30, bottom: 80, left: 50 };
    const key = tab === 'incidents' ? 'value' : tab; // map UI tab to data key
    
    // Sort the data and get only the top 10
    const sorted = [...data].sort((a, b) => (b[key] || 0) - (a[key] || 0));
    const top10Data = sorted.slice(0, 10); // <-- MODIFICATION: Get top 10
    
    const tooltip = d3.select('#tooltip');
    d3.select("#bar").html("");

    const svg = d3.select("#bar")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .range([margin.left, width - margin.right])
        .padding(0.2)
        .domain(top10Data.map(d => d.country)); // <-- MODIFICATION: Use top10Data

    const y = d3.scaleLinear()
        .domain([0, d3.max(top10Data, d => d[key]) || 0]) // <-- MODIFICATION: Use top10Data
        .nice()
        .range([height - margin.bottom, margin.top]);

    svg.selectAll("rect")
        .data(top10Data) // <-- MODIFICATION: Use top10Data
        .join("rect")
        .attr("x", d => x(d.country))
        .attr("y", d => y(d[key] || 0))
        .attr("height", d => Math.max(0, (height - margin.bottom) - y(d[key] || 0)))
        .attr("width", x.bandwidth())
        .attr("fill", (tab === "incidents" ? "#0077cc" : "#e34a33"))
        .on('mousemove', (event, d) => {
            const formats = {
                value: d3.format(',d'),
                casualties: d3.format(',d'),
                damage: d3.format(',.2f'),
                aid: d3.format(',.2f')
            };
            const fmt = formats[key] || d3.format(',d');
            tooltip
                .style('display', 'block')
                .style('left', (event.pageX + 8) + 'px')
                .style('top', (event.pageY + 8) + 'px')
                .html(`<strong>${d.country}</strong><br>${fmt(d[key] || 0)}`);
        })
        .on('mouseout', () => tooltip.style('display', 'none'));

    // X axis with country names
    const xAxis = d3.axisBottom(x);
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .attr("dx", "-0.5em")
        .attr("dy", "0.1em");

    // Y axis with ticks
    const yAxis = d3.axisLeft(y).ticks(5).tickSizeOuter(0);
    const yAxisG = svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(yAxis);

    // Y axis label/description
    const yLabel =
        key === 'value' ? 'Incidents' :
        key === 'damage' ? 'Economic Damage (million USD)' :
        key === 'aid' ? 'International Aid (million USD)' :
        'Casualties';
    yAxisG.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', - (height - margin.bottom + margin.top) / 2)
        .attr('y', -40)
        .attr('fill', '#333')
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .text(yLabel);
}
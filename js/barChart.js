const d3 = window.d3;
export function drawBar(data, tab) {
    const container = d3.select("#bar").node();
    const width = Math.max(300, container.getBoundingClientRect().width);
    const height = 350;
    const margin = { top: 20, right: 30, bottom: 80, left: 50 };
    
    // 1. Define the metrics to plot and a color scale
    const metrics = ['damage', 'aid'];
    const color = d3.scaleOrdinal()
        .domain(metrics)
        .range(['#e34a33', '#0077cc']); // Red for Damage, Blue for Aid
    
    // Sort the data by damage (since the user requested top 10 by economic damage)
    const key = 'damage'; 
    const sorted = [...data].sort((a, b) => (b[key] || 0) - (a[key] || 0));
    const top10Data = sorted.slice(0, 10);
    
    const tooltip = d3.select('#tooltip');
    d3.select("#bar").html("");

    const svg = d3.select("#bar")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // 2. Define the Outer X Scale (for Countries)
    const x = d3.scaleBand()
        .range([margin.left, width - margin.right])
        .padding(0.2)
        .domain(top10Data.map(d => d.country));

    // 3. Define the Inner X Scale (for the two metrics within each country group)
    const x1 = d3.scaleBand()
        .domain(metrics)
        .range([0, x.bandwidth()])
        .padding(0.05);

    // 4. Define the Y Scale (domain based on the maximum of EITHER metric)
    const maxVal = d3.max(top10Data, d => d3.max(metrics, m => d[m]));

    const y = d3.scaleLinear()
        .domain([0, maxVal || 0])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // 5. Group the data by country and draw the two bars per group
    const barGroup = svg.append("g")
        .selectAll("g")
        .data(top10Data)
        .join("g")
            .attr("transform", d => `translate(${x(d.country)}, 0)`);

    barGroup.selectAll("rect")
        // Map the country data into two objects (one for damage, one for aid)
        .data(d => metrics.map(m => ({ 
            metric: m, 
            country: d.country, 
            value: d[m] || 0,
            label: m === 'damage' ? 'Economic Damage' : 'International Aid'
        })))
        .join("rect")
            .attr("x", d => x1(d.metric))
            .attr("y", d => y(d.value))
            .attr("width", x1.bandwidth())
            .attr("height", d => Math.max(0, (height - margin.bottom) - y(d.value)))
            .attr("fill", d => color(d.metric))
            .on('mousemove', (event, d) => {
                const fmt = d3.format(',.2f'); // Using .2f since both metrics are in millions USD
                tooltip
                    .style('display', 'block')
                    .style('left', (event.pageX + 8) + 'px')
                    .style('top', (event.pageY + 8) + 'px')
                    .html(`<strong>${d.country}</strong><br>${d.label}: ${fmt(d.value)}`);
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
    const yLabel = 'Value (million USD)'; // Combined label
    yAxisG.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', - (height - margin.bottom + margin.top) / 2)
        .attr('y', -40)
        .attr('fill', '#333')
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .text(yLabel);

    // 6. Add a basic legend for the two metrics
    const legend = svg.append('g')
        .attr('transform', `translate(${width - margin.right - 100}, 20)`);

    legend.selectAll('rect')
        .data(metrics)
        .join('rect')
            .attr('x', 0)
            .attr('y', (d, i) => i * 20)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', d => color(d));

    legend.selectAll('text')
        .data(metrics)
        .join('text')
            .attr('x', 15)
            .attr('y', (d, i) => i * 20 + 9)
            .attr('fill', '#333')
            .style('font-size', '11px')
            .text(d => d === 'damage' ? 'Economic Damage' : 'International Aid');
}
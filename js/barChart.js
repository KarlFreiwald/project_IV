const d3 = window.d3;
export function drawBar(data, tab) {
    const container = d3.select("#bar").node();
    const width = Math.max(300, container.getBoundingClientRect().width);
    const height = 350;
    const margin = { top: 20, right: 30, bottom: 80, left: 50 };
    const key = tab === 'incidents' ? 'value' : tab; // map UI tab to data key
    const sorted = [...data].sort((a, b) => (b[key] || 0) - (a[key] || 0));
    d3.select("#bar").html("");

    const svg = d3.select("#bar")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .range([margin.left, width - margin.right])
        .padding(0.2)
        .domain(sorted.map(d => d.country));

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[key]) || 0])
        .range([height - margin.bottom, margin.top]);

    svg.selectAll("rect")
        .data(sorted)
        .join("rect")
        .attr("x", d => x(d.country))
        .attr("y", d => y(d[key] || 0))
        .attr("height", d => Math.max(0, (height - margin.bottom) - y(d[key] || 0)))
        .attr("width", x.bandwidth())
        .attr("fill", (tab === "incidents" ? "#0077cc" : "#e34a33"));

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
}

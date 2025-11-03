const d3 = window.d3;
export function drawBar(data, tab) {
    const container = d3.select("#bar").node();
    const width = Math.max(300, container.getBoundingClientRect().width);
    const height = 350;
    const key = tab === 'incidents' ? 'value' : tab; // map UI tab to data key
    d3.select("#bar").html("");

    const svg = d3.select("#bar")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .range([50, width-30])
        .padding(0.2)
        .domain(data.map(d => d.country));

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[key]) || 0])
        .range([height-40, 20]);

    svg.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", d => x(d.country))
        .attr("y", d => y(d[key] || 0))
        .attr("height", d => Math.max(0, (height-40) - y(d[key] || 0)))
        .attr("width", x.bandwidth())
        .attr("fill", (tab === "incidents" ? "#0077cc" : "#e34a33"));
}

const d3 = window.d3;
export function drawBar(data, tab) {
    const width = 900, height = 350;
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
        .domain([0, d3.max(data, d => d[tab])])
        .range([height-40, 20]);

    svg.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", d => x(d.country))
        .attr("y", d => y(d[tab]))
        .attr("height", d => (height-40) - y(d[tab]))
        .attr("width", x.bandwidth())
        .attr("fill", tab === "value" ? "#0077cc" : "#e34a33");
}

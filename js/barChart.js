export function drawBarChart(data) {
    const width = 600, height = 400;
    
    const svg = d3.select("#bar")
        .html("")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([40, width-20])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range([height-30, 20]);

    svg.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", d => x(d.country))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => (height-30) - y(d.value))
        .attr("fill", "#d95f02");
}

var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

d3.json("data/HKUST_coauthor_graph.json", function(error, graph) {
    if (error) throw error;
    const svg1 = d3.select('#nodeLink svg'),
        width = +svg1.attr('width'),
        height = +svg1.attr('height');

    var cseid = graph.nodes.filter(e => e.dept === "CSE").map(e => e.id);
    var data = {
        nodes: graph.nodes.filter(e => e.dept === "CSE"),
        edges: graph.edges.filter(e => cseid.indexOf(e.source) >= 0 && cseid.indexOf(e.target) >= 0)
    };

    for (var item in data.nodes){
        var connections=[]
        connections.push(data.edges.filter(l => (l.target == data.nodes[item].id || l.source == data.nodes[item].id)))
        data.nodes[item].collaborators = connections[0].length;
    }
    data.nodes.map(e => {
        e.collaborator = data.edges.filter(f => f.source === e.id || f.target === e.id).map(f => {
            var cObj = {};
            if (f.target === e.id) {
                cObj.id = f.source;
            }
            else {
                cObj.id = f.target;
            }
            cObj.publications = f.publications;
            return cObj;
        });
    })

    const simulation = d3.forceSimulation()
        .nodes(data.nodes)
        .force('link', d3.forceLink().id(d => d.id))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width /2, height/2))
        .on('tick', ticked);

    simulation.force('link')
        .links(data.edges);

    const R = 4;

    let link = svg1.selectAll('line')
        .data(data.edges)
        .enter().append('line');

    link
        .attr('class', 'link')
        .on('mouseover.tooltip', function(d) {
            tooltip.transition()
                .duration(300)
                .style("opacity", .8);
            tooltip.html("Source:"+data.nodes.filter(e => e.id === d.source.id)[0].fullname +
                "<p/>Target:" +data.nodes.filter(e => e.id === d.target.id)[0].fullname +
                "<p/>Collaborations:"  + d.publications.length)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 10) + "px");
        })
        .on("mouseout.tooltip", function() {
            tooltip.transition()
                .duration(100)
                .style("opacity", 0);
        })
        .on('mouseout.fade', fade(1))
        .on("mousemove", function() {
            tooltip.style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 10) + "px");
        });
    ;

    let node = svg1.selectAll('.node')
        .data(data.nodes)
        .enter().append('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));;

    node.append('circle')
        .attr('r', function(d) { console.log(d.collaborators);return d.collaborators+R ; })
        .attr("fill", 'yellow')
        .on("mouseover", nodeLinkHighlight())
        .on("mouseout", nodeLinkReset)
        .on('mouseover.tooltip', function(d) {
            tooltip.transition()
                .duration(300)
                .style("opacity", .8);
            tooltip.html("Name:" + d.fullname +
                "<p/>Id:"  + d.id)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 10) + "px");
        })
        .on('mouseover.fade', fade(0.1))
        .on("mouseout.tooltip", function() {
            tooltip.transition()
                .duration(100)
                .style("opacity", 0);
        })
        .on('mouseout.fade', fade(1))
        .on('mouseout.fade2', console.log("linkedByIndex"))
        .on("mousemove", function() {
            tooltip.style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 10) + "px");
        })
        .on('dblclick',releasenode)

    node.append('text')
        .attr('x', 0)
        .attr('dy', '.25em')
        .text(d => d.name);

    function ticked() {
        link
            .attr('x1', d => d.source.x/0.7)
            .attr('y1', d => d.source.y/0.7)
            .attr('x2', d => d.target.x/0.7)
            .attr('y2', d => d.target.y/0.7);

        node
            .attr('transform', d => `translate(${d.x/0.7},${d.y/0.7})`);
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
    }
    function releasenode(d) {
        d.fx = null;
        d.fy = null;
    }

    const linkedByIndex = {};
    data.edges.forEach(d => {
        linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
    });

    function isConnected(a, b) {
        return linkedByIndex[`${a.index},${b.index}`] || linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
    }

    function fade(opacity) {

        return d => {
            console.log("fade");
            console.log(d);
            node.style('stroke-opacity', function (o) {

                console.log("isConnected",d , o);
                console.log(isConnected(d, o));

                const thisOpacity = isConnected(d, o) ? 1 : opacity;
                this.setAttribute('fill-opacity', thisOpacity);
                return thisOpacity;
            });

            link.style('stroke-opacity', o => (o.source === d || o.target === d ? 1 : opacity));

        };
    }

    // Matrix view
    var matrixMargin = { top: 150, right: 100, bottom: 10, left: 150 },
        matrixWidth = 800 - matrixMargin.left - matrixMargin.right,
        matrixHeight = 800 - matrixMargin.top - matrixMargin.bottom;
    var legendSize = { height: 150, width: 20};
    var matrixSvg = d3.select("#matrix svg")
        .attr("width", matrixWidth + matrixMargin.left + matrixMargin.right)
        .attr("height", matrixHeight + matrixMargin.top + matrixMargin.bottom);

    var matrixG = matrixSvg.append("g")
        .attr("transform", "translate(" + matrixMargin.left + "," + matrixMargin.top + ")");

    var color = d3.scaleSequential(d3.interpolateRainbow);
    console.log(color)
    var nameScale = d3.scaleBand();
    var idScale = d3.scaleBand();
    var colorScale = d3.scaleLinear();

    // Create legeng
    var defs = matrixSvg.append("defs");
    defs.append("linearGradient")
    // Vertical gradient
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%")
        .attr("id", "linear-gradient")
        .selectAll("stop")
        .data(color.ticks().reverse().map((t, i, n) => ({ offset: i/n.length, color: color(t) })))
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);
    var legend = matrixG.append('g')
        .attr("transform", "translate("+(matrixWidth + 10 + legendSize.width)+",0)")
    legend.append("rect")
        .attr("width", legendSize.width)
        .attr("height", legendSize.height)
        .style("fill", "url(#linear-gradient)");
    var colorAxis = legend.append('g').attr("transform", "translate(" + legendSize.width + ",0)");


    var numRange = d3.extent(data.nodes.map(e => e.collaborators));
    color.domain(numRange);

    nameScale.domain(data.nodes.map(e => e.fullname)).range([0, matrixWidth]);
    idScale.domain(data.nodes.map(e => e.id)).range([0, matrixWidth]);
    colorScale.domain(color.domain()).range([legendSize.height, 0]);

    var xAxis = matrixG.append("g");
    xAxis.call(d3.axisTop(nameScale)).selectAll("text").style("text-anchor", "start").attr("transform", "translate(12,-10) rotate(-90)");
    var yAxis = matrixG.append("g");
    yAxis.call(d3.axisLeft(nameScale));
    colorAxis.call(d3.axisRight(colorScale));



    var matrixGG = matrixG.append("g")
        .selectAll("g")
        .data(data.nodes)
        .enter()

    var rects = matrixGG.selectAll("rect")
        .data(d => { d.collaborator.forEach(e => e.source = d.id); return d.collaborator;})
        .enter()
        .append("rect")
        .attr("x", d => idScale(d.id))
        .attr("y", d => idScale(d.source))
        .attr("width", nameScale.bandwidth())
        .attr("height", nameScale.bandwidth())
        .attr("fill", d => color(d.publications.length))
        .on("mouseover", matrixHighlight())
        .on("mouseout", matrixReset);

    function sortByName(a, b) {
        return d3.ascending(a.fullname, b.fullname);
    }
    data.nodes.sort(sortByName);
    // Update axis
    nameScale.domain(data.nodes.map(e => e.fullname)).range([0, matrixWidth]);
    idScale.domain(data.nodes.map(e => e.id)).range([0, matrixWidth]);

    xAxis.transition().duration(750).delay((d, i) => i * 20).call(d3.axisTop(nameScale)).selectAll("text").style("text-anchor", "start").attr("transform", "translate(12,-10) rotate(-90)");
    yAxis.transition().duration(750).delay((d, i) => i * 20).call(d3.axisLeft(nameScale));
    rects
        .order()
        .transition()
        .duration(750)
        .delay((d, i) => i * 20)
        .attr("x", d => idScale(d.id))
        .attr("y", d => idScale(d.source));

    function nodeLinkHighlight() {
        return function(d) {
            rects.style("opacity", e => e.id === d.id || e.source === d.id ? 1 : 0);
            node.style("stroke-opacity", function(e) {
                if (e.id === d.id) {
                    return 1;
                }
                return d.collaborators.find(function(f) { return f.id === e.id }) === undefined ? 0.2 : 1;
            });
            node.style("fill-opacity", function(e) {
                if (e.id === d.id) {
                    return 1;
                }
                return d.collaborators.find(function(f) { return f.id === e.id }) === undefined ? 0.2 : 1;
            });
            link.style("stroke-opacity", function(e) {
                return e.source.id === d.id || e.target.id === d.id ? 1 : 0.2;
            });
        }
    }

    function nodeLinkReset() {
        node.style("stroke-opacity", 1);
        node.style("fill-opacity", 1);
        link.style("stroke-opacity", 1);
        rects.style("opacity", 1);
    }

    function matrixHighlight() {
        return function(d) {
            rects.style("opacity", e => e.id === d.id && e.source === d.source ? 1 : 0);
            node.style("stroke-opacity", function(e) {
                if (e.id === d.id || e.id === d.source) {
                    return 1;
                }
                return 0.2;
            });
            node.style("fill-opacity", function(e) {
                if (e.id === d.id || e.id === d.source) {
                    return 1;
                }
                return 0.2;
            });
            link.style("stroke-opacity", function(e) {
                return e.source.id === d.id && e.target.id === d.source || e.source.id === d.source && e.target.id === d.id ? 1 : 0.2;
            });
            link.style("stroke-width", function(e) {
                return e.source.id === d.id && e.target.id === d.source || e.source.id === d.source && e.target.id === d.id ? 1 + e.publications.length : 1;
            });
        }
    }

    function matrixReset() {
        node.style("stroke-opacity", 1);
        node.style("fill-opacity", 1);
        link.style("stroke-width", 1)
        link.style("stroke-opacity", 1);
        rects.style("opacity", 1);
    }
})

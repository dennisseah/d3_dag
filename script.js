var colors = d3.scaleOrdinal(d3.schemeCategory10);
var SVG_ID = "dag";

// create tooltip
var div_tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// create DAG
function createGraph() {
  var svg = d3
    .select("body")
    .append("svg")
    .attr("id", SVG_ID)
    .attr("width", window.innerWidth)
    .attr("height", window.innerHeight);
  var width = +svg.attr("width");
  var height = +svg.attr("height");
  var node, link;

  // create the arrow heads
  svg
    .append("defs")
    .append("marker")
    .attrs({
      id: "arrowhead",
      viewBox: "-0 -5 10 10",
      refX: 16,
      refY: 0,
      orient: "auto",
      markerWidth: 8,
      markerHeight: 8,
      xoverflow: "visible",
    })
    .append("svg:path")
    .attr("d", "M 0,-5 L 10 ,0 L 0,5")
    .attr("fill", "#999")
    .style("stroke", "none");

  // for arranging the graph using force
  simulation = d3
    .forceSimulation()
    .force(
      "link",
      d3
        .forceLink()
        .id(function (d) {
          return d.id;
        })
        .distance(150) // up this number if want to have node push apart more
        .strength(2)
    )
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

  // this is where we get the data
  d3.json("data/graph.json").then(function (graph) {
    update(graph.links, graph.nodes);
  });

  function update(links, nodes) {
    link = svg
      .selectAll(".link")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("marker-end", "url(#arrowhead)");

    edgepaths = svg
      .selectAll(".edgepath")
      .data(links)
      .enter()
      .append("path")
      .attrs({
        class: "edgepath",
        id: function (d, i) {
          return "edgepath" + i;
        },
      });

    svg
      .selectAll(".link")
      .on("mouseover", function (d) {
        div_tooltip.transition().duration(200).style("opacity", 0.9);
        div_tooltip
          .html(d.source.name + " to<br/>" + d.target.name)
          .style("left", d3.event.pageX + "px")
          .style("top", d3.event.pageY - 28 + "px");
      })
      .on("mouseout", function (d) {
        div_tooltip.transition().duration(500).style("opacity", 0);
      });

    edgelabels = svg
      .selectAll(".edgelabel")
      .data(links)
      .enter()
      .append("text")
      .attr("dy", -4)
      .attrs({
        class: "edgelabel",
        id: function (d, i) {
          return "edgelabel" + i;
        },
      });

    edgelabels
      .append("textPath")
      .attr("xlink:href", function (d, i) {
        return "#edgepath" + i;
      })
      .style("pointer-events", "none")
      .attr("text-anchor", "middle")
      .attr("startOffset", "50%") // centered the text to the edge
      .text(function (d) {
        return d.val;
      });

    node = svg
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag().on("start", dragstarted).on("drag", dragged))
      // tooltip
      .on("mouseover", function (d) {
        div_tooltip.transition().duration(200).style("opacity", 0.9);
        div_tooltip
          .html(d.name + "<br/>" + d.location)
          .style("left", d3.event.pageX + "px")
          .style("top", d3.event.pageY - 28 + "px");
      })
      .on("mouseout", function (d) {
        div_tooltip.transition().duration(500).style("opacity", 0);
      });

    node
      .append("circle")
      .attr("r", 10)
      .style("fill", "#fff")
      .style("stroke-width", 5)
      .style("stroke-opacity", 0.7)
      .style("stroke", function (d, i) {
        return d.type === "friend" ? "green" : "red";
      });

    node
      .append("text")
      .attr("dx", 12)
      .attr("dy", 8)
      .text(function (d) {
        return d.name;
      });

    simulation.nodes(nodes).on("tick", ticked);
    simulation.force("link").links(links);
  }

  function ticked() {
    link
      .attr("x1", function (d) {
        return d.source.x;
      })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });

    node.attr("transform", function (d) {
      return "translate(" + d.x + ", " + d.y + ")";
    });

    edgepaths.attr("d", function (d) {
      return (
        "M " +
        d.source.x +
        " " +
        d.source.y +
        " L " +
        d.target.x +
        " " +
        d.target.y
      );
    });

    edgelabels.attr("transform", function (d) {
      if (d.target.x < d.source.x) {
        var bbox = this.getBBox();

        rx = bbox.x + bbox.width / 2;
        ry = bbox.y + bbox.height / 2;
        return "rotate(180 " + rx + " " + ry + ")";
      }
      return "rotate(0)";
    });
  }

  function dragstarted(d) {
    if (!d3.event.active) {
      simulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  var resizeTimer;
  window.onresize = function (e) {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var elm = document.getElementById(SVG_ID);
      // elm.parentNode.removeChild(elm);
      // createGraph();

      d3.select("#" + SVG_ID)
        .attr("width", window.innerWidth)
        .attr("height", window.innerHeight);
      simulation
        .force("center")
        .x(window.innerWidth / 2)
        .y(window.innerHeight / 2);

      simulation.alpha(0.3).restart();
    }, 500);
  };
}

createGraph();

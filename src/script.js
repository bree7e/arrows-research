/////////////////////
// SIMPLE EXAMPLE! //
/////////////////////

// Define some arrows

const swoopy = swoopyArrow()
  .angle(Math.PI / 4)
  .x(d => d[0])
  .y(d => d[1]);

// Set up container
const svg = d3
  .select("body")
  .append("svg")
  .attr("xmlns", "http://www.w3.org/2000/svg")
  .classed("arrow-container", true)
  .style("position", "absolute")
  .style("top", "0")
  .style("left", "0")
  .style("width", "100%")
  .style("height", "100%")
  .style("overflow", "visible")
  .style("pointer-events", "none");

// Define simple arrowhead marker
svg
  .append("defs")
  .append("marker")
  .attr("id", "arrowhead")
  .attr("viewBox", "-10 -10 20 20")
  .attr("refX", 0)
  .attr("refY", 0)
  .attr("markerWidth", 20)
  .attr("markerHeight", 20)
  .attr("stroke-width", 1)
  .attr("orient", "auto")
  .append("polyline")
  .attr("stroke-linejoin", "bevel")
  .attr("points", "-6.75,-6.75 0,0 -6.75,6.75");

d3.select(".swoopy svg")
  .append("path")
  .attr("class", "arrow")
  .attr("marker-end", "url(#arrowhead)")
  .datum([
    [0, 0],
    [200, 200]
  ])
  .attr("d", swoopy);

///////////////////////
// ADVANCED EXAMPLE! //
///////////////////////

// Returns four points at the corners of an element
function getCorners(element) {
  var box = element.getBoundingClientRect();
  var corners = [
    ["left", "top"],
    ["left", "bottom"],
    ["right", "top"],
    ["right", "bottom"]
  ];
  return corners.map(function(corner) {
    return [box[corner[0]] + window.pageXOffset, box[corner[1]] + window.pageYOffset];
  });
}

// Returns four points at the midpoints of the edges of an element
function getEdgeMidpoints(element) {
  var box = element.getBoundingClientRect();
  var edges = [
    [box.left, (box.top + box.bottom) / 2],
    [box.right, (box.top + box.bottom) / 2],
    [(box.left + box.right) / 2, box.top],
    [(box.left + box.right) / 2, box.bottom]
  ];
  edges.forEach(function(edge) {
    edge.x += window.pageXOffset;
    edge.y += window.pageYOffset;
  });
  return edges;
}

// Given two sets of points, find the closest pair
function getClosest(fromCandidates, toCandidates) {
  var fromClosest, toClosest, shortestDistance;
  fromCandidates.forEach(function(from) {
    toCandidates.forEach(function(to) {
      var thisDistance = hypotenuse(to[0] - from[0], to[1] - from[1]);
      if (!shortestDistance || thisDistance < shortestDistance) {
        shortestDistance = thisDistance;
        fromClosest = from;
        toClosest = to;
      }
    });
  });
  return [fromClosest, toClosest];
  function hypotenuse(a, b) {
    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
  }
}

// Draw a swoopy arrow between two elements,
// snapping to the nearest corners or edge midpoints on their bounding boxes.

// Find nearest two points
const fromElement = d3.select(".a").node();
const toElement = d3.select(".b").node();
const fromCandidates = [].concat(getCorners(fromElement), getEdgeMidpoints(fromElement));
const toCandidates = [].concat(getCorners(toElement), getEdgeMidpoints(toElement));
const points = getClosest(fromCandidates, toCandidates);

// Draw the arrow, with a transition drawing animation
svg
  .append("path")
  .attr("class", "arrow")
  .attr("marker-end", "url(#arrowhead)")
  .datum(points)
  .attr("d", swoopy)
  .style("opacity", 0)
  .style("stroke-dasharray", function() {
    return this.getTotalLength();
  })
  .style("stroke-dashoffset", function() {
    return this.getTotalLength();
  })
  .transition()
  .delay(250)
  .duration(2000)
  .style("opacity", 1)
  .style("stroke-dashoffset", 0);

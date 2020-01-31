function arrowConnector() {

  var svg, arrows;

  var lineTypes = {
    // "straight": d3.svg.line().x(ƒ('x')).y(ƒ('y')),
    "swoopy": swoopyArrow().degrees(Math.PI/4),
    "kooky": kooky,
    "loopy": loopy,
    "random": randLine
  }

  function randLine() {
    var lineTypeKeys = Object.keys(lineTypes);
    var lineTypeIndex = Math.floor(Math.random()*lineTypeKeys.length);
    return lineTypes[lineTypeKeys[lineTypeIndex]].apply(this, arguments);
  }

  var lineType = 'random',
      considerCorners = false,
      considerEdges = true;

  function render() {

    if(d3.select(".arrow-connector-container").empty()) {
      svg = d3.select("body").append("svg")
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .classed("arrow-connector-container", true)
        .style("position", "absolute")
        .style("top", "0")
        .style("left", "0")
        .style("width", "100%")
        .style("height", "100%")
        .style("overflow", "visible")
        .style("pointer-events", "none");

      // arrowhead def
      svg.append('defs')
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

    } else {
      svg = d3.select(".arrow-connector-container");
    }

    arrows = svg.selectAll("path")
      .data(getTargets(getPairs(d3.select("body"))));

    arrows.enter()
      .append("path")
      .classed("arrow-connector", true)
      .attr("d", lineTypes[lineType])
      .attr('marker-end', 'url(#arrowhead)')
      .style('opacity', 1)
      .style('stroke-dasharray', function() { return this.getTotalLength(); })
      .style('stroke-dashoffset', 0);
  }

  function getPairs(sel) {
    var pairs = [];
    sel.selectAll("[data-arrow-target]")
      .each(function(d,i) {
        var from = this;
        d3.selectAll(this.dataset.arrowTarget).each(function(dd,ii) {
          var to = this;
          pairs.push([from,to]);
        });
      });
    return pairs;
  }

  function getTargets(elementPairs) {
    var targets = [];
    elementPairs.forEach(function(pair) {

      var fromCandidates = [];
      var toCandidates = [];

      if(considerEdges) {
        fromCandidates = fromCandidates.concat(getEdges(pair[0]));
        toCandidates = toCandidates.concat(getEdges(pair[1]));
      }

      if(considerCorners) {
        fromCandidates = fromCandidates.concat(getCorners(pair[0]));
        toCandidates = toCandidates.concat(getCorners(pair[1]));
      }

      // debugger

      // check all possible combinations of eligible endpoints for the shortest distance
      var fromClosest, toClosest, distance;
      fromCandidates.forEach(function(from) {
        toCandidates.forEach(function(to) {
          if(distance == null || hypotenuse( to.x-from.x, to.y-from.y ) < distance) {
            distance = hypotenuse( to.x-from.x, to.y-from.y );
            fromClosest = from;
            toClosest = to;
          }
        });
      });

      targets.push([fromClosest,toClosest]);
    })
    return targets;
  }

  // gets from the sides of a bounding rect (left, right, top, bottom)
  // to its corners (topleft, topright, bottomleft, bottomright)
  function getCorners(element) {
    var corners = [];
    ["left","right"].forEach(function(i) { ["top","bottom"].forEach(function(j) { corners.push({"x":i,"y":j}); }); });
    return corners.map(function(corner) {
      return {
        "x": element.getBoundingClientRect()[corner.x] + window.pageXOffset,
        "y": element.getBoundingClientRect()[corner.y] + window.pageYOffset,
        "ref": element
      };
    });
  }

  // get the midpoints of the four edges of a box — inelegant but readable!
  // (lmk when you seriously need to generalize to n-gons in m dimensions...)
  function getEdges(el) {
    var box = el.getBoundingClientRect();
    var edges = [
      {
        "x": box.left,
        "y": (box.top + box.bottom) / 2
      },
      {
        "x": box.right,
        "y": (box.top + box.bottom) / 2
      },
      {
        "x": (box.left + box.right) / 2,
        "y": box.top
      },
      {
        "x": (box.left + box.right) / 2,
        "y": box.bottom
      }
    ];
    edges.forEach(function(edge) {
      edge.x += window.pageXOffset;
      edge.y += window.pageYOffset;
      edge.ref = el;
    });
    return edges;
  }

  // this seems good to have
  function hypotenuse(a, b) {
    return Math.sqrt( Math.pow(a,2) + Math.pow(b,2) );
  }

  render.edges = function(_) {
    if (!arguments.length) return considerEdges;
    considerEdges = _;
    return render;
  };

  render.corners = function(_) {
    if (!arguments.length) return considerCorners;
    considerCorners = _;
    return render;
  };

  render.type = function(_) {
    if (!arguments.length) return lineType;
    lineType = _;
    return render;
  };

  return render;

}

function swoopyArrow() {
  'use strict';

  var degrees = Math.PI,
      clockwise = true

  function arrow(data) {
    // get the chord length ("height" {h}) between points
    var h = hypotenuse(data[1].x-data[0].x, data[1].y-data[0].y)

    // get the distance at which chord of height h subtends {angle} degrees
    var d = h / ( 2 * Math.tan(degrees / 2) );

    // get the radius {r} of the circumscribed circle
    var r = hypotenuse(d, h/2)

    /*
    SECOND, compose the corresponding SVG arc.
      read up: http://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
      example: <path d = "M 200,50 a 50,50 0 0,1 100,0"/>
                          M 200,50                          Moves pen to (200,50);
                                   a                        draws elliptical arc;
                                     50,50                  following a degenerate ellipse, r1 == r2 == 50;
                                                            i.e. a circle of radius 50;
                                           0                with no x-axis-rotation (irrelevant for circles);
                                             0,1            with large-axis-flag=0 and sweep-flag=1 (clockwise);
                                                 100,0      to a point +100 in x and +0 in y, i.e. (300,50).
    */
    var path =  "M " + data[0].x + "," + data[0].y
         + " a " + r + "," + r
         + " 0 0," + (clockwise ? "1" : "0") + " "
         + (data[1].x-data[0].x) + "," + (data[1].y-data[0].y);

    return path
  }

  // PRIVATE FUNCTIONS

  // this seems good to have
  function hypotenuse(a, b) {
    return Math.sqrt( Math.pow(a,2) + Math.pow(b,2) );
  }

  // GETTERS & SETTERS

  arrow.from = function(_) {
    if (!arguments.length) return from;
    from = _;
    return arrow;
  };

  arrow.to = function(_) {
    if (!arguments.length) return to;
    to = _;
    return arrow;
  }

  arrow.degrees = function(_) {
    if (!arguments.length) return degrees;
    degrees = Math.min(Math.max(_, 1e-6), Math.PI-1e-6);
    return arrow;
  };

  arrow.clockwise = function(_) {
    if (!arguments.length) return clockwise;
    clockwise = !!_;
    return arrow;
  };

  // return drawing function
  return arrow;
}

function kooky(data) {
  if(data.length < 2) return;

  data = data.map(function(d,i) {
    return [d.x,d.y];
  })

  var steps = 5;
  var mean = 0;
  var deviation = 100;

  var rng = d3.random.normal(mean, deviation);
  var line = d3.svg.line().interpolate("basis");

  var points = [];

  points.push(data[0]);
  data.slice(1).forEach(function(d1,i) {
    var d0 = data[i];
    d3.range(steps).slice(1).forEach(function(numerator) {
      var cx = d0[0] + (numerator/steps) * (d1[0]-d0[0]);
      var cy = d0[1] + (numerator/steps) * (d1[1]-d0[1]);

      if(numerator < steps-1) {
        cx += rng();
        cy += rng();
      }

      points.push([cx, cy])
    })
  });
  points.push(data[data.length-1]);

  // debugger

  return line(points);
}

function loopy(data) {
  if(data.length < 2) return;

  data = data.map(function(d,i) {
    return [d.x,d.y];
  })

  var steps = 30;
  var radius = 20;

  var line = d3.svg.line().interpolate("basis");

  var points = [];

  points.push(data[0]);
  data.slice(1).forEach(function(d1,i) {
    var d0 = data[i];
    d3.range(steps).slice(1).forEach(function(numerator) {
      var cx = d0[0] + (numerator/steps) * (d1[0]-d0[0]);
      var cy = d0[1] + (numerator/steps) * (d1[1]-d0[1]);

      if(numerator < steps-1) {
        cx += radius * Math.sin(numerator);
        cy += radius * Math.cos(numerator);
      }

      points.push([cx, cy]);
    });
  });
  points.push(data[data.length-1]);

  return line(points);
}

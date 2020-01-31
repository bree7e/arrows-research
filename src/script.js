//////////////////////////
// DIV CONNECT EXAMPLE! //
//////////////////////////

// configure arrows
const connect = arrowConnector()
  .type("swoopy") // options: 'straight', 'swoopy', 'kooky', 'loopy', 'random'
  .edges(true) // allow arrows to attach to box edge midpoints (it'll pick closest pair)
  .corners(false); // allow arrows to attach to box corners (it'll pick closest pair)

// draw arrows
connect();

// redraw arrows on resize
d3.select(window).on("resize", connect);

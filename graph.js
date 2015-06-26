/* Inspired by ROBO Design
 * https://dev.opera.com/articles/html5-canvas-painting/
 */


  var canvas, context, canvaso, contexto;

  // The active tool instance.
  var tool;
  var tool_default = 'node';

  function init () {
    // Find the canvas element.
    canvaso = document.getElementById('imageView');

    // Get the 2D canvas context.
    contexto = canvaso.getContext('2d');

    // Add the temporary canvas.
    var container = canvaso.parentNode;
    canvas = document.createElement('canvas');

    canvas.id     = 'imageTemp';
    canvas.width  = canvaso.width;
    canvas.height = canvaso.height;
    container.appendChild(canvas);

    context = canvas.getContext('2d');

    // Get the tool select input.
    var tool_select = document.getElementById('dtool');
    tool_select.addEventListener('change', ev_tool_change, false);

    // Activate the default tool.
    if (tools[tool_default]) {
      tool = new tools[tool_default]();
      tool_select.value = tool_default;
    }

    //work with the undo/redo button
    var undo_click = document.getElementById('undo');
    var redo_click = document.getElementById('redo');
    undo_click.addEventListener('click', undoIt, false);
    redo_click.addEventListener('click', redoIt, false);

    // Attach the mousedown, mousemove and mouseup event listeners.
    canvas.addEventListener('mousedown', ev_canvas, false);
    canvas.addEventListener('mousemove', ev_canvas, false);
    canvas.addEventListener('mouseup',   ev_canvas, false);
  }

  // The general-purpose event handler. This function just determines the mouse 
  // position relative to the canvas element.
  function ev_canvas (ev) {
    if (ev.layerX || ev.layerX == 0) { // Firefox
      ev._x = ev.layerX;
      ev._y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX == 0) { // Opera
      ev._x = ev.offsetX;
      ev._y = ev.offsetY;
    }

    // Call the event handler of the tool.
    var func = tool[ev.type];
    if (func) {
      func(ev);
    }
  }

  // The event handler for any changes made to the tool selector.
  function ev_tool_change (ev) {
    if (tools[this.value]) {
      tool = new tools[this.value]();
    }
  }

  // This function draws the #imageTemp canvas on top of #imageView, after which 
  // #imageTemp is cleared. This function is called each time when the user 
  // completes a drawing operation.
  function img_update () {
    contexto.drawImage(canvas, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  // This object holds the implementation of each drawing tool.
  var tools = {};

  var nodes = []; //array of nodes
  var edges = []; //array of the id's of the nodes
  var undo = [];
  var redo = [];

  // The edge tool.
  tools.edge = function () {
    var tool = this;
    this.started = false;

    var start_x = 0;
    var start_y = 0;
    var start_id;
    var end_id;

    this.mousedown = function (ev) {
      tool.started = true;
      var node = closest(ev._x, ev._y);
      start_x = node[0][0];
      start_y = node[0][1];
      start_id = node[1];

    };

    //closest function
    //find circle closest to x, y
    //!!! returns coords,id
    function closest(x, y){
          var close = [];
          var distance = Infinity;
          var id;
          for (var i = 0; i < nodes.length; i++) {
            var c =  nodes[i].coords; //parsing through the coords of every node
            var d = (x - c[0])*(x - c[0]) + (y - c[1])*(y - c[1]);
            if (d < distance) {
              close = c;
              distance = d;
              id = nodes[i].id;
            }
          }
          //return array of closest node center coordinates
          return [close, id];
      };

    this.mousemove = function (ev) {
      if (!tool.started) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.beginPath();
      context.moveTo(start_x, start_y);
      var node = closest(ev._x, ev._y);
      context.lineTo(node[0][0], node[0][1]);
      end_id = node[1];
      context.lineWidth = 2;
      context.strokeStyle = 'black';
      context.stroke();
      context.closePath();
    };

    this.mouseup = function (ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        img_update();
        //////append new edge to array of edges
        edges.push([start_id, end_id]);
        //update undo
        undo.push("e"); //add new to end
        if(undo.length == 10) {
          undo.shift(); //only store last 10
          }
      }
    }
  };
  


  //node tool
  tools.node = function () {
    var tool = this;
    this.started = false;

    function Node(id,coords) {
      this.id = id;
      this.coords = coords;
    };

    this.mousedown = function (ev) {
      tool.started = true;
      tool.x0 = ev._x;
      tool.y0 = ev._y;
    };

    this.mousemove = function (ev) {
      if (!tool.started) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      context.beginPath();
      context.arc(tool.x0, tool.y0, 5, 0, 2 * Math.PI)
      context.fillStyle = 'black';
      context.fill();
      context.strokeStyle = 'black';
      context.stroke();
      context.closePath();
    };

    this.mouseup = function (ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        img_update();
        nodes.push(new Node(nodes.length,[tool.x0, tool.y0]));
        //update undo
        undo.push("n"); //add new to end
        if(undo.length == 10) {
          undo.shift(); //only store last 10
          }
      }
    };
  };

//function that removes edges on canvas
function remove_edges(start_coords, end_coords) {
  //remove edge drawing
  contexto.globalCompositeOperation = "xor";
  contexto.beginPath();
  contexto.moveTo(start_coords[0], start_coords[1]);
  contexto.lineTo(end_coords[0], end_coords[1]);
  contexto.lineWidth = 4;
  contexto.strokeStyle = 'white';
  contexto.stroke();
  contexto.closePath();
  contexto.globalCompositeOperation = "source-over";

  //draw nodes over where line was erased
  contexto.beginPath();
  contexto.arc(start_coords[0], start_coords[1], 5, 0, 2 * Math.PI);
  contexto.fillStyle = 'black';
  contexto.fill();
  contexto.lineWidth = 1;
  contexto.strokeStyle = 'black';
  contexto.stroke();
  contexto.closePath();

  contexto.beginPath();
  contexto.arc(end_coords[0], end_coords[1], 5, 0, 2 * Math.PI);
  contexto.fillStyle = 'black';
  contexto.fill();
  contexto.strokeStyle = 'black';
  contexto.stroke();
  contexto.closePath();
};

//function that removes nodes on canvas
function remove_nodes(coords){
  contexto.globalCompositeOperation = "xor";
  contexto.beginPath();
  contexto.arc(coords[0], coords[1], 6, 0, 2 * Math.PI);
  contexto.fillStyle = 'white';
  contexto.fill();
  contexto.strokeStyle = 'white';
  contexto.stroke();
  contexto.closePath();
  contexto.globalCompositeOperation = "source-over";
};


//UNDO AND REDO TOOLS
 function undoIt(ev) {
  if (undo.length == 0) {
    alert("Nothing to undo!");
  }
  else {
   var oops = undo.pop(); //get what to undo
    if (oops == 'e') {
      //remove edge from array
      var bye_edge = edges.pop();
      start_coords = nodes[bye_edge[0]].coords;
      end_coords = nodes[bye_edge[1]].coords;
      
      remove_edges(start_coords, end_coords);//remove photo

      redo.push(['e', bye_edge]); //add to redo
    }
    if (oops == 'n') {
      //remove node from array
      var bye_node = nodes.pop();

      remove_nodes(bye_node.coords);//remove node from drawing

      redo.push(['n', bye_node]);//add to redo
    }
  }
 };

 function redoIt(ev) {
  if (redo.length == 0) {
    alert("Nothing to redo!");
  } else {
   var jk = redo.pop();
   if (jk[0] == 'e') {
    var redo_edge = jk[1];
    edges.push(redo_edge); //add edge to array
    //get edge coordinates
    start_coords = nodes[redo_edge[0]].coords;
    end_coords = nodes[redo_edge[1]].coords;
    //draw edge
    context.beginPath();
    context.moveTo(start_coords[0], start_coords[1]);
    context.lineTo(end_coords[0], end_coords[1]);
    context.lineWidth = 2;
    context.strokeStyle = 'black';
    context.stroke();
    context.closePath();
    img_update();

    undo.push('e'); //add back to undo
   }
   else if (jk[0] == 'n') {
    var redo_node = jk[1];
    nodes.push(redo_node); //add node to array
    //draw node
    context.beginPath();
    context.arc(redo_node.coords[0], redo_node.coords[1], 5, 0, 2 * Math.PI)
    context.fillStyle = 'black';
    context.fill();
    context.strokeStyle = 'black';
    context.stroke();
    context.closePath();
    img_update();

    undo.push('n'); //add back to undo
   }
  }
 };

if(window.addEventListener) {
    window.addEventListener('load', init(), false)
}

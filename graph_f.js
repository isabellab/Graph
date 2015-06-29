
/* Inspired by ROBO Design
 * https://dev.opera.com/articles/html5-canvas-painting/
 */


  var canvas, context, canvaso, contexto, backgroundCanvas, backgroundContext, mouse_canvas, mouse_context;
  var toollist;

  // The active tool instance.
  var tool;
  var tool_default = 'node';

  function init () {
    // Find the canvas element.
    canvaso = document.getElementById('imageView');
    backgroundCanvas = document.getElementById('background');

    // Get the 2D canvas context.
    contexto = canvaso.getContext('2d');
    backgroundContext = backgroundCanvas.getContext('2d');

    // Add the temporary canvas.
    var container = canvaso.parentNode;
    canvas = document.createElement('canvas');

    canvas.id     = 'imageTemp';
    canvas.width  = canvaso.width;
    canvas.height = canvaso.height;
    container.appendChild(canvas);

    context = canvas.getContext('2d');

    //initialize mouse coordinates box
    mouse_canvas = document.getElementById('mouse');
    mouse_context = mouse_canvas.getContext('2d');

    toollist = document.getElementsByName("dtool"); 
    for(var i = 0; i < toollist.length; i++) {  
      toollist[i].addEventListener('change', ev_tool_change, false);
    }

    


    // Activate the default tool.
    if (tools[tool_default]) {
      tool = new tools[tool_default]();
      toollist.value = tool_default;
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

//get file and change canvas background
function changeCanvas(){
  var file = document.getElementById('image').files[0];
  var fileread = new FileReader();
  var image = new Image();
  var width, height;
  
  //fileread.readAsDataURL(file);
  fileread.onload = function(_file) { //once file has uplaoded
    //make sure the image has loaded
    image.onload = function(){
      width = this.width;
      height = this.height

      height = height * 1000 / width;
      width = 1000;

      //change canvas
      canvaso.width = width; //edit sizes
      canvaso.height = height;
      canvas.width = width;
      canvas.height = height;
      backgroundCanvas.width = width;
      backgroundCanvas.height = height;
      backgroundContext.drawImage(image, 0, 0, width, height);

      //clear all nodes and edges
      edges = [];
      nodes = [];
    }
    image.src = _file.target.result;
  }
  fileread.readAsDataURL(file);
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

 // The event handler for any changes made to the tool selector. AKLFJAKLSDJFLKASJFLKSJAFDLKJDSFLKJFKLDJSF
  function ev_tool_change (ev) {
    for(var i = 0; i < toollist.length; i++) {  
      if(toollist[i].checked == true)  {
             var selectedT = toollist[i].value
            tool = new tools[selectedT];
            break;
        
      }
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
      var node = closest(ev._x, ev._y);
      end_id = node[1];

      draw_edge(start_x, start_y, node[0][0], node[0][1], 'black', 2);
    };

    this.mouseup = function (ev) {
      if (tool.started) {
        if(start_id != end_id) {
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
      draw_node(tool.x0, tool.y0, 5, 'black', 1);
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
function remove_nodes(coords) {
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

function draw_node(x, y, radius, color, line_width) {
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.fillStyle = color;
  context.fill();
  context.lineWidth = line_width;
  context.strokeStyle = color;
  context.stroke();
  context.closePath();
};
function draw_edge(start_x, start_y, end_x, end_y, color, line_width) {
  context.beginPath();
  context.moveTo(start_x, start_y);
  context.lineTo(end_x, end_y);
  context.lineWidth = line_width;
  context.strokeStyle = color;
  context.stroke();
  context.closePath();
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
    } else if (oops == 'n') {
      //remove node from array
      var bye_node = nodes.pop();

      remove_nodes(bye_node.coords);//remove node from drawing

      redo.push(['n', bye_node]);//add to redo
    } else {
      var node_id = oops[0];
      var coords = oops[1]; //coordinates to reset the node to
      var connected_edges = oops[2];
      var old_coords = nodes[node_id].coords;

      //remove new drawings
      for (var i = 0; i < connected_edges.length; i++) {
        remove_edges(nodes[connected_edges[i]].coords, old_coords); 
      }
      remove_nodes(old_coords);

      //add new drawings
      draw_node(coords[0], coords[1], 5, 'black', 1);
      for (var i = 0; i < connected_edges.length; i++) {
        draw_edge(nodes[connected_edges[i]].coords[0], nodes[connected_edges[i]].coords[1], 
          coords[0], coords[1], 'black', 2); 
      }
      nodes[node_id].coords = coords; //update coords of node
      img_update();

      //push to redo
      redo.push([node_id, old_coords, connected_edges]); //node id, old coordinates, connect_id[]
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
    draw_edge(start_coords[0], start_coords[1], end_coords[0], end_coords[1], 'black', 2);
    img_update();

    undo.push('e'); //add back to undo
   } else if (jk[0] == 'n') {
    var redo_node = jk[1];
    nodes.push(redo_node); //add node to array
    //draw node
    draw_node(redo_node.coords[0], redo_node.coords[1], 5, 'black', 1);
    img_update();

    undo.push('n'); //add back to undo
   } else {
    var node_id = jk[0];
    var coords = jk[1]; //coordinates to reset the node to
    var connected_edges = jk[2];
    var old_coords = nodes[node_id].coords; //current coords of node

    //remove new drawings
    for (var i = 0; i < connected_edges.length; i++) {
      remove_edges(nodes[connected_edges[i]].coords, old_coords); 
    }
    remove_nodes(old_coords);

    //add new drawings
    draw_node(coords[0], coords[1], 5, 'black', 1);
    for (var i = 0; i < connected_edges.length; i++) {
      draw_edge(nodes[connected_edges[i]].coords[0], nodes[connected_edges[i]].coords[1], 
        coords[0], coords[1], 'black', 2); 
    }
    nodes[node_id].coords = coords; //update coords of node
    img_update();
    
    //push to redo
    undo.push([node_id, old_coords, connected_edges]); //node id, old coordinates, connect_id[]
   }
  }
 };

   // The resize tool.
  tools.resize = function () {
    var tool = this;
    this.started = false;

    var old_x = 0;
    var old_y = 0;
    var node_id; //id of the resizing node
    var first_run = false;
    connect_id = []; // ids of the nodes on the other end of edges

    this.mousedown = function (ev) {
      tool.started = true;
      var close = closest(ev._x, ev._y);
      old_x = close[0][0]; //remember the xcoor of the node
      old_y = close[0][1]; //remember the ycoor of the node
      node_id = close[1];

     //parse through edge array to find connected edges
      for (var i = 0; i < edges.length; i++) { //for every edge
         if (edges[i][0] == node_id) {
            connect_id.push(edges[i][1]); //push id of the other node
         }
         else if (edges[i][1] == node_id){
            connect_id.push(edges[i][0]); //push id of the other node
         }
      }
      //prepare first_run
      first_run = true;
    };

    //closest function
    //find node closest to x, y
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
          //return array of closest node center coordinates and id
          return [close, id];
      };

    this.mousemove = function (ev) {
      if (!tool.started) {
        return;
      }
      if (first_run) {
        //removal of original edges to the moved node
        for (var i = 0; i < connect_id.length; i++) {
          remove_edges(nodes[connect_id[i]].coords, [old_x, old_y]);
         }
        //remove original node
        remove_nodes([old_x, old_y]);
        first_run = false;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      mouseCoords(ev._x, ev._y);
      draw_node(ev._x, ev._y, 5, 'black', 1);  //draw new node

      //draw new edges
      for (var i = 0; i < connect_id.length; i++) {
        draw_edge(nodes[connect_id[i]].coords[0], nodes[connect_id[i]].coords[1], ev._x, ev._y, 'black', 2);
      }
    };

    this.mouseup = function (ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        img_update();
        mouse_context.clearRect(0, 0, mouse_canvas.width, mouse_canvas.height);

        //update coordinates of changed node
        nodes[node_id].coords = [ev._x, ev._y];

        connected_edges = connect_id;
        //add to undo list
        undo.push([node_id, [old_x, old_y], connected_edges]); //node id, old coordinates, connect_id[]

        //clear connect_id
        connect_id = [];
      }
    };
  };

function mouseCoords(x, y) {
  var message = 'Mouse position: ' + x + ', ' + y;
  mouse_context.clearRect(0, 0, mouse_canvas.width, mouse_canvas.height);
  mouse_context.font = '12pt Calibri';
  mouse_context.fillStyle = 'black';
  mouse_context.fillText(message, 10, 20);
}

if(window.addEventListener) {
    window.addEventListener('load', init(), false)
}
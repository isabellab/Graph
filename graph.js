/* Inspired by ROBO Design
 * https://dev.opera.com/articles/html5-canvas-painting/
 */

//Global variables
var canvas, context, canvaso, contexto, backgroundCanvas, backgroundContext
var mouse_canvas, mouse_context;
var toollist; 
var radius = 3;
var undo_length = 10;
var newheight;

// The active tool instance.
var tool;
var tool_default = 'node';
var new_id = 0;

//active edit instance
var edit;
var edit_default = 'resize';

// This object holds the implementation of each drawing tool.
var tools = {};
var edits = {};

var nodes = []; //array of nodes
var edges = []; //array of the id's of the nodes
var undo = [];
var redo = [];

//Initialization~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
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

    document.getElementsByName('radius')[0].value = 3;

    //add event listener for nodeType
    document.getElementById('nodeType').addEventListener('change', ev_tool_change, false);
    document.getElementById('dedit').addEventListener('change', ev_tool_change, false);

    toollist = document.getElementsByName("dtool"); 
    for(var i = 0; i < toollist.length; i++) {  
      toollist[i].addEventListener('change', ev_tool_change, false);
    }

    // Activate the default tool.
    if (tools[tool_default]) {
      tool = new tools[tool_default]();
      toollist.value = tool_default;
    }

    editlist = document.getElementsByName("dedit"); 
    for(var i = 0; i < editlist.length; i++) {  
      editlist[i].addEventListener('change', ev_tool_change, false);
    }

    // Activate the default edit.
    if (edits[edit_default]) {
      edit = new edits[edit_default]();
      editlist.value = edit_default;
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
}; // END INITIALIZATION


// CANVAS SET-UP and BASIC EVENT HANDLER~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/*The general-purpose event handler. This function just determines the mouse 
position relative to the canvas element.*/

function ev_canvas (ev) {
  if (ev.layerX || ev.layerX == 0) { // Firefox
    ev._x = ev.layerX;
    ev._y = ev.layerY;
  } else if (ev.offsetX || ev.offsetX == 0) { // Opera
    ev._x = ev.offsetX;
    ev._y = ev.offsetY;
  }

  // Call the event handler of the tool.
  if(!document.getElementById('dtool')[2].checked) {
    var func = tool[ev.type];
    if (func){
      func(ev);
    }
  } else {
    var func = edit[ev.type];
    if (func){
      func(ev);
    }
  }
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

      //resizing the uploaded image
      height = height * 1000 / width * document.getElementById('zoom').value;
      width = 1000 * document.getElementById('zoom').value;
      newheight = height;

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
    document.getElementById('container').height = newheight;
}; 

 // This function draws the #imageTemp canvas on top of #imageView, after which 
  // #imageTemp is cleared. This function is called each time when the user 
  // completes a drawing operation.
  function img_update () {
    contexto.drawImage(canvas, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
   }

function display(id, style) {
  document.getElementById(id).style.display = style
}

 // The event handler for any changes made to the tool selector. 
  function ev_tool_change (ev) {
    for(var i = 0; i < toollist.length; i++) {  
      if(toollist[i].checked == true)  {
            var selectedT = toollist[i].value;
            tool = new tools[selectedT];
         
             //hide all. 
            display('nodeType', 'none');
            display('radius', 'none');
            display('info', 'none');
            display('gender', 'none');
            display('roomNumber', 'none');
            display('entryway', 'none');
            display('stairset', 'none');
            display('stairinfo', 'none');
            display('floorset', 'none');
            display('stair', 'none');
            display('stair1', 'none');
            display('dedit', 'none');
            display('snapping','none');

            
            if(selectedT == 'node'){
                //display
                display('nodeType', 'inline-block');
                display('radius', 'inline-block');

                if (document.getElementById("nodeType").value == "bathroom") {
                  display('gender', 'inline-block');
                }
                else if(document.getElementById("nodeType").value == "room"){
                  display('roomNumber', 'inline-block');
                }
                else if (document.getElementById("nodeType").value == "entry"){
                  display('entryway', 'inline-block');
                }
                else if ((document.getElementById("nodeType").value == "stairs") || (document.getElementById("nodeType").value == "elevator")){
                    display('stairset', 'inline-block');
                    display('floorset', 'inline-block');
                    display('stair', 'inline-block');
                    display('stair1', 'inline-block');
                    display('stairinfo', 'inline-block');
                }
             }

            else if (selectedT == 'info') {
              display('info', 'inline-block');
            } 

            else if (selectedT == 'edit') {
              display('dedit', 'inline-block');
              for(var i = 0; i < editlist.length; i++) {  
                if(editlist[i].checked == true) {
                  var selectedE = editlist[i].value;
                  edit = new edits[selectedE]; 
                  if (editlist[i].value == 'resize'){
                    display('snapping', 'block');
                  }
                }
              }
            }
            //clear temporary canvas
            context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

 //random functions section~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//function to find nodeID, returns the node
function nodeID(node_id) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].id == node_id)
      return nodes[i]; 
  }
}

 //find circle closest to x, y. returns coords,id
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

 
function colorFind(node_id, new_node) {
   var nodeType;
   var gender;
   if (new_node) 
     nodeType = findNT();
   else 
     nodeType = nodeID(node_id).type;
   if (nodeType =='walk')
     return 'black';
   else if (nodeType =='room')
     return 'red';
   else if (nodeType =='bathroom') {
    if (new_node) { 
      if (document.getElementsByName("gender")[0].checked) gender = 'F';
      else gender = 'M';
    } 
    if (gender == 'M') return '#2ECCFA';
    else return '#F781BE';
   } else if (nodeType =='stairs')
     return '#5858FA';
   else if (nodeType =='elevator')
      return '#FFBF00';
   else if (nodeType =='entry')
     return '#3ADF00';
 };


function findNT() {
   var r = document.getElementById("nodeType").length;
    for(var i = 0; i<r; i++){
     var typetrial = document.getElementById("nodeType")[i];
     if(typetrial.selected)
       return typetrial.value;
   }
 };

//set radius
function setRadius() {
    //set radius size
    if (document.getElementsByName('radius')[0].value == '') {
      alert('radius is undefined!');
    }
    radius = parseFloat(document.getElementsByName('radius')[0].value);
}

function connectedEdges(node_id) {
  var connect_id = [];
  for (var i = 0; i < edges.length; i++) { //for every edge
        if (edges[i].coords[0] == node_id) {
           connect_id.push(edges[i].coords[1]); //push id of the other node
        }
        else if (edges[i].coords[1] == node_id){
           connect_id.push(edges[i].coords[0]); //push id of the other node
        }
     }
  return connect_id;
}

// DRAWING TOOLS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//function that removes edges on canvas - - - - - - - - - -- - - - - - - - - - - - - - - -- - - 
function remove_edges(start_coords, end_coords, start_id, end_id) {
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
 contexto.arc(start_coords[0], start_coords[1], radius, 0, 2 * Math.PI);
 contexto.fillStyle = colorFind(start_id, false);
 contexto.fill();
 contexto.lineWidth = 1;
 contexto.strokeStyle = colorFind(start_id, false);
 contexto.stroke();
 contexto.closePath();

 contexto.beginPath();
 contexto.arc(end_coords[0], end_coords[1], radius, 0, 2 * Math.PI);
 contexto.fillStyle = colorFind(end_id, false);
 contexto.fill();
 contexto.strokeStyle = colorFind(end_id, false);
 contexto.stroke();
 contexto.closePath();
};
 
 //function that removes nodes on canvas
 function remove_nodes(coords) {
   contexto.globalCompositeOperation = "xor";
   contexto.beginPath();
   contexto.arc(coords[0], coords[1], radius + 1, 0, 2 * Math.PI);
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


// THE SECTION FOR NODE INFO TOOLS
//  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 function updateText(node_id){
  document.example.popx.value = nodeID(node_id).coords[0];
  document.example.popy.value = nodeID(node_id).coords[1];
  document.example.poptype.value = nodeID(node_id).type;

  //get nodeID and draw node
  draw_node(nodeID(node_id).coords[0], nodeID(node_id).coords[1], radius, '#FFFF00', 1);
  draw_node(nodeID(node_id).coords[0], nodeID(node_id).coords[1], radius * 0.5, colorFind(node_id,false), 1);
  document.getElementById('findme').value = node_id;
  // document.example.populateme.value = JSON.stringify(nodes[5]);

  if(nodeID(node_id).type== "room"){ 
    showRoom('inline-block', node_id); 
    //hide bathroom, entry, stairs fields and clear fields
    showBathroom('none',"");
    showStairs('none',"");
    showEntry('none',"");
  }

  else if(nodeID(node_id).type== "entry"){  
    showEntry('inline-block', node_id);
    //hide bathroom, room, stairs fields and clear fields
    showBathroom('none',"");
    showStairs('none',"");
    showRoom('none',"");
  }

  else if(nodeID(node_id).type == "bathroom"){
    showBathroom("inline-block", nodeID(node_id).gender);
    // hide
    showRoom('none',"");
    showEntry('none',"");
    showStairs('none',"");
  }

  else if((nodeID(node_id).type == "stairs") || (nodeID(node_id).type == "elevator")){
     //show stair/elevator facets
    showStairs('inline-block', node_id);
    //hide everything else
    showRoom('none',"");
    showBathroom('none',"");
    showEntry('none',"");
  }


  else{
    // hide all optional elements
    showRoom('none',"");
    showBathroom('none',"");
    showEntry('none',"");
    showStairs('none',"");
    
  }
};

// Get edits from Nodeinfo and store with nodes.

function updateCoord(newc, i, c){
  var old = nodeID(i).coords[c];
  nodeID(i).coords[c] = newc;
  if(c==0){
    remove_nodes(old, nodeID(i).coords[1]);
  }
  if(c==1){
    remove_nodes(nodeID(i).coords[0], old);
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  //move node
  draw_node(nodeID(i).coords[0], nodeID(i).coords[1], radius, colorFind(i, false), 1);
  img_update();
  //redraw selection
  draw_node(nodeID(i).coords[0], nodeID(i).coords[1], radius, '#FFFF00', 1);
  draw_node(nodeID(i).coords[0], nodeID(i).coords[1], radius * 0.5, colorFind(i, false), 1);
};

function updateX(newx, i){
  var old_x = nodeID(i).coords[c];
  nodeID(i).coords[0] = newx;
  remove_nodes([old_x, nodeID(i).coords[1]]);
  context.clearRect(0, 0, canvas.width, canvas.height);
  //move node
  draw_node(newx, nodeID(i).coords[1], radius, colorFind(i,false), 1);
  img_update();
  //redraw selection
  draw_node(newx, nodeID(i).coords[1], radius, '#FFFF00', 1);
  draw_node(newx, nodeID(i).coords[1], radius * 0.5, colorFind(i,false), 1);
};

function updateY(newy, i){
  var old_y = nodeID(i).coords[1];
  nodeID(i).coords[1] = newy;
  remove_nodes([nodeID(i).coords[0], old_y]);
  context.clearRect(0, 0, canvas.width, canvas.height);
  //move node
  draw_node(nodeID(i).coords[0], newy, radius, colorFind(i,false), 1);
  img_update();
  //redraw selection
  draw_node(nodeID(i).coords[0], newy, radius, '#FFFF00', 1);
  draw_node(nodeID(i).coords[0], newy, radius * 0.5, colorFind(i,false), 1);
  alert("Have I been redrawn?");
};

function updateType(newt, i){
  // do not needlessly erase important info if user changes to same type
  if((document.getElementById("popentry").style.display != "none") && (newt !="entry")){
    showEntry("none", "");
  }
  if((document.getElementById("poproom").style.display != "none") && (newt != "room")){
    showRoom("none","");
  }
  if((document.getElementById("popfemale").style.display != "none") &&(newt != "bathroom")){
   showBathroom("none", "");
  }
  if((document.getElementById("popset").style.display != "none") &&(newt != "stairs") &&(newt != "elevator")) {
    showStairs("none", "");
  }

  nodeID(i).type = newt;


  if(newt == "bathroom"){
    showBathroom('inline-block', nodeID(i).gender);
  }

  // CONSIDER STANDARDIZING WITH BATHROOM++++++++++++++++++++++++++++++++++++++++++++++
  if(newt == "room"){
    showRoom('inline-block', "");
    alert("Room number has not been set.")
  }

  if(newt == "entry"){
    showEntry('inline-block',"");
    alert("Entry number has not been set.")
  }

  if((newt == "stairs") || (newt == "elevator")){
    showStairs('inline-block',"");
    alert("You might be missing some information. Feel free to fill it in.");

  }

  draw_node(nodeID(i).coords[0], nodeID(i).coords[1], radius, colorFind(i,false), 1);
  img_update();
  //redraw selection
  draw_node(nodeID(i).coords[0], nodeID(i).coords[1], radius, '#FFFF00', 1);
  draw_node(nodeID(i).coords[0], nodeID(i).coords[1], radius * 0.5, colorFind(i,false), 1);
};

function updateEntry(newe, i){
  nodeID(i).entryway = newe;
  draw_node(nodeID(i).coords[0], nodeID(i).coords[1], radius, colorFind(i,false), 1);
  img_update();
  //redraw selection
  draw_node(nodeID(i).coords[0], nodeID(i).coords[1], radius, '#FFFF00', 1);
  draw_node(nodeID(i).coords[0], nodeID(i).coords[1], radius * 0.5, colorFind(i,false), 1);
};

function updateRoom(newr, i){
  nodeID(i).room = newr;
};

function updateGender(i){
  var radiobtn = document.getElementById("popfemale");
  if (radiobtn.checked == true)
    nodeID(i).gender = "F";
  else
    nodeID(i).gender = "M";

  draw_node(nodeID(i).coords[0], nodeID(i).coords[1], radius, colorFind(i,false), 1);
  img_update();
  //redraw selection
  draw_node(nodeID(i).coords[0], nodeID(i).coords[1], radius, '#FFFF00', 1);
  draw_node(nodeID(i).coords[0], nodeID(i).coords[1], radius * 0.5, colorFind(i,false), 1);
};

function updateSet(news, i){
  nodeID(i).stairset = news;
};

function updateFloor(newf, i){
  nodeID(i).floorset = newf;
};

function updateVert(){
  var radiobtn = document.getElementById("popup");
  var radiobtn1 = document.getElementById("popdown");
  if (radiobtn.checked == true)
    nodeID(i).direction = "U";
  else if(radiobtn.checked ==true)
    nodeID(i).direction = "D";
  else nodeID(i).direction = "B";
};

// HIDING FUNCTIONS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


//takes display status and nodeid
function showRoom(status, id){
  display('no2', 'status');
  display('poproom', 'status');
  if (id == ""){
     document.example.poproom.value = "";
  }
  else{
    document.example.poproom.value = nodeID(id).room;
  }
};

//takes displays status and gender
function showBathroom(status, gen){
  display('no3', 'status');
  display('no4', 'status');
  display('no5', 'status');
  display('popmale', 'status');
  display('popfemale', 'status');
  var radiobtn;
  var radiobtn1;
  if(status == "none"){
    radiobtn = document.getElementById("popmale");
    radiobtn.checked = false; 
    radiobtn1 = document.getElementById("popfemale");
    radiobtn1.checked = false; 
  }
  else if(gen == "M"){
    radiobtn = document.getElementById("popmale");
    radiobtn.checked = true; 
  }
  else if(gen == "F"){
    radiobtn = document.getElementById("popfemale");
      radiobtn.checked = true;
  }
  else{
    radiobtn = document.getElementById("popfemale");
    radiobtn.checked = true;
    alert("Gender has been set to female by default");
  }

};

//takes display status and node id
function showEntry(status, id){
  display('no1', 'status');
  display('popentry', 'status');
  if (id == ""){
    document.example.popentry.value = "";
  }
  else{
    document.example.popentry.value = nodeID(id).entryway;
  }
};


//takes display status and node_id
function showStairs(status, id){
  display('no6', 'status');
  display('popset', 'status');

    // Is this right? 
    if (status == "none"){
        document.example.popset.value = ""; 
        stairSpec(status);
        elevatorSpec(status);

    }
    //show elevator, hide stairs (FLOOR SETS)
    else if(nodeID(id).type == "elevator"){ 
      elevatorSpec(status);
      stairSpec('none');
    }
    //show stairs, hide elevator (THIS IS UP DOWN)
    else{
      // general
      document.example.popset.value = nodeID(id).stairset;

      // show elevator. hide stairs
      if(nodeID(id).type == "elevator"){ 
        elevatorSpec(status, id);
        stairSpec('none', "");
      }
      //show stairs, hid elevator
      else{ 
        stairSpec(status, id);
        elevatorSpec('none',"");
      }
    }

    function stairSpec(stat, id){
      alert("hi stairs"+ stat);
      display('popup', 'stat');
      display('popdown', 'stat');
      display('popboth', 'stat');
      display('no8', 'stat');
      display('no9', 'stat');
      display('no10', 'stat');

       //RADIOBUTTONS GO HERE
      if (stat != "none"){ 
        var radiobtn1 = document.getElementById("popup");
        var radiobtn2 = document.getElementById("popdown");
        var radiobtn3  = document.getElementById("popboth");
        var dir = nodeID(id).direction;
        
        if (dir== "U") radiobtn1.checked = true; 
        else if (dir == "D") radiobtn2.checked = true;
        else radiobtn3.checked = true;
      }
      // set radiobuttons off b/c none
      else{
        radiobtn1.checked = false; 
        radiobtn2.checked = false; 
        radiobtn3.checked = false; 
      }
    };

    function elevatorSpec(stat, id){
        alert("hi ele"+ stat);
        display('popfloors', 'stat');
        display('no7', 'stat');
        if (stat != "none"){
          document.example.popfloors.value = nodeID(id).floorset;
        }
        else{
          document.example.popfloors.value = "";
        }
    };

};

 // UNDO AND REDO TOOLS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function undoIt(ev) {
 if (undo.length == 0) {
   alert("Nothing to undo!");
 }
 else {
  var oops = undo.pop(); //get what to undo
   if (oops == 'e') {
     //remove edge from array
     var bye_edge = edges.pop();
     start_coords = nodeID(bye_edge.coords[0]).coords;
     end_coords = nodeID(bye_edge.coords[1]).coords;
     remove_edges(start_coords, end_coords, bye_edge.coords[0], bye_edge.coords[1]);//remove photo
     redo.push(['e', bye_edge]); //add to redo
   } 

   else if (oops == 'n') {
     //remove node from array
     var bye_node = nodes.pop();
     remove_nodes(bye_node.coords);//remove node from drawing
     redo.push(['n', bye_node]);//add to redo
   } 

   else if (oops[0] == 'dn') { //undo delete node
    var removed = oops[1];
    var removed_edges = oops[2];

    //add node and edges back to arrays
    nodes.push(removed);
    for (var i = 0; i < removed_edges.length; i++) {
      edges.push(new Edge(removed_edges[i]));
      draw_edge(nodeID(removed_edges[i].coords[0]).coords[0], nodeID(removed_edges[i].coords[0]).coords[1], nodeID(removed_edges[i].coords[1]).coords[0], nodeID(removed_edges[i].coords[1]).coords[1], 'black', 2); //redraw edge
    }

    draw_node(removed.coords[0], removed.coords[1], radius, colorFind(removed.id, false), 1); 
   
    //add to redo
    redo.push(['dn', removed.id]);  
   }

   else if (oops[0] == 'de') { //undo delete edge
    var removed = oops[1];
    edges.push(removed);
    draw_edge(nodeID(removed.coords[0]).coords[0], nodeID(removed.coords[0]).coords[1], nodeID(removed.coords[1]).coords[0], nodeID(removed.coords[1]).coords[1], 'black', 2); //redraw edge

    //add to redo
    redo.push(['de', removed]);
   }

   else if (oops[0] == 'an') { //undo auto node --  ['an', node id, endpoint node id, endpoint node id]
    var new_node = nodeID(oops[1]);
    var sideA = nodeID(oops[2]);
    var sideB = nodeID(oops[3]);

    //remove node
    removeNode(oops[1]);

    //remove edges
    for (var i = 0; i < edges.length; i++) {
      if (edges[i].coords[0] == oops[1] && (edges[i].coords[1] == oops[2] || edges[i].coords[1] == oops[3])) {
        removeEdge(i);
      }
    }

    //add edge
    draw_edge(sideA.coords[0], sideA.coords[1], sideB.coords[0], sideB.coords[1], 'black', 2);
    draw_node(sideA.coords[0], sideA.coords[1], radius, colorFind(oops[2], false), 1);
    draw_node(sideB.coords[0], sideB.coords[1], radius, colorFind(oops[3], false), 1);
    edges.push(new Edge([oops[2], oops[3]]));
    img_update();

    oops.push(new_node);
    redo.push(oops);
    img_update();
   }

   else { //undoing resize
     var node_id = oops[0];
     var coords = oops[1]; //coordinates to reset the node to
     var connected_edges = oops[2];
     var old_coords = nodeID(node_id).coords;
     //remove new drawings
     for (var i = 0; i < connected_edges.length; i++) {
       remove_edges(nodeID(connected_edges[i]).coords, old_coords, connected_edges[i], node_id); 
     }
     remove_nodes(old_coords);
     //add new drawings
     for (var i = 0; i < connected_edges.length; i++) { //draw edges
       draw_edge(nodeID(connected_edges[i]).coords[0], nodeID(connected_edges[i]).coords[1], 
         coords[0], coords[1], 'black', 2); 
     }
     for (var i = 0; i < connected_edges.length; i++) { //draw nodes
       draw_node(nodeID(connected_edges[i]).coords[0], nodeID(connected_edges[i]).coords[1], radius, colorFind(connected_edges[i],false), 1); 
     }

     draw_node(coords[0], coords[1], radius, colorFind(node_id,false), 1);
     
     nodeID(node_id).coords = coords; //update coords of node

     //push to redo
     redo.push([node_id, old_coords, connected_edges]); //node id, old coordinates, connect_id[]
   }
   img_update();
 }
};
 
function redoIt(ev) {
 if (redo.length == 0) {
   alert("Nothing to redo!");
 } 
 else {
  var jk = redo.pop();
  if (jk[0] == 'e') { //REDO EDGES
   var redo_edge = jk[1];
   edges.push(redo_edge); //add edge to array
   //get edge coordinates
   start_coords = nodeID(redo_edge.coords[0]).coords;
   end_coords = nodeID(redo_edge.coords[1]).coords;
   //draw edge
   draw_edge(start_coords[0], start_coords[1], end_coords[0], end_coords[1], 'black', 2);
   //draw two noes around it
   draw_node(start_coords[0], start_coords[1], radius, colorFind(redo_edge.coords[0],false), 1);
   draw_node(end_coords[0], end_coords[1], radius, colorFind(redo_edge.coords[1],false), 1);
   img_update();
   undo.push('e'); //add back to undo
  } 

  else if (jk[0] == 'n') { //REDO NODES
   var redo_node = jk[1];
   nodes.push(redo_node); //add node to array
   //draw node
   draw_node(redo_node.coords[0], redo_node.coords[1], radius, colorFind(redo_node.id,false), 1);
   img_update();
   undo.push('n'); //add back to undo
  } 

  else if (jk[0] == 'de') {
    var removed = jk[1];
    var remove_id;
    //find ID of removed edge
    for(var i = 0; i < edges.length; i++) {
      if(edges[i].coords[0] == removed.coords[0] && edges[i].coords[1] == remove.coords[1])
        remove_id = i;
    }

    undo.push(removeEdge(remove_id));
  }

  else if (jk[0] == 'dn') {
    undo.push(removeNode(jk[1]));
  }

  else if (jk[0] == 'an') { //redo autonode -- ['an', node id, endpoint node id, endpoint node id, node to add]
    //remove edge
    var node_id = jk[1];
    var sideA = jk[2];
    var sideB = jk[3];
    var add_node = jk[4];

    var to_remove;
    for (var i = 0; i < edges.length; i++) {
      if (edges[i].coords[1] == sideA && edges[i].coords[0] == sideB || edges[i].coords[0] == sideA && edges[i].coords[1] == sideB)
        to_remove = i;
    }
    removeEdge(to_remove);

    var nodeA = nodeID(sideA);
    var nodeB = nodeID(sideB);

    //add edges
    edges.push(new Edge([node_id, sideA]));
    edges.push(new Edge([node_id, sideB]));
    draw_edge(add_node.coords[0], add_node.coords[1], nodeA.coords[0], nodeA.coords[1], 'black', 2);
    draw_edge(add_node.coords[0], add_node.coords[1], nodeB.coords[0], nodeB.coords[1], 'black', 2);

    //add node
    nodes.push(new Node(node_id,[add_node.coords[0], add_node.coords[1]], 'walk'));
    draw_node(add_node.coords[0], add_node.coords[1], radius, 'black', 1);
    draw_node(nodeA.coords[0], nodeA.coords[1], radius, colorFind(sideA, false), 1);
    draw_node(nodeB.coords[0], nodeB.coords[1], radius, colorFind(sideB, false), 1);

    undo.push([jk[0], jk[1], jk[2], jk[3]]);
    img_update();
  }

  else { //REDO RESIZE
   var node_id = jk[0];
   var coords = jk[1]; //coordinates to reset the node to
   var connected_edges = jk[2];
   var old_coords = nodeID(node_id).coords; //current coords of node
   //remove new drawings
   for (var i = 0; i < connected_edges.length; i++) {
     remove_edges(nodeID(connected_edges[i]).coords, old_coords, connected_edges[i], node_id); 
   }
   remove_nodes(old_coords);
   //add new drawings
   for (var i = 0; i < connected_edges.length; i++) { //redraw edges
     draw_edge(nodeID(connected_edges[i]).coords[0], nodeID(connected_edges[i]).coords[1], 
       coords[0], coords[1], 'black', 2); 
   }
   for (var i = 0; i < connected_edges.length; i++) { //redraw nodes
     draw_node(nodeID(connected_edges[i]).coords[0], nodeID(connected_edges[i]).coords[1], 
       radius, colorFind(connected_edges[i],false), 1); 
   }

   draw_node(coords[0], coords[1], radius, colorFind(node_id,false), 1);
   nodeID(node_id).coords = coords; //update coords of node
   img_update();
   
   //push to redo
   undo.push([node_id, old_coords, connected_edges]); //node id, old coordinates, connect_id[]
  }
 }
};
 

// THE TOOLS SECTION ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//NEW TOOL~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//Node function out of the Node tool
function Node(id, coords, type) {
   this.id = id;
   this.coords = coords;
   this.type = type;
 };

 //Edge function to create edge data type
 function Edge(coords) {
  this.coords = coords;
 }

tools.info = function () {
   var tool = this;
   this.started = false;
   var closest_node; //[coords, id]

   this.mousedown = function (ev) {
     tool.started = true;
     closest_node = closest(ev._x, ev._y); //returns[coords, id]
     //erase other highlighting by clearing temp canvas
     context.clearRect(0, 0, canvas.width, canvas.height);
     //highlight node
     draw_node(closest_node[0][0], closest_node[0][1], radius, '#FFFF00', 1);
   };

   this.mouseup = function (ev) {
     if (tool.started) {
      tool.started = false;

      //send node_id to gender box
      updateText(closest_node[1]);
     }
   };
 };

// The edge tool.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
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
         //draw the endpoints onto the nodes
         draw_node(start_x, start_y, radius, colorFind(start_id,false), 1);
         draw_node(nodeID(end_id).coords[0], nodeID(end_id).coords[1], radius, colorFind(end_id,false), 1);
         img_update();
         //////append new edge to array of edges,false
         edges.push(new Edge([start_id, end_id]));
         //update undo
         undo.push("e"); //add new to end
         if(undo.length == undo_length) { 
           undo.shift(); //only store last 10
         }
       }
     }
   }
 };   //end edge tool

//node tool~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 tools.node = function () {
   var tool = this;
   this.started = false;

   this.mousedown = function (ev) {
     tool.started = true;
     tool.x0 = ev._x;
     tool.y0 = ev._y;
     setRadius();
   };

   this.mousemove = function (ev) {
     if (!tool.started) {
       return;
     }
     context.clearRect(0, 0, canvas.width, canvas.height);
     draw_node(tool.x0, tool.y0, radius, colorFind(nodes.length, true), 1);
   };

   this.mouseup = function (ev) {
     if (tool.started) {
      tool.mousemove(ev);
      tool.started = false;
      img_update();

      nodes.push(new Node(new_id,[tool.x0, tool.y0], findNT()));
      new_id++;

      //add extra attributes
      //add bathroom things
      if (document.getElementById("nodeType").value == "bathroom") {
        if (nodeID(new_id - 1).gender = document.getElementsByName("gender")[0].checked)  {
          nodeID(new_id - 1).gender = 'F'; //if female is checked
        }
        else {
          nodeID(new_id - 1).gender = 'M'; //if male is checked
        }
      } 
      else if (document.getElementById("nodeType").value == "room") {
        nodeID(new_id - 1).room = document.getElementsByName('numtextbox')[0].value;
        var value = document.getElementsByName('numtextbox')[0].value;
        if (value != "") { //if not no room number
          value = parseInt(value) + 1;
          document.getElementsByName('numtextbox')[0].value = value.toString();
        }
      } 
      else if (document.getElementById("nodeType").value == 'entry') {
        nodeID(new_id - 1).entryway = document.getElementsByName('entryway')[0].value;
        var value = document.getElementsByName('entryway')[0].value;
        if (value != "") { //if an entryway number
          value = parseInt(value) + 1;
          document.getElementsByName('entryway')[0].value = value.toString();
        }
      }
      else if ((document.getElementById("nodeType").value == 'stairs') || (document.getElementById("nodeType").value == 'elevator')){
        nodeID(new_id - 1).stairset = document.getElementById("stairset").value;
        var value = document.getElementById("stairset").value;
        if (value != "") { //if an entryway number
          value = parseInt(value) + 1;
          document.getElementById("stairset").value = value.toString();
        }
        if (document.getElementById("nodeType").value == 'elevator'){

          // array of floors in format like 1, 2, 4
          var string = document.getElementById("floorset").value;
          var parts;
          if (string.indexOf(", ") != -1){
            parts = string.split(", ");
          }
          else if (string.indexOf(",")!= -1){
            parts = string.split(",");
          }
          nodeID(new_id - 1).floorset = parts;
          }
          // stairs
          else{
            if (nodeID(new_id - 1).vertical = document.getElementsByName("dirnodes")[0].checked)  {
              nodeID(new_id - 1).vertical = 'U'; 
            }
            else if (nodeID(new_id - 1).vertical = document.getElementsByName("dirnodes")[1].checked){
              nodeID(new_id - 1).vertical = 'D'; 
            }
            else{
              nodeID(new_id - 1).vertical = 'B'; 
            }

          }
        }

       //update undo
       undo.push("n"); //add new to end
       if(undo.length == undo_length) { 
         undo.shift(); //only store last 10
       }
     }
   };
 }; //end tools.node

// The resize tool.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 edits.resize = function(){
   var edit = this;
   this.started = false;

   var old_x, old_y, end_x, end_y, snapping_x, snapping_y, current_x, current_y;
   var node_id; //id of the resizing node
   var first_run = false;
   connect_id = []; // ids of the nodes on the other end of edges
   var snapping;

   this.mousedown = function (ev) {
     edit.started = true;
     var close = closest(ev._x, ev._y);
     old_x = close[0][0]; //remember the xcoor of the node
     old_y = close[0][1]; //remember the ycoor of the node
     node_id = close[1];

    //parse through edge array to find connected edges
     connect_id = connectedEdges(node_id);
     //prepare first_run
     first_run = true;

     snapping = document.getElementsByName('snapping')[0].checked;
     //prepare snapping
     if (snapping) { //if snapping true
       snapping_x = true;
       snapping_y = true;
     }
   };

   this.mousemove = function (ev) {
     if (!edit.started) {
       return;
     }
     if (first_run) {
       //removal of original edges to the moved node
       for (var i = 0; i < connect_id.length; i++) {
         remove_edges(nodes[connect_id[i]].coords, [old_x, old_y], connect_id[i], node_id);
        }
       //remove original node
       remove_nodes([old_x, old_y]);
       first_run = false;
     }

     if (!snapping) {
       current_x = ev._x;
       current_y = ev._y;
     } 
     else {
       if (snapping_x) {current_x = ev._x;}
       if (snapping_y) {current_y = ev._y;}
     }

     var tolerance = 2;
     context.clearRect(0, 0, canvas.width, canvas.height);
     //mouseCoords(ev._x, ev._y);

     if (snapping) { //if snapping is on
       for (var i = 0; i < connect_id.length; i++) { //for all neighbors of the node
         var coords = nodes[connect_id[i]].coords;
         if (snapping_x) {
           if (Math.abs(coords[0] - current_x) <= tolerance) {
             current_x = coords[0];
             snapping_x = false;
           }
         }
         if (snapping_y) {
           if (Math.abs(coords[1] - current_y) <= tolerance) {
             current_y = coords[1];
             snapping_y = false;
           }
         }
       }
     } 

     //draw new edges
     for (var i = 0; i < connect_id.length; i++) {
       draw_edge(nodeID(connect_id[i]).coords[0], nodeID(connect_id[i]).coords[1], current_x, current_y, 'black', 2);
     }

     for (var i = 0; i < connect_id.length; i++) {
      draw_node(nodeID(connect_id[i]).coords[0], nodeID(connect_id[i]).coords[1], radius, colorFind(connect_id[i], false), 1)
     }

    draw_node(current_x, current_y, radius, colorFind(node_id, false), 1);  //draw new node
     
     end_x = current_x;
     end_y = current_y;
   };

   this.mouseup = function (ev) {
     if (edit.started) {
       edit.mousemove(ev);
       edit.started = false;
       img_update();
       mouse_context.clearRect(0, 0, mouse_canvas.width, mouse_canvas.height);

       //update coordinates of changed node
       nodeID(node_id).coords = [end_x, end_y];

       connected_edges = connect_id;
       //add to undo list
       undo.push([node_id, [old_x, old_y], connected_edges]); //node id, old coordinates, connect_id[]

       //clear connect_id
       connect_id = [];
     }
   };
 }; //end tools.resize
 
// SAVE, LOAD Functions ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
function saveGraph() {
  var image = document.getElementById('image').value;
  image = image.substr(12);

  function Graph() {
    this.image = image;
    this.nodes = nodes;
    this.edges = edges;
  }
  document.getElementById('graph_info').value = JSON.stringify(new Graph());
}

function loadGraph() {
  clearGraph();
  var graph = document.getElementById('graph_info').value;
  graph = JSON.parse(graph);
  var node_length = nodes.length;
  var edge_length = edges.length;

  //add new edges and nodes
  var new_nodes = graph.nodes;
  var new_edges = graph.edges;
  for (var i = 0; i < new_nodes.length; i++) {
    nodes.push(new_nodes[i]);
  }
  for (var i = 0; i < new_edges.length; i++) {
    edges.push(new_edges[i]);
  }
  //clear temp canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
  //draw on temp canvas
  for (var i = edge_length; i < edges.length; i++) {
    draw_edge(nodeID(edges[i].coords[0]).coords[0], nodeID(edges[i].coords[0]).coords[1], nodeID(edges[i].coords[1]).coords[0], nodeID(edges[i].coords[1]).coords[1], 'black', 2);
  }
  for (var i = node_length; i < nodes.length; i++) {
    draw_node(nodeID(i).coords[0], nodeID(i).coords[1], radius, colorFind(i, false), 1);
  }
  img_update();
  //set background IF no current background
}

function clearGraph() {
  //clear image
  context.clearRect(0, 0, canvas.width, canvas.height);
  contexto.clearRect(0, 0, canvaso.width, canvaso.height);
  backgroundContext.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

  //clear nodes and edges
  nodes = [];
  edges = [];
}

// Mouse Coordinates ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 function mouseCoords(x, y) {
   var message = 'Mouse position: ' + x + ', ' + y;
   mouse_context.clearRect(0, 0, mouse_canvas.width, mouse_canvas.height);
   mouse_context.font = '12pt Calibri';
   mouse_context.fillStyle = 'black';
   mouse_context.fillText(message, 10, 20);
 } 

// my new fun tools ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//given the mouse coordinates determines if in range of node or edge - if so returns
//whichever object it is closest to
function regionDetection(x, y) { 
  var closest; //closest object
  var distance = Infinity; //distance of closest object
  var location; //location of object in array
  var range = 2;

  //check nodes
  for (var i = 0; i < nodes.length; i++) {
    var c =  nodes[i].coords; //parsing through the coords of every node
    var dist = (x - c[0])*(x - c[0]) + (y - c[1])*(y - c[1]);
    if (Math.sqrt(dist) <= (range + radius)) {
      if (dist < distance) {
        closest = 'n';
        distance = dist;
        location = i;
      }
    }
  }

  //check edges
  for (var i = 0; i < edges.length; i++) {
    var end_nodes = edges[i].coords;
    var coordsA = nodeID(end_nodes[0]).coords;
    var coordsB = nodeID(end_nodes[1]).coords;
    var range = 3;

    //check range
    if ((Math.min(coordsA[0], coordsB[0]) - range - 2) <= x && x <= (Math.max(coordsA[0], coordsB[0]) + range + 2) && //x coords
        (Math.min(coordsA[1], coordsB[1]) - range - 2) <= y && y <= (Math.max(coordsA[1], coordsB[1]) + range + 2)) { //y coords
      //find distance to line
      var m = (coordsA[1] - coordsB[1]) / (coordsA[0] - coordsB[0]);
      var dist = Math.abs(y - coordsA[1] - m * x + m * coordsA[0]) / Math.sqrt(1 + m * m);
      if (dist < range && dist + radius + range + 2 < distance) {
        closest = 'e';
        distance = dist;
        location = i;
      }
    }
  }

  if (distance == Infinity) return 'none';
  return [closest, location];
}

//The edit tool
tools.edit = function() {
  var tool = this;
  this.started = false;
  if(nodes.length == 0) 
    alert("No nodes to edit!");
}

edits.deleted = function() {
   var edit = this;
   this.started = false;

   var closest;
   var remove;
   var remove_id;

   this.mousedown = function (ev) {
     edit.started = true;
   }

   this.mousemove = function (ev) {
     if (!edit.started) {
       return;
     }
     context.clearRect(0, 0, canvas.width, canvas.height);
     //region detection
     closest = regionDetection(ev._x, ev._y);
     if (closest != 'none') { //if returned something
      remove_id = closest[1];

       //highlight node or edge
       if (closest[0] == 'e') {
        remove = edges[remove_id];
         draw_edge(nodeID(remove.coords[0]).coords[0], nodeID(remove.coords[0]).coords[1], nodeID(remove.coords[1]).coords[0], nodeID(remove.coords[1]).coords[1], 'yellow', 2);
       }
       else if (closest[0] == 'n') {
         remove = nodes[remove_id];
         draw_node(remove.coords[0], remove.coords[1], radius, 'yellow', 1);
       }
     }
   };

   this.mouseup = function (ev) {
     if (edit.started) {
      edit.mousemove(ev);
      edit.started = false;
      if (closest != 'none') {
        //remove closest
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (closest[0] == 'e') {
         removeEdge(remove_id);
        }
        else if (closest[0] == 'n') {
          undo.push(removeNode(nodes[remove_id].id));
        }
      }
    }
  }
 }

function removeNode(remove_id) {
  var remove;
  var remove_location;
  for (var i = 0; i < nodes.length; i++) { //find node location
    if (nodes[i].id == remove_id) {
      remove = nodes[i];
      remove_location = i;
    } 
  }

  var connect_id = [];
  var removed_edges = [];
  var removed_edges_id = [];
  for (var i = 0; i < edges.length; i++) { //for every edge
    if (edges[i].coords[0] == remove_id) {
      connect_id.push(edges[i].coords[1]); //push id of the other node
      removed_edges.push(edges[i]);
      removed_edges_id.push(i);
    }
    else if (edges[i].coords[1] == remove_id){
      connect_id.push(edges[i].coords[0]); //push id of the other node
      removed_edges.push(edges[i]);
      removed_edges_id.push(i);
    }
  }
  //remove edges from array
  for (var i = removed_edges_id.length - 1; i >= 0; i--) {
    edges.splice(removed_edges_id[i], 1);
  }
  for (var i = 0; i < connect_id.length; i++) {
    remove_edges(nodeID(connect_id[i]).coords, remove.coords, connect_id[i], remove.id);
  }
  remove = nodes.splice(remove_location, 1)[0];
  remove_nodes(remove.coords); //remove node from screen

  //ADD TO UNDO
  return ['dn', remove, removed_edges];
  img_update();
}

function removeEdge(remove_id) {
  remove = edges.splice(remove_id, 1)[0];
  remove_edges(nodeID(remove.coords[0]).coords, nodeID(remove.coords[1]).coords, remove.coords[0], remove.coords[1]); //remove from screen
         
  //ADD TO UNDO
  return ['de', remove];
  img_update();
}



edits.autonode = function() {
  var edit = this;
  this.started = false;

  var closest, x, y;

  this.mousedown = function (ev) {
    edit.started = true;
  }

  this.mousemove = function (ev) {
    if (!edit.started) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    x = ev._x;
    y = ev._y;
    closest = regionDetection(ev._x, ev._y);
    if (closest[0] != 'none') {
      if (closest[0] == 'e') {
        var endpoints = edges[closest[1]].coords;
        var a = nodeID(endpoints[0]).coords;
        var b = nodeID(endpoints[1]).coords;
        var u = (x - a[0])*(b[0] - a[0]) + (y - a[1])*(b[1] - a[1]);
        var udenom = (b[0] - a[0])*(b[0] - a[0]) + (b[1] - a[1])*(b[1] - a[1]);
        u /= udenom;
        x = a[0] + u * (b[0] - a[0]);
        y = a[1] + u * (b[1] - a[1]);

        draw_node(x, y, radius, 'black', 1); //assuming walking node
      }
    }
  };

  this.mouseup = function (ev) {
    if (edit.started) {
      edit.mousemove(ev);
      edit.started = false;

      if (closest[0] != 'none') {
        if (closest[0] == 'e') {
          //add node
          nodes.push(new Node(new_id,[x, y], 'walk'));
          //remove edge, add two new edges
          coords = edges[closest[1]].coords;
          removeEdge(closest[1]);
          edges.push(new Edge([new_id, coords[0]]));
          edges.push(new Edge([new_id, coords[1]]));
          new_id++;

          //draw
          draw_edge(x, y, nodeID(coords[0]).coords[0], nodeID(coords[0]).coords[1], 'black', 2);
          draw_edge(x, y, nodeID(coords[1]).coords[0], nodeID(coords[1]).coords[1], 'black', 2);
          draw_node(x, y, radius, 'black', 1);
          draw_node(nodeID(coords[0]).coords[0], nodeID(coords[0]).coords[1], radius, colorFind(coords[0]), 1);
          draw_node(nodeID(coords[1]).coords[0], nodeID(coords[1]).coords[1], radius, colorFind(coords[1]), 1);

          img_update();

          undo.push(['an', new_id - 1, coords[0], coords[1]]);
        }
      }
    }
  }
}


edits.straightline = function() {
  var edit = this;
  this.started = false;

  var closest;
   var remove;
   var remove_id;
   var selected_node;
   var selected_edge;

   this.mousedown = function (ev) {
    edit.started = true;
    selected_node = [];
    selected_edge = [];
   }

   this.mousemove = function (ev) {
     if (!edit.started) {
       return;
     }
     //region detection
     closest = regionDetection(ev._x, ev._y);
     if (closest != 'none') { //if returned something
      remove_id = closest[1];

       //highlight node or edge
       if (closest[0] == 'e') {
        var contains = false;
        for (var i = 0; i < selected_edge.length; i++) {
          if (selected_edge[i] == closest[1])
            contains = true;
        }
        if (!contains) { //doesnt already contain
          selected_edge.push(closest[1]);
          remove = edges[closest[1]];
          draw_edge(nodeID(remove.coords[0]).coords[0], nodeID(remove.coords[0]).coords[1], nodeID(remove.coords[1]).coords[0], nodeID(remove.coords[1]).coords[1], 'yellow', 2);
         }
       }
       else if (closest[0] == 'n') {
        var contains = false;
        remove = nodes[remove_id];
        for (var i = 0; i < selected_node.length; i++) {
          if (selected_node[i].id == remove.id)
            contains = true;
        }
        if (!contains) {
          selected_node.push(remove);
          draw_node(remove.coords[0], remove.coords[1], radius, 'yellow', 1);
        }
       }
     }
   };

  this.mouseup = function (ev) {
    if (edit.started) {
      edit.mousemove(ev);
      edit.started = false;
      context.clearRect(0, 0, canvas.width, canvas.height);
      if ((selected_node.length == (selected_edge.length + 1)) && (selected_edge.length > 0)) { //valid selection
        //STRAIGHTEN
        alert('lets be creative!')
        

        //remove all edges and nodes
        for (var i = 0; i < selected_edge.length; i++) {
          var nodeA = nodeID(edges[selected_edge[i]].coords[0]);
          var nodeB = nodeID(edges[selected_edge[i]].coords[1]);
          remove_edges(nodeA.coords, nodeB.coords, nodeA.id, nodeB.id); //remove from screen
        }
        for (var i = 0; i < selected_node.length; i++) {
          remove_nodes(selected_node[i].coords);
        }

        //find node endpoints
        var result = {};
        var endpoints = [];
        for (var i = 0; i < selected_edge.length; i++) {
          var coords = edges[selected_edge[i]].coords;
            if (!(coords[0] in result))
                result[coords[0]] = 1;
            else {
              result[coords[0]]++;
            }
            if (!(coords[1] in result))
                result[coords[1]] = 1;
            else {
              result[coords[1]]++;
            }
        }

        for (var id in result) {
          if (result[id] == 1)
            endpoints.push(id);
        }

        //find line of best fit
        //convert each other selected node's coords to new coords on line
        for (var i = 0; i < selected_node.length; i++) {
          var x = selected_node[i].coords[0];
          var y = selected_node[i].coords[1];
          var a = nodeID(endpoints[0]).coords;
          var b = nodeID(endpoints[1]).coords;
          var u = (x - a[0])*(b[0] - a[0]) + (y - a[1])*(b[1] - a[1]);
          var udenom = (b[0] - a[0])*(b[0] - a[0]) + (b[1] - a[1])*(b[1] - a[1]);
          u /= udenom;
          x = a[0] + u * (b[0] - a[0]);
          y = a[1] + u * (b[1] - a[1]);

          selected_node[i].coords[0] = x;
          selected_node[i].coords[1] = y;
        }

        //draw new nodes and edges
        for (var i = 0; i < selected_edge.length; i++) {
          var nodeA = nodeID(edges[selected_edge[i]].coords[0]);
          var nodeB = nodeID(edges[selected_edge[i]].coords[1]);
          draw_edge(nodeA.coords[0], nodeA.coords[1], nodeB.coords[0], nodeB.coords[1], 'black', 2); //remove from screen
        }
        for (var i = 0; i < selected_node.length; i++) {
          draw_node(selected_node[i].coords[0], selected_node[i].coords[1], radius, colorFind(selected_node[i].id), 1);
        }

        img_update();
      }
    }
  }
}



 // EVENT LISTENERS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 if (window.addEventListener) {
     window.addEventListener('load', init(), false);

 }

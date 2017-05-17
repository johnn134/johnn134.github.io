/* Module      : webgl-project2.js
 * Author      : John Nelson
 * Email       : jpnelson@wpi.edu
 * Course      : 4732
 *
 * Description : This is my submission for Project 3 for CS 4732.
 *               This program fills a scene with obstacles and creatures that flock
 * 
 *               WebGL base code is built upon the WebGL tutorial code found at:
 *               https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial
 *               These tutorials provided the environment code for rendering
 *               to a WebGL canvas element.
 *
 * Date        : 2017/04/14
 *
 * History:
 * Revision      Date          Changed By
 * --------      ----------    ----------
 * 01.00         2017/04/14    jpnelson
 * First release.
 *
 * (c) Copyright 2017, Worcester Polytechnic Institute.
 */

/* -- GLOBAL VARIABLES --------------------------------------------------- */

var gl; 	// A global variable for the WebGL context
var ctx;	// A global variable for the WebGL text context
var canvas;
var txtCanvas;
var mvMatrix;
var perspectiveMatrix;
var date;

var objects = [];

var fontSize = 16.0;
var fontType = 'courier'
var horizAspect = 480.0/640.0;
var FPS = 60;
var frame = 0;
var lastFrameTime = 0;
var cameraPos = [0, 0, 30];

var worldRadius = 10.0;
var startingCreatures = 50;

/* ----------------------------------------------------------------------- */
/* Function    : start()
 *
 * Description : Starts up the WebGL application and initializes the
 *               buffers and shaders.
 *
 * Parameters  : N/A
 *
 * Returns     : N/A
 */
function start() {
	//printHTML("starting");
	canvas = document.getElementById('glCanvas');

	// Initialize the GL context
	gl = initWebGL(canvas);

	// Only continue if WebGL is available and working
	if (!gl) {
		return;
	}

	txtCanvas = document.getElementById('text');

	ctx = initWebGLText(txtCanvas);

	if(!ctx) {
		return;
	}

	// Set clear color to white, fully opaque
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	// Enable depth testing
	gl.enable(gl.DEPTH_TEST);
	// Near things obscure far things
	gl.depthFunc(gl.LEQUAL);
	// Clear the color as well as the depth buffer.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	//Set Text font
	ctx.font = '' + fontSize + 'px ' + fontType;
	ctx.textAlign = 'left';
	ctx.textBaseline = 'hanging';
	//Clear the text canvas
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	initShaders();

	initBuffers();

	loadScene();

	setInterval(drawScene, 1000 / FPS);

	//testStuff();
}

/* ----------------------------------------------------------------------- */
/* Function    : drawScene()
 *
 * Description : Sets up the perspective and camera Matrix then calls
 *                the draw function for each object. 
 *                Update is then called each frame.
 *
 * Parameters  : N/A
 *
 * Returns     : N/A
 */
function drawScene() {
	frame += 1;

	//Draw Objects onto the canvas element
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
	var l = makeLookAt(cameraPos[0], cameraPos[1], cameraPos[2],
	         0, 0, 0,
	         0, 1, 0);

	loadIdentity();

	multMatrix(l);

	for(i = 0; i < objects.length; i++) {
		drawObject(objects[i]);
	}

	//Draw text onto the text canvas element
	drawText();

	Update();
}

/* ----------------------------------------------------------------------- */
/* Function    : drawObject(obj)
 *
 * Description : Draws the given object using its transform variables
 *
 * Parameters  : Object obj : object to be drawn
 *
 * Returns     : N/A
 */
function drawObject(obj) {
	//Translate and rotate cube
	mvPushMatrix();

	mvTranslate(obj.position);
	Quaternion.ApplyMatrix(obj.rotation);
	mvScale(obj.scale);

	//Bind attribute buffers
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesColorBuffers[obj.material.color]);
	gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

	// Draw Cube Triangles
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

	obj.children.forEach(drawObject);

	// Restore the original matrix
	mvPopMatrix();
}

function drawText() {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.fillText("Red   Creatures: " + numCreatures[0], 0, 0);
	ctx.fillText("Green Creatures: " + numCreatures[1], 0, fontSize);
	ctx.fillText("Blue  Creatures: " + numCreatures[2], 0, fontSize * 2);
}

/* ----------------------------------------------------------------------- */
/* Function    : loadScene()
 *
 * Description : Fills the scene with obstacles and creatures
 *
 * Parameters  : N/A
 *
 * Returns     : N/A
 */
function loadScene() {
	//Origin Obstacle
	var zero = [0.0, 0.0, 0.0];
	var one = [1.0, 1.0, 1.0];
	new Obstacle([0.0, 0.0, 0.0], zero, one, Colors.BLACK, "origin obstacle");
	new Obstacle([-5.0, 5.0, -5.0], zero, one, Colors.BLACK, "origin obstacle");
	new Obstacle([5.0, 5.0, 5.0], zero, one, Colors.BLACK, "origin obstacle");
	new Obstacle([-5.0, -5.0, 5.0], zero, one, Colors.BLACK, "origin obstacle");
	new Obstacle([5.0, -5.0, -5.0], zero, one, Colors.BLACK, "origin obstacle");

	for(var i = 0; i < startingCreatures; i++) {
		new Creature(0);
		new Creature(1);
		new Creature(2);
	}
}

/* ----------------------------------------------------------------------- */
/* Function    : Update()
 *
 * Description : Called every frame. Tells each object to update its position
 *
 * Parameters  : N/A
 *
 * Returns     : N/A
 */
function Update() {
	var delta = 0;

	if(frame == 1) {
		lastFrameTime = curTime();
	}
	else {
		delta = (curTime() - lastFrameTime) / 1000;	//time since last frame in seconds
		lastFrameTime = curTime();
	}

	creatures.forEach(function(item) {
		item.updatePosition(delta);
	});
}

/* ----------------------------------------------------------------------- */
/* Function    : testStuff()
 *
 * Description : tests some functions at the start of the program for debug purposes
 *
 * Parameters  : N/A
 *
 * Returns     : N/A
 */
function testStuff() {
	printHTML("testing stuff");
	var dim = [1, 1, 1];
	var a = [0, 0, 0];
	var b = [2, 0, 0];
	var c = [1, 1, 1];
	printHTML("a & a: " + testCollision(a, dim, a, dim));
	printHTML("a & b: " + testCollision(a, dim, b, dim));
	printHTML("a & c: " + testCollision(a, dim, c, dim));

	var l1 = [-1, 0, 0];
	var l2 = [1, 0, 0];
	var p = [0, 0, 0];
	var dim = [1, 1, 1];
	var r = testLineBoxCollision(l1, l2, p, dim);
	printHTML("line to box: " + r);
}

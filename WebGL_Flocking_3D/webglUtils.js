/* Module      : webglUtils.js
 * Author      : John Nelson
 * Email       : jpnelson@wpi.edu
 * Course      : 4732
 *
 * Description : Utility functions for the WebGL environment
 * 
 *               This program is built upon the WebGL tutorial code found at:
 *               https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial
 *               These tutorials provided the environment code for rendering
 *               to a WebGL canvas element.
 *
 * Date        : 2017/03/28
 *
 * History:
 * Revision      Date          Changed By
 * --------      ----------    ----------
 * 01.00         2017/03/28    jpnelson
 * First release.
 *
 * (c) Copyright 2017, Worcester Polytechnic Institute.
 */
 
/* -- GLOBAL VARIABLES --------------------------------------------------- */

var cubeVerticesBuffer;
var cubeVerticesIndexBuffer;
var cubeVerticesColorBuffers = [];
var vertexPositionAttribute;
var vertexColorAttribute;
var shaderProgram;

/* ----------------------------------------------------------------------- */
/* Function    : initWebGL(canvas)
 *
 * Description : Initialies the canvas on which the WebGL application
 *               is displayed.
 *
 * Parameters  : WebGL-canvas canvas : the canvas element being drawn to
 *
 * Returns     : WebGL-context : standard or experimental WebGL context
 */
function initWebGL(canvas) {
  gl = null;
  
  // Try to grab the standard context. If it fails, fallback to experimental.
  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  // If we don't have a GL context, give up now
  if (!gl) {
    alert('Unable to initialize WebGL. Your browser may not support it.');
  }
  
  return gl;
}

/* ----------------------------------------------------------------------- */
/* Function    : initWebGLText(canvas)
 *
 * Description : Initialies the canvas on which the WebGL application text
 *               is displayed.
 *
 * Parameters  : WebGL-canvas canvas : the canvas element being drawn to
 *
 * Returns     : WebGL-context : 2d WebGL context
 */
function initWebGLText(canvas) {
  ctx = null;

  ctx = canvas.getContext("2d");

  if(!ctx) {
    alert('Unable to initialize WebGL. Your browser may not support it.')
  }

  return ctx;
}

/* ----------------------------------------------------------------------- */
/* Function    : initBuffers()
 *
 * Description : Initializes the OpenGL buffers storing the vertices positions, 
 *               vertices indexes, and vertices colors.
 *
 * Parameters  : N/A
 *
 * Returns     : N/A
 */
function initBuffers() {
  
  //Create buffer to hold cube vertices

  cubeVerticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);


  // Create buffer to hold cube vertex colors

  var generatedColors = [];

  for (var j = 0; j < 6; j++) {
    var c = colors[j];
    
    for (var i = 0; i < 4; i++) {
      generatedColors = generatedColors.concat(c);
    }
  }
  cubeVerticesColorBuffers.push(gl.createBuffer());
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesColorBuffers[0]);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(generatedColors), gl.STATIC_DRAW);

  //RED
  var redColors = [];
  for(var i = 0; i < vertices.length; i++)
    redColors = redColors.concat([1.0, 0.0, 0.0, 1.0]);
  cubeVerticesColorBuffers.push(gl.createBuffer());
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesColorBuffers[1]);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(redColors), gl.STATIC_DRAW);

  //GREEN
  var greenColors = [];
  for(var i = 0; i < vertices.length; i++)
    greenColors = greenColors.concat([0.0, 1.0, 0.0, 1.0]);
  cubeVerticesColorBuffers.push(gl.createBuffer());
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesColorBuffers[2]);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(greenColors), gl.STATIC_DRAW);

  //BLUE
  var blueColors = [];
  for(var i = 0; i < vertices.length; i++)
    blueColors = blueColors.concat([0.0, 0.0, 1.0, 1.0]);
  cubeVerticesColorBuffers.push(gl.createBuffer());
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesColorBuffers[3]);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(blueColors), gl.STATIC_DRAW);

  //BLACK
  var blackColors = [];
  for(var i = 0; i < vertices.length; i++)
    blackColors = blackColors.concat([0.0, 0.0, 0.0, 1.0]);
  cubeVerticesColorBuffers.push(gl.createBuffer());
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesColorBuffers[4]);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(blackColors), gl.STATIC_DRAW);

  // Create buffer to hold the indices of the cube vertex

  cubeVerticesIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
}

/* ----------------------------------------------------------------------- */
/* Function    : initBuffers()
 *
 * Description : Initializes the OpenGL shaders storing 
 *				 the vertex and fragment shaders
 *
 * Parameters  : N/A
 *
 * Returns     : N/A
 */
function initShaders() {
  var fragmentShader = getShader(gl, 'shader-fs');
  var vertexShader = getShader(gl, 'shader-vs');
  
  // Create the shader program
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
  }
  
  gl.useProgram(shaderProgram);
  
  // Get the position attribute associated with the vertex shader
  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.enableVertexAttribArray(vertexPositionAttribute);

  // Get the color attribute associated with the vertex shader
  vertexColorAttribute = gl.getAttribLocation(shaderProgram, 'aVertexColor');
  gl.enableVertexAttribArray(vertexColorAttribute);
}

/* ----------------------------------------------------------------------- */
/* Function    : getShader(gl, id, type)
 *
 * Description : Returns the compiled shader from the given shader file
 *
 * Parameters  : WebGL-context gl : copy of WebGL context
 *               string id : identifier of given shader
 *               string type : identifier for vertex or fragment shader
 *
 * Returns     : shader : vertex, fragment, null
 */
function getShader(gl, id, type) {
  var shaderScript, theSource, currentChild, shader;
  
  shaderScript = document.getElementById(id);
  
  if (!shaderScript) {
    return null;
  }
  
  theSource = shaderScript.text;
  if (!type) {
    if (shaderScript.type == 'x-shader/x-fragment') {
      type = gl.FRAGMENT_SHADER;
    } else if (shaderScript.type == 'x-shader/x-vertex') {
      type = gl.VERTEX_SHADER;
    } else {
      // Unknown shader type
      return null;
    }
  }
  shader = gl.createShader(type);
  gl.shaderSource(shader, theSource);
    
  // Compile the shader program
  gl.compileShader(shader);  
    
  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {  
      console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));  
      gl.deleteShader(shader);
      return null;  
  }
    
  return shader;
}

/* ----------------------------------------------------------------------- */
/* Function    : printHTML()
 *
 * Description : adds the message to the debug HTML element
 *
 * Parameters  : string message : message to be printed
 *
 * Returns     : N/A
 */
function printHTML(message) {
	document.getElementById('debug').innerHTML = 
		document.getElementById('debug').innerHTML + '<br>' + frame + ': ' + message;
}

/* ----------------------------------------------------------------------- */
/* Function    : curTime()
 *
 * Description : returns the current time in milliseconds
 *
 * Parameters  : N/A
 *
 * Returns     : int : time in milliseconds
 */
function curTime() {
  date = new Date();
  return date.getTime();
}

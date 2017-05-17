John Nelson - jpnelson@wpi.edu
CS 4732 - D17 - Project 3

The youtube video of my project running can be found at:
https://youtu.be/rUf1xYcTuXw

You can run my program by opening the html file. The program starts with 50 of each creature spawned
at a random location with a random velocity. The creatures begin to flock and hunt one another as
the program goes on. The number of each creature type is displayed in the top left.

My development environment runs in WebGL. My files are as so:

-index.html : Html file containing my vertex and fragment shaders along with my WebGL canvas.

-webgl-project3.js : This is the primary Javascript file for my project 3. This file contains
			code for loading the scene objects and drawing the scene.

-creature.js : This file contains the Creature, Obstacle, and BoxCollider classes and functions.
		It also contains functions for testing collisions and vector methods.

-model.js : This file contains the vertices for the cube model.

-object.js : This file contains the object code for my Object and Animation classes. Object
		stores the position, rotation, scale, animation, and children of a scene object.
		Animations are created from splines and passed to objects for them to be
		animated using the given spline control point values. I used interpolation
		for all of my animations.

-quaternion.js : This file contains all of the functions related to quaternions.
			My quaternions are just arrays of 4 numbers, not objects.

-webglUtils.js : I moved some of the functions required for building the webGL environment
		into this javascript file. No code specific to this project is in this file.

-glUtils.js : Helper and utility functions for WebGL. Not made by me.
	      Source: https://github.com/mdn/webgl-examples/blob/gh-pages/tutorial/glUtils.js

-sylvester.js : Helper and utility functions for WebGL. Not made by me.
		Note that the entire file is on one line so there is not much
		to read here.
		Source: http://sylvester.jcoglan.com/

-spline.js : This file contains the object code for my splines, control points, spline
		interpolation and approximation, and quaternion slerping.

-splineReader.js : This file contains the functions for reading in a spline txt file
			and building the spline from the information.

-spline1.txt : this is the given spline txt file. It holds the splines for animating each object
		in the bird figure hierarchy.

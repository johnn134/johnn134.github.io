/* Module      : creature.js
 * Author      : John Nelson
 * Email       : jpnelson@wpi.edu
 * Course      : 4732
 *
 * Description : Creature and Object classes. Collision and vector functions
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

var CREATURESIZE = 0.25;
var SEPARATEWEIGHT = 1.5;
var COHEREWEIGHT = 1.0;
var ALIGNWEIGHT = 1.0;
var TRACKWEIGHT = 2.0;
var FLEEWEIGHT = 1.5;
var DODGEWEIGHT = 5.0;

var uniqueCreatures = 0;
var creatures = [];
var numCreatures = [0, 0, 0];
var obstacles = [];

/* ----------------------------------------------------------------------- */
/* Function    : Creature(type)
 *
 * Description : Creature class. Holds data for creature object
 *
 * Parameters  : int type :0 - red, 1 - green, 2 - blue
 *
 * Returns     : new Creature
 */
function Creature(type) {
	this.object = new Object([0.0, 0.0, 0.0], 
							 [0.0, 0.0, 0.0], 
							 [CREATURESIZE, CREATURESIZE, CREATURESIZE], 
							 type + 1, 
							 "Creature " + uniqueCreatures);
	this.collider = new BoxCollider([2 * CREATURESIZE, 2 * CREATURESIZE, 2 * CREATURESIZE], this);
	this.type = type;
	this.maxVelocity = 4.0;
	this.velocity = [0, 0, 0];
	this.maxAcceleration = 0.3;
	this.acceleration = [0, 0, 0];
	this.visionRadius = 5.0;
	this.separationRadius = 2.5;
	this.trackRadius = 10.0;
	this.fleeRadius = 8.0;
	this.forwardMagnitude = 1.0;

	this.spawn();

	numCreatures[type]++;
	this.ID = uniqueCreatures;
	uniqueCreatures++;

	creatures.push(this);
}

/* ----------------------------------------------------------------------- */
/* Function    : spawn()
 *
 * Description : spawns the creature at a random position in the world space
 *				 with a random velocity.
 *
 * Parameters  : N/A
 *
 * Returns     : N/A
 */
Creature.prototype.spawn = function() {
	// Spawn creature at a random position in the worldspace
	this.object.position = [2 * worldRadius * Math.random() - worldRadius, 
							2 * worldRadius * Math.random() - worldRadius, 
							2 * worldRadius * Math.random() - worldRadius];

	// Spawn creature with a randomized velocity
	this.velocity = vectorNormalize([Math.random() * 2.0 - 1.0, 
					 				 Math.random() * 2.0 - 1.0, 
					 				 Math.random() * 2.0 - 1.0]);
	var factor = Math.random() * this.maxVelocity;
	this.velocity = vectorMultiply(this.velocity, factor);

	//printHTML(this.object.name + " spawned at " + this.object.position);
}

/* ----------------------------------------------------------------------- */
/* Function    : updatePosition(delta)
 *
 * Description : updates the position of the creature since the last frame
 *				 accumulates forces from flocking, tracking, escaping, and dodging
 *  			 and applies them to the velocity. It then updates the position
 *
 * Parameters  : float delta - time since last frame
 *
 * Returns     : N/A
 */
Creature.prototype.updatePosition = function(delta) {
	//update acceleration with flocking
	this.flock();

	//update acceleration with tracking
	this.track();

	//update acceleration with fleeing
	this.escape();


	//update acceleration with dodging
	this.dodge();

	this.velocity = vectorAddVector(this.velocity, vectorMultiply(this.acceleration, delta));
	this.velocity = vectorLimit(this.velocity, this.maxVelocity);
	this.object.position = vectorAddVector(this.object.position, vectorMultiply(this.velocity, delta));
	this.acceleration = [0, 0, 0];

	this.checkWorldBounds();

	this.testForCollisions();
}

/* ----------------------------------------------------------------------- */
/* Function    : flock()
 *
 * Description : Helper function for applying flocking forces to the
 *				 creature's acceleration this frame
 *
 * Parameters  : N/A
 *
 * Returns     : N/A
 */
Creature.prototype.flock = function() {
	//Acquire forces
	var cohesion = vectorMultiply(this.cohere(), COHEREWEIGHT);
	var alignment = vectorMultiply(this.align(), ALIGNWEIGHT);
	var separation = vectorMultiply(this.separate(), SEPARATEWEIGHT);

	//Combine forces
	this.acceleration = vectorAddVector(this.acceleration, cohesion);
	this.acceleration = vectorAddVector(this.acceleration, alignment);
	this.acceleration = vectorAddVector(this.acceleration, separation);
}

/* ----------------------------------------------------------------------- */
/* Function    : cohere()
 *
 * Description : calculates the cohesion force on this creature according
 *				 to all other creatures of the same type
 *
 * Parameters  : N/A
 *
 * Returns     : Vector3 acceleration
 */
Creature.prototype.cohere = function() {
	var sum = [0, 0, 0];
	var count = 0;
	for(var i = 0; i < creatures.length; i++) {
		if(creatures[i].ID != this.ID && creatures[i].type == this.type) {
			var d = vectorDistance(this.object.position, creatures[i].object.position);

			if(d > 0 && d < this.visionRadius) {
				sum = vectorAddVector(sum, creatures[i].object.position);
				count++;
			}
		}
	}

	if(count > 0)
		return this.seek(vectorDivide(sum, count));
	else
		return sum;
}

/* ----------------------------------------------------------------------- */
/* Function    : align()
 *
 * Description : calculates the alignment force for this creature according
 *				 to all other creatures of the same type
 *
 * Parameters  : N/A
 *
 * Returns     : Vector3 acceleration
 */
Creature.prototype.align = function() {
	var sum = [0, 0, 0];
	var count = 0;
	for(var i = 0; i < creatures.length; i++) {
		if(creatures[i].ID != this.ID && creatures[i].type == this.type) {	//Valid partner
			var d = vectorDistance(this.object.position, creatures[i].object.position);

			if(d > 0 && d < this.visionRadius) {
				sum = vectorAddVector(sum, creatures[i].velocity);
				count++;
			}
		}
	}

	if(count > 0) {
		sum = vectorDivide(sum, count);
		sum = vectorNormalize(sum);
		sum = vectorMultiply(sum, this.maxVelocity);

		var steer = vectorSubtractVector(sum, this.velocity);
		steer = vectorLimit(steer, this.maxAcceleration);

		return steer;
	}
	else
		return sum;
}

/* ----------------------------------------------------------------------- */
/* Function    : separate()
 *
 * Description : calculates the separation force for this creature according
 *				 to all other creatures of the same type
 *
 * Parameters  : N/A
 *
 * Returns     : Vector3 acceleration
 */
Creature.prototype.separate = function() {
	var steer = [0, 0, 0];
	var count = 0;
	for(var i = 0; i < creatures.length; i++) {
		if(creatures[i].ID != this.ID && creatures[i].type == this.type) {
			var d = vectorDistance(this.object.position, creatures[i].object.position);

			if(d > 0 && d < this.separationRadius) {
				var diff = vectorSubtractVector(this.object.position, creatures[i].object.position);
				diff = vectorDivide(vectorNormalize(diff), d);
				steer = vectorAddVector(steer, diff);
				count++;
			}
		}
	}

	if(count > 0) {
		steer = vectorDivide(steer, count);
	}

	if(vectorMagnitude(steer) > 0) {
		steer = vectorNormalize(steer);
		steer = vectorMultiply(steer, this.maxVelocity);
		steer = vectorLimit(steer, this.maxAcceleration);
	}

	return steer;
}

/* ----------------------------------------------------------------------- */
/* Function    : track()
 *
 * Description : calculates the tracking force for this creature according
 *				 to the closest creature of the target type
 *
 * Parameters  : N/A
 *
 * Returns     : Vector3 acceleration
 */
Creature.prototype.track = function() {
	var closestTarget = -1;
	var closestTargetDist = 1000000;
	for(var i = 0; i < creatures.length; i++) {
		if(creatures[i].type == ((this.type - 1) % 3)) {
			var d = vectorDistance(this.object.position, creatures[i].object.position);

			if(d > 0 && d < this.trackRadius && d < closestTargetDist) {
				closestTarget = i;
				closestTargetDist = d;
			}
		}
	}

	if(closestTarget > -1) {
		var steer = this.seek(creatures[closestTarget].object.position);
		var track = vectorMultiply(steer, TRACKWEIGHT);
		this.acceleration = vectorAddVector(this.acceleration, track);
	}
}

/* ----------------------------------------------------------------------- */
/* Function    : escape()
 *
 * Description : calculates the escape force for this creature according
 *				 to the average of the positions of hunting creatures
 *
 * Parameters  : N/A
 *
 * Returns     : Vector3 acceleration
 */
Creature.prototype.escape = function() {
	var sum = [0, 0, 0];
	var count = 0;
	for(var i = 0; i < creatures.length; i++) {
		if(creatures[i].type == ((this.type + 1) % 3)) {
			var d = vectorDistance(this.object.position, creatures[i].object.position);

			if(d > 0 && d < this.fleeRadius) {
				sum = vectorAddVector(sum, creatures[i].object.position);
				count++;
			}
		}
	}

	if(count > 0) {
		var steer = this.flee(vectorDivide(sum, count));

		var escape = vectorMultiply(steer, FLEEWEIGHT);
		this.acceleration = vectorAddVector(this.acceleration, escape);

		return steer;
	}
}

/* ----------------------------------------------------------------------- */
/* Function    : dodge()
 *
 * Description : calculates the dodge force for this creature according
 *				 to the nearest obstacle in front of the creature
 *
 * Parameters  : N/A
 *
 * Returns     : Vector3 acceleration
 */
Creature.prototype.dodge = function() {
	var sum = [0, 0, 0];
	var count = 0;
	var threat = -1;
	var threatDist = 1000000;
	for(var i = 0; i < obstacles.length; i++) {
		var d = vectorDistance(this.object.position, obstacles[i].object.position);
		var ahead = vectorMultiply(vectorNormalize(this.velocity), this.forwardMagnitude);
		var p2 = vectorAddVector(this.object.position, ahead);
		if(d < threatDist && testLineBoxCollision(this.object.position, 
												  p2, 
												  obstacles[i].object.position, 
												  obstacles[i].collider.dimensions)) {

			threat = i;
			threatDist = d;
		}
	}

	if(threat > -1) {
		var ahead = vectorAddVector(this.object.position, 
								  vectorMultiply(vectorNormalize(this.velocity), 
								  				 this.forwardMagnitude));
		var steer = vectorSubtractVector(ahead, obstacles[threat].object.position);
		steer = vectorMultiply(vectorNormalize(steer), this.maxAcceleration);
		steer = vectorLimit(steer, this.maxAcceleration);
		steer = vectorMultiply(steer, DODGEWEIGHT);
		this.acceleration = vectorAddVector(this.acceleration, steer);

		return steer;
	}
}

/* ----------------------------------------------------------------------- */
/* Function    : seek()
 *
 * Description : returns the seeking vector to the target from the current position
 *
 * Parameters  : Vector3 target
 *
 * Returns     : Vector3 seeking vector
 */
Creature.prototype.seek = function(target) {
	var desired = vectorSubtractVector(target, this.object.position);
	desired = vectorNormalize(desired);
	desired = vectorMultiply(desired, this.maxVelocity);

	var steer = vectorSubtractVector(desired, this.velocity);
	steer = vectorLimit(steer, this.maxAcceleration);

	return steer;
}

/* ----------------------------------------------------------------------- */
/* Function    : flee()
 *
 * Description : returns the fleeing vector away from the target
 *
 * Parameters  : Vector3 target
 *
 * Returns     : Vector3 fleeing vector
 */
Creature.prototype.flee = function(target) {
	var desired = vectorSubtractVector(this.object.position, target);
	desired = vectorNormalize(desired);
	desired = vectorMultiply(desired, this.maxVelocity);

	var steer = vectorSubtractVector(desired, this.velocity);
	steer = vectorLimit(steer, this.maxAcceleration);

	return steer;
}

/* ----------------------------------------------------------------------- */
/* Function    : checkWorldBounds()
 *
 * Description : keeps the creature within the world bounds and cycles it
 *				 from one side to the other if the creature moves past the bounds
 *
 * Parameters  : N/A
 *
 * Returns     : N/A
 */
Creature.prototype.checkWorldBounds = function() {
	var x = this.object.position[0];
	var y = this.object.position[1];
	var z = this.object.position[2];
	if(x < -worldRadius || x > worldRadius)
		this.object.position[0] *= -0.95;
	if(y < -worldRadius || y > worldRadius)
		this.object.position[1] *= -0.95;
	if(z < -worldRadius || z > worldRadius)
		this.object.position[2] *= -0.95;
}

/* ----------------------------------------------------------------------- */
/* Function    : testForCollisions()
 *
 * Description : tests this creature's box collider against the colliders
 *				 for all other creatures and obstacles for collisions
 *
 * Parameters  : N/A
 *
 * Returns     : N/A
 */
Creature.prototype.testForCollisions = function() {
	for(var i = 0; i < creatures.length; i++) {
		if(creatures[i].ID != this.ID) {
			if(testCollision(this.object.position, 
							 this.collider.dimensions, 
							 creatures[i].object.position, 
							 creatures[i].collider.dimensions)) {

				this.onCollision(creatures[i]);
			}
		}
	}
	for(var i = 0; i < obstacles.length; i++) {
		if(testCollision(this.object.position, 
						 this.collider.dimensions, 
						 obstacles[i].object.position, 
						 obstacles[i].collider.dimensions)) {
			//printHTML(this.object.name + " is colliding with " + obstacles[i].object.name);
		}
	}
}

/* ----------------------------------------------------------------------- */
/* Function    : onCollision()
 *
 * Description : called when this creature collides with another creature
 *				 changes the collided with creature if it is a target
 *
 * Parameters  : Creature target
 *
 * Returns     : N/A
 */
Creature.prototype.onCollision = function(target) {
	//printHTML(this.object.name + " has collided with " + target.object.name);
	switch(this.type) {
		case 0:  // this is red
			if(target.type == 2) {	//collided with blue
				target.changeColor(0);
			}
			break;
		case 1:  // this is green
			if(target.type == 0) {	//collided with red
				target.changeColor(1);
			}
			break;
		case 2:  // this is blue
			if(target.type == 1) {	//collided with green
				target.changeColor(2);
			}
			break;
		default:
			break;
	}
}

/* ----------------------------------------------------------------------- */
/* Function    : changeColor()
 *
 * Description : changes the type and color of a creature
 *
 * Parameters  : int type: 0 - red, 1 - green, 2 - blue
 *
 * Returns     : N/A
 */
Creature.prototype.changeColor = function(type) {
	//printHTML(this.object.name + ": " + this.type + "->" + type);
	numCreatures[this.type]--;
	numCreatures[type]++;
	this.type = type;
	this.object.material.color = type + 1;
}

/* ----------------------------------------------------------------------- */
/* Function    : Obstacle(position, rotation, scale, color, name)
 *
 * Description : Obstacle class. obstacle to be avoided by creatures
 *
 * Parameters  : Vector3 position - position of obstacle
 *				 Vector3 rotation - euler angles of rotation
 *				 Vector3 scale - scale of object
 *				 Colors color - color of object material
 *				 String name - name of obstacle
 *
 * Returns     : new Obstacle
 */
function Obstacle(position, rotation, scale, color, name) {
	this.object = new Object(position, rotation, scale, color, name);
	this.collider = new BoxCollider(vectorMultiply(scale, 2), this);
	obstacles.push(this);
}

/* ----------------------------------------------------------------------- */
/* Function    : BoxCollider(dimensions, parent)
 *
 * Description : BoxCollider class. box shaped collider
 *
 * Parameters  : Vector3 dimensions - position of obstacle
 *				 Creature/Obstacle parent - parent object
 *
 * Returns     : new BoxCollider
 */
function BoxCollider(dimensions, parent) {
	this.dimensions = dimensions;
	this.parent = parent;
}

/* ----------------------------------------------------------------------- */
/* Function    : testCollision(positionA, dimensionA, positionB, dimensionB)
 *
 * Description : tests if the two colliders are colliding
 *
 * Parameters  : Vector3 positionA - position of first collider
 *				 Vector3 dimenionA - dimensions of first collider
 *				 Vector3 positionB - position of second collider
 *				 Vector3 dimenionB - dimensions of second collider
 *
 * Returns     : boolean - colliding?
 */
function testCollision(positionA, dimensionA, positionB, dimensionB) {
	var minA = [0, 0, 0];
	var maxA = [0, 0, 0];
	var minB = [0, 0, 0];
	var maxB = [0, 0, 0];
	var collisions = [false, false, false];
	for(var i = 0; i < 3; i++) {
		minA[i] = positionA[i] - dimensionA[i] / 2.0;
		maxA[i] = positionA[i] + dimensionA[i] / 2.0;
		minB[i] = positionB[i] - dimensionB[i] / 2.0;
		maxB[i] = positionB[i] + dimensionB[i] / 2.0;
		collisions[i] = inRange(maxA[i], minB[i], maxB[i]) || inRange(minA[i], minB[i], maxB[i]);
	}
	return collisions[0] && collisions[1] && collisions[2];
}

/* ----------------------------------------------------------------------- */
/* Function    : testPointBoxCollision(v, position, dimension)
 *
 * Description : tests if the point is within the box
 *
 * Parameters  : Vector3 v - position of the point
 *				 Vector3 position - dimensions of the collider
 *				 Vector3 dimension - position of the collider
 *
 * Returns     : boolean - colliding?
 */
function testPointBoxCollision(v, position, dimension) {
	var min = [0, 0, 0];
	var max = [0, 0, 0];
	var collisions = [false, false, false];
	for(var i = 0; i < 3; i++) {
		min[i] = position[i] - dimension[i] / 2.0;
		max[i] = position[i] + dimension[i] / 2.0;
		collisions[i] = inRange(v[i], min[i], max[i]);
	}
	return collisions[0] && collisions[1] && collisions[2];
}

/* ----------------------------------------------------------------------- */
/* Function    : testLineBoxCollision(p1, p2, pos, dim) 
 *
 * Description : tests if the line intersects the box
 *
 * Parameters  : Vector3 p1 - position of the startpoint
 *				 Vector3 p2 - position of the endpoint
 *				 Vector3 pos - dimensions of the collider
 *				 Vector3 dim - position of the collider
 *
 * Returns     : boolean - intersecting?
 */
function testLineBoxCollision(p1, p2, pos, dim) {
	var B1 = [pos[0] - dim[0] / 2.0,
			  pos[1] - dim[1] / 2.0,
			  pos[2] - dim[2] / 2.0];
	var B2 = [pos[0] + dim[0] / 2.0,
			  pos[1] + dim[1] / 2.0,
			  pos[2] + dim[2] / 2.0];
	var L1 = p1;
	var L2 = p2;
	if (L2[0] < B1[0] && L1[0] < B1[0]) return false;	// line less than box x
	if (L2[0] > B2[0] && L1[0] > B2[0]) return false;	// line greater than box x
	if (L2[1] < B1[1] && L1[1] < B1[1]) return false;	// line less than box y
	if (L2[1] > B2[1] && L1[1] > B2[1]) return false;	// line greater than box y
	if (L2[2] < B1[2] && L1[2] < B1[2]) return false;	// line less than box z
	if (L2[2] > B2[2] && L1[2] > B2[2]) return false;	// line greater than box z
	if (L1[0] > B1[0] && L1[0] < B2[0] &&
    	L1[1] > B1[1] && L1[1] < B2[1] &&
    	L1[2] > B1[2] && L1[2] < B2[2]) {	//line inside box
    	return true;
	}
	var r = (getIntersection( L1, L2, B1, B2, 0, true ))	//line through box min x
	  	 || (getIntersection( L1, L2, B1, B2, 1, true )) 	//line through box min y
	   	 || (getIntersection( L1, L2, B1, B2, 2, true )) 	//line through box min z
	   	 || (getIntersection( L1, L2, B1, B2, 0, false )) 	//line through box max x
	  	 || (getIntersection( L1, L2, B1, B2, 1, false )) 	//line through box max y
	  	 || (getIntersection( L1, L2, B1, B2, 2, false ));	//line through box max z


	return r;
}

/* ----------------------------------------------------------------------- */
/* Function    : getIntersection(L1, L2, B1, B2, axis, min)
 *
 * Description : tests if the line intersects the face of the box
 *
 * Parameters  : Vector3 L1 - position of the startpoint
 *				 Vector3 L2 - position of the endpoint
 *				 Vector3 B1 - position of the minimum box corner
 *				 Vector3 B2 - position of the maximum box corner
 *				 int axis - 0 - x, 1 - y, 2 - z
 *				 boolean min - testing min points of box?
 *
 * Returns     : boolean - intersecting?
 */
function getIntersection(L1, L2, B1, B2, axis, min) {
	var dist1;
	var dist2;
	if(min) {
		dist1 = L1[axis] - B1[axis];
		dist2 = L2[axis] - B1[axis];
	}
	else {
		dist1 = L1[axis] - B2[axis];
		dist2 = L2[axis] - B2[axis];
	}
	if((dist1 * dist2) >= 0.0) return false;	// points are on same side of box edge
	if(dist1 == dist2) return false;	//points are equal

	//Line intersects current box edge,
	//is hit in the box?

	var diff = vectorSubtractVector(L2, L1);
	var factor = ( -1.0 * dist1 / (dist2 - dist1) );
	var hit = vectorAddVector(L1, vectorMultiply(diff, factor));	//P1 + (P2-P1) * (-dist1 / (dist2-dist1))

	//Test hit
	var a = (axis + 1) % 3;
	var b = (axis + 2) % 3;
	return inRange(hit[a], B1[a], B2[a]) && inRange(hit[b], B1[b], B2[b]);
}

/* ----------------------------------------------------------------------- */
/* Function    : inRange(val, min, max)
 *
 * Description : tests if the point is within min and max
 *
 * Parameters  : float val - value
 *				 float min - minimum
 *				 float max - maximum
 *
 * Returns     : boolean - intersecting?
 */
function inRange(val, min, max) {
	return val < max && val > min;
}

//*********************************** Vector Methods ****************************************//

function vectorMagnitude(v) {
	return Math.sqrt((v[0] * v[0]) + (v[1] * v[1]) + (v[2] * v[2]));
}

function vectorNormalize(v) {
	var mag = vectorMagnitude(v);
	if(mag == 0)
		return [0, 0, 0];
	return vectorDivide(v, vectorMagnitude(v));
}

function vectorLimit(v, max) {
	if(vectorMagnitude(v) > max) {
		var factor = max / vectorMagnitude(v);
		v = vectorMultiply(v, factor);
	}
	return v;
}

function vectorDistance(a, b) {
	return Math.sqrt(Math.pow(b[0] - a[0], 2)
					 + Math.pow(b[1] - a[1], 2) 
					 + Math.pow(b[2] - a[2], 2));
}

function vectorAdd(v, op) {
	return [v[0] + op, v[1] + op, v[2] + op];
}

function vectorAddVector(a, b) {
	return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function vectorSubtract(v, op) {
	return [v[0] - op, v[1] - op, v[2] - op];
}

function vectorSubtractVector(a, b) {
	return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function vectorDivide(v, dividend) {
	return [v[0] / dividend, v[1] / dividend, v[2] / dividend];
}

function vectorMultiply(v, op) {
	return [v[0] * op, v[1] * op, v[2] * op];
}

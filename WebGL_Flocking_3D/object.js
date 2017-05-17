/* Module      : object.js
 * Author      : John Nelson
 * Email       : jpnelson@wpi.edu
 * Course      : 4732
 *
 * Description : Object, Animation, and Material classes and functions
 *
 * Date        : 2017/04/14
 *
 * History:
 * Revision      Date          Changed By
 * --------      ----------    ----------
 * 01.00         2017/04/08    jpnelson
 * 02.00		 2017/04/14	   jpnelson
 * First release.
 *
 * (c) Copyright 2017, Worcester Polytechnic Institute.
 */

var uniqueID = 0;

/* ----------------------------------------------------------------------- */
/* Function    : Object(position, rotation, scale, name)
 *
 * Description : Object class. Holds transform for scene object
 *
 * Parameters  : Vector3 position : x, y, z coordinates
 *               Quaternion rotation : object rotation quaternion
 *               Vector3 scale : x, y, z scale
 *				 String name : name identifier for object
 *
 * Returns     : new Object
 */
function Object(position, rotation, scale, color, name) {
	this.position = position;
	this.rotation = Quaternion.toQuaternion(rotation);
	this.scale = scale;
	this.name = name;

	this.parent = null;
	this.children = [];
	this.numChildren = 0;

	this.animation = new Animation(null);
	this.material = new Material(color);

	this.id = uniqueID;
	uniqueID++;
	objects.push(this);
}

/* ----------------------------------------------------------------------- */
/* Function    : addChild(obj)
 *
 * Description : Sets given object and child of this object
 *
 * Parameters  : Object obj : new child
 *
 * Returns     : N/A
 */
Object.prototype.addChild = function(obj) {
	this.children.push(obj);
	obj.parent = this;
	this.numChildren++;
}

/* ----------------------------------------------------------------------- */
/* Function    : removeChild(obj)
 *
 * Description : Removes the given object from this object's list of children
 *
 * Parameters  : Object obj : child to be removed
 *
 * Returns     : N/A
 */
Object.prototype.removeChild = function(obj) {
	var index;
	for(i = 0; i < this.numChildren(); i++) {
		if(this.children[i] == obj)
			index = i;
	}
	this.children.slice(index + 1);
	obj.parent = null;
	this.numChildren--;
}

/* ----------------------------------------------------------------------- */
/* Function    : startAnimations()
 *
 * Description : sets the animations for this object and all children to play
 *
 * Parameters  : N/A
 *
 * Returns     : N/A
 */
Object.prototype.startAnimations = function() {
	this.animation.start();
	this.children.forEach(function(item, index) { 
		item.startAnimations(); 
	});
}

/* ----------------------------------------------------------------------- */
/* Function    : updateAnimations()
 *
 * Description : Updates the object's position and rotation along the
 *				 object's animation spline. Recurses through all children
 *
 * Parameters  : N/A
 *
 * Returns     : N/A
 */
Object.prototype.updateAnimations = function() {

	//Update this object based on its animation
	if(this.animation.isValid) {	//check for valid animation

  		var delta = curTime() - this.animation.startTime;
		

  		if(delta >= this.animation.spline.movementTime * 1000) {	//Animation has ended
  			
    		if(this.animation.isLooping)
    			this.animation.start();
    		else
    			this.animation.stop();
  		}
  		else {	//Animation has not ended
  			this.position = splineInterpolation(this.animation.spline, delta);
  			this.rotation = splineSlerp(this.animation.spline, delta);
  		}
	}

	//Recurse through children
	this.children.forEach(function(element) {
		
		element.updateAnimations();
	});
}

function SceneObject(position, rotation, scale, color, name) {
	this.object = new Object(position, rotation, scale, color, name);
}

/* ----------------------------------------------------------------------- */
/* Function    : Animation(spline)
 *
 * Description : Animation class. Stores animation information for an object
 *
 * Parameters  : Spline spline : spline of control points for animation
 *
 * Returns     : new Animation
 */
function Animation(spline) {
	this.isValid = false;
	if(spline != null)
		this.isValid = true;
	this.spline = spline;
	this.isPlaying = false;
	this.isLooping = true;
	this.startTime = 0.0;

}

/* ----------------------------------------------------------------------- */
/* Function    : start()
 *
 * Description : starts the animation
 *
 * Parameters  : N/A
 *
 * Returns     : N/A
 */
Animation.prototype.start = function() {
	this.isPlaying = true;
	this.startTime = curTime();
}

/* ----------------------------------------------------------------------- */
/* Function    : stop()
 *
 * Description : stops the animation
 *
 * Parameters  : N/A
 *
 * Returns     : N/A
 */
Animation.prototype.stop = function() {
	this.isPlaying = false;
}

var Colors = {
	MULTI : 0,
	RED : 1,
	GREEN : 2,
	BLUE : 3,
	BLACK : 4,
};

/* ----------------------------------------------------------------------- */
/* Function    : Material(color)
 *
 * Description : Material class. Stores color information for an object
 *
 * Parameters  : Colors color : color of the object
 *
 * Returns     : new Material
 */
function Material(color) {
	this.color = color;
}
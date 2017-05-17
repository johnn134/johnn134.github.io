/* Module      : quaternion.js
 * Author      : John Nelson
 * Email       : jpnelson@wpi.edu
 * Course      : 4732
 *
 * Description : Quaternion Functions and Code
 *
 * Date        : 2017/03/26
 *
 * History:
 * Revision      Date          Changed By
 * --------      ----------    ----------
 * 01.00         2017/03/28    jpnelson
 * 02.00         2017/04/08    jpnelson
 * First release.
 *
 * (c) Copyright 2017, Worcester Polytechnic Institute.
 */

function Quaternion() {}

/* ----------------------------------------------------------------------- */
/* Function    : rotate(v, q)
 *
 * Description : rotates the given vector by the given quaternion
 *
 * Parameters  : Vector3 v : vector
 *               float q : quaternion
 *
 * Returns     : Vector3 : rotates point
 */
Quaternion.rotate = function(v, q) {
  var V = [0, v[0], v[1], v[2]];
  var Q = q;
  var Qinv = Quaternion.inverse(q);

  //Rotq(v) = qvq^-1
  var qv = Quaternion.multiply(Q, V);
  var qvq = Quaternion.multiply(qv, Qinv);

  return [qvq[1], qvq[2], qvq[3]];
}

/* ----------------------------------------------------------------------- */
/* Function    : Slerp
 *
 * Description : Interpolates between the given quaternions
 *
 * Parameters  : Quaternion p : first quaternion
 *               Quaternion q : second quaternion
 *               float u : alpha value between 0 and 1
 *
 * Returns     : Quaternion : interpolated quaternion
 */
Quaternion.Slerp = function(p, q, u) {
  if(p[0] == q[0] && p[1] == q[1] && p[2] == q[2] && p[3] == q[3])
    return p;

  var q1 = $V(p);
  var q2 = $V(q);

  var dot = q1.dot(q2);
  var theta = Math.acos(dot);
  var a1 = Math.sin((1 - u) * theta) / Math.sin(theta);
  var a2 = Math.sin(u * theta) / Math.sin(theta);

  var Q1 = q1.x(a1);
  var Q2 = q2.x(a2);
  var Q = Q1.add(Q2);
  var newQ = Quaternion.normalize([Q.e(1), Q.e(2), Q.e(3), Q.e(4)]);

  return newQ;
}

/* ----------------------------------------------------------------------- */
/* Function    : ApplyMatrix(q)
 *
 * Description : Builds a rotation matrix from the given quaternion.
 *               Multiplies it to the current model matrix
 *
 * Parameters  : Quaternion q : quaternion to convert
 *
 * Returns     : N/A
 */
Quaternion.ApplyMatrix = function(q) {
  q = Quaternion.normalize(q);
  var qw = q[0]; var qx = q[1]; var qy = q[2]; var qz = q[3];
  var qx2 = qx * qx; var qy2 = qy * qy; var qz2 = qz * qz;
  //Row 1
  var q00 = 1 - 2*qy2 - 2*qz2;
  var q01 = 2*qx*qy - 2*qw*qz;
  var q02 = 2*qx*qz + 2*qw*qy;
  //Row 2
  var q10 = 2*qx*qy + 2*qw*qz;
  var q11 = 1 - 2*qx2 - 2*qz2;
  var q12 = 2*qy*qz - 2*qw*qx;
  //Row 3
  var q20 = 2*qx*qy - 2*qw*qy;
  var q21 = 2*qy*qz + 2*qw*qx;
  var q22 = 1 - 2*qx2 - 2*qy2;

  var m = $M([[q00, q01, q02, 0],
              [q10, q11, q12, 0],
              [q20, q21, q22, 0],
              [  0,   0,   0, 1]]);
  multMatrix(m);
}

/* ----------------------------------------------------------------------- */
/* Function    : toQuaternion(eulerAngles)
 *
 * Description : Converts the given euler angles to a quaternion
 *
 * Parameters  : Vector3 eulerAngles : roll, yaw, pitch degrees of rotation
 *
 * Returns     : quaternion : converted quaternion
 */
Quaternion.toQuaternion = function(eulerAngles) {
  var roll = eulerAngles[0] * Math.PI / 180.0;
  var yaw = eulerAngles[1] * Math.PI / 180.0;
  var pitch = eulerAngles[2] * Math.PI / 180.0;

  var t0 = Math.cos(yaw * 0.5);
  var t1 = Math.sin(yaw * 0.5);
  var t2 = Math.cos(pitch * 0.5);
  var t3 = Math.sin(pitch * 0.5);
  var t4 = Math.cos(roll * 0.5);
  var t5 = Math.sin(roll * 0.5);

  var q = [0, 0, 0, 0];

  q[0] = t0 * t2 * t4 - t1 * t3 * t5;
  q[1] = t1 * t3 * t4 + t0 * t2 * t5;
  q[2] = t1 * t2 * t4 + t0 * t3 * t5;
  q[3] = t0 * t3 * t4 - t1 * t2 * t5;

  return q;
}

/* ----------------------------------------------------------------------- */
/* Function    : toEuler(q)
 *
 * Description : Converts the given quaternion to euler angles
 *
 * Parameters  : Quaternion q : quaternion to convert
 *
 * Returns     : Vector3[] : array of euler angles [x, y, z]
 */
Quaternion.toEuler = function(q) {
  var rot = [0, 0, 0];

  //x
  var t0 = 2.0 * (q[0] * q[1] + q[2] * q[3]);
  var t1 = 1.0 - 2.0 * (q[1] * q[1] + q[2] * q[2]);
  rot[0] = Math.atan2(t0, t1);

  //y
  var t2 = 2.0 * (q[0] * q[2] - q[3] * q[1]);
  t2 = Math.max(-1.0, Math.min(1.0, t2));
  rot[1] = Math.asin(t2);

  //z
  var t3 = 2.0 * (q[0] * q[3] + q[1] * q[2]);
  var t4 = 1.0 - 2.0 * (q[2] * q[2] + q[3] * q[3]);
  rot[2] = Math.atan2(t3, t4);

  for(i = 0; i < 3; i++)
    rot[i] = rot[i] * 180.0 / Math.PI;

  return rot;
}

/* ----------------------------------------------------------------------- */
/* Function    : magnitude(q)
 *
 * Description : returns the magnitude of the given quaternion
 *
 * Parameters  : Quaternion q : quaternoin to measure
 *
 * Returns     : float : magnitude of quaternion q
 */
Quaternion.magnitude = function(q) {
  return Math.sqrt(Math.pow(q[0], 2) + 
                   Math.pow(q[1], 2) +
                   Math.pow(q[2], 2) +
                   Math.pow(q[3], 2));
}

/* ----------------------------------------------------------------------- */
/* Function    : inverse(q)
 *
 * Description : Returns the inverse of the given quaternion
 *
 * Parameters  : Quaternion q : quaternion to invert
 *
 * Returns     : Quaternion : inverted quaternion
 */
Quaternion.inverse = function(q) {
  var c = Math.pow((1.0 / Quaternion.magnitude(q)), 2)
  var Q = [q[0] * c, 
           -1.0 * q[1] * c,
           -1.0 * q[2] * c,
           -1.0 * q[3] * c];
  return Q;
}

/* ----------------------------------------------------------------------- */
/* Function    : normalize(q)
 *
 * Description : Returns the normalized unit quaternion
 *
 * Parameters  : Quaternion q : quaternion to normalize
 *
 * Returns     : Quaternion : normalized quaternion
 */
Quaternion.normalize = function(q) {
  var n = $V(q).x(1 / Quaternion.magnitude(q));
  return [n.e(1), n.e(2), n.e(3), n.e(4)];
}

/* ----------------------------------------------------------------------- */
/* Function    : multiply(p, q)
 *
 * Description : Multiplies the given quaternions
 *
 * Parameters  : Quaternion p : first quaternion
 *               Quaternion q : second quaternion
 *
 * Returns     : Quaternion : multiplied quaternion
 */
Quaternion.multiply = function(p, q) {
  var s1 = p[0];
  var s2 = q[0];
  var v1 = $V([p[1], p[2], p[3]]);
  var v2 = $V([q[1], q[2], q[3]]);

  var s1v2 = v2.x(s1);
  var s2v1 = v1.x(s2);
  var v1v2 = v1.cross(v2);

  var w = s1 * s2 - v1.dot(v2);
  var v = s1v2.add(s2v1).add(v1v2)

  return [w, v.e(1), v.e(2), v.e(3)];
}

/* ----------------------------------------------------------------------- */
/* Function    : dot(p, q)
 *
 * Description : Provides the dot product of the two quaternions
 *
 * Parameters  : Quaternion p : first quaternion
 *               Quaternion q : second quaternion
 *
 * Returns     : float : dot product of the two quaternions
 */
Quaternion.dot = function(p, q) {
  return p[0] * q[0] + p[1] * q[1] + p[2] * q[2] + p[3] * q[3];
}

/* ----------------------------------------------------------------------- */
/* Function    : negative(q)
 *
 * Description : Returns the negative of the quaternion
 *
 * Parameters  : Quaternion q : quaternion to convert
 *
 * Returns     : Quaternion : negative quaternion
 */
Quaternion.negative = function(q) {
  return [q[0] * -1, q[1] * -1, q[2] * -1, q[3] * -1];
}
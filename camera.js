//==============================================================================
// Camera Object
// Set the viewport separately
function Camera () {
    // Better managmenet of layers and sub layers.
    // Assign a range of the z buffer  for the view to use exclusively.
    // The full range is -1->1.  -1 is in front.
    this.ZRange = [-1.0,1.0];
    this.Roll = 0;
    this.Matrix = mat4.create();
    this.Height = 256.0 * 64.0;
    this.FocalPoint = [128.0*64.0, 128.0*64.0, 10.0];
    this.ComputeMatrix();
    // for drawing the view bounds.
    this.Points = [];
    this.Buffer = null;
    this.CreateBuffer();
    this.Mirror = false;

    // Placeholders
    this.ViewportWidth = 100;
    this.ViewportHeight = 100;
}

Camera.prototype.DeepCopy = function (inCam) {
    this.ZRange = inCam.ZRange.slice(0);
    this.Roll = inCam.Roll;
    this.Height = inCam.Height;
    this.FocalPoint = inCam.FocalPoint.slice(0);
    this.ViewportWidth = inCam.ViewportWidth;
    this.ViewportHeight = inCam.ViewportHeight;
    this.ComputeMatrix();
}

Camera.prototype.SetViewport = function (viewport) {
  if (10*viewport[3] < viewport[2]) {
    //alert("Unusual viewport " + viewport[3]);
    return;
  }
  this.ViewportWidth = viewport[2];
  this.ViewportHeight = viewport[3];
}


Camera.prototype.Serialize = function () {
  var obj = {};
  obj.FocalPoint = [this.FocalPoint[0], this.FocalPoint[1]];
  obj.Roll = this.Roll;
  obj.Height = this.GetHeight();
  obj.Width = this.GetWidth();
  return obj;
}

Camera.prototype.Load = function (obj) {
  this.FocalPoint[0] = obj.FocalPoint[0];
  this.FocalPoint[1] = obj.FocalPoint[1];
  this.Roll = obj.Roll;
  this.Height = obj.Height;
  // Width is computed from height and aspect.
  this.ComputeMatrix();
}


// Roll is in Radians
// Rotation is in Degrees
Camera.prototype.GetRotation = function () {
    return this.Roll * 180.0 / 3.1415926535;
}

Camera.prototype.GetFocalPoint = function () {
  // Copy to avoid bugs because arrays are shared.
  // These are nasty to find.
  return [this.FocalPoint[0],this.FocalPoint[1],this.FocalPoint[2]];
}

Camera.prototype.SetFocalPoint = function (x, y) {
  if (isNaN(x) || isNaN(y)) {
    console.log("Camera 1");
    return;
  }
  this.FocalPoint[0] = x;
  this.FocalPoint[1] = y;
  // Ignore z on purpose.
}


Camera.prototype.ConvertPointViewerToWorld = function(x, y) {
    // Convert to world coordinate system
    // Compute focal point from inverse overview camera.
    x = x/this.ViewportWidth;
    y = y/this.ViewportHeight;
    x = (x*2.0 - 1.0)*this.Matrix[15];
    y = (1.0 - y*2.0)*this.Matrix[15];
    var m = this.Matrix;
    var det = m[0]*m[5] - m[1]*m[4];
    var xNew = (x*m[5]-y*m[4]+m[4]*m[13]-m[5]*m[12]) / det;
    var yNew = (y*m[0]-x*m[1]-m[0]*m[13]+m[1]*m[12]) / det;

    return [xNew, yNew];
}

Camera.prototype.ConvertPointWorldToViewer = function(x, y) {
    var m = this.Matrix;

    // Convert from world coordinate to view (-1->1);
    var h = (x*m[3] + y*m[7] + m[15]);
    var xNew = (x*m[0] + y*m[4] + m[12]) / h;
    var yNew = (x*m[1] + y*m[5] + m[13]) / h;
    // Convert from view to screen pixel coordinates.
    xNew = (1.0+xNew)*0.5*this.ViewportWidth;
    yNew = (1.0-yNew)*0.5*this.ViewportHeight;

    return [xNew, yNew];
}

// dx, dy are in view coordinates [-0.5,0.5].
// The camera matrix converts world to view.
Camera.prototype.HandleTranslate = function (dx,dy) {
    // Convert view vector to world vector.
    // We could invert the matrix to get the transform, but this is easier for now.....
    var s = Math.sin(this.Roll);
    var c = Math.cos(this.Roll);
    var x = this.FocalPoint[0];
    var y = this.FocalPoint[1];
    var z = this.FocalPoint[2];
    var w = this.GetWidth();
    var h = this.GetHeight();

    if (this.Mirror) {
      dy = -dy;
    }

    // Scale to world.
    dx = dx * w;
    dy = dy * w;
    // Rotate
    var rx = dx*c + dy*s;
    var ry = dy*c - dx*s;

    this.Translate(rx,ry,0.0);
}

// x,y are in display coordiantes (origin at the center).
// dx,dy are in the same coordinates system (scale).
// Scale does not matter because we only care about rotation.
Camera.prototype.HandleRoll = function (x,y, dx, dy) {
  // Avoid divide by zero / singularity
  if (x == 0 && y == 0) {
    return;
  }
  // Orthogonal (counter clockwise) dot dVect.
  var dRoll = -y*dx +x*dy;
  // Remove magnitude of location.
  // Scale by R to get correct angle.
  dRoll = dRoll / (x*x + y*y);
  if ( this.Mirror) {
    dRoll = -dRoll;
  }
  // Keep roll in radians.
  this.Roll += dRoll;

  this.ComputeMatrix();
}


Camera.prototype.Translate = function (dx,dy,dz) {
  if (isNaN(dx) || isNaN(dy) || isNaN(dz)) {
    console.log("Camera 2");
    return;
  }
  this.FocalPoint[0] += dx;
  this.FocalPoint[1] += dy;
  this.FocalPoint[2] += dz;
  this.ComputeMatrix();
}


Camera.prototype.GetHeight = function () {
  return this.Height;
}


Camera.prototype.SetHeight = function (height) {
  if (isNaN(height)) {
    console.log("Camera 3");
    return;
  }
  this.Height = height;
}


Camera.prototype.GetWidth = function () {
  return this.Height * this.ViewportWidth / this.ViewportHeight;
}


// Slide coordinates.
Camera.prototype.GetBounds = function () {
    var width = this.GetWidth();
    var bds = new Array(4);
    bds[0] = this.FocalPoint[0] - (width*0.5);
    bds[1] = bds[0] + width;
    bds[2] = this.FocalPoint[1] - (this.Height*0.5);
    bds[3] = bds[2] + this.Height;
    return bds;
}


// Camera matrix transforms points into camera coordinate system
// X:(-1->1)
// Y:(-1->1) (-1 is bottom)
// Z:(-1->1) (-1 is front)
Camera.prototype.ComputeMatrix = function () {
    var s = Math.sin(this.Roll);
    var c = Math.cos(this.Roll);
    var x = this.FocalPoint[0];
    var y = this.FocalPoint[1];
    var z = this.FocalPoint[2];
    var w = this.GetWidth();
    // var ht = this.GetHeight();  The iPad got this wrong?????
    var ht = this.Height;

    if (ht > 1000000) {
      StartLogging();
      LogMessage("First height is big " + this.height);
    }
    if (w < 0) { return; }

    if (this.Mirror) { ht = -ht; }

    mat4.identity(this.Matrix);

    this.Matrix[0] = c;
    this.Matrix[1] = -s*w/ht;
    this.Matrix[4] =  -s;
    this.Matrix[5] =  -c*w/ht;
    this.Matrix[9] =  0;
    this.Matrix[10]=  (this.ZRange[1]-this.ZRange[0])*0.5;
    this.Matrix[12]= -c*x + s*y;
    this.Matrix[13]= -(w/ht)*(-s*x - c*y);
    this.Matrix[14]=  -z + (this.ZRange[1]+this.ZRange[0])*0.25*w;
    this.Matrix[15]=  0.5*w;

  if (Math.abs(this.Matrix[5]) < 0.01 &&
      Math.abs(this.Matrix[4]) < 0.01) {
    StartLogging();
    LogMessage("m[4] " + this.Matrix[4]);
    LogMessage("m[5] " + this.Matrix[4]);
    LogMessage("c = " + c);
    LogMessage("w = " + w);
    LogMessage("ht = " + ht);
    LogMessage("height = " + this.Height);
  }
}

// TODO: ROOT_SPACING IS UNDEFINED.
// Reset is not bound to any event.
Camera.prototype.Reset = function () {
    // Compute the bounds
    var bounds = [];
    bounds[0] = bounds[2] = bounds[4] = 0.0;
    bounds[1] = TILE_DIMENSIONS[0] * ROOT_SPACING[0];
    bounds[3] = TILE_DIMENSIONS[1] * ROOT_SPACING[1];
    bounds[5] = NUMBER_OF_SECTIONS * ROOT_SPACING[2];

    this.SetFocalPoint((bounds[0] + bounds[1]) * 0.5,
                       (bounds[2] + bounds[3]) * 0.5);
    // We would need to set slice as well.
    //this.FocalPoint[2] = (bounds[4] + bounds[5]) * 0.5;
    this.SetHeight(bounds[3]-bounds[2]);
    this.ComputeMatrix();
}

// Currenly assumes parallel projection and display z range = [-1,1].
// Also no rotation!
// a.k.a. This method does not work.
Camera.prototype.DisplayToWorld = function (x,y,z) {
    var scale = this.Height / this.ViewportHeight;
    x = x - (0.5*this.ViewportWidth);
    y = y - (0.5*this.ViewportHeight);
    var worldPt = [];
    worldPt[0] = this.FocalPoint[0] + (x * scale);
    worldPt[1] = this.FocalPoint[1] + (y * scale);
    worldPt[2] = this.FocalPoint[2] + (z * this.Height * 0.5);

    return worldPt;
}

Camera.prototype.AddPoint = function (x, y, z) {
    this.Points.push(x);
    this.Points.push(y);
    this.Points.push(z);
}

Camera.prototype.CreateBuffer = function () {
  if (GL) {
    if (this.Buffer != null) {
      GL.deleteBuffer(this.Buffer);
    }
    this.Buffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, this.Buffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(this.Points),
                  GL.STATIC_DRAW);
  }
}

// Getting rid of this.
Camera.prototype.UpdateBuffer = function() {
    this.Points = [];
    var cx = this.FocalPoint[0];
    var cy = this.FocalPoint[1];
    var rx = this.GetWidth() * 0.5;
    var ry = this.GetHeight() * 0.5;
    this.AddPoint(cx-rx, cy-ry);
    this.AddPoint(cx+rx, cy-ry);
    this.AddPoint(cx+rx, cy+ry);
    this.AddPoint(cx-rx, cy+ry);
    this.AddPoint(cx-rx, cy-ry);
    this.CreateBuffer();
}


// Camera is already set.
Camera.prototype.Draw = function (overview) {
    var overviewCam = overview.Camera;
    var viewport = overview.Viewport;

    var cx = this.FocalPoint[0];
    var cy = this.FocalPoint[1];
    var rx = this.GetWidth() * 0.5;
    var ry = this.GetHeight() * 0.5;

    // To handle rotation, I need to pass the center through
    // the overview camera matrix. Coordinate system is -1->1
    var newCx = (cx*overviewCam.Matrix[0] + cy*overviewCam.Matrix[4]
                 + overviewCam.Matrix[12]) / overviewCam.Matrix[15];
    var newCy = (cx*overviewCam.Matrix[1] + cy*overviewCam.Matrix[5]
                 + overviewCam.Matrix[13]) / overviewCam.Matrix[15];

    if (GL) {
        // I having trouble using the overview camera, so lets just compute
        // the position of the rectangle here.
        var ocx = overviewCam.FocalPoint[0];
        var ocy = overviewCam.FocalPoint[1];
        var orx = overviewCam.GetWidth() * 0.5;
        var ory = overviewCam.GetHeight() * 0.5;

        program = polyProgram;
        GL.useProgram(program);
        GL.uniform3f(program.colorUniform, 0.9, 0.0, 0.9);

        GL.viewport(viewport[0],viewport[1],viewport[2],viewport[3]);
        mat4.identity(pMatrix);
        GL.uniformMatrix4fv(program.pMatrixUniform, false, pMatrix);

        var viewFrontZ = overviewCam.ZRange[0]+0.001;

        mat4.identity(mvMatrix);
        //mvMatrix[12] = ((cx-rx)-ocx)/orx;
        //mvMatrix[13] = ((cy-ry)-ocy)/ory;
        mvMatrix[12] = newCx-(rx/orx);
        mvMatrix[13] = newCy-(ry/ory);
        mvMatrix[14] = viewFrontZ;
        mvMatrix[0] = 2*rx/orx;
        mvMatrix[5] = 2*ry/ory;

        GL.bindBuffer(GL.ARRAY_BUFFER, squareOutlinePositionBuffer);
        GL.vertexAttribPointer(program.vertexPositionAttribute,
                               squareOutlinePositionBuffer.itemSize,
                               GL.FLOAT, false, 0, 0);
        GL.uniformMatrix4fv(program.mvMatrixUniform, false, mvMatrix);
        GL.drawArrays(GL.LINE_STRIP, 0, squareOutlinePositionBuffer.numItems);
    } else {
        // Transform focal point from -1->1 to viewport
        newCx = (1.0 + newCx) * viewport[2] * 0.5;
        newCy = (1.0 - newCy) * viewport[3] * 0.5;
        // Scale width and height from world to viewport.
        rx = rx * viewport[3] / overviewCam.GetHeight();
        ry = ry * viewport[3] / overviewCam.GetHeight();

        // The 2d canvas was left in world coordinates.
        var ctx = overview.Context2d;
        /*
          ctx.beginPath();
          //ctx.strokeStyle="#E500E5";
          ctx.rect(this.FocalPoint[0]-(0.5*width),this.FocalPoint[1]-(0.5*height),width,height);
          //ctx.fillStyle="#E500E5";
          //ctx.fillRect(this.FocalPoint[0]-(0.5*width),this.FocalPoint[1]-(0.5*height),width,height);
          ctx.stroke();
        */
        ctx.save();
        //ctx.setTransform(1,0,0,1,0,0);
        // Now that the while slide / overview canvas is rotating
        // We have to rotate the rectangle.
        var c = Math.cos(this.Roll);
        var s = Math.sin(this.Roll);
        ctx.setTransform(c,-s,+s,c,
                         (1-c)*newCx-s*newCy,
                         (1-c)*newCy+s*newCx)

        ctx.strokeStyle="#4011E5";
        ctx.beginPath();
        ctx.rect(newCx-rx,newCy-ry,2*rx,2*ry);
        ctx.stroke();
        ctx.restore();
    }

}







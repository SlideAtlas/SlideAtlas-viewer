// TODO:
// Fix the webGL attributes not initialized properly warning.
// Multiple text object should share the same texture.
// Add symbols -=+[]{},.<>'";: .....

(function () {
  'use strict';

  var LINE_SPACING = 1.3;

    // I need an array to map ascii to my letter index.
    // a = 97
  var ASCII_LOOKUP =
    [[0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 0
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 5
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 10
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 15
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 20
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 25
         [0, 413, 50, 98], [0, 413, 50, 98], [900, 17, 30, 98], [791, 119, 28, 95], [0, 413, 50, 98], // 30 32 = ' ' 33="!"
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 35
         [260, 18, 32, 97], [292, 18, 32, 97], [0, 413, 50, 98], [0, 413, 50, 98], [635, 120, 25, 36], // 40 40="(" 41=")" 44=','
         [783, 17, 37, 57], [662, 121, 25, 34], [687, 121, 46, 96], [822, 214, 58, 98], [881, 214, 50, 98], // 45 45="-" 46="." 47="/" 48 = 01
         [932, 214, 56, 98], [0, 114, 53, 98], [54, 114, 54, 98], [109, 114, 54, 98], [164, 114, 57, 98], // 50 = 23456
         [222, 114, 49, 98], [272, 114, 57, 98], [330, 114, 56, 98], [554, 18, 25, 76], [579, 121, 28, 73], // 55 = 789 (387 ') 58=":" 59=";"
         [0, 413, 50, 98], [412, 120, 62, 69], [0, 413, 50, 98], [733, 10, 53, 106], [0, 413, 50, 98], // 60 61 = "=" 63="?"
         [263, 314, 67, 98], [331, 314, 55, 98], [387, 314, 59, 98], [447, 314, 66, 98], [514, 314, 52, 98], // 65 = ABCDE
         [566, 314, 49, 98], [616, 314, 67, 98], [684, 314, 67, 98], [752, 314, 24, 98], [777, 314, 36, 98], // 70 = FGHIJ
         [814, 314, 58, 98], [873, 314, 45, 98], [919, 314, 88, 98], [0, 214, 66, 98], [69, 214, 72, 98], // 75 = KLMNO
         [142, 214, 54, 98], [197, 214, 76, 98], [274, 214, 53, 98], [328, 214, 49, 98], [378, 214, 55, 98], // 80 = PQRST
         [434, 214, 66, 98], [501, 214, 63, 98], [565, 214, 96, 98], [662, 214, 55, 98], [718, 214, 53, 98], // 85 = UVWXY
         [772, 214, 49, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 90 = Z
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [51, 413, 56, 98], [108, 413, 50, 98], // 95 97 = abc
         [154, 413, 50, 98], [210, 413, 50, 98], [263, 413, 39, 98], [301, 413, 50, 98], [350, 413, 54, 98], // 100 = defgh
         [406, 413, 22, 98], [427, 413, 34, 98], [458, 413, 50, 98], [508, 413, 24, 98], [532, 413, 88, 98], // 105 = ijklm
         [619, 413, 57, 98], [675, 413, 60, 98], [734, 413, 57, 98], [790, 413, 57, 98], [847, 413, 40, 98], // 110 = nopqr
         [886, 413, 42, 98], [925, 413, 41, 98], [966, 413, 56, 98], [0, 314, 49, 98], [50, 314, 77, 98], // 115 = stuvw
         [127, 314, 48, 98], [173, 314, 52, 98], [224, 314, 42, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 120 = xyz
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 125
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 130
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 135
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 140
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 145
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 150
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 155
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 160
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 165
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 170
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 175
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 180
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 185
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 198
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 195
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 200
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 205
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 210
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 215
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 220
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 225
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 230
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 235
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 240
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 245
         [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], [0, 413, 50, 98], // 250
         [0, 413, 50, 98]];

  // All text object use the same texture map.

  function Text () {
    this.Color = [0.0, 0.1, 0.5];
    this.FontSize = 12; // Height in pixels

    // Position of the anchor in the world coordinate system.
    this.Position = [100, 100];
    this.Orientation = 0.0; // in degrees, counter clockwise, 0 is left

    // The anchor point and position are the same point.
    // Position is in world coordinates.
    // Offset is in pixel coordinates of text (buffers).
    // In pixel(text) coordinate system
    // It is the position of the upper left corner relative to the postion / anchor.
    this.Offset = [0, 0];
    this.Selected = false;

    // this.String = "Hello World";
    // this.String = "0123456789";
    this.String = '';

    // Pixel bounds are in text box coordiante system.
    this.PixelBounds = [0, 0, 0, 0];

    this.BackgroundFlag = false;
  }

  Text.prototype.DeleteSelected = function () {
    if (this.IsSelected()) {
      this.SetString('');
      return true;
    }
  };

  Text.prototype.IsEmpty = function () {
    return this.String === undefined || this.String === '';
  };

  Text.prototype.SetString = function (str) {
    this.String = str;
  };

  Text.prototype.GetString = function () {
    return this.String;
  };

  Text.prototype.Draw = function (view) {
    // Place the anchor of the text.
    // First transform the world anchor to view.
    var x = this.Position[0];
    var y = this.Position[1];
    if (this.PositionCoordinateSystem !== SAM.Shape.VIEWER) {
      var m = view.Camera.GetImageMatrix();
      x = (this.Position[0] * m[0] + this.Position[1] * m[4] + m[12]) / m[15];
      y = (this.Position[0] * m[1] + this.Position[1] * m[5] + m[13]) / m[15];
      // convert view to pixels (view coordinate system).
      x = view.Viewport[2] * (0.5 * (1.0 + x));
      y = view.Viewport[3] * (0.5 * (1.0 - y));
    }

    // Hacky attempt to mitigate the bug that randomly sends the Offset values into the tens of thousands.
    if (Math.abs(this.Offset[0]) > 1000 || Math.abs(this.Offset[1]) > 1000) {
      this.Offset = [-50, 0];
    }

    // (x,y) is the screen position of the text.
    // Canvas text location is lower left of first letter.
    var strArray = this.String.split('\n');
    // Move (x,y) from tip of the arrow to the upper left of the text box.
    var ctx = view.Context2d;
    ctx.save();
    var radians = this.Orientation * Math.PI / 180;
    var s = Math.sin(radians);
    var c = Math.cos(radians);
    ctx.setTransform(c, -s, s, c, x, y);
    x = -this.Offset[0];
    y = -this.Offset[1];

    ctx.font = this.FontSize + 'pt Calibri';
    var width = this.PixelBounds[1];
    var height = this.PixelBounds[3];
    // Draw the background text box.
    if (this.BackgroundFlag) {
      // ctx.fillStyle = '#fff';
      // ctx.strokeStyle = '#000';
      // ctx.fillRect(x - 2, y - 2, this.PixelBounds[1] + 4, (this.PixelBounds[3] + this.FontSize/3)*1.4);
      var radius = this.FontSize / 4;
      roundRect(ctx, x - radius, y - radius,
                width + 2 * radius, height + 2 * radius,
                radius, true, false);
    }

    // Choose the color for the text.
    if (this.Selected) {
      ctx.fillStyle = '#FF0';
    } else {
      ctx.fillStyle = SAM.ConvertColorToHex(this.Color);
    }

    // Convert (x,y) from upper left of textbox to lower left of first character.
    y = y + this.FontSize;
    // Draw the lines of the text.
    for (var i = 0; i < strArray.length; ++i) {
      ctx.fillText(strArray[i], x, y);
      // Move to the lower left of the next line.
      y = y + this.FontSize * LINE_SPACING;
    }

    // ctx.stroke();
    ctx.restore();
  };

  function roundRect (ctx, x, y, width, height, radius) {
    if (typeof radius === 'undefined') {
      radius = 2;
    }
    ctx.fillStyle = '#fff';
    // ctx.strokeStyle = '#666';
    ctx.fillRect(x, y, width, height);

    /*
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    */
    // ctx.stroke();
    // ctx.fill();
  }

  Text.prototype.UpdateBuffers = function (view) {
    var i;
    if (!view.gl) {
      // Canvas.  Compute pixel bounds.
      var strArray = this.String.split('\n');
      var height = this.FontSize * LINE_SPACING * strArray.length;
      var width = 0;
      // Hack: use a global viewer because I do not have the viewer.
      // Maybe it should be passed in as an argument, or store the context
      // as an instance variable.
      var ctx = view.Context2d;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = this.FontSize + 'pt Calibri';
      // Compute the width of the text box.
      for (i = 0; i < strArray.length; ++i) {
        var lineWidth = ctx.measureText(strArray[i]).width;
        if (lineWidth > width) { width = lineWidth; }
      }
      this.PixelBounds = [0, width, 0, height];
      ctx.restore();
      return;
    }
    // Create a textured quad for each letter.
    var vertexPositionData = [];
    var textureCoordData = [];
    var cellData = [];
        // 128 for power of 2, but 98 to top of characters.
    var charLeft = 0;
    var charTop = 0;
    var ptId = 0;
    this.PixelBounds = [0, 0, 0, this.FontSize];

    for (i = 0; i < this.String.length; ++i) {
      var idx = this.String.charCodeAt(i);
      if (idx === 10 || idx === 13) { // newline
        charLeft = 0;
        charTop += this.FontSize;
      } else {
        var port = ASCII_LOOKUP[idx];
        // Convert to texture coordinate values.
        var tLeft = port[0] / 1024.0;
        var tRight = (port[0] + port[2]) / 1024.0;
        var tBottom = port[1] / 512.0;
        var tTop = (port[1] + port[3]) / 512.0;
        // To place vertices
        var charRight = charLeft + port[2] * this.FontSize / 98.0;
        var charBottom = charTop + port[3] * this.FontSize / 98.0;

        // Accumulate bounds;
        if (this.PixelBounds[0] > charLeft) { this.PixelBounds[0] = charLeft; }
        if (this.PixelBounds[1] < charRight) { this.PixelBounds[1] = charRight; }
        if (this.PixelBounds[2] > charTop) { this.PixelBounds[2] = charTop; }
        if (this.PixelBounds[3] < charBottom) { this.PixelBounds[3] = charBottom; }

        // Make 4 points, We could share points.
        textureCoordData.push(tLeft);
        textureCoordData.push(tBottom);
        vertexPositionData.push(charLeft);
        vertexPositionData.push(charBottom);
        vertexPositionData.push(0.0);

        textureCoordData.push(tRight);
        textureCoordData.push(tBottom);
        vertexPositionData.push(charRight);
        vertexPositionData.push(charBottom);
        vertexPositionData.push(0.0);

        textureCoordData.push(tLeft);
        textureCoordData.push(tTop);
        vertexPositionData.push(charLeft);
        vertexPositionData.push(charTop);
        vertexPositionData.push(0.0);

        textureCoordData.push(tRight);
        textureCoordData.push(tTop);
        vertexPositionData.push(charRight);
        vertexPositionData.push(charTop);
        vertexPositionData.push(0.0);

        charLeft = charRight;

        // Now create the cell.
        cellData.push(0 + ptId);
        cellData.push(1 + ptId);
        cellData.push(2 + ptId);

        cellData.push(2 + ptId);
        cellData.push(1 + ptId);
        cellData.push(3 + ptId);
        ptId += 4;
      }
    }

    this.VertexTextureCoordBuffer = view.gl.createBuffer();
    view.gl.bindBuffer(view.gl.ARRAY_BUFFER, this.VertexTextureCoordBuffer);
    view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(textureCoordData), view.gl.STATIC_DRAW);
    this.VertexTextureCoordBuffer.itemSize = 2;
    this.VertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

    this.VertexPositionBuffer = view.gl.createBuffer();
    view.gl.bindBuffer(view.gl.ARRAY_BUFFER, this.VertexPositionBuffer);
    view.gl.bufferData(view.gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), view.gl.STATIC_DRAW);
    this.VertexPositionBuffer.itemSize = 3;
    this.VertexPositionBuffer.numItems = vertexPositionData.length / 3;

    this.CellBuffer = view.gl.createBuffer();
    view.gl.bindBuffer(view.gl.ELEMENT_ARRAY_BUFFER, this.CellBuffer);
    view.gl.bufferData(view.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cellData), view.gl.STATIC_DRAW);
    this.CellBuffer.itemSize = 1;
    this.CellBuffer.numItems = cellData.length;
  };

  // Point in text coordinates is over the text.
  Text.prototype.PointInText = function (xMouse, yMouse) {
    if (!this.Visibility) { return false; }

    var bds = this.PixelBounds.slice(0);
    if (this.BackgroundFlag) {
      var radius = this.FontSize / 4;
      bds[0] -= radius;
      bds[1] += radius;
      bds[2] -= radius;
      bds[3] += radius;
    }
    if (xMouse > bds[0] && xMouse < bds[1] &&
        yMouse > bds[2] && yMouse < bds[3]) {
      return true;
    }
    return false;
  };

  Text.prototype.SetColor = function (c) {
    this.Color = SAM.ConvertColor(c);
  };
  Text.prototype.GetColor = function () {
    return this.Color;
  };

  Text.prototype.SetFontSize = function (s) {
    this.FontSize = s;
  };
  Text.prototype.GetFontSize = function () {
    return this.FontSize;
  };

  Text.prototype.SetBackgroundFlag = function (f) {
    this.BackgroundFlag = f;
  };
  Text.prototype.GetBackgroundFlag = function () {
    return this.BackgroundFlag;
  };

  Text.prototype.IsSelected = function () {
    return this.Selected;
  };

  // Returns true if the selected state changed.
  Text.prototype.SetSelected = function (f) {
    if (f === this.Selected) { return false; }
    this.Selected = f;
    return true;
  };

  SAM.Text = Text;
})();

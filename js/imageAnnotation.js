// Draw an image as an annotation object.  This simple drawing object
// is like a shape, but I am not subclassing shape because shape
// is about drawing vector graphics.

// We only support rendering in slide coordinate system for now.

(function () {
  'use strict';

  function ImageAnnotation () {
    this.Visibility = true;

        // Slide position of the upper left image corner.
    this.Origin = [0, 0];
    this.Image = undefined;

    this.Height = 5000;
  }

  ImageAnnotation.prototype.destructor = function () {
        // Get rid of the image.
  };

    // View (main view).
  ImageAnnotation.prototype.Draw = function (view) {
    if (!this.Visibility || !this.Image) {
      return;
    }

    var context = view.Context2d;
    context.save();
        // Identity (screen coordinates).
    context.setTransform(1, 0, 0, 1, 0, 0);
        // Change canvas coordinates to View (-1->1, -1->1).
    context.transform(0.5 * view.Viewport[2], 0.0,
                          0.0, -0.5 * view.Viewport[3],
                          0.5 * view.Viewport[2],
                          0.5 * view.Viewport[3]);

        // Change canvas coordinates to slide (world). (camera: slide to view).
    var m = view.Camera.GetWorldMatrix();
    var h = 1.0 / m[15];
    context.transform(m[0] * h, m[1] * h,
                      m[4] * h, m[5] * h,
                      m[12] * h, m[13] * h);

        // Change canvas to image coordinate system.
    var scale = this.Height / this.Image.height;
    context.transform(scale, 0,
                          0, scale,
                          this.Origin[0], this.Origin[1]);

    // context.drawImage(this.Image, 0, 0);
    context.fillRect(100, 100, 500, 300);

    context.restore();
  };

  SAM.ImageAnnotation = ImageAnnotation;
})();

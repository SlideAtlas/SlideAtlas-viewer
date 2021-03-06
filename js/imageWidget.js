// ==============================================================================
// Display a samller mask image ontop of a large image.
// Mask image will be an additional file in the image item.
// Not sure how to store the image in the annotation schema.

(function () {
  'use strict';

  // The cross has just been created and is following the mouse.
  // I can probably merge  this state with drag. (mouse up vs down though)
  var IMAGE_WIDGET_DRAG = 1; // The cross is being dragged.
  var IMAGE_WIDGET_WAITING = 3; // The normal (resting) state.
  var IMAGE_WIDGET_ACTIVE = 4; // Mouse is over the widget and it is receiving events.

  function ImageWidget (viewer, newFlag) {
    if (viewer === null) {
      return;
    }
    this.Viewer = viewer;
    this.Shape = new SAM.ImageAnnotation();
    this.Viewer.AddWidget(this);
    this.Viewer.AddShape(this.Shape);

    // New flag => widget is created in drag state.
    if (newFlag) {
      this.State = IMAGE_WIDGET_DRAG;
      this.Viewer.ActivateWidget(this);
      return;
    }

    this.State = IMAGE_WIDGET_WAITING;
  }

  ImageWidget.prototype.Draw = function (view) {
    this.Shape.Draw(view);
  };

  ImageWidget.prototype.RemoveFromViewer = function () {
    if (this.Viewer) {
      this.Viewer.RemoveWidget(this);
    }
  };

  ImageWidget.prototype.HandleKeyPress = function (keyCode, shift) {
    return false;
  };

  ImageWidget.prototype.HandleMouseDown = function (event) {
    if (event.which !== 1) {
      return;
    }
    if (this.State === IMAGE_WIDGET_DRAG) {
      // We need the viewer position of the IMAGE center to drag radius.
      this.OriginViewer = this.Viewer.ConvertPointWorldToViewer(this.Shape.Origin[0], this.Shape.Origin[1]);
      this.State = IMAGE_WIDGET_WAITING;
    }
    if (this.State === IMAGE_WIDGET_ACTIVE) {
      this.State = IMAGE_WIDGET_DRAG;
    }
  };

  // returns false when it is finished doing its work.
  ImageWidget.prototype.HandleMouseUp = function (event) {
    if (this.State === IMAGE_WIDGET_ACTIVE && event.which === 3) {
      // Right mouse was pressed.
      // Pop up the properties dialog.
      // this.State = IMAGE_WIDGET_PROPERTIES_DIALOG;
      // this.ShowPropertiesDialog();
    } else if (this.State === IMAGE_WIDGET_DRAG) {
      this.SetActive(false);
    }
  };

  ImageWidget.prototype.HandleMouseMove = function (event) {
    var x = this.Viewer.MouseX;
    var y = this.Viewer.MouseY;

    if (this.Viewer.MouseDown === false && this.State === IMAGE_WIDGET_ACTIVE) {
      this.CheckActive(event);
      return;
    }

    if (this.State === IMAGE_WIDGET_DRAG) {
      var tmp = this.Viewer.ConvertPointViewerToWorld(x, y);
      // Trying to preserve pointer so I do not need to update correlation points.
      this.Shape.Origin[0] = tmp[0];
      this.Shape.Origin[1] = tmp[1];
      this.Viewer.EventuallyRender();
    }

    if (this.State === IMAGE_WIDGET_WAITING) {
      this.CheckActive(event);
    }
  };

  ImageWidget.prototype.CheckActive = function (event) {
    // change dx and dy to vector from center of IMAGE.
    if (this.FixedSize) {
      alert('Fixed size not implemented');
      return;
    }

    var dx = event.worldX - this.Shape.Origin[0];
    var dy = event.worldY - this.Shape.Origin[1];

    // We need to scale to pixels
    var cam = this.Viewer.GetCamera();
    var viewport = this.Viewer.GetViewport();
    var k = viewport[3] / cam.Height;
    dx = dx * k;
    dy = dy * k;

    var d = Math.sqrt(dx * dx + dy * dy);
    var active = false;
    if (d < 3.0) {
      active = true;
    }

    this.SetActive(active);
    return active;
  };

  // Multiple active states.  Active state is a bit confusing.
  ImageWidget.prototype.GetActive = function () {
    if (this.State === IMAGE_WIDGET_WAITING) {
      return false;
    }
    return true;
  };

  // Setting to active always puts state into "active".
  // It can move to other states and stay active.
  ImageWidget.prototype.SetActive = function (flag) {
    if (flag === this.GetActive()) {
      return;
    }

    if (flag) {
      this.State = IMAGE_WIDGET_ACTIVE;
      this.Shape.Active = true;
      this.Viewer.ActivateWidget(this);
      this.Viewer.EventuallyRender();
    } else {
      this.State = IMAGE_WIDGET_WAITING;
      this.Shape.Active = false;
      this.Viewer.DeactivateWidget(this);
      this.Viewer.EventuallyRender();
    }
  };

  SAM.ImageWidget = ImageWidget;
})();

// Annotation widget toggles annotation visibility and also shows the drawing tools.
// Each view will need its own widget.
// I am less happy about this than the right click menu implementation.
// It would be nice to expand the drawing tools on hover, but
// the toggle for annotation visibility naturally suggests
// the same state should show drawing tool palette.

// Todo:
// - Make an object out of it to support two views.
// - Change behavior of text widget to first drag an arrow when created.
// - eliminate polyLine vertices when they are dragged on top of another vertex.
// or maybe the delete key.

(function () {
  'use strict';

  var ANNOTATION_OFF = 0;
  var ANNOTATION_ON = 2;

  function AnnotationWidget (layer, viewer) {
    var self = this; // trick to set methods in callbacks.
    this.Viewer = viewer;
    this.Layer = layer;
    layer.AnnotationWidget = this;

    SAM.detectMobile();
    this.Tab = new SA.Tab(layer.GetParent(),
                       SA.ImagePathUrl + 'pencil3Up.png',
                       'annotationTab');
    this.Tab.Div
        .css({'box-sizing': 'border-box',
          'position': 'absolute',
          'bottom': '0px',
          'right': '110px'});
        // .prop('title', 'Annotation');

    this.Tab.Panel.addClass('sa-view-annotation-panel');
    this.VisibilityDiv = $('<div>')
        .appendTo(this.Tab.Panel)
        .addClass('sa-view-annotation-vis')
        // .prop('title', 'Visibility')
        .on('click touchstart', function () { self.ToggleVisibility(); });
    this.VisibilityImage = $('<img>')
        .appendTo(this.VisibilityDiv)
        .addClass('sa-view-annotation-vis-img')
        .addClass('sa-active')
        .attr('type', 'image')
        .attr('src', SA.ImagePathUrl + 'toggleswitch.jpg');

    this.TextButton = $('<img>')
        .appendTo(this.Tab.Panel)
        .addClass('sa-view-annotation-button sa-flat-button-active')
        .addClass('sa-active')
        .attr('type', 'image')
        .attr('src', SA.ImagePathUrl + 'Text.png')
        // .prop('title', 'Text')
        .on('click touchstart', function () { self.NewText(); });
    this.CircleButton = $('<img>')
        .appendTo(this.Tab.Panel)
        .addClass('sa-view-annotation-button sa-flat-button-active')
        .addClass('sa-active')
        .attr('type', 'image')
        .attr('src', SA.ImagePathUrl + 'Circle.png')
        // .prop('title', 'Circle')
        .on('click touchstart', function () { self.NewCircle(); });
    this.RectButton = $('<img>')
        .appendTo(this.Tab.Panel)
        .addClass('sa-view-annotation-button sa-flat-button-active')
        .addClass('sa-active')
        .attr('type', 'image')
        .attr('src', SA.ImagePathUrl + 'rectangle.gif')
        // .prop('title', 'Rectangle')
        .on('click touchstart', function () { self.NewRect(); });
    this.GridButton = $('<img>')
        .appendTo(this.Tab.Panel)
        .addClass('sa-view-annotation-button sa-flat-button-active')
        .addClass('sa-active')
        .attr('type', 'image')
        .attr('src', SA.ImagePathUrl + 'grid.png')
        // .prop('title', 'Grid')
        .on('click touchstart', function () { self.NewGrid(); });
    this.PolylineButton = $('<img>')
        .appendTo(this.Tab.Panel)
        .addClass('sa-view-annotation-button sa-flat-button-active')
        .addClass('sa-active')
        .attr('type', 'image')
        .attr('src', SA.ImagePathUrl + 'FreeForm.gif')
        // .prop('title', 'Polygon')
        .on('click touchstart', function () { self.NewPolyline(); });
    this.PencilButton = $('<img>')
        .appendTo(this.Tab.Panel)
        .addClass('sa-view-annotation-button sa-flat-button-active')
        .addClass('sa-active')
        .attr('type', 'image')
        // .prop('title', 'Pencil')
        .attr('src', SA.ImagePathUrl + 'Pencil-icon.jpg')
        .on('click touchstart', function () { self.NewPencil(); });
    this.LassoButton = $('<img>')
        .appendTo(this.Tab.Panel)
        .addClass('sa-view-annotation-button sa-flat-button-active')
        .addClass('sa-active')
        .attr('type', 'image')
        .attr('src', SA.ImagePathUrl + 'select_lasso.png')
        // .prop('title', 'Lasso')
        .on('click touchstart', function () { self.NewLasso(); });
    if (window.SA && this.Viewer) {
      this.SectionsButton = $('<img>')
            .appendTo(this.Tab.Panel)
            .addClass('sa-view-annotation-button sa-flat-button-active')
            .addClass('sa-active')
            .attr('type', 'image')
            .attr('src', SA.ImagePathUrl + 'sections.png')
            // .prop('title', 'Segment')
            .on('click touchstart', function () { self.DetectSections(); });
    }
    /*
    this.FillButton = $('<img>')
        .appendTo(this.Tab.Panel)
        .css({'height': '28px',
              'opacity': '0.6',
              'margin': '1px',
              'border-style': 'outset',
              'border-radius': '4px',
              'border-thickness':'2px'})
        .attr('type','image')
        .attr('src',SA.ImagePathUrl+"brush1.jpg")
        .on('click touchstart', function(){self.NewFill();});
        */
  }

// Show hide the tool tab button
  AnnotationWidget.prototype.show = function () {
    this.Tab.show();
  };

  AnnotationWidget.prototype.hide = function () {
    this.Tab.hide();
  };

  AnnotationWidget.prototype.SetVisibility = function (visibility) {
    if (this.Layer.GetVisibility() === visibility) {
      return;
    }

    // Hack to make all stack viewers share a single annotation visibility
    // flag.
    if (SA.notesWidget) {
      var note = SA.notesWidget.GetCurrentNote();
      if (note && note.Type === 'Stack') {
        for (var i = 0; i < note.ViewerRecords.length; ++i) {
          note.ViewerRecords[i].AnnotationVisibility = visibility;
        }
      }
    }

    if (this.VisibilityImage) {
      if (visibility === ANNOTATION_OFF) {
        this.VisibilityImage.css({'top': '-30px'});
      } else {
        this.VisibilityImage.css({'top': '1px'});
      }
    }

    this.Layer.SetVisibility(visibility);
    this.Layer.EventuallyDraw();
  };

  AnnotationWidget.prototype.GetVisibility = function () {
    return this.Layer.GetVisibility();
  };

  AnnotationWidget.prototype.ToggleVisibility = function () {
    var vis = this.GetVisibility();
    if (vis === ANNOTATION_OFF) {
      vis = ANNOTATION_ON;
    } else {
      vis = ANNOTATION_OFF;
    }
    this.SetVisibility(vis);
    if (window.SA) { SA.RecordState(); }
  };

  AnnotationWidget.prototype.TogglePanel = function () {
    this.Panel.toggle();
    if (this.Panel.is(':visible')) {
      this.TabButton.addClass('sa-active');
    } else {
        // Should we deactivate any active widget tool?
      this.TabButton.removeClass('sa-active');
    }
  };

// I would like to change the behavior of this.
// First slide the arrow, then pop up the dialog to set text.
  AnnotationWidget.prototype.NewText = function () {
    var button = this.TextButton;
    var widget = this.ActivateButton(button, SAM.TextWidget);
    // The dialog is used to set the initial text.
    widget.ShowPropertiesDialog();
  };

// Probably want a singleton pencil.
  AnnotationWidget.prototype.NewPencil = function () {
    var button = this.PencilButton;
    this.ActivateButton(button, SAM.PencilWidget);
  };

  AnnotationWidget.prototype.NewLasso = function () {
    var button = this.LassoButton;
    this.ActivateButton(button, SAM.ImageWidget);
  };

  AnnotationWidget.prototype.NewPolyline = function () {
    var button = this.PolylineButton;
    this.ActivateButton(button, SAM.PolylineWidget);
  };

  AnnotationWidget.prototype.NewCircle = function () {
    var button = this.CircleButton;
    this.ActivateButton(button, SAM.CircleWidget);
  };

  AnnotationWidget.prototype.NewRect = function () {
    var button = this.RectButton;
    this.ActivateButton(button, SAM.RectWidget);
  };

  AnnotationWidget.prototype.NewGrid = function () {
    var button = this.GridButton;
    var widget = this.ActivateButton(button, SAM.GridWidget);
    var cam = this.Layer.GetCamera();
    var fp = cam.GetWorldFocalPoint();
    // Square grid elements determined by height
    widget.Grid.Origin = [fp[0], fp[1], 0.0];
    widget.Grid.Orientation = cam.GetWorldRotation();
    this.Layer.DeactivateWidget(widget);
  };

  AnnotationWidget.prototype.NewFill = function () {
    var button = this.FillButton;
    var widget = this.ActivateButton(button, SAM.FillWidget);
    widget.Initialize();
  };

// Boilerplate code that was in every "newWidget" method.
  AnnotationWidget.prototype.ActivateButton = function (button, WidgetFunction) {
    var widget = this.Layer.ActiveWidget;
    if (widget) {
      if (button.Pressed) {
            // The user pressed the button again (while it was active).
        widget.Deactivate();
        return;
      }
        // This call sets pressed to false as a side action..
      widget.Deactivate();
    }
    button.Pressed = true;
    button.addClass('sa-active');

    this.SetVisibility(ANNOTATION_ON);
    widget = new WidgetFunction(this.Layer, true);
    this.Layer.ActivateWidget(widget);

    // Button remains "pressed" until the circle deactivates.
    widget.DeactivateCallback =
        function () {
          button.removeClass('sa-active');
          widget.DeactivateCallback = undefined;
          button.Pressed = false;
        };
    // Keep track of annotation created by students
    // without edit
    // permission.
    if (!SA.Edit) {
      this.UserNoteFlag = true;
    }
    if (SA.notesWidget && SA.notesWidget.IsUserTextTabOpen()) {
      widget.UserNoteFlag = true;
    }
    return widget;
  };

  AnnotationWidget.prototype.DetectSections = function () {
    if (!window.SA) { return; }

    var widget = this.Layer.GetActiveWidget();
    var button = this.SectionsButton;
    if (widget) {
      if (button.Pressed) {
        // The user pressed the button again (while it was active).
        widget.Deactivate();
        return;
      }
      // This call sets pressed to false as a side action.
      widget.Deactivate();
    }
    button.Pressed = true;
    button.addClass('sa-active');

    // See if a SectionsWidget already exists.
    widget = null;
    var widgets = this.Layer.GetWidgets();
    for (var i = 0; i < widgets.length && widget == null; ++i) {
      var w = widgets[i];
      // if (w instanceOf SectionsWidget) {
      if (w.Type === 'sections') {
        widget = w;
      }
    }
    if (widget == null) {
      // Find sections to initialize sections widget.
      widget = new SA.SectionsWidget(this.Layer, this.Viewer, false);
      widget.ComputeSections(this.Viewer);
      if (widget.IsEmpty()) {
        this.Layer.RemoveWidget(widget);
        button.removeClass('sa-active');
        button.Pressed = false;
        return;
      }
    }

    widget.SetActive(true);
    widget.DeactivateCallback =
      function () {
        button.removeClass('sa-active');
        widget.DeactivateCallback = undefined;
        button.Pressed = false;
      };
  };

  SA.AnnotationWidget = AnnotationWidget;
})();

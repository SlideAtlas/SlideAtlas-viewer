// This "widget" implements undo and redo as well as saving states in the database for a recording of a session.
// I save the recording state as a cookie so that the user can change slides or even sessions.
// I am going to have a separate recording collection.
// Each recording will be a single object.
// They will be tagged with start time, end time, user ID and a name (autogenerated or entered by user).

// NOTES:
// I will have to think about this ...
// save state vs. save delta state.
// State is simple .... Supports undo better .... Start with this.

// Maybe students can link to the instructor recording session.  The could add notes which are added to the recording.

// It might be nice to know where the mouse is pointing at all times.  We need a pointing tool. That is many events though.  LATER....

// Design issue:
// Should I save the state at the end of a move or the beginning?  I chose end.  Although beginning is easier,
// I like just popping the last state off the TIME_LINE and pushing to the REDO_STACK

// ------------------------------------------------------------------------------
// Records are now being used for notes.  Since page record may contain
// information about current note, I am using ViewerRecord as a shared object.

(function () {
  'use strict';

  SA.RECORDER_WIDGET = null;

  function ViewerRecord () {
    this.AnnotationVisibility = 0;
    this.Annotations = [];
        // UserNotes are bound to image ids so the need to be stored in
        // viewer records. They will always have one viewer record of the
        // their own. They may have children links ....
    this.UserNote = null;
  }

    // For copy slide in presentatations.  Serialize / load messup image.
  ViewerRecord.prototype.DeepCopy = function (source) {
    this.AnnotationVisibility = source.AnnotationVisibility;
    this.Annotations = JSON.parse(JSON.stringify(source.Annotations));
    this.Camera = new SAM.Camera();
    this.Camera.DeepCopy(source.Camera);
    this.Image = source.Image;
    this.OverviewBounds = source.OverviewBounds.slice(0);
    this.UserNote = source.UserNote;
  };

    // I am still trying to figure out a good pattern for loading
    // objects from mongo.
    // Cast to a ViewerObject by setting its prototype does not work on IE
  ViewerRecord.prototype.Load = function (obj) {
    if (!obj.Image.units && obj.Image.filename) {
      var tmp = obj.Image.filename.split('.');
      var ext = tmp[tmp.length - 1];
      if (ext === 'ptif') {
        obj.Image.spacing = [0.25, 0.25, 1.0];
        obj.Image.units = '\xB5m'; // um / micro meters
      }
    }

    if (!obj.Camera) {
      var bds = obj.Image.bounds;
      if (bds) {
        obj.Camera = {FocalPoint: [(bds[0] + bds[1]) / 2, (bds[2] + bds[3]) / 2],
          Height: bds[3] - bds[2],
          Width: bds[1] - bds[0],
          Roll: 0};
      }
    }

    for (var ivar in obj) {
      this[ivar] = obj[ivar];
    }

    if (this.Camera.Width === undefined) {
      this.Camera.Width = this.Camera.Height * 1.62;
    }

        // Stuck with Overview because it is in the database.
    if (!this.OverviewBounds) {
      this.OverviewBounds = this.Image.bounds;
    }

    if (this.Annotations) {
      for (var i = 0; i < this.Annotations.length; ++i) {
        var a = this.Annotations[i];
        if (a && a.color) {
          a.color = SAM.ConvertColor(a.color);
        }
      }
    }

    if (this.Transform) {
      var t = new SA.PairTransformation();
      t.Load(this.Transform);
      this.Transform = t;
    }

        // Anytime thie image changes, we have to set the user note.
    if (this.UserNote) {
            // Will this ever happen?
            // Should we save the old if it does?
            // For now, let the caller worry about it.
      console.log('Loading over a user note');
    }

    if (!this.UserFlag) {
      if (!this.UserNote || this.UserNote.Parent !== this.Image._id) {
                // This returns a note if it has already been loaded.
        this.UserNote = SA.GetUserNoteFromImageId(this.Image._id);
        if (!this.UserNote) {
          this.UserNote = new SA.Note();
          this.UserNote.Parent = this.Image._id;
                    // Copy the camera.
          var record = new SA.ViewerRecord();
          record.Camera = new SAM.Camera();
          record.Camera.DeepCopy(this.Camera);
          record.Image = this.Image;
          record.OverviewBounds = this.OverviewBounds.slice(0);
                    // Records of usernotes should not have usernotes
          record.UserFlag = true;
          this.UserNote.ViewerRecords = [record];
          this.UserNote.Type = 'UserNote';
                    // User notes slowing down stack loading.
                    // Make them load on demand.
        }
      }
    }
  };

    // Move to note.js
  ViewerRecord.prototype.RequestUserNote = function () {
    if (!this.UserNote) {
      return;
    }
    if (this.UserNote.LoadState !== 0) {
      return;
    }

        // TODO: Move this to note.js
    this.UserNote.LoadState === 1; // REQUESTED

    var self = this;
    $.ajax({
      type: 'get',
      url: '/webgl-viewer/getusernotes',
      data: {'imageid': this.UserNote.Parent},
      success: function (data, status) { self.LoadUserNote(data); },
      error: function () {
        SA.Debug('AJAX - error() : getusernotes');
        if (self.UserNote) {
                    // TODO: Do not add notes to the SA.Notes
                    // array until they are loaded.  Figure out
                    // why this ajax call is failing for HM stack.
          SA.DeleteNote(self.UserNote);
          delete self.UserNote;
        }
      }
    });
  };

    // Move to note.js
  ViewerRecord.prototype.LoadUserNote = function (data) {
    if (data.Notes.length === 0) {
      return;
    }

    var userNote = this.UserNote;
    var noteData = data.Notes[0];

        // This should not happen, but if it does, merge notes as best as possible.
    if (data.Notes.length > 1) {
      SA.Debug('Warning: More than one user note for the same image..');
      for (var i = 1; i < data.Notes.length; ++i) {
                // TODO: line break.
                // TODO: Remove the duplicate note in the database.
        noteData.Text += '<br>' + data.Notes[i].Text;
        noteData.ViewerRecords[0].Annotations =
                    noteData.ViewerRecords[0].Annotations.concat(
                        data.Notes[i].ViewerRecords[0].Annotations);
      }
    }
        // If in the rare case that the user note took a long time to load
        // and user text or annotations were added while waiting, merge
        // them.
    if (userNote.Text !== '') {
      noteData.Text = userNote.Text + '<br>' + noteData.Text;
    }
    if (userNote.ViewerRecords[0].Annotations.length > 0) {
      noteData.ViewerRecords[0].Annotations =
                noteData.ViewerRecords[0].Annotations.concat(
                        userNote.ViewerRecords[0].Annotations);
    }

    userNote.Load(noteData);

        // The new notes need to be displayed.
        // I do not like that this is global. We could have callbacks????
    SA.UpdateUserNotes();
  };

  ViewerRecord.prototype.CopyViewer = function (viewer) {
    var cache = viewer.GetCache();
    if (!cache) {
      this.Camera = null;
      this.AnnotationVisibility = false;
      this.Annotations = [];
      return;
    }

    this.OverviewBounds = viewer.GetOverViewBounds();

    this.OverviewBounds = viewer.GetOverViewBounds();
    this.Image = cache.Image;
    this.UserNote = SA.GetUserNoteFromImageId(this.Image._id);
    this.Camera = viewer.GetCamera().Serialize();

        // TODO: get rid of this hack somehow. Generalize layers?
    var annotationLayer = viewer.Layers[0];
    if (!annotationLayer) { return; }

    this.AnnotationVisibility = annotationLayer.GetVisibility();
    this.Annotations = [];

    var widgets = annotationLayer.GetWidgets();
    for (var i = 0; i < widgets.length; ++i) {
      this.Annotations.push(widgets[i].Serialize());
    }
  };

    // For stacks.  A reduced version of copy view.
  ViewerRecord.prototype.CopyAnnotations = function (viewer, userNoteFlag) {
    this.Annotations = [];
        // TODO: get rid of this hack somehow. Generalize layers?
    if (viewer.Layers.length === 0) { return; }
    var annotationLayer = viewer.Layers[0];
    if (!annotationLayer) { return; }
    var widgets = viewer.Layers[0].GetWidgets();
    for (var i = 0; i < widgets.length; ++i) {
      var widget = widgets[i];
            // Keep user note annotations separate from other annotations
            // if ((userNoteFlag && widget.UserNoteFlag)) ||
            //    (!userNoteFlag && !widget.UserNoteFlag)){ // ! exclusive or.
      widget.UserNoteFlag = widget.UserNoteFlag || false;
      if (userNoteFlag === widget.UserNoteFlag) { // ! exclusive or.
        var o = widgets[i].Serialize();
        if (o) {
          this.Annotations.push(o);
        }
      }
    }
  };

  // I am not sure we need to serialize.
  // The annotations are already in database form.
  // Possibly we need to restrict which ivars get into the database.
  ViewerRecord.prototype.Serialize = function () {
    var rec = {};
    rec.Image = this.Image._id;
    rec.Database = this.Image.database;
    rec.NumberOfLevels = this.Image.levels;
    rec.Camera = this.Camera;
        // deep copy
    if (this.Annotations) {
      rec.Annotations = JSON.parse(JSON.stringify(this.Annotations));
    }
    rec.AnnotationVisibility = this.AnnotationVisibility;

    if (this.OverviewBounds) {
      rec.OverviewBounds = this.OverviewBounds;
    }

    if (this.Transform) {
      rec.Transform = this.Transform.Serialize();
    }

    return rec;
  };

  // This is a helper method to start preloading tiles for an up coming view.
  ViewerRecord.prototype.LoadTiles = function (viewport) {
    var cache = SA.FindCache(this.Image);
    // TODO:  I do not like the fact that we are keeping a serialized
    // version of the camera in the record object.  It should be a real
    // camera that is serialized when it is saved.
    var cam = new SAM.Camera();
    cam.Load(this.Camera);
    cam.SetViewport(viewport);
    cam.ComputeMatrix();

        // Load only the tiles we need.
    var tiles = cache.ChooseTiles(cam, 0, []);
    for (var i = 0; i < tiles.length; ++i) {
      SA.LoadQueueAddTile(tiles[i]);
    }
  };

  // legacy
  SA.RecordState = function () {
    if (SA.RECORDER_WIDGET) {
      SA.RECORDER_WIDGET.RecordState();
    }
  };

  // display is a set of viewers (like DualViewWidet)
  var RecorderWidget = function (display) {
    if (!SA.RECORDER_WIDGET) {
      SA.RECORDER_WIDGET = this;
    }

    var self = this;
    this.Display = display;
    this.RecordTimerId = 0;
    this.Records;

    this.TimeLine = [];
    this.RedoStack = [];
    this.Recording = true;
    this.RecordingName = '';

        // The recording button indicates that recording is in
        // progress and also acts to stop recording.
    this.RecordButton = $('<img>')
            .appendTo('body')
            .css({
              'opacity': '0.5',
              'position': 'absolute',
              'height': '20px',
              'bottom': '120px',
              'right': '20px',
              'z-index': '1'})
            .attr('src', SA.ImagePathUrl + 'stopRecording2.png')
            .hide()
            .click(function () { self.RecordingStop(); });

        // Optional buttons.  Exposed for testing.
        // Undo (control z) and redo (control y) keys work,
    this.UndoButton = $('<img>').appendTo('body')
            .css({
              'opacity': '0.5',
              'position': 'absolute',
              'height': '30px',
              'bottom': '5px',
              'right': '100px',
              'z-index': '1'})
            .attr('src', SA.ImagePathUrl + 'undo.png')
            .hide()
            .click(function () { alert('undo'); });
    this.RedoButton = $('<img>').appendTo('body').css({
      'opacity': '0.5',
      'position': 'absolute',
      'height': '30px',
      'bottom': '5px',
      'right': '70px',
      'z-index': '1'})
            .attr('src', SA.ImagePathUrl + 'redo.png')
            .hide()
            .click(function () { alert('REDO'); });

    this.RecordingName = SA.getCookie('SlideAtlasRecording');
    if (this.RecordingName !== undefined && this.RecordingName !== 'false') {
      this.Recording = true;
      this.UpdateGUI();
    }

        // We have to start with one state (since we are recording states at the end of a move).
    this.RecordState();
  };

    // Should we name a recording?
  RecorderWidget.prototype.UpdateGUI = function () {
    if (this.Recording) {
      this.RecordButton.show();
    } else {
      this.RecordButton.hide();
    }
  };

    // Should we name a recording?
  RecorderWidget.prototype.RecordingStart = function () {
    if (this.Recording) { return; }
    this.Recording = true;
        // Generate a recording name as a placeholder.
        // User should be prompted for a name when recording stops.
    var d = new Date();
    this.RecordingName = 'Bev' + d.getTime();
    SA.setCookie('SlideAtlasRecording', this.RecordingName, 1);
    this.UpdateGUI();
        // Create a new recording object in the database.
    this.RecordState();
  };

  RecorderWidget.prototype.RecordingStop = function () {
    if (!this.Recording) { return; }
    this.Recording = false;
    SA.setCookie('SlideAtlasRecording', 'false', 1);
    this.UpdateGUI();

        // Prompt for a name and if the user want to keep the recording.
  };

  RecorderWidget.prototype.RecordStateCallback = function () {
    if (this.Display.GetNumberOfViewers() === 0) { return; }

        // Timer called this method.  Timer id is no longer valid.
    this.RecordTimerId = 0;
        // Redo is an option after undo, until we save a new state.
    this.RedoStack = [];

        // Create a new note.
    var note = new SA.Note();
    note.Type = 'Record';
        // This will probably have to be passed the viewers.
    note.RecordView(this.Display);

        // The note will want to know its context
        // The stack viewer does not have  notes widget.
    if (SA.display) {
      var parentNote = SA.display.GetNote();
      if (!parentNote || !parentNote.Id) {
                //  Note is not loaded yet.
                // Wait some more
        this.RecordState();
        return;
      }
            // ParentId should be depreciated.
      note.ParentId = parentNote.Id;
      note.SetParent(parentNote);
    }
        // Save the note in the admin database for this specific user.
    $.ajax({
      type: 'post',
      url: '/webgl-viewer/saveusernote',
      data: {'note': JSON.stringify(note.Serialize(true)),
        'col': 'tracking',
        'type': 'Record'},
      success: function (data, status) {
        note.Id = data;
      },
      error: function () {
                // SA.Debug( "AJAX - error() : saveusernote" );
      }
    });

    this.TimeLine.push(note);
        // Remove it from the serachable global list.
        // "Delete" recorder notes.  Once saved, we never user
        // them again. I do not think tileline will be an issue.
    SA.DeleteNote(note);
  };

    // Create a snapshot of the current state and push it on the TIME_LINE stack.
    // I still do not compress scroll wheel zoom, so I am putting a timer event
    // to collapse recording to lest than oner per second.
  RecorderWidget.prototype.RecordState = function () {
    if (this.Display.GetNumberOfViewers() === 0) { return; }
        // Delete the previous pending record timer
    if (this.RecordTimerId) {
      clearTimeout(this.RecordTimerId);
      this.RecordTimerId = 0;
    }
        // Start a record timer.
    var self = this;
    this.RecordTimerId = setTimeout(
            function () { self.RecordStateCallback(); },
            1000);
  };

  RecorderWidget.prototype.GetRecords = function () {
    var self = this;
    $.ajax({
      type: 'get',
      url: '/webgl-viewer/getfavoriteviews',
      data: {'col': 'tracking'},
      success: function (data, status) {
        self.Records = data.viewArray;
      },
      error: function () {
        SA.Debug('AJAX - error() : get records');
      }
    });
  };

    // Create a snapshot of the current state and push it on the TIME_LINE stack.
    // I still do not compress scroll wheel zoom, so I am putting a timer event
    // to collapse recording to lest than oner per second.
  RecorderWidget.prototype.RecordState = function () {
        // Delete the previous pending record timer
    if (this.RecordTimerId) {
      clearTimeout(this.RecordTimerId);
      this.RecordTimerId = 0;
    }
        // Start a record timer.
    var self = this;
    this.RecordTimerId = setTimeout(function () { self.RecordStateCallback(); }, 1000);
  };

    // Move the state back in time.
  RecorderWidget.prototype.UndoState = function () {
    if (this.TimeLine.length > 1) {
            // We need at least 2 states to undo.  The last state gets removed,
            // the second to last get applied.
      var recordNote = this.TimeLine.pop();
      this.RedoStack.push(recordNote);

            // Get the new end state
      recordNote = this.TimeLine[this.TimeLine.length - 1];
            // Now change the page to the state at the end of the timeline.
      SA.SetNote(recordNote);
    }
  };

    // Move the state forward in time.
  RecorderWidget.prototype.RedoState = function () {
    if (this.RedoState.length === 0) {
      return;
    }
    var recordNote = this.RedoStack.pop();
    this.TimeLine.push(recordNote);

    // Now change the page to the state at the end of the timeline.
    recordNote.DisplayView();
  };

  SA.ViewerRecord = ViewerRecord;
  SA.RecorderWidget = RecorderWidget;
})();


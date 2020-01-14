var BoxPosition = require('./box-position.js');
var CueStyleBox = require('./cue-style-box.js');
var moveBoxToLinePosition = require('./move-box-to-line-position.js');

var FONT_SIZE_PERCENT = 0.05;
var FONT_STYLE = "sans-serif";
var CUE_BACKGROUND_PADDING = "1.5%";

// Runs the processing model over the cues and regions passed to it.
// @param overlay A block level element (usually a div) that the computed cues
//                and regions will be placed into.
var processCues = function(window, cues, overlay, regions) {
  if (!window || !cues || !overlay) {
    return null;
  }

  // Remove all previous children.
  while (overlay.firstChild) {
    overlay.removeChild(overlay.firstChild);
  }

  regions = regions || [];

  for (var i = 0; i < regions.length; i++) {
    var region = regions[i];
    var display = region.displayState = window.document.createElement('div')
    var overlayHeight = overlay.offsetHeight;
    var height = Math.round(overlayHeight / 100) * 6 * region.lines;
    var width = region.width;
    display.classList.add(region.id);
    display.style.width = width + '%';
    display.style.height = height + 'px';
    display.style.position = "absolute";
    display.style.left = `calc(${region.viewportAnchorX}% - ${width * region.regionAnchorX / 100}%`;
    display.style.top = overlayHeight * region.viewportAnchorY / 100 - height * region.regionAnchorY / 100 + 'px';
    display.style.margin = CUE_BACKGROUND_PADDING;
    display.style.overflow = "hidden";
    display.style.transitionProperty = 'top';
    display.style.transitionDuration = '0.433s';

    overlay.appendChild(display);
  }

  var paddedOverlay = window.document.createElement("div");
  paddedOverlay.style.position = "absolute";
  paddedOverlay.style.left = "0";
  paddedOverlay.style.right = "0";
  paddedOverlay.style.top = "0";
  paddedOverlay.style.bottom = "0";
  paddedOverlay.style.margin = CUE_BACKGROUND_PADDING;
  overlay.appendChild(paddedOverlay);

  // Determine if we need to compute the display states of the cues. This could
  // be the case if a cue's state has been changed since the last computation or
  // if it has not been computed yet.
  function shouldCompute(cues) {
    for (var i = 0; i < cues.length; i++) {
      if (cues[i].hasBeenReset || !cues[i].displayState) {
        return true;
      }
    }
    return false;
  }

  // We don't need to recompute the cues' display states. Just reuse them.
  if (!shouldCompute(cues)) {
    for (var i = 0; i < cues.length; i++) {
      if (cues[i].region) {
        region.displayState.appendChild(cues[i].displayState);
      } else {
        paddedOverlay.appendChild(cues[i].displayState);
      }
    }
    return;
  }

  var boxPositions = [],
      containerBox = BoxPosition.getSimpleBoxPosition(paddedOverlay),
      fontSize = Math.round(containerBox.height * FONT_SIZE_PERCENT * 100) / 100;
  var styleOptions = {
    font: fontSize + "px " + FONT_STYLE
  };

  (function() {
    var styleBox, cue;

    for (var i = 0; i < cues.length; i++) {
      cue = cues[i];

      // Compute the intial position and styles of the cue div.
      styleBox = new CueStyleBox(window, cue, styleOptions);
      if (cue.region) {
        cue.region.displayState.appendChild(styleBox.div);
        containerBox = BoxPosition.getSimpleBoxPosition(cue.region.displayState);
        if (cue.region.scroll === 'up') {
          for (var j = 0; j < cue.region.displayState.children.length; j++) {
            var c = cue.region.displayState.children[j];
            var top = parseInt(c.style.top, 10);
            console.log(c.style.top, '!!1');
            c.style.top = top - styleBox.div.offsetHeight + 'px';
            console.log(c.style.top, '!!');
          }
        }
      } else {
        paddedOverlay.appendChild(styleBox.div);
      }

      // Move the cue div to it's correct line position.
      moveBoxToLinePosition(window, styleBox, containerBox, boxPositions, cue.region);

      // Remember the computed div so that we don't have to recompute it later
      // if we don't have too.
      cue.displayState = styleBox.div;

      boxPositions.push(BoxPosition.getSimpleBoxPosition(styleBox));
    }
  })();
};

module.exports = processCues;
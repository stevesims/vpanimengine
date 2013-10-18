/*
  VPAnimEngine 'rowmangler' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";
  
  var debug = VPAnimEngine.debug;

  // the 'rowmangler' renderer...
  // can't remember what all the settings do on this one right now, but will make an example or two
  VPAnimEngine.addRenderer({
    name: 'rowmangler',
    version: 1,
    renderer: function rowmangler(source, destination, settings) {
      var ctx = destination.getContext('2d');
      var width = source.width;
      if (!width) {
        return destination;
      }
      var height = source.height;
      settings = settings || {};
      var rows = settings.rows || 10;
      var rowHeight = height / rows;
      var rowHeightC = Math.ceil(rowHeight);

      var yPos = 0;
      switch (settings.type) {
        case 'opposing-sin':
          if (!settings.animStartTime) {
            settings.animStartTime = Date.now();
          }
          var animAngle = (Date.now() - settings.animStartTime) * (settings.angleRate || 0.0005);
          var animOffset = ((settings.animSize || (width / 10)) * Math.sin(animAngle));
          for (var row = 0; row < rows; row++) {
            yPos = Math.ceil(rowHeight * row);
            ctx.drawImage(
              source,
              0, yPos, width, rowHeightC,
              (animOffset * (((row % 2) * 2) - 1)), yPos, width, rowHeightC
            );
          }
          break;
        case 'randomized-sin':
          if (!settings.animStartTime) {
            settings.animStartTime = Date.now();
          }
          if (!Array.isArray(settings.angleOffsets)) {
            settings.angleOffsets = [];
            for (var row = 0; row < rows; row++) {
              settings.angleOffsets.push(Math.round(Math.random() * 20000));
            }
          }
          for (var row = 0; row < rows; row++) {
            var animAngle = (Date.now() - settings.animStartTime + settings.angleOffsets[row]) * (settings.angleRate || 0.0005);
            var animOffset = ((settings.animSize || (width / 10)) * Math.sin(animAngle));
            yPos = Math.ceil(rowHeight * row);
            var thisRowHeight = Math.min(rowHeightC, height - yPos);
            ctx.drawImage(
              source,
              0, yPos, width, thisRowHeight,
              animOffset, yPos, width, thisRowHeight
            );
          }
          break;
        case 'sequenced-sin':
          if (!settings.animStartTime) {
            settings.animStartTime = Date.now();
          }
          if (!Array.isArray(settings.angleOffsets)) {
            settings.angleOffsets = [];
            for (var row = 0; row < rows; row++) {
              settings.angleOffsets.push(row * (settings.rowAngleTimeOffset || 500));
            }
          }
          for (var row = 0; row < rows; row++) {
            var animAngle = (Date.now() - settings.animStartTime + settings.angleOffsets[row]) * (settings.angleRate || 0.0005);
            var animOffset = ((settings.animSize || (width / 10)) * Math.sin(animAngle));
            yPos = Math.ceil(rowHeight * row);
            var thisRowHeight = Math.min(rowHeightC, height - yPos);
            try {
              ctx.drawImage(
                source,
                0, yPos, width, thisRowHeight,
                animOffset, yPos, width, thisRowHeight
              );
            } catch(e) {
              debug("Dang - source params were 0, %d, %d, %d", yPos, width, rowHeightC);
              throw e
            }
          }
          break;
        case 'mirror-vert':
        case 'mirror-vertical':
          for (var row = 0; row < rows; row++) {
            yPos = Math.ceil(rowHeight * row);
            var thisRowHeight = Math.min(rowHeightC, height - yPos);
            if (row % 2) {
              ctx.drawImage(
                source,
                0, yPos, width, thisRowHeight,
                0, yPos, width, thisRowHeight
              );
            } else {
              ctx.scale(1, -1);
              ctx.drawImage(
                source, 
                0, yPos, width, thisRowHeight,
                0, -yPos - rowHeightC, width, thisRowHeight
              );
              ctx.scale(1, -1);
            }
          }
          break;
        case 'mirror-horiz':
        case 'mirror-horizontal':
        default:
          for (var row = 0; row < rows; row++) {
            yPos = Math.ceil(rowHeight * row);
            var thisRowHeight = Math.min(rowHeightC, height - yPos);
            if (row % 2) {
              ctx.drawImage(
                source,
                0, yPos, width, thisRowHeight,
                0, yPos, width, thisRowHeight
              );
            } else {
              ctx.scale(-1, 1);
              ctx.drawImage(
                source, 
                0, yPos, width, thisRowHeight,
                -width, yPos, width, thisRowHeight
              );
              ctx.scale(-1, 1);
            }
          }
      }
  
      return destination;
    }
  });
})();
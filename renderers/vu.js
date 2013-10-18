/*
  VPAnimEngine 'vu' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";

  // 'vu' renderer
  // to be used in conjuction to an action module providing VU data
  // supports various nifty display options including bezier curve fitting

  var kPI2 = Math.PI * 2;
  
  function findCoefficients(positions) {
    var n = positions.length - 1;

    var b = new Array();
    var r = new Array();
    var c = new Array();

    b[0] = 2 * ( positions[1] - positions[0] ) / 3.0;
    for( i = 1; i < n; i++ )
      b[i] = positions[i+1] - positions[i-1];
    b[n] = 2 * ( positions[n] - positions[n-1] ) / 3.0;

    r[n] = 1;
    r[n-1] = 1;
    for(var i = n-2; i >= 0; i--) {
      r[i] = 4 * r[i+1] - r[i+2];
    }
    for( i = 1; i<=n; i+=2 ) {
      r[i] = -r[i];
    }

    c[0] = 0.0;
    for(var i = n; i>=0; i--) {
      c[0] += r[i] * b[i];
    }
    c[0] /= (r[0] + r[1]);
    c[1] = b[0] - c[0];
    for(var i = 1; i < n; i++) {
      c[i+1] = b[i] - 4 * c[i] - c[i-1];
    }

    return c;
  };

  function getXCoefficients(canvas, channels) {
    if (canvas.xCoefficients && (canvas.xCoefficients.length === (channels + 2))) return canvas.xCoefficients;
    canvas.xCoefficients = findCoefficients(canvas.xOffsets);
    return canvas.xCoefficients;
  };

  function bezXOffsets(canvas, channels) {
    if (canvas.xOffsets && (canvas.xOffsets.length === (channels + 2))) return canvas.xOffsets;
    var xOffsets = new Array();
    var canvasWidth = canvas.width;
    for (var i = 0; i <= channels + 1; i++) {
      xOffsets[i] = (canvasWidth / (channels + 1)) * i;
    }
    canvas.xOffsets = xOffsets;
    return xOffsets;
  };

  function barXOffsets(canvas, channels) {
    if (canvas.barXOffsets && (canvas.barXOffsets.length === (channels + 1))) return canvas.barXOffsets;
    var barXOffsets = new Array();
    var canvasWidth = canvas.width;
    for (var i = 0; i <= channels; i++) {
      barXOffsets[i] = (canvasWidth / channels) * i;
    }
    canvas.barXOffsets = barXOffsets;
    return barXOffsets;
  };


  VPAnimEngine.addRenderer({
    name: 'vu',
    version: 1,
    renderer: function vu(source, destination, settings) {
      var ctx = destination.getContext('2d');
      var width = destination.width;
      var height = destination.height;

      var yScale = height / 255;

      var vuData = this.settings.vuData.values.map(function(a) { return a * yScale });
      var channels = this.settings.vuData.channels;
      var points = channels;
      if (settings.leadingZero) {
        points = points + 1;
        vuData.unshift(0);
      }
      if (settings.trailingZero) {
        points = points + 1;
      }
 
      ctx.save();

      switch (settings.style) {
        case 'bezier':
          var yCoefficients = findCoefficients(vuData);
          var xOffsets = bezXOffsets(destination, channels);
          var xCoefficients = getXCoefficients(destination, channels);

          ctx.save();
          ctx.beginPath();
          if (settings.inverted) {
            ctx.moveTo(0, vuData[0]);
          } else {
            ctx.moveTo(0, height - vuData[0]);
          }
          for (var i = 0; i < (points - 1); i++) {
            if (settings.inverted) {
              ctx.bezierCurveTo(
                xOffsets[i] + xCoefficients[i], (vuData[i] + yCoefficients[i]),
                xOffsets[i+1] - xCoefficients[i+1], (vuData[i+1] - yCoefficients[i+1]),
                xOffsets[i+1], vuData[i+1]
              );
            } else {
              ctx.bezierCurveTo(
                xOffsets[i] + xCoefficients[i], height - (vuData[i] + yCoefficients[i]),
                xOffsets[i+1] - xCoefficients[i+1], height - (vuData[i+1] - yCoefficients[i+1]),
                xOffsets[i+1], height - vuData[i+1]
              );
            }
          }
          ctx.restore();
          break;
        case 'shapes':
          var yCoefficients = findCoefficients(vuData);
          var xOffsets = bezXOffsets(destination, channels);
          var xCoefficients = getXCoefficients(destination, channels);
          ctx.save();
            ctx.beginPath();
            for (var i = 0; i < points; i++) {
              var xPos = xOffsets[i];
              var yPos = settings.inverted ? vuData[i] : height - vuData[i];
              switch (settings.shape) {
                case 'circle':
                  ctx.moveTo(xPos, yPos);
                  ctx.arc(xPos, yPos, (settings.radius || 2), 0, kPI2, false);
                  break;
                case 'cross':
                default:
                  ctx.moveTo(xPos - 5, yPos - 5);
                  ctx.lineTo(xPos + 5, yPos + 5);
                  ctx.moveTo(xPos - 5, yPos + 5);
                  ctx.lineTo(xPos + 5, yPos - 5);
              }
            }
          ctx.restore();
          break;
        case 'bars':
          var barXOffsets = barXOffsets(destination, channels);
          ctx.save();
          ctx.beginPath();
          for (var i = 0; i < channels; i++) {
            if (settings.inverted) {
              ctx.rect(
                barXOffsets[i], 0,
                barXOffsets[i+1] - barXOffsets[i], vuData[i]
              );
            } else {
              ctx.rect(
                barXOffsets[i], height - vuData[i],
                barXOffsets[i+1] - barXOffsets[i], vuData[i]
              );
            }
          }
          ctx.closePath();
          ctx.restore();
          break;
        case 'peaks':
          var barXOffsets = barXOffsets(destination, channels);
          if (!settings.peakValues) {
            settings.peakValues = new Array();
            for (var i = 0; i < channels; i++) {
              settings.peakValues[i] = 0;
            }
            settings.lastPeakTime = Date.now();
          }
          var newTime = Date.now();
          var timeDiff = newTime - settings.lastPeakTime;
          var decayRate = Math.floor(timeDiff / kDecayFactor);
          settings.lastPeakTime = newTime;
          ctx.save();
          ctx.beginPath();
          for (var i = 0; i < channels; i++) {
            var yPos = Math.round(vuData[i] / 16) * 16;
            if (settings.peakValues[i] <= yPos) {
              settings.peakValues[i] = yPos;
            } else {
              settings.peakValues[i] = Math.max(settings.peakValues[i] - decayRate, 0);
            }
            if (!settings.inverted) {
              ctx.rect(
                barXOffsets[i], height - settings.peakValues[i],
                barXOffsets[i+1] - barXOffsets[i], -5
              );
            } else {
              ctx.rect(
                barXOffsets[i], settings.peakValues[i],
                barXOffsets[i+1] - barXOffsets[i], -5
              );
            }
          }
          ctx.closePath();
          ctx.restore();
      }
      ctx.restore();

      return destination;
    },
    dependencies: [
      { action: 'updateVU', version: 1 }
    ]
  });

}());
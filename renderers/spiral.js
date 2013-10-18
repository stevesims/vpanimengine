/*
  VPAnimEngine 'spiral' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
  "use strict";

  // Spiral renderer
  // if image(s) provided, then this renderer will render images
  // otherwise adds bezier path to current context
  
  // not the best spiral in the world...

  var kPI10 = Math.PI * 10;
  var kPI2 = Math.PI * 2;

  function makeSpiralData(settings, width, height) {
    settings.spiralData = {};
    var x = settings.spiralData.x = new Array();
    var y = settings.spiralData.y = new Array();
    var xFill = settings.spiralData.xFill = new Array();
    var yFill = settings.spiralData.yFill = new Array();
    settings.spiralData.spiralScale = settings.spiralScale || 1;
    settings.spiralData.fillAngle = settings.fillAngle || Math.PI / 3;
    settings.spiralData.spiralAngle = settings.spiralAngle || 0;
    var spiralTotalAngle = settings.spiralTotalAngle || kPI10;

    var size = Math.max(width, height) * settings.spiralData.spiralScale;

    var n = settings.points || 200;

    var spiralAngle = settings.spiralData.spiralAngle;
    for (var i = 0; i < n; i++) {
      var frac = i / n;
      x.push((Math.sin((frac * spiralTotalAngle) + spiralAngle) * frac) * size);
      y.push((Math.cos((frac * spiralTotalAngle) + spiralAngle) * frac) * size);
    }

    var fillAngle = settings.spiralData.fillAngle;
    var fillFudge = 1 + (((kPI2 - fillAngle) / kPI2) / 5);
    for (var i = 0; i < (n * fillFudge); i++) {
      var frac = i / n;
      xFill.push((Math.sin((frac * spiralTotalAngle) + fillAngle + spiralAngle) * frac) * size);
      yFill.push((Math.cos((frac * spiralTotalAngle) + fillAngle + spiralAngle) * frac) * size);
    }
  };
  
  VPAnimEngine.addRenderer({
    name: 'spiral',
    version: 2,
    renderer: function spiral(source, destination, settings, pipeline) {
      var ctx = destination.getContext('2d');
      var width = destination.width;
      var height = destination.height;
  
      if (!settings.spiralData
        || (settings.spiralData.spiralScale != (settings.spiralScale || 0.7))
        || (settings.spiralData.fillAngle != (settings.fillAngle || (Math.PI / 3)))
        || (settings.spiralData.spiralAngle != (settings.spiralAngle || 0))
      ) {
        makeSpiralData(settings, width, height);
      }
  
      var x = settings.spiralData.x,
          y = settings.spiralData.y,
          xFill = settings.spiralData.xFill,
          yFill = settings.spiralData.yFill;

      var image, source;
      if (Array.isArray(settings.imageSources)) {
        if (settings.imageIndex === undefined) settings.imageIndex = 0;
        source = settings.imageSources[settings.imageIndex];
      } else {
        source = settings.imageSource;
      }
      if (source) {
        if (settings.image && (settings.image.getAttribute('src') == source)) {
          image = settings.image;
          if (!image.width) return destination;
        } else {
          image = new Image();
          image.src = source;
          settings.image = image;
          return destination;
        }
      }
  
      ctx.save();
  
      try {
        ctx.translate(width/2, height/2);
  
        if (image) {
          for (var i = 0; i < x.length - 1; i++) {
            var size = Math.max((i / (x.length - 1)) * (settings.imageScale || 1) * image.width, settings.imageMinSize || 1);
            ctx.drawImage(image, x[i] - (size / 2), y[i] - (((image.height / image.width) * size) / 2), size, (image.height / image.width) * size);
          }
          ctx.restore();
        } else {
          ctx.beginPath();

          for (var i = 0; i < x.length; i++) {
            ctx.lineTo(x[i], y[i]);
          }

          if (settings.fillStyle || settings.pattern || settings.filled) {
            for (var i = xFill.length - 1; i >= 0; i--) {
              ctx.lineTo(xFill[i], yFill[i]);
            }
            ctx.closePath();
          }

          if (!settings.preventAutoRestore) {
            this.pushAutoStage(pipeline, { render: 'restore', destination: destination.surfaceSettings.name }, { unshift: true });
          }
        }
      } catch(e) {
        if (window.console) {
          console.log("Error in spiral renderer %o", e);
        }
        ctx.restore();
      }
  
      return destination;
    }
  });
})();
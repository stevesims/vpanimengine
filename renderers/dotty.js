/*
  VPAnimEngine 'dotty' renderer collection

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
  "use strict";

  var kPI2 = Math.PI * 2;

  // 'dottySource' renderer prepares a shrunken source canvas for use with dotty renderer
  VPAnimEngine.addRenderer({
    name: 'dottySource',
    version: 1,
    renderer: function dottySource(source, destination, settings) {
      var sWidth = source.width;
      var sHeight = source.height;
      var width = destination.width;
      var height = destination.height;

      if (((sWidth * settings.dotSize) != width) || ((sHeight * settings.dotSize) != height)) {
        sWidth = Math.floor(width / settings.dotSize);
        sHeight = Math.floor(height / settings.dotSize);
        var newSource = document.createElement("canvas");
        var sCtx = newSource.getContext('2d');
        sCtx.drawImage(source, 0, 0, sWidth, sHeight);
        return newSource;
      } else {
        return source;
      }
    }
  });

  // dotty renders a simple dotty pixelated version of the source to destination
  // settings object must define the following:
  // dotSize    - pixel spacing between dots - required
  // dotRadius  - radius of dots in pixels - required
  // dotOffsetX - x offset for dots - optional, defaults to dotSize/2
  // dotOffsetY - y offset for dots - optional, defaults to dotSize/2
  VPAnimEngine.addRenderer({
    name: 'dotty',
    version: 1,
    renderer: function dotty(source, destination, settings) {
      var sCtx = source.getContext('2d');
      var sWidth = source.width;
      var sHeight = source.height;
      var pixels = sCtx.getImageData(0, 0, sWidth, sHeight);
      var pixData = pixels.data;  
      var ctx = destination.getContext('2d');
      ctx.save();
        var width = destination.width;
        var height = destination.height;
        var dotSpace = settings.dotSize;
        var dotRadius = settings.dotRadius;
        var dotOffsetX = settings.dotOffsetX || (dotSpace / 2);
        var dotOffsetY = settings.dotOffsetY || (dotSpace / 2);
        for (var y = 0; y < sHeight; y++) {
          for (var x = 0; x < sWidth; x++) {
            var offset = (y * sWidth * 4) + (x * 4);
            var alpha = pixData[offset+3] / 255;
            if (alpha === 0) {
              continue;
            }
            var red = pixData[offset];
            var green = pixData[offset+1];
            var blue = pixData[offset+2];
            ctx.fillStyle = "rgba(" + red + "," + green + "," + blue + "," + alpha + ")";
            ctx.beginPath();
            ctx.arc(dotOffsetX + (x * dotSpace), dotOffsetY + (y * dotSpace), dotRadius, 0, kPI2, false);
            ctx.closePath();
            ctx.fill();
          }
        }
      ctx.restore();
      return destination;
    }
  });
}());

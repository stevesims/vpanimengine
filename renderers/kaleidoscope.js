/*
  VPAnimEngine 'kaleidoscope' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";

  var kPI1_2 = Math.PI / 2;
  
  function drawKaleidoTriangleSegment(ctx, source, sourceX, sourceY, width, height, diag) {
    ctx.save();
    try {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, diag);
      ctx.lineTo(diag, diag);
      ctx.lineTo(0,0);
      ctx.clip();
      ctx.drawImage(source, sourceX, sourceY, width, height, 0, 0, width, height);
    }
    finally {
      ctx.restore();
    }
  };

  // kaleidoscope renderer uses source as the source image
  // TODO: would be nice to make the number of kaleidoscope segments configurable
  VPAnimEngine.addRenderer({
    name: 'kaleidoscope',
    version: 1,
    renderer: function kaleidoscope(source, destination, settings) {
      var ctx = destination.getContext('2d');
      var width = settings.width || destination.width;
      var height = settings.height || destination.height;

      var sourceX = settings.source ? settings.source.x || 0 : 0;
      var sourceY = settings.source ? settings.source.y || 0 : 0;

      var halfWidth = width/2;
      var halfHeight = height/2;

      var diag = Math.sin(kPI1_2) * halfWidth;
      //var diag = 707;

      if (source.width === 0) {
        if (settings.oldSource) {
          source = settings.oldSource;
        } else {
          return destination;
        }
      } else {
        settings.oldSource = source;
      }

      ctx.save();
      try {
        ctx.translate(halfWidth, halfHeight);

        var sourceWidth = Math.min(halfWidth, source.width - sourceX);
        var sourceHeight = Math.min(halfHeight, source.height - sourceY);

        if (!settings.hideOne) {
          ctx.save();
          try {
            ctx.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
            ctx.scale(1, -1);
            ctx.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
            ctx.scale(-1, 1);
            ctx.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
            ctx.scale(1, -1);
            ctx.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
          }
          finally {
            ctx.restore();
          }
        }

        if (!settings.hideTwo) {
          sourceHeight = Math.min(halfWidth, source.height - sourceY);
          sourceWidth = Math.min(halfHeight, source.width - sourceX);

          ctx.rotate(kPI1_2);
          drawKaleidoTriangleSegment(ctx, source, sourceX, sourceY, sourceWidth, sourceHeight, diag);
          ctx.scale(1, -1);
          drawKaleidoTriangleSegment(ctx, source, sourceX, sourceY, sourceWidth, sourceHeight, diag);
          ctx.scale(-1, 1);
          drawKaleidoTriangleSegment(ctx, source, sourceX, sourceY, sourceWidth, sourceHeight, diag);
          ctx.scale(1, -1);
          drawKaleidoTriangleSegment(ctx, source, sourceX, sourceY, sourceWidth, sourceHeight, diag);
        }
      }
      finally {
        ctx.restore();
      }
    }
  });
})();
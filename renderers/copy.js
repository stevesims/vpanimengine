/*
  VPAnimEngine 'copy' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";

  // 'copy' renderer copies from source to destination, using optional settings
  // settings can optionally provide metrics values for source and destination
  VPAnimEngine.addRenderer({
    name: 'copy',
    version: 2,
    renderer: function copy(source, destination, settings) {
      var ctx = destination.getContext('2d');
    
      if (!settings) {
        ctx.drawImage(source, 0, 0);
        return;
      }
    
      settings = settings || {};

      var sx = settings.source ? settings.source.x || 0 : 0,
          sy = settings.source ? settings.source.y || 0 : 0,
          sw = settings.source ? settings.source.width || source.width : source.width,
          sh = settings.source ? settings.source.height || source.height : source.height,
          dx = settings.destination ? settings.destination.x || 0 : 0,
          dy = settings.destination ? settings.destination.y || 0 : 0,
          dw = settings.destination ? settings.destination.width : undefined,
          dh = settings.destination ? settings.destination.height : undefined;

      if (settings.stretch) {
        dw = dw || destination.width;
        dh = dh || destination.height;
      } else {
        dw = dw || sw;
        dh = dh || sh;
      }

      ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);

      return destination;
    }
  });
})();
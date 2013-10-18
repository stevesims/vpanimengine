/*
  VPAnimEngine 'clear' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";

  // clear renderer will clear a destination canvas
  // takes an optional settings object which can include destination metrics for area to clear
  // and also fillStyle or color values
  VPAnimEngine.addRenderer({
    name: 'clear',
    version: 1,
    renderer: function clear(source, destination, settings) {
      var ctx = destination.getContext('2d');
      settings = settings || {};
      var width  = (settings.destination ? settings.destination.width : 0) || destination.width;
      var height = (settings.destination ? settings.destination.height: 0) || destination.height;
      var x      = (settings.destination ? settings.destination.x     : 0) || 0;
      var y      = (settings.destination ? settings.destination.y     : 0) || 0;
      ctx.save()
        ctx.setTransform(1,0,0,1,0,0);
        if (settings && (settings.fillStyle || settings.color)) {
          ctx.fillStyle = settings.fillStyle || settings.color;
          ctx.fillRect(x, y, width, height);
        } else {
          ctx.clearRect(x, y, width, height);
        }
      ctx.restore();
  
      return destination;
    }
  });
})();
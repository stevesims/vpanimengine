/*
  VPAnimEngine 'geometrics' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";

  var kPI2 = Math.PI * 2;

  // geometrics renderer produces simple cycling geometric patterns as paths in destination context
  VPAnimEngine.addRenderer({
    name: 'geometrics',
    version: 1,
    renderer: function geometrics(source, destination, settings) {
      if (!(settings && destination)) {
        debug("geometrics render error - settings %o destination %o", settings, destination);
        return;
      }

      if (settings.startActions && (settings.frame === 0)) {
        this.processStages(settings.startActions);
      }

      var ctx = destination.getContext('2d');
      var width = destination.width;
      var height = destination.height;

      ctx.beginPath();

      switch (settings.shape) {
        case 'square':
          var rSize = Math.min(width, height);
          var originX = width / 2;
          var originY = height / 2;
          var stepSize = rSize / (settings.steps + 1);
          var rectSize;
          if (settings.oneWay) {
            rectSize = stepSize * (settings.frame + 1);
          } else {
            rectSize = stepSize * (settings.frame - (settings.steps / 2)) * 2;
          }
          if (settings.inwards) {
            rectSize = rSize - rectSize;
          }
          rectSize = Math.round(rectSize);
          var rectOffset = rectSize / 2;
          ctx.rect(originX - rectOffset, originY - rectOffset, rectSize, rectSize);
          break;
        case 'circle':
          var originX = width / 2;
          var originY = height / 2;
          var radius = Math.sqrt((originX * originX) + (originY * originY));
          if (settings.oneWay) {
            if (settings.inwards) {
              radius = radius * ((settings.steps - settings.frame) / settings.steps);
            } else {
              radius = radius * (settings.frame / settings.steps);
            }
          } else {
            radius = radius * Math.abs(((settings.frame - (settings.steps / 2)) * 2) / settings.steps);
          }
          radius = Math.round(radius);
          ctx.arc(originX, originY, radius, 0, kPI2, false);
          break;
        case 'diagonal':
          var diagSize = Math.max(width, height);
          var offset = (2 * (settings.steps - settings.frame) * Math.round(diagSize / settings.steps)) - diagSize;
          ctx.moveTo(diagSize + offset, 0);
          ctx.lineTo(offset, height);
          break;
        default:
          debug("Error: Unknown geometric shape %o - ignoring", settings.shape);
          return;
      }

      settings.frame = (settings.frame + 1) % settings.steps;

      if (settings.endActions && (settings.frame === 0)) {
        // TODO consider delaying this into an autoStages call, since this might affect current context
        this.processStages(settings.endActions);
      }

      return destination;
    }
  });
}());


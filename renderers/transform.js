/*
  VPAnimEngine 'transform' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";

  // 'transform' renderer provides generic canvas transform, and globalAlpha, support

  function doTransform(ctx, settings, width, height, originX, originY) {
    if (Array.isArray(settings.transforms)) {
      settings.transforms.forEach(function(setting) {
        doTransform(
          ctx, setting, width, height,
          setting.origin !== undefined ? setting.origin.x : originX,
          setting.origin !== undefined ? setting.origin.y : originY
        );
      });
    }

    if (settings.globalAlpha) {
      ctx.globalAlpha = settings.globalAlpha;
    }
    if (settings.rotate) {
      ctx.translate(originX, originY);
      ctx.rotate(settings.rotate);
      ctx.translate(-originX, -originY);
    }
    if (settings.scale && (settings.scale !== 1)) {
      ctx.translate(originX, originY);
      ctx.scale(settings.scale, settings.scale);
      ctx.translate(-originX, -originY);
    }
    if (settings.scaleX && (settings.scaleX !== 1)) {
      ctx.translate(originX, originY);
      ctx.scale(settings.scaleX, 1);
      ctx.translate(-originX, -originY);
    }
    if (settings.scaleY && (settings.scaleY !== 1)) {
      ctx.translate(originX, originY);
      ctx.scale(1, settings.scaleY);
      ctx.translate(-originX, -originY);
    }
    if (settings.metrics) {
      ctx.translate(settings.metrics.x || 0, settings.metrics.y || 0);
    }
  }
  
  VPAnimEngine.addRenderer({
    name: 'transform',
    version: 1,
    renderer: function transform(source, destination, settings, pipeline) {
      var ctx = destination.getContext('2d');
      ctx.save();
      try {
        doTransform(
          ctx, settings, destination.width, destination.height,
          settings.origin !== undefined ? settings.origin.x || 0 : destination.width / 2,
          settings.origin !== undefined ? settings.origin.y || 0 : destination.height / 2
        );
      }
      finally {
        if (!settings.preventAutoRestore) {
          this.pushAutoStage(pipeline, { render: 'restore', destination: destination.surfaceSettings.name }, { unshift: true });
        }
      }
    },
    dependencies: [
      { renderer: 'restore', version: 1 }
    ]
  });
}());

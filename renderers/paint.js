/*
  VPAnimEngine 'paint' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
  "use strict";

  // the 'paint' renderer will paint the current path in destination canvas' context
  // takes various settings...
  // shadow styles will be applied first
  // 'type' setting defines if the paint will be a stroke, fill, stroke-then-fill, or fill-then-stroke (the default)
  // see setShadow, setStroke and setFill code below for more info

  var debug = VPAnimEngine.debug;
  
  function getStyle(ctx, settings, width, height) {
    var style;
    
    if (settings.color) {
      style = settings.color;
    }
    
    if (settings.pattern) {
      if (style) {
        debug("warning in paint renderer: pattern %o overrides color %o", settings.pattern, settings.color);
      }
      var patternSurface = this._surfaces[settings.pattern];
      if (patternSurface) {
        var pattern = ctx.createPattern(patternSurface, (settings.patternRepeat || 'repeat'));
        style = pattern;
      } else {
        debug("error in paint renderer: pattern surface %o not found", settings.pattern);
      }
    }
    
    if (settings.gradient) {
      if (style) {
        debug("warning in paint renderer: gradient %o overrides fill", settings.gradient);
      }
      
      var grad, gradient;
      
      if (VPUtils.isString(settings.gradient) || Array.isArray(settings.gradient)) {
        grad = this.getSettings(settings.gradient);
        if (!grad) {
          debug("gradient settings %o not found", settings.gradient);
        }
      }
      
      grad = grad || settings;

      if (grad.type === 'radial') {
        gradient = ctx.createRadialGradient(
          grad.startX || (width/2),
          grad.startY || (height/2),
          grad.startRadius || 0,
          grad.endX || (width/2),
          grad.endY || (height/2),
          grad.endRadius || (Math.sqrt((width * width) + (height * height)) / 2)
        );
      } else {
        gradient = ctx.createLinearGradient(
          grad.startX || 0,
          grad.startY || 0,
          grad.endX || 0,
          grad.endY || height
        );
      }

      window.gradDef = grad;
      
      if (Array.isArray(grad.colorStops)) {
        grad.colorStops.forEach(function(stop) {
          gradient.addColorStop.apply(gradient, stop);
        });
      } else {
        gradient.addColorStop(0, grad.colorFrom || 'red');
        gradient.addColorStop(1, grad.colorTo || 'yellow');
      }

      style = gradient;
    }
    
    return style;
  }
  
  function setFill(ctx, settings, width, height) {
    var fillSettings = this.getSettings(settings.fillStyle, true) || settings;
    var fillStyle = getStyle.apply(this, [ctx,fillSettings, width, height]);
    
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
    } else {
      debug("No fill style found in settings %o", settings);
    }
  }
  
  function setStroke(ctx, settings, width, height) {
    var strokeSettings = this.getSettings(settings.strokeStyle, true) || settings;
    var strokeStyle = getStyle.apply(this, [ctx, strokeSettings, width, height]);
    
    ['lineWidth', 'lineCap', 'lineJoin', 'miterLimit'].forEach(function(style) {
      if (strokeSettings.hasOwnProperty(style)) {
        ctx[style] = strokeSettings[style];
      }
    });

    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
    } else {
      ctx.strokeStyle = 'white';
      debug('no stroke style given in settings %o (%o) - defaulting to white', settings, strokeSettings);
    }
  }
  
  function setShadow(ctx, settings, width, height) {
    var shadowSettings = this.getSettings(settings.shadowStyle, true) || settings;
    ['shadowOffsetX', 'shadowOffsetY', 'shadowBlur', 'shadowColor'].forEach(function(style) {
      if (shadowSettings.hasOwnProperty(style)) {
        ctx[style] = shadowSettings[style];
      }
    });
  }
  
  VPAnimEngine.addRenderer({
    name: 'paint',
    version: 1,
    renderer: function paint(source, destination, settings) {
      var ctx = destination.getContext('2d');
      var height = destination.height;
      var width = destination.width;

      ctx.save();
      try {
        setShadow.apply(this, [ctx, settings, width, height]);
        switch (settings.type) {
          case "fill":
            setFill.apply(this, [ctx, settings, width, height]);
            ctx.fill();
            break;
          case "stroke":
            setStroke.apply(this, [ctx, settings, width, height]);
            ctx.stroke();
            break;
          case "stroke-then-fill":
            setStroke.apply(this, [ctx, settings, width, height]);
            ctx.stroke();
            setFill.apply(this, [ctx, settings, width, height]);
            ctx.fill();
            break;
          case "fill-then-stroke":
          default:
            setFill.apply(this, [ctx, settings, width, height]);
            ctx.fill();
            setStroke.apply(this, [ctx, settings, width, height]);
            ctx.stroke();
            break;
        }
      }
      finally {
        ctx.restore();
      }
    }
  });
}());

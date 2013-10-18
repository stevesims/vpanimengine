/*
  VPAnimEngine 'image' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";

  // image renderer will render a source image, or an image in settings, or an image from an array of images in settings
  // if the destination is not set, or is an image, then the renderer will return an image for use in the next pipeline stage
  // if the settings does not contain an image, the source (if loaded) will be used for rendering to destination canvas
  // settings object may also contain "source" and/or "destination" metrics objects
  VPAnimEngine.addRenderer({
    name: 'image',
    version: 3,
    renderer: function image(source, destination, settings) {
      var imgSrc;
      settings = settings || {};
  
      if (Array.isArray(settings.sources) || Array.isArray(settings.images)) {
        if (settings.index === undefined) {
          settings.index = 0;
        }
        if (Array.isArray(settings.images) && settings.images[settings.index]) {
          source = settings.images[settings.index];
        } else {
          imgSrc = settings.sources[settings.index];
        }
      } else if (settings.source) {
        imgSrc = settings.source;
      }
    
      var type = this.getSurfaceType(destination);
    
      if (imgSrc) {
        if (settings.image && (settings.image.getAttribute('src') == imgSrc)) {
          source = settings.image;
        } else if (type !== 'image') {
          source = new Image();
          source.src = imgSrc;
          settings.image = source;
        }
      }
      
      if (!destination) {
        return source;
      }
      
      if (type === 'image') {
        if (imgSrc) {
          destination.src = imgSrc;
        }
        return destination;
      }
      
      var sOffsetX  = (settings.source ? settings.source.x      : 0) || 0;
      var sOffsetY  = (settings.source ? settings.source.y      : 0) || 0;
      var sWidth    = (settings.source ? settings.source.width  : 0) || source.width;
      var sHeight   = (settings.source ? settings.source.height : 0) || source.height;
      
      if (!source.complete || (source.width === 0)) {
        return destination;
      }
      
      var ctx = destination.getContext('2d');
      var xOffset = (settings.destination ? settings.destination.x     : 0) || settings.xOffset || 0;
      var yOffset = (settings.destination ? settings.destination.y     : 0) || settings.yOffset || 0;
      var width   = (settings.destination ? settings.destination.width : 0) || settings.width   || destination.width;
      var height  = (settings.destination ? settings.destination.height: 0) || settings.height  || destination.height;
      
      var scale = 1;
      if (sWidth > width || sHeight > height) {
        if (settings.fit) {
          switch (settings.fit) {
            case 'width':
              scale = width/sWidth;
              break;
            case 'height':
              scale = height/sHeight;
              break;
            default:
              scale = Math.min(width/sWidth, height/sHeight);
          }
        }
      }
  
      ctx.save();
        ctx.translate(width/2, height/2);
  
        ctx.drawImage(source,
          sOffsetX, sOffsetY, sWidth, sHeight,
          0 - (((sWidth/2) - xOffset) * scale), 0 - (((sHeight/2) - yOffset) * scale), sWidth * scale, sHeight * scale
        );  
      ctx.restore();

      return destination;
    }
  });
})();
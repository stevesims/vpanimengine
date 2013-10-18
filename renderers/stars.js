/*
  VPAnimEngine 'stars' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
  "use strict";

  // stars renderer
  // draws a moving 3d-esque starfield
  // stars can be points, or images
  // various settings available...

  function initStars(settings, width, height) {
    if (settings.originX == undefined) {
      settings.originX = width/2;
    }
    if (settings.originY == undefined) {
      settings.originY = height/2;
    }
    settings.stars = new Array();
    for (var i = 0; i < (settings.total || 400); i++) {
      var star = {};
      randomizeStar(star, settings, width, height);
      settings.stars.push(star);
    }
  };

  function randomizeStar(star, settings, width, height) {
    star.x = (Math.random() * width - width * 0.5) * (settings.baseScale || 10);
    star.y = (Math.random() * height - height * 0.5) * (settings.baseScale || 10);
    star.scale = settings.baseScale || 10;
    star.lastX = 0;
    star.lastY = 0;
    if (settings.randomColor) {
      var red = Math.floor(255 - (Math.random() * 128));
      var green = Math.floor(255 - (Math.random() * 128));
      var blue = Math.floor(255 - (Math.random() * 128));
      star.strokeStyle = 'rgb(' + red + ',' + green + ',' + blue + ')';
    }
  };
  
  VPAnimEngine.addRenderer({
    name: 'stars',
    version: 1,
    renderer: function stars(source, destination, settings) {
      var width = destination.width;
      var height = destination.height;

      if (!settings.stars) {
        initStars(settings, width, height);
      }

      var image, imgSrc;
      if (Array.isArray(settings.imageSources)) {
        if (settings.imageIndex === undefined) {
          settings.imageIndex = 0;
        }
        imgSrc = settings.imageSources[settings.imageIndex];
      } else {
        imgSrc = settings.imageSource;
      }
      if (imgSrc) {
        if (settings.image && (settings.image.getAttribute('src') == imgSrc)) {
          image = settings.image;
        } else {
          image = new Image();
          image.src = imgSrc;
          settings.image = image;
        }
        if (image.width === 0) {
          return destination;
        }
      }

      var stars = settings.stars;
      var originX = settings.originX;
      var originY = settings.originY;

      var ctx = destination.getContext('2d');
      ctx.save();
        ctx.globalAlpha = 0.3;

        ctx.save();
          ctx.fillStyle = "black";
          ctx.setTransform(1,0,0,1,0,0);
          ctx.fillRect(0, 0, width, height);
        ctx.restore();

        var star, x, y, lineWidth;
        var speed = settings.speed || 0.1;

        var totalStars = settings.restrictTo || settings.total || 400;

        for (var i = 0; i < totalStars; i++) {
          star = stars[i];
          x = star.x / star.scale;
          y = star.y / star.scale;
          if (star.lastX != 0) {
            if (image) {
              var size = Math.max(Math.sqrt(Math.pow(x - star.lastX, 2) + Math.pow(y - star.lastY, 2)) * (settings.imageScale || 1), (settings.imageMinSize || 1));
              ctx.drawImage(image, x + originX, y + originY, size, (image.height / image.width) * size);
            } else {
              lineWidth = 1 / star.scale * 5 + 1;
              ctx.strokeStyle = star.strokeStyle || settings.color || 'white';
              ctx.lineWidth = lineWidth;
              ctx.beginPath();
              ctx.moveTo(x + originX, y + originY);
              ctx.lineTo(star.lastX + originX, star.lastY + originY);
              ctx.stroke();
            }
          }
          star.lastX = x;
          star.lastY = y;
          star.scale -= speed;
          if (star.scale < speed || star.lastX > width || star.lastY > height) {
            randomizeStar(star, settings, width, height);
          }
        }

      ctx.restore();

      return destination;
    }
  });
})();
/*
  VPAnimEngine 'echo' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";

  // a simple "echo" renderer
  // renderer assumes a black background for the canvas
  // settings object optionally contains:
  // xOffset - offset in pixels in x axis for rendering echo, defaults to 10
  // yOffset - offset in pixels in y axis for rendering echo, defaults to 10
  // reduceX - number of pixels to reduce X size by, defaults to 20
  // reduceY - number of pixels to reduce Y size by, defaults to 20
  VPAnimEngine.addRenderer({
    name: 'echo',
    version: 1,
    renderer: function echo(source, destination, settings) {
      var ctx = destination.getContext('2d');
      var width = destination.width;
      var height = destination.height;
  
      var decay = settings.decay || 0.06;
    
      settings = settings || {};
  
      ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.fillStyle = "rgba(0,0,0," + decay + ")";
        ctx.fillRect(0, 0, width, height);
      ctx.restore();

      ctx.save();
        var xOffset = settings.xOffset;
        if (xOffset === undefined) xOffset = 10;
        var yOffset = settings.yOffset;
        if (yOffset === undefined) yOffset = 10;
        var reduceX = settings.reduceX;
        if (reduceX === undefined) reduceX = 20;
        var reduceY = settings.reduceY;
        if (reduceY === undefined) reduceY = 20;

        ctx.drawImage(source, 0, 0, width, height, xOffset, yOffset, width - reduceX, height - reduceY);

        // fill in the edges that have been exposed
        ctx.fillStyle = "black";
        ctx.fillRect(0,0,width,yOffset);
        ctx.fillRect(0,0,xOffset,height);
        ctx.fillRect(width + xOffset - reduceX, 0, reduceX - xOffset, height);
        ctx.fillRect(0, height + yOffset - reduceY, width, reduceY - yOffset);
      ctx.restore();

      return destination;
    }
  });
})();
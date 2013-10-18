/*
  VPAnimEngine 'treevu' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";
  
  // 'tvpixels' renderer copies source canvas context to destination
  // sequentially passing through only the red, green, or blue colors for each column
  // resultant image looks like a TV screen when you're up really close
  // no settings supported

  VPAnimEngine.addRenderer({
    name: 'tvpixels',
    version: 1,
    renderer: function tvpixels(source, destination, settings) {
      var sCtx = source.getContext('2d');
      var ctx = destination.getContext('2d');
      var width = source.width;
      var height = source.height;
  
      var imgDat = sCtx.getImageData(0,0,width, height);
      var imgData = imgDat.data;
  
      var offset, rgb = 0;
  
      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          //rgb = Math.floor((x % 6) / 2);
          rgb = x % 3;
          offset = (y * width * 4) + (x * 4);
          switch (rgb) {
            case 0:
              imgData[offset + 1] = 0;
              imgData[offset + 2] = 0;
              break;
            case 1:
              imgData[offset] = 0;
              imgData[offset + 2] = 0;
              break;
            case 2:
              imgData[offset] = 0;
              imgData[offset + 1] = 0;
              break;
          }
        }
      }
  
      ctx.putImageData(imgDat, 0, 0);
  
      return destination;
    }
  });
})();
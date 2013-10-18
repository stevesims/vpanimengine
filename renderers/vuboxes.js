/*
  VPAnimEngine 'vuboxes' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
  "use strict";

  // 'vuboxes' renderer
  // will render box-based VU display, similar to what you'd see on an 80s stereo
  // needs a source of VU data, such as the itvudata action module
  
  VPAnimEngine.addRenderer({
    name: 'vuboxes',
    version: 2,
    renderer: function vuboxes(source, destination, settings, pipeline) {
      var ctx = destination.getContext('2d');
      var width = settings.width || destination.width;
      var height = settings.height || destination.height;
    
      var vuDataPath = settings.vuPath || ['vuData'];
      var vuData = this.getSettings(vuDataPath);
      var channels = vuData.channels;
    
      // default to stacks of 10 boxes
      var stackHeight = settings.stackHeight || 10;
      var verticalGap = VPUtils.isNumber(settings.verticalGap) ? settings.verticalGap : 5;
      var horizontalGap = VPUtils.isNumber(settings.horizontalGap) ? settings.horizontalGap : 5;
      var boxHeight = (height / stackHeight) - (verticalGap * ((stackHeight - 1) / stackHeight));
      var boxWidth = (width / channels) - (horizontalGap * ((channels - 1) / channels));
    
      var cornerRadius = settings.cornerRadius;
    
      if (!settings.stackPaintStyles) {
        ctx.beginPath();
      }
    
      // Go through values making boxes
      vuData.values.forEach(function(data, index) {
        var boxCount = Math.round((data / 255) * stackHeight);
        var xOffset = (boxWidth + horizontalGap) * index;
        for (var i = 0; i < boxCount; i++) {
          var yOffset = (boxHeight + verticalGap) * i;
          if (settings.stackPaintStyles) {
            ctx.beginPath();
          }
          if (!cornerRadius) {
            ctx.rect(xOffset, height - yOffset, boxWidth, boxHeight);
          } else {
            ctx.moveTo(xOffset + cornerRadius, height - yOffset);
            ctx.arc(xOffset + cornerRadius, height - (yOffset + cornerRadius), cornerRadius, Math.PI * 0.5, Math.PI);
            ctx.lineTo(xOffset, height - (yOffset + boxHeight - cornerRadius));
            ctx.arc(xOffset + cornerRadius, height - (yOffset + boxHeight - cornerRadius), cornerRadius, Math.PI, Math.PI * 1.5);
            ctx.lineTo(xOffset + boxWidth - cornerRadius, height - (yOffset + boxHeight));
            ctx.arc(xOffset + boxWidth - cornerRadius, height - (yOffset + boxHeight - cornerRadius), cornerRadius, Math.PI * 1.5, 0);
            ctx.lineTo(xOffset + boxWidth, height - (yOffset + cornerRadius));
            ctx.arc(xOffset + boxWidth - cornerRadius, height - (yOffset + cornerRadius), cornerRadius, 0, Math.PI * 0.5);
            ctx.closePath();
          }
          if (settings.stackPaintStyles) {
            this.doRender("paint", source, destination, settings.stackPaintStyles[i], pipeline);
          }
        }
      }, this);
    
      return destination;
    }
  });
  
}());
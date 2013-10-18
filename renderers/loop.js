/*
  VPAnimEngine 'loop' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";

  // a 'loop' renderer, which doesn't actually render anything but adds support for looping stages
  // the simple loop type has a "count" value provided in the stage object
  // "count" type loops can optionally store the loop counter at a path indicated by stage.countPath
  // otherwise loops are "while" loops governed by a condition on the stage or settings object
  // such "while" loops are limited by stage.maxLoop or settings.maxLoop, or 100 if neither of the other values are set
  // as with other VPAnimEngine stage lists, loops can be aborted if stage processing returns a "null" value
  VPAnimEngine.addRenderer({
    name: 'loop',
    version: 2,
    renderer: function loop(source, destination, settings, pipeline, stage) {
      var result, maxLoop = stage.maxLoop || settings.maxLoop || 100;
      if (stage.count) {
        // simple loop type
        for (var i = 0; (i < stage.count) && (result !== null); i++) {
          if (stage.countPath) {
            this.adjustSettings(stage.countPath, i);
          }
          result = this.processStages(stage.stages, pipeline, source, destination);
        }
      } else if (stage.condition) {
        while (this.checkCondition(stage) && (result !== null) && maxLoop) {
          result = this.processStages(stage.stages, pipeline, source, destination);
          maxLoop--;
        }
      } else if (settings.condition) {
        while (this.checkCondition(settings) && (result !== null) && maxLoop) {
          result = this.processStages(stage.stages, pipeline, source, destination);
          maxLoop--;
        }
      }
      return result;
    }
  });
})();
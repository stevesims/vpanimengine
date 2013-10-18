/*
  VPAnimEngine 'fps' action module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
  "use strict";

  var debug = VPAnimEngine.debug;
  
  function calcFPS(settings, bpm, fpb) {
    if (!settings.steps) {
      debug("Warning: calcFPS won't work for non-step-based animations");
      return 30;
    }
    if (settings.steps % fpb != 0) {
      debug("Warning: calcFPS has detected settings where frames-per-beat is not a multiple of animation steps");
    }

    return 1 / ((60/bpm) / fpb);
  };

  // setFPS is a utility action for pipelines used in music visualizers
  // given a "bpm" value (Beats Per Minute) and "fpb" value (Frames Per Beat) it sets the FPS for a pipeline's settings object
  // used with steps-based renderers, such as "geometrics"
  VPAnimEngine.addAction({
    name: 'setFPS',
    version: 1,
    action: function setFPS(pipeSettings, animSettings, bpm, fpb) {
      var settings = this.getSettings(pipeSettings);
      settings.fps = calcFPS(this.getSettings(animSettings), bpm, fpb);
    }
  });
})();
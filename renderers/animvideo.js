/*
  VPAnimEngine 'animvideo' renderer collection

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";

  // The 'animvideo' renderer collection is intended for frame-by-frame animation from separate image files
  // developed to work around iTunes' restriction of not allowing the playback of HTML5 video whilst also playing music
  // it's intended to be used alongside the 'image' renderer

  // set_sources startup renderer
  // setup a sources array for use with image renderer
  VPAnimEngine.addRenderer({
    name: 'set_sources', 
    version: 1,
    renderer: function set_sources(source, destination, settings) {
      if (!settings.sources) {
        if (!settings.filenamePattern || !settings.frames) {
          throw new TypeError("Bad settings data for set_sources renderer");
        }
        settings.preloaded = false;
        settings.sources = [];
        var startFrame = settings.startFrame !== undefined ? settings.startFrame : 1;
        for (var frame = startFrame; frame <= (settings.frames + startFrame - 1); frame++) {
          settings.sources.push(sprintf(settings.filenamePattern, frame));
        }
      }
      settings.animStartTime = Date.now();
      settings.index = 0;
    }
  });

  VPAnimEngine.addRenderer({
    name: 'preload_frames',
    version: 1,
    renderer: function preload_frames(source, destination, settings) {
      if (settings.sources && !settings.preloaded) {
        settings.sources.forEach(function(source) {
          new Image().src = source;
        });
        settings.preloaded = true;
      }
    }
  });

  VPAnimEngine.addRenderer({
    name: 'cache_frames',
    version: 1,
    renderer: function cache_frames(source, destination, settings) {
      if (settings.sources) {
        settings.images = [];
        settings.sources.forEach(function(src) {
          var newImage = new Image();
          newImage.src = src;
          settings.images.push(newImage);
        });
      }
    },
    dependencies: [
      { renderer: 'image', version: 2 }
    ]
  });

  VPAnimEngine.addRenderer({
    name: 'uncache_frames',
    version: 1,
    renderer: function uncache_frames(source, destination, settings) {
      if (settings.images) {
        settings.images = [];
      }
    }
  });

  // set_frame - sets the frame index
  VPAnimEngine.addRenderer({
    name: 'set_frame',
    version: 1,
    renderer: function set_frame(source, destination, settings, pipeline) {
      if (!settings.animStartTime || !settings.frames) {
        throw new TypeError("Bad settings data for set_frame renderer");
      }
  
      var elapsed = (Date.now() - settings.animStartTime) + (settings.temporalOffset || 0);
      var pipeSettings = this.getSettings(pipeline.settings);
      var fps = settings.fps || pipeSettings.fps || 25;
      var frameLength = 1000 / fps;
  
      settings.index = Math.round((elapsed / frameLength) % (settings.frames - 1));
  
      return source;
    },
    dependencies: [
      { renderer: 'image', version: 1 }
    ]
  });
})();
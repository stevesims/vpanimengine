/*
  VPAnimEngine 'class' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";

  // 'class' renderer adjusts class values of DOM elements
  // NB this may require a classList polyfill for older browsers
  // settings may have "add", "remove" and/or "toggle" values
  // all of which can either be a string or an array of strings
  VPAnimEngine.addRenderer({
    name: 'class',
    version: 1,
    renderer: function renderClass(source, destination, settings) {
      var els = [];
      if (settings.selector) {
        var selEls = destination.querySelectorAll(settings.selector);
        for (var i = 0; i < selEls.length; i++) {
          els.push(selEls[i]);
        }
      } else {
        els.push(destination);
      }

      if (els.length === 0) {
        debug("class renderer: Error - selector not found %o", settings);
        return;
      }

      for (var index = 0; index < els.length; index++) {
        var el = els[index];
        if (settings.remove) {
          if (Array.isArray(settings.remove)) {
            settings.remove.forEach(function(token) { el.classList.remove(token); });
          } else {
            el.classList.remove(settings.remove);
          }
        }
        if (settings.toggle) {
          if (Array.isArray(settings.toggle)) {
            settings.toggle.forEach(function(token) { el.classList.toggle(token); });
          } else {
            el.classList.toggle(settings.toggle);
          }
        }
        if (settings.add) {
          if (Array.isArray(settings.add)) {
            settings.add.forEach(function(token) { el.classList.add(token); });
          } else {
            el.classList.add(settings.add);
          }
        }
      }

      return destination;
    }
  });
})();
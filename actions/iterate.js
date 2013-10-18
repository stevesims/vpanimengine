/*
  VPAnimEngine 'iterate' action module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";

  var debug = VPAnimEngine.debug;
  
  // Iterate action iterates a value at a given settings path, using params provided
  // params object is optional and can include the following slots:
  // by: <value>   - amount to iterate by, defaults to 1
  // max: <value>  - maximum value to iterate up to, or loop around to
  // min: <value>  - minimum value to iterate down to, or loop around to
  // callbacks: <callback stages list or settings path>  - callbacks to make when looping
  VPAnimEngine.addAction({
    name: 'iterate',
    version: 1,
    action: function iterate(path, params) {
      var value = this.getSettings(path, true);
      if (!VPUtils.isNumber(value)) {
        debug("Error: iterate action couldn't find settings path %o, params %o", path, params);
        return;
      }
      if (VPUtils.isString(params) || Array.isArray(params)) {
        params = this.getSettings(params);
      }

      params = params || {};
      var by = params.by || 1;
      value = value + by;

      if (VPUtils.isNumber(params.max) && (value > params.max)) {
        this.adjustSettings(path, params.min || 0);
        if (params.callbacks) {
          this.processStages(params.callbacks);
        }
      } else {
        if (VPUtils.isNumber(params.min) && (value < params.min)) {
          if (by < 0) {
            this.adjustSettings(path, VPUtils.isNumber(params.max) ? params.max : params.min);
            if (params.callbacks) {
              this.processStages(params.callbacks);
            }
          } else {
            this.adjustSettings(path, params.min);
          }
        } else {
          this.adjustSettings(path, value);
        }
      }
    }
  });
})();

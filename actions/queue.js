/*
  VPAnimEngine 'queue' action module

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
  
  // basic queue management
  // queues are arrays that get additional "average" and "weightedAverage" properties added to them
  // plus their length is automatically limited, when adding values via the queueAdd or queueAddCopy actions
  // an example use would be in a visualizer to smooth out VU level values
  VPAnimEngine.addActions([
    {
      name: 'makeQueue',
      version: 1,
      action: function makeQueue(path, queueSettings) {
        if (!Array.isArray(path)) {
          path = [path];
        }
        var leaf = path[path.length - 1];
        var settings = this.getSettings(path, false, true);
        if (VPUtils.isString(queueSettings) || Array.isArray(queueSettings)) {
          queueSettings = this.getSettings(queueSettings);
        }
        queueSettings = queueSettings || {};

        var newQueue = [0];
        newQueue.queueLimit = queueSettings.limit || 20;
        newQueue.queueWeights = queueSettings.weights || [];
        Object.defineProperty(newQueue, 'average', {
          get: function() {
            var total = this.reduce(function(old, value, index, queue) { 
              return old + value;
            }, 0);
            return total / this.length;
          }
        });
        Object.defineProperty(newQueue, 'weightedAverage', {
          get: function() {
            var totalWeight = 0;
            var total = this.reduce(function(old, value, index, queue) { 
              var weight;
              weight = queue.queueWeights[index] || 1;
              totalWeight += weight;
              return old + (value * weight);
            }, 0);
            return total / totalWeight;
          }
        });

        settings[leaf] = newQueue;
      }
    },

    {
      name: 'queueAdd',
      version: 1,
      action: function queueAdd(path, value) {
        var queue = this.getSettings(path, true);
        if (!queue) {
          debug("queue at path %o does not exist", path);
        } else {
          queue.unshift(value);
          while (queue.length > (queue.queueLimit || 20)) {
            queue.pop();
          }
        }
      }
    },

    {
      name: 'queueAddCopy',
      version: 1,
      action: function queueAddCopy(path, settingPath) {
        this.queueAdd(path, this.getSettings(settingPath));
      }
    }
  ]);
})();

/*
  VPAnimEngine 'itunes-vu' action module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
  "use strict";
  
  /*
  NB this module must be run inside an iTunes environment
  i.e. it is for use inside an iTunes LP, or an iTunes Extra
  */

  if (!window.DEBUG && !window.iTunes) {
    throw new TypeError("itunesvudata action module won't register without iTunes");
  }
  
  function linch(inLogch, nLogChannels) {
    var dec = ( 3.0 / nLogChannels ) * inLogch;

    return (( 20 * ( Math.pow(10, dec) )) - 20 ) / 78.047;
  };

  var minLogTab = 1;
  var maxLogTab = 32

  function buildLogTables() {
    var logtabs = new Array();
    for( var n = minLogTab; n < maxLogTab; n++ ) {
      var prev = 0;
      logtabs[n - minLogTab] = new Array();
      for ( var i = 0; i < n; i++ ) {
        var lin = linch( i + 1, n );
        var diff = lin - prev;
        prev = lin;
        var m = Math.round(diff);
        if ( m < 1 ) {
          m = 1;
        }
        logtabs[ n - minLogTab ][i] = m;
      }
    }
    return logtabs;
  };
  
  VPAnimEngine.addInitialiser('itunes-vu', function() {
    this.setupVU(['vuData']);
  });

  // setupVU action will set up a settings object for storing VU data
  // by default the settings path ['vuData'] will be used
  // this action may be called in a pipeline's initStages
  // or it may be omitted if default settings are being used
  VPAnimEngine.addAction({
    name: 'setupVU',
    version: 2,
    action: function(vuPath, params) {
      this.adjustSettings(
        vuPath || ['vuData'],
        {
          logtabs: buildLogTables(),
          lastUpdated: 0,
          channels: 10,
          values: [],
          normalized: false,
          scale: 1
        }
      );
      
      var vuData = this.getSettings(vuPath || ['vuData']);
      
      if (VPUtils.isObject(params)) {
        VPUtils.copyProperties(vuData, params);
      }
      
      vuData.values[vuData.channels] = 0;
    }
  });
  
  // updateVU action updates a corresponding VU data object
  // this will typically be called as a stage in an animation pipeline that's rendering a VU
  VPAnimEngine.addAction({
    name: 'updateVU',
    version: 2,
    action: function updateVU(vuPath) {
      var vuData = this.getSettings(vuPath || ['vuData']);
      if (vuData.lastUpdated > (Date.now() - 16)) { return; }

      vuData.lastUpdated = Date.now();

      var k = 1;
      var spectrumArray;
      var total = 0;
      var max = 0;

      try {
        spectrumArray = window.iTunes.waveform.waveformData;
        if (!spectrumArray) throw 'wibble';
      } catch(err) {
        for (var i = 0; i <= vuData.channels; i++) {
          vuData.values[i] = 0;
        }
        vuData.level = 0;
        vuData.max = 0;
        return;
      }

      if (!spectrumArray) return;

      for (var i = 0; i < vuData.channels; i++) {
        var slotsperbin = vuData.logtabs[vuData.channels - minLogTab][i];
        var leftvalue = 0;

        var n = slotsperbin;
        while( n-- ) {
          leftvalue += spectrumArray[0][k++];
        }

        leftvalue = (leftvalue / slotsperbin) || 0;
        if (vuData.normalized) {
          leftvalue = leftvalue/255;
        }
        leftvalue = leftvalue * vuData.scale;
        total += leftvalue;
        max = Math.max(max, leftvalue);
        if (vuData.maxValue) {
          leftvalue = Math.min(leftvalue, vuData.maxValue);
        }
        vuData.values[i] = vuData.normalized ? leftvalue : Math.floor(leftvalue);
      }

      vuData.level = vuData.normalized ? (total / vuData.channels) : Math.floor(total / vuData.channels);
      if (vuData.maxValue) {
        vuData.level = Math.min(vuData.level, vuData.maxValue);
      }
      vuData.max = vuData.normalized ? max : Math.floor(max);
      if (vuData.maxValue) {
        vuData.max = Math.max(vuData.max, vuData.maxValue);
      }
    }
  });
})();
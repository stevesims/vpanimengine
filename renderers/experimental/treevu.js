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

  // a faux-3D christmas tree
  // developed for an iTunes LP project, but never released
  
  // provided as-is - current version really needs to be run inside iTunes with support of the the itvudata action module

  var debug = VPAnimEngine.debug;
  var kPI2 = Math.PI * 2;

  function createLeafCanvas(shade, settings) {
    var canvas = document.createElement('canvas');
    canvas.width = settings.leafSize;
    canvas.height = settings.leafSize;
    var ctx = canvas.getContext('2d');

    for (var i = 0; i < settings.leafStrokes; i++) {
      var angle = Math.random() * kPI2;

      // draw radial strokes
      var x = Math.cos(angle);
      var y = (Math.random() * 2) - 1;
      var dist = x*x + y*y;
      //var y = Math.sin(angle);
      if (dist < 1) {
        var strokeString;
        if (settings.silver) {
          var col = Math.round(127 + (shade * 12));
          strokeString = "rgba(" + col + "," + col + "," + col + ",0.1)";
        } else {
          strokeString = "rgba(" + Math.max(0, Math.round((shade * 4) + (Math.random() * 10) - 5)) + "," + Math.max(0, Math.round((Math.random() * 10) - 5 + ((shade + 1) * 17))) + "," + Math.round(shade * 4) + ",0.1)";
        }
        ctx.strokeStyle = strokeString;
        ctx.beginPath();
        var size = settings.halfLeafSize / 2;
        var size2 = settings.halfLeafSize;
        ctx.moveTo(settings.halfLeafSize + (x * size), settings.halfLeafSize + (y * size));
        ctx.lineTo(settings.halfLeafSize + (x * size2), settings.halfLeafSize + (y * size2));
        ctx.stroke();
      }
    }

    return canvas;
  }
  
  var vectorSize = 4;
  var jitterSize = vectorSize * 2;
  var stepSize = vectorSize * 4;
  
  function createBranches(settings) {
    for (var num = 0; num < settings.branchCount; num++) {
      var branchLength = num + (Math.sqrt(num) * 30);
      var branchAngle = num % kPI2;
      var y = branchLength * 0.7;
      var vecX = Math.sin(branchAngle) * vectorSize;
      var vecZ = Math.cos(branchAngle) * vectorSize;
      var x = 0;
      var z = 0;
      //debug("Branch %o, will have %o leaves", num, branchLength / stepSize)
      for (var pos = 1; pos < branchLength; pos = pos + stepSize) {
        x = x + vecX + (Math.random() * jitterSize) - vectorSize;
        y = y + (Math.random() * jitterSize) - vectorSize;
        z = z + vecZ + (Math.random() * jitterSize) - vectorSize;
        var leafType;
        //if (num > 20 && (pos + stepSize >= branchLength) && (vecZ > -0.1) && (Math.random() > 0.9)) {
        if (num > 10 && (pos + stepSize >= branchLength) && ((num % 4) == 0) && vecZ > -0.15) {
          leafType = settings.leafTypes;// + (Math.round(Math.random() * 4));
        } else {
          leafType = Math.round((settings.leafTypes - 1) - ((branchLength - pos) / branchLength) * 9); /*Math.random() * 9;*/
          leafType = Math.min(settings.leafTypes - 1, Math.max(0, leafType + (Math.round(Math.random() * 2) - 1)));
        }
        settings.branches.push([x, y >> 0, z, leafType>>0]);
      }
    }
    
    // now - need to find list of leaves above the lights
    settings.lights = settings.branches.filter(function(el) { return el[3] >= settings.leafTypes });
    settings.branches = settings.branches.filter(function(el) { return el[3] < settings.leafTypes });
    settings.lights.sort(function(a,b) {
      return b[1] - a[1];
    })
    settings.lights.forEach(function(light, index) {
      //light[3] = light[3] - leafTypes;
      light[3] = index % 5;
    });
    
    
    // find branch leaves in front of the lights
    settings.frontBranches = settings.branches.filter(function(el) {
      var distances = settings.lights.map(function(light) {
        var x = el[0] - light[0], 
            y = el[1] - light[1],
            z = el[2] - light[2];
        if (z < 0) {
          return 9999;
        }
        return x*x + y*y;  //  + z*z
      });
      
      var lowest = Math.min.apply(undefined, distances);
      
      return Math.sqrt(lowest) < settings.halfLeafSize;
    });
    
    settings.branches = settings.branches.filter(function(el) {
      return settings.frontBranches.indexOf(el) === -1;
    })
  }


  function drawTree(ctx, settings, branchList, fainter) {
    var renderAngle = settings.renderAngle || 0;
    function sortFunc(a, b) {
      return(a[2]-b[2])*Math.cos(renderAngle) - (a[0]-b[0])*Math.sin(renderAngle);
    }
    ctx.save();
    if (fainter) {
      ctx.globalOpacity = 0.7;
    }
    branchList.sort(sortFunc);
    // loop through elements list until it hits an undefined one
    var cosAng = Math.cos(renderAngle);
    var sinAng = Math.sin(renderAngle);
    var leaf;
    var halfWidth = ctx.canvas.width / 2;
    for(var i=0;leaf=branchList[i++];){
      if (leaf[3] < 10) {
        ctx.drawImage(settings.leaves[leaf[3]], ((halfWidth+leaf[0]*cosAng) - (leaf[2]*sinAng))>>0, leaf[1])
      } else {
        debug("Light found %o", leaf);
      }
    }
    ctx.restore();
  }



  VPAnimEngine.addAction({
    name: 'setupTree',
    version: 1,
    action: function setupTree(settings) {
      this.adjustSettings(settings, {});
      settings = this.getSettings(settings);
      settings.leaves = [];
      settings.leafSize = settings.leafSize || 64;
      settings.halfLeafSize = settings.leafSize / 2;
      settings.leafTypes = settings.leafTypes || 10;
      settings.leafStrokes = settings.leafStrokes || 500;
      settings.branches = [];
      settings.branchCount = settings.branchCount || 300;
      
      settings.lightColors = settings.lightColors || ["red", "orange", "yellow", "magenta", "cyan"];
      
      for (var i = 0; i < settings.leafTypes; i++) {
        settings.leaves.push(createLeafCanvas(i, settings));
      }
      
      createBranches(settings);
      
      this.adjustSettings(['vuData', 'channels'], settings.lights.length);
    }
  });
  
  VPAnimEngine.addRenderer({
    name: 'drawTreeBackground',
    version: 1,
    renderer: function drawTreeBackground(source, destination, settings) {
      var ctx = destination.getContext('2d');
      drawTree(ctx, settings, settings.branches);
    }
  });
  
  VPAnimEngine.addRenderer({
    name: 'drawTreeForeground',
    version: 1,
    renderer: function drawTreeForeground(source, destination, settings) {
      var ctx = destination.getContext('2d');
      drawTree(ctx, settings, settings.frontBranches, true);
    }
  });
  
  VPAnimEngine.addRenderer({
    name: 'vulights',
    version: 1,
    renderer: function vulights(source, destination, settings, pipeline) {
      var ctx = destination.getContext('2d');
      var vuDataPath = settings.vuPath || ['vuData'];
      var vuData = this.getSettings(vuDataPath);
      var displayAngle = settings.displayAngle || 0;
      var halfLeafSize = settings.halfLeafSize;
      var halfWidth = destination.width / 2;
      ctx.save();
        ctx.fillStyle = "black";
        ctx.shadowOffsetY = -800;
        ctx.shadowBlur = settings.halfLeafSize;
        //ctx.globalAlpha = 0.7;
        var cosAng = Math.cos(displayAngle);
        var sinAng = Math.sin(displayAngle);
        for (var i = 0; i < settings.lights.length; i++) {
          ctx.globalAlpha = 0.2 + (0.8 * (vuData.values[i] / 255));
          var light = settings.lights[i];
          ctx.shadowColor = settings.lightColors[light[3]];
          ctx.beginPath();
            ctx.arc(((halfWidth+light[0]*cosAng) - (light[2]*sinAng) + halfLeafSize)>>0, light[1] + 800 + halfLeafSize, halfLeafSize / 2, 0, kPI2, true);
            ctx.fill();
          ctx.closePath();
        }
      ctx.restore();
    },
    dependencies: [
      { action: 'updateVU', version: 2 }
    ]
  });
}());

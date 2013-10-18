/*
  VPAnimEngine 'path' renderer collection

  (c) 2012-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";
  
  // the "path" renderer collection are basically all simple wrappers around 2d canvas calls
  // they are all concerned with path manipulation in a destination canvas
  // settings objects are straightforward - see code below for details
  
  var kPI2 = Math.PI * 2;
  
  VPAnimEngine.addRenderer({
    name: 'beginPath',
    version: 1,
    renderer: function beginPath(source, destination, settings) {
      var ctx = destination.getContext('2d');
      ctx.beginPath();
      return destination;
    }
  });

  VPAnimEngine.addRenderer({
    name: 'closePath',
    version: 1,
    renderer: function closePath(source, destination, settings) {
      var ctx = destination.getContext('2d');
      ctx.closePath();
      return destination;
    }
  });
  
  VPAnimEngine.addRenderer({
    name: 'moveTo',
    version: 1,
    renderer: function moveTo(source, destination, settings) {
      var ctx = destination.getContext('2d');
      ctx.moveTo(settings.x, settings.y);
      return destination;
    }
  });

  VPAnimEngine.addRenderer({
    name: 'lineTo',
    version: 1,
    renderer: function lineTo(source, destination, settings) {
      var ctx = destination.getContext('2d');
      ctx.lineTo(settings.x, settings.y);
      return destination;
    }
  });
  
  VPAnimEngine.addRenderer({
    name: 'rect',
    version: 1,
    renderer: function rect(source, destination, settings) {
      var ctx = destination.getContext('2d');
      ctx.rect(settings.x, settings.y, settings.width, settings.height);
      return destination;
    }
  });
  
  VPAnimEngine.addRenderer({
    name: 'arc',
    version: 1,
    renderer: function arc(source, destination, settings) {
      var ctx = destination.getContext('2d');
      ctx.arc(settings.x, settings.y, settings.radius, settings.startAngle, settings.endAngle, settings.anticlockwise);
      return destination;
    }
  });

  VPAnimEngine.addRenderer({
    name: 'arcTo',
    version: 1,
    renderer: function arcTo(source, destination, settings) {
      var ctx = destination.getContext('2d');
      var destination = settings.destination || {};
      destination.x = destination.x || 0;
      destination.y = destination.y || 0;
      ctx.arcTo(settings.x, settings.y, destination.x, destination.y, settings.radius);
      return destination;
    }
  });

  VPAnimEngine.addRenderer({
    name: 'circle',
    version: 1,
    renderer: function circle(source, destination, settings) {
      var ctx = destination.getContext('2d');
      ctx.arc(settings.x, settings.y, settings.radius, 0, kPI2, settings.anticlockwise);
      return destination;
    }
  });
  
  VPAnimEngine.addRenderer({
    name: 'quadraticCurveTo',
    version: 1,
    renderer: function quadraticCurveTo(source, destination, settings) {
      var ctx = destination.getContext('2d');
      ctx.quadraticCurveTo(settings.cpx, settings.cpy, settings.x, settings.y);
      return destination;
    }
  });

  VPAnimEngine.addRenderer({
    name: 'bezierCurveTo',
    version: 1,
    renderer: function bezierCurveTo(source, destination, settings) {
      var ctx = destination.getContext('2d');
      ctx.bezierCurveTo(settings.cp1x, settings.cp1y, settings.cp2x, settings.cp2y, settings.x, settings.y);
      return destination;
    }
  });
  
}());
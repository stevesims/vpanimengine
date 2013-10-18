/* experimental bitmapeffects renderer */
/* requires BitmapData.js  http://peternitsch.net/bitmapdata.js/ */

(function() {
  "use strict";

  var brightness = [
    2, 0, 0, 0, 0,
    0, 2, 0, 0, 0,
    0, 0, 2, 0, 0,
    0, 0, 0, 1, 0
  ];
  var brightnessFilter = new ColorMatrixFilter(brightness);
  var zeroPoint = new Point();

  VPAnimEngine.addRenderer({
    name: 'brighten',
    version: 1,
    renderer: function brighten(source, destination, settings) {
      var imgData = new BitmapData(source.width, source.height);
      var ctx = destination.getContext('2d');
      imgData.draw(source);
      imgData.applyFilter(imgData, imgData.rect, zeroPoint, brightnessFilter);
      ctx.putImageData(imgData.data, 0, 0);
      return destination;
    }
  });
}());

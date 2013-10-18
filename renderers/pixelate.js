/*
  VPAnimEngine 'pixelate' renderer
  With thanks to David DeSandro for permission to adapt Close Pixelate
  http://desandro.com/resources/close-pixelate/
*/

(function () {
  "use strict";
  
  var kPI2 = Math.PI * 2;
  var kPI1_4 = Math.PI / 4;

  VPAnimEngine.addRenderer({
    name: 'pixelate',
    version: 1,
    renderer: function pixelate(source, destination, settings) {
      var sCtx = source.getContext('2d');
      var ctx = destination.getContext('2d');
      var w = destination.width;
      var h = destination.height;

      var imgData = sCtx.getImageData(0, 0, w, h).data;
  
      var renderOptions = settings.renderOptions;
  
      for (var i=0, len = renderOptions.length; i < len; i++) {
        var opts = this.getSettings(renderOptions[i], true) || renderOptions[i];
    
        var res = opts.resolution,
            // option defaults
            size = opts.size || res,
            alpha = opts.alpha || 1,
            offset = opts.offset || 0,
            offsetX = 0, 
            offsetY = 0,
            cols = w / res + 1,
            rows = h / res + 1,
            halfSize = size / 2,
            diamondSize = size / Math.SQRT2,
            halfDiamondSize = diamondSize / 2;

        if ( VPUtils.isObject(offset) ){ 
          offsetX = offset.x || 0;
          offsetY = offset.y || 0;
        } else if ( Array.isArray(offset) ){
          offsetX = offset[0] || 0;
          offsetY = offset[1] || 0;
        } else {
          offsetX = offsetY = offset;
        }

        for ( var row = 0; row < rows; row++ ) {
          var y = ( row - 0.5 ) * res + offsetY,
            // normalize y so shapes around edges get color
            pixelY = Math.max( Math.min( y, h-1), 0);

          for ( var col = 0; col < cols; col++ ) {
            var x = ( col - 0.5 ) * res + offsetX,
                // normalize y so shapes around edges get color
                pixelX = Math.max( Math.min( x, w-1), 0),
                pixelIndex = ( Math.floor(pixelX) + Math.floor(pixelY) * w ) * 4,
                red = imgData[ pixelIndex + 0 ],
                green = imgData[ pixelIndex + 1 ],
                blue = imgData[ pixelIndex + 2 ],
                newAlpha = alpha * (imgData[ pixelIndex + 3 ] / 255);
            
            if (newAlpha != 0) {
              ctx.fillStyle = 'rgba(' + red +','+ green +','+ blue +','+ newAlpha + ')';

              switch ( opts.shape ) {
                case 'circle' :
                  ctx.beginPath();
                    ctx.arc ( x, y, halfSize, 0, kPI2, true );
                    ctx.fill();
                  ctx.closePath();
                  break;
                case 'diamond' :
                  ctx.save();
                    ctx.translate( x, y );
                    ctx.rotate( kPI1_4 );
                    ctx.fillRect( -halfDiamondSize, -halfDiamondSize, diamondSize, diamondSize );
                  ctx.restore();
                  break;
                default :
                  // square
                  ctx.fillRect( x - halfSize, y - halfSize, size, size );
              } // switch
            }
          } // col
        } // row
      } // option
  
      return destination;
    }
  });
}());

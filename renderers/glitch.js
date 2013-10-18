/*
  VPAnimEngine 'getSetting' renderer module

  An adaptation of "smackmyglitchupjs" into a VPAnimEngine renderer
  https://github.com/mutaphysis/smackmyglitchupjs
*/

(function () {
  "use strict";
  var debug = VPAnimEngine.debug;
  
  var base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var base64Map = base64Chars.split("");
  var reverseBase64Map = {}; base64Map.forEach(function(val, key) { reverseBase64Map[val] = key} );
  
  function detectJpegHeaderSize(data) {
      var jpgHeaderLength = 417;
      for (var i = 0, l = data.length; i < l; i++) {
          if (data[i] == 0xFF && data[i+1] == 0xDA) {
              jpgHeaderLength = i + 2; return jpgHeaderLength;
          }
      }
      return jpgHeaderLength;
  }
  
  // base64 is 2^6, byte is 2^8, every 4 base64 values create three bytes
  function base64ToByteArray(str) {
      var result = [], digitNum, cur, prev;
      for (var i = 23, l = str.length; i < l; i++) {
          cur = reverseBase64Map[str.charAt(i)];
          digitNum = (i-23) % 4;
          switch(digitNum){
              //case 0: first digit - do nothing, not enough info to work with
              case 1: //second digit
                  result.push(prev << 2 | cur >> 4);
                  break;
              case 2: //third digit
                  result.push((prev & 0x0f) << 4 | cur >> 2);
                  break;
              case 3: //fourth digit
                  result.push((prev & 3) << 6 | cur);
                  break;
          }
          prev = cur;
      }
      return result;
  }
  
  function byteArrayToBase64(arr) {
     var result = ["data:image/jpeg;base64,"], byteNum, cur, prev;
      for (var i = 0, l = arr.length; i < l; i++) {
          cur = arr[i];
          byteNum = i % 3;
          switch (byteNum) {
              case 0: //first byte
                  result.push(base64Map[cur >> 2]);
                  break;
              case 1: //second byte
                  result.push(base64Map[(prev & 3) << 4 | (cur >> 4)]);
                  break;
              case 2: //third byte
                  result.push(base64Map[(prev & 0x0f) << 2 | (cur >> 6)]);
                  result.push(base64Map[cur & 0x3f]);
                  break;
          }
          prev = cur;
      }
      if (byteNum == 0) {
          result.push(base64Map[(prev & 3) << 4]);
          result.push("==");
      } else if (byteNum == 1) {
          result.push(base64Map[(prev & 0x0f) << 2]);
          result.push("=");
      }
      return result.join("");
  }
  
  function glitchJpegBytes(strArr, jpgHeaderLength) {
      var rnd = Math.floor(jpgHeaderLength + Math.random() * (strArr.length - jpgHeaderLength - 4));
      strArr[rnd] = Math.floor(Math.random() * 256);
  }
  
  

  // makeJPGDataArray renderer takes a source canvas and puts data into a settings object
  VPAnimEngine.addRenderer({
    name: 'makeJPGDataArray',
    version: 1,
    renderer: function makeJPGDataArray(source, destination, settings) {
      settings = settings || {};
      var imgData = source.toDataURL("image/jpeg", settings.quality || 0.6);
      var imgDataArr = base64ToByteArray(imgData);
      var imgDataObject = {
        jpgData: imgDataArr,
        headerSize: detectJpegHeaderSize(imgDataArr),
        glitchBytes: settings.glitchBytes || 10
      };
      if (settings.path) {
        this.adjustSettings(settings.path, imgDataObject, true);
        return destination || source;
      } else {
        return imgDataObject;
      }
    }
  });
  
  // glitch data, and shove it to destination, or pass it on
  VPAnimEngine.addRenderer({
    name: 'glitch',
    version: 1,
    renderer: function glitch(source, destination, settings) {
      var outputImage = new Image();
      var glitchCount = settings.glitchBytes || 10;
      var glitchData = settings.jpgData;
      var headerSize = settings.headerSize;
      glitchData = glitchData.slice();
      while (glitchCount--) {
        glitchJpegBytes(glitchData, headerSize);
      }
      this.surfaces.glitchedImage = outputImage;
      outputImage.src = byteArrayToBase64(glitchData);
      settings.image = outputImage;
      return outputImage;
    }
  });
})();

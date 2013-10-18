/*
  VPAnimEngine DOM element 'style' renderer module

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
  "use strict";
  
  // DOM element 'style' renderer
  // requires sprintf
  
  // settings passed to style renderer can contain "remove" and "set" values
  // "remove" can be an array of style properties to remove from the DOM element
  // "set" can be a single object or an array of objects defining styles to set
  // those styles are in a "styleDef" object passed to the following setStyle method
  
  // styleDef: { property: 'propName', value: 'value'/function, prefix: 'prefixString', suffix: 'suffixString', settings: ['settingsName', path, path ], formattedString: 'sprintf format', values: [ list of settings paths ] }
  function setStyle(el, styleDef) {
    if (!styleDef.property) {
      debug("style renderer: no property in style definition %o", styleDef);
      return;
    }
    var style = styleDef.prefix || '';
    var value, range;
    
    if (VPUtils.isString(styleDef.formattedString)) {
      if (Array.isArray(styleDef.values)) {
        var sprintfParams = styleDef.values.map(function(setting) { return this.getSettings(setting, true); }, this);
        sprintfParams.unshift(styleDef.formattedString);
        value = sprintf.apply(this, sprintfParams);
      } else {
        return;
      }
    } else {
      if (VPUtils.hasProperty(styleDef, 'value')) {
        if (VPUtils.isFunction(styleDef.value)) {
          value = styleDef.value.call(this);
        } else {
          value = styleDef.value;
        }
      } else if (styleDef.settings) {
        value = this.getSettings(styleDef.settings, true);
      }

      if (VPUtils.isNumber(value) && styleDef.range) {
        if (VPUtils.isString(styleDef.range) || Array.isArray(styleDef.range)) {
          range = this.getSettings(styleDef.range, true);
        } else if (VPUtils.isObject(styleDef.range)) {
          range = styleDef.range;
        }
        if (VPUtils.isObject(range)) {
          // range needs to specify source range of values, destination range
          // { fromMin: 0 || <value>, fromMax: <value>, toMin: 0 || <value>, toMax: <value> }
          var fromMin = range.fromMin || 0,
              fromMax = range.fromMax,
              toMin   = range.toMin || 0,
              toMax   = range.toMax,
              fromRange, toRange, scale;
          if (VPUtils.isNumber(fromMax) && VPUtils.isNumber(toMax) && (fromMin !== fromMax) && (toMin !== toMax)) {
            value = Math.min(Math.max(fromMin, value), fromMax);
            fromRange = fromMax - fromMin;
            toRange   = toMax - toMin;
            scale     = toRange / fromRange;
            value = ((value - fromMin) * scale) + toMin;
          } else {
            debug("style renderer: range definition %o dodgy, ignoring %o", range, styleDef);
          }
        } else {
          debug("style renderer: range definition incorrect, ignoring %o", styleDef);
        }
      }

      if (VPUtils.isNumber(value) && styleDef.round) {
        value = Math.round(value);
      }
    }

    if (VPUtils.isString(value) || VPUtils.isNumber(value)) {
      style = style + value;
    } else {
      debug("style renderer: cannot set style definition %o value %o", styleDef, value);
      return;
    }
    
    style = style + (styleDef.suffix || '');
    if (Array.isArray(styleDef.propertyPrefixes)) {
      styleDef.propertyPrefixes.forEach(function(prefix) {
        el.style.setProperty(prefix + styleDef.property, style, null);
        el.style[prefix + styleDef.property] = style;
      });
    } else {
      el.style.setProperty(styleDef.property, style, null);
      el.style[styleDef.property] = style;
    }
  }
  
  VPAnimEngine.addRenderer({
    name: 'style',
    version: 2,
    renderer: function style(source, destination, settings) {
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
        debug("style renderer: Error - no elements found %o", settings);
        return;
      }

      for (var index = 0; index < els.length; index++) {
        var el = els[index];
        if (settings.remove) {
          var remove = this.getSettings(settings.remove, true) || settings.remove;
          if (Array.isArray(remove)) {
            remove.forEach(function(token) { el.style.removeProperty(token); });
          } else {
            el.style.removeProperty(remove);
          }
        }
        if (settings.set) {
          var set = this.getSettings(settings.set, true) || settings.set;
          if (Array.isArray(set)) {
            set.forEach(function(val) { setStyle.apply(this, [el, val]); }, this);
          } else {
            setStyle.apply(this, [el, set]);
          }
        }
      }
  
      return destination;
    }
  });
}());
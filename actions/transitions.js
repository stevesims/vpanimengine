/*
  VPAnimEngine 'transitions' action module

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
  
  // constants
  var kColorSettings = ['fillStyle', 'strokeStyle', 'color', 'colorFrom', 'colorTo'];
  
  // Private transition processing functions
  function deleteTransKey(transition, fieldName) {
    delete transition.changing[fieldName];
    for (var cb in transition.callbacks) {
      var callbackDef = transition.callbacks[cb];
      var keyIndex = callbackDef.keys.indexOf(fieldName);
      if (keyIndex !== -1) {
        callbackDef.keys.splice(keyIndex,1);
      }
    }
  }

  function doTransitionCallbacks(transition, removeOnly) {
    // must be applied, setting "this"
    for (var cb in transition.callbacks) {
      var callbackDef = transition.callbacks[cb];
      if (callbackDef.keys.length === 0) {
        var actions = callbackDef.actions;
        if (removeOnly) {
          // I don't think this can work, and is effectively a no-op
          // not sure what the implications of that might be
          actions.length = 0;
        } else {
          delete transition.callbacks[cb];
          if (actions.length !== 0) {
            this.processStages(actions);
          }
        }
      }
    }
  }

  function processTransition(transition) {
    for (var changing in transition.changing) {
      var transParams = transition.changing[changing];
      var progress = Math.max((this.getTime(transition.timeType) - (transParams.started + transParams.delay)), 0) / transParams.duration;

      if (progress > 1) {
        progress = 1;
      } else if (transParams.bezier) {
        var bez = transParams.bezier;
        progress = this.cubicBezierAtTime(progress, bez[0], bez[1], bez[2], bez[3], transParams.duration);
      }

      if (transParams.gradient) {
        if (progress === 1) {
          transition.settings[changing] = transParams.to;
        } else {
          var pixData = transParams.gradient;
          var offset = Math.round(progress * 99) * 4;

          var red = pixData[offset];
          var green = pixData[offset+1];
          var blue = pixData[offset+2];
          var alpha = pixData[offset+3] / 255;

          transition.settings[changing] = "rgba(" + red + "," + green + "," + blue + "," + alpha + ")";
        }
      } else if (transParams.delta) {
        transition.settings[changing] = transParams.from + (transParams.delta * progress);
      }

      if (progress === 1) {
        this.removeTransition(transition.path, changing);
      }
    }
  }
  
  function processAllTransitions() {
    for (var trans in this.transitions) {
      processTransition.apply(this, [this.transitions[trans]]);
    }
  }

  function removeTransition(path, fieldName, ignoreWarn, ignoreCallbacks, noDelete) {
    if (!Array.isArray(path)) {
      path = [path];
    }
    var settingsName = path.join('-') || '-global';
    var transition = this.transitions[settingsName];

    if (transition) {
      if (fieldName) {
        deleteTransKey(transition, fieldName);
      } else {
        for (var key in transition.changing) {
          deleteTransKey(transition, key);
        }
      }
      if (!noDelete) {
        var active = 0;
        for (var key in transition.changing) {
          active++;
        }
        if (active === 0) {
          delete this.transitions[transition.name]
        }
      }
      doTransitionCallbacks.apply(this, [transition, ignoreCallbacks]);
    } else if (!ignoreWarn) {
      debug("Warning: Transition %o already removed", settingsName);
    }
  }
  
  function clearTransitions() {
    delete this.transitions;
    this.transitions = {};
  }

  VPAnimEngine.addInitialiser('transitions', function transitionsInitialiser() {
    clearTransitions.apply(this);
  });
  
  VPAnimEngine.addResetter('transitions', function transitionsResetter(skipClear) {
    if (!skipClear) {
      clearTransitions.apply(this);
    }
  });
  
  VPAnimEngine.addAdjustCallback(removeTransition);
  VPAnimEngine.addPipeProcessCallback(processAllTransitions);
  
  VPAnimEngine.addActions([
    {
      // Bezier timing info/method public to allow for it to be used 
      name: 'timingBeziers',
      version: 1,
      value: {
               "ease": [ 0.25, 0.1, 0.25, 1.0 ],
             "linear": [ 0.0, 0.0, 1.0, 1.0 ],
            "ease-in": [ 0.42, 0.0, 1.0, 1.0 ],
           "ease-out": [ 0.0, 0.0, 0.58, 1.0 ],
        "ease-in-out": [ 0.42, 0.0, 0.58, 1.0 ]
      }
    },
    
    {
      name: 'addTransition',
      version: 1,
      action: function addTransition(path, newSettings, transPath) {
        if (!Array.isArray(path)) {
          path = [path];
        }

        var settingsName = path.join('-') || '-global';

        var transition;
        if (VPUtils.isString(transPath) || Array.isArray(transPath)) {
          transition = this.getSettings(transPath, true);
        } else {
          transition = transPath;
        }

        if (!VPUtils.isObject(transition)) {
          debug("Cannot add transition for %o because transition %o not found/defined", path, transPath);
          return;
        }

        var oldSettings;
        if (!this.transitions[settingsName]) {
          oldSettings = this.getSettings(path, true);
          if (!VPUtils.isObject(oldSettings)) {
            debug("Cannot add transition %o for settings named %o since there are no settings with that name (%o)", transition, settingsName, oldSettings);
            return;
          }
          this.transitions[settingsName] = {
            name: settingsName,
            path: JSON.parse(JSON.stringify(path)),
            changing: {},
            callbacks: {},
            settings: oldSettings
          };
        }

        var trans = this.transitions[settingsName];

        if (VPUtils.isString(newSettings) || Array.isArray(newSettings)) {
          newSettings = this.getSettings(newSettings);
        }

        for (var fieldName in newSettings) {
          if (trans.changing[fieldName]) {
            // this call skips callbacks for previous transition that is getting removed,
            // and ensures the existing transition doesn't get deleted
            this.removeTransition(path, fieldName, true, true, true);
          }
        }

        oldSettings = oldSettings || trans.settings;

        var delay = transition.delay || 0;

        var started;
        if (transition.now) {
          started = this.getTime(transition.timeType);
        } else {
          started = transition.fromTime || this.currentTime;
          if (started === undefined) {
            started = this.getTime(transition.timeType);
          }
        }
        var until = started + transition.duration + delay;
        debug("addTransition started %o, until %o, duration %o, delay %o, path %o", started, until, transition.duration, delay, settingsName);

        if (transition.callbacks) {
          if (!trans.callbacks[until]) {
            trans.callbacks[until] = { keys: [], actions: [] };
          }
          
          // only add the callback actions if they're not already on the action list
          if (trans.callbacks[until].actions.indexOf(transition.callbacks) === -1) {
            trans.callbacks[until].actions.push(transition.callbacks);
          }
        }

        for (var fieldName in newSettings) {
          var transParams = {
            started: started,
            until: until,
            delay: delay,
            from: oldSettings[fieldName],
            to: newSettings[fieldName],
            duration: transition.duration
          };

          if (transition.bezier) {
            if (Array.isArray(transition.bezier) && (transition.bezier.length === 4)) {
              transParams.bezier = transition.bezier;
            } else if (VPUtils.isString(transition.bezier) && this.timingBeziers[transition.bezier]) {
              transParams.bezier = this.timingBeziers[transition.bezier];
            } else {
              debug("Transition (%o) bezier function %o not understood", transition, transition.bezier);
            }
          }

          if (kColorSettings.indexOf(fieldName) != -1) {
            var gradCanvas = document.createElement("canvas");
            gradCanvas.width = 1;
            gradCanvas.height = 100;
            var ctx = gradCanvas.getContext('2d');
            var gradient = ctx.createLinearGradient(0, 0, 0, 100);
            if (!transParams.from || !transParams.to) {
              debug("Transition (%o) ignoring because to/from colour is undefined", transition);
              continue;
            }
            gradient.addColorStop(0, transParams.from);
            gradient.addColorStop(1, transParams.to);
            ctx.fillStyle = gradient;
            ctx.fillRect(0,0,1,100);
            transParams.gradient = ctx.getImageData(0, 0, 1, 100).data;
          } else if (!isNaN(new Number(transParams.from)) && !isNaN(new Number(transParams.to))) {
            transParams.delta = transParams.to - transParams.from;
          } else {
            debug("Transition (%o) of non numeric or colour value not supported %o: %o", transition, fieldName, transParams.from);
            continue;
          }

          trans.changing[fieldName] = transParams;

          if (transition.callbacks) {
            trans.callbacks[until].keys.push(fieldName);
          }
        }
      }
    },
    
    {
      name: 'hasTransition',
      version: 1,
      action: function hasTransition(path, newSettings, lookupPath) {
        if (lookupPath) {
          path = this.getSettings(path);
        }
        if (!Array.isArray(path)) {
          path = [path];
        }

        var settingsName = path.join('-') || '-global';
        var trans = this.transitions[settingsName];
        if (!trans) {
          debug("no transition matching path %s found", settingsName);
          return false;
        }

        if (VPUtils.isUndefined(newSettings)) {
          debug("Object at path %s has transition, and no newSettings object given to compare against, so returning true", settingsName);
          return true;
        }
        if (VPUtils.isString(newSettings) || Array.isArray(newSettings)) {
          newSettings = this.getSettings(newSettings);
        }

        for (var fieldName in newSettings) {
          if (trans.changing[fieldName]) {
            debug("transition found matching path %s and fieldName %s found", settingsName, fieldName);
            return true;
          }
        }
        
        debug("transition was found for path %s, but not for the field", settingsName);
        return false;
      }
    },
    
    {
      name: 'removeTransition',
      version: 1,
      action: removeTransition
    },
    
    {
      name: 'processAllTransitions',
      version: 1,
      action: processAllTransitions
    },
    
    {
      name: 'cubicBezierAtTime',
      version: 1,
      // Cubic bezier code based on WebKit code, care of: http://www.netzgesta.de/dev/cubic-bezier-timing-function.html
      action: function cubicBezierAtTime(t,p1x,p1y,p2x,p2y,duration) {
        var ax=0,bx=0,cx=0,ay=0,by=0,cy=0;
        // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
        function sampleCurveX(t) {return ((ax*t+bx)*t+cx)*t;};
        function sampleCurveY(t) {return ((ay*t+by)*t+cy)*t;};
        function sampleCurveDerivativeX(t) {return (3.0*ax*t+2.0*bx)*t+cx;};
        // The epsilon value to pass given that the animation is going to run over |dur| seconds. The longer the
        // animation, the more precision is needed in the timing function result to avoid ugly discontinuities.
        function solveEpsilon(duration) {return 1.0/(200.0*duration);};
        function solve(x,epsilon) {return sampleCurveY(solveCurveX(x,epsilon));};
        // Given an x value, find a parametric value it came from.
        function solveCurveX(x,epsilon) {var t0,t1,t2,x2,d2,i;
          function fabs(n) {if(n>=0) {return n;}else {return 0-n;}}; 
          // First try a few iterations of Newton's method -- normally very fast.
          for(t2=x, i=0; i<8; i++) {x2=sampleCurveX(t2)-x; if(fabs(x2)<epsilon) {return t2;} d2=sampleCurveDerivativeX(t2); if(fabs(d2)<1e-6) {break;} t2=t2-x2/d2;}
          // Fall back to the bisection method for reliability.
          t0=0.0; t1=1.0; t2=x; if(t2<t0) {return t0;} if(t2>t1) {return t1;}
          while(t0<t1) {x2=sampleCurveX(t2); if(fabs(x2-x)<epsilon) {return t2;} if(x>x2) {t0=t2;}else {t1=t2;} t2=(t1-t0)*.5+t0;}
          return t2; // Failure.
        };
        // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
        cx=3.0*p1x; bx=3.0*(p2x-p1x)-cx; ax=1.0-cx-bx; cy=3.0*p1y; by=3.0*(p2y-p1y)-cy; ay=1.0-cy-by;
        // Convert from input time to parametric value in curve, then from that to output time.
        return solve(t, solveEpsilon(duration));
      }
    }
    
  ]);

})();
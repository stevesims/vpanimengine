/*
  VPAnimEngine
  the Vert Pixels Animation Engine library

  (c) 2011-13, Steve Sims and Vert Pixels Ltd.
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var VPAnimEngine = (function() {
  "use strict";

  // Global private variables for engine
  var renderers = {};
  var actionDefinitions = {};
  var rendererDefinitions = {};
  var initialisers = [];
  var initNames = {};
  var resetters = [];
  var resetNames = {};
  var timeGetters = {};
  var adjustCallbacks = [];
  var pipeProcessCallbacks = [];

  // constants
  var kPriorityParams = ['controller', 'view'];

  function debug() {
    if (window.DEBUG !== undefined && window.DEBUG && window.console && window.console.log) {
      var args = Array.prototype.slice.call(arguments);
      if (window.SHOW_TRACE && window.console && window.console.trace) {
        console.trace();
      }
      if (window.TIMESTAMP) {
        args[0] = "DEBUG @ " + Date.now() + ": " + args[0];
      } else {
        args[0] = "DEBUG: " + args[0];
      }
      if (console.log.apply) {
        console.log.apply(console, args);
      } else {
        // fallback for some versions of IE
        console.log(args[0], args[1] || '', args[2] || '', args[3] || '', args[4] || '', args[5] || '', args[6] || '', args[7] || '');
      }
    }
  };

  // engine object creator function definition
  var engine = function VPAnimEngine(params) {
    if (window && this === window) {
      throw new TypeError("not calling as constructor");
    }
    
    this.checkDependencies(actionDefinitions);
    this.checkDependencies(rendererDefinitions);
    
    this.init();
    
    if (VPUtils.isObject(params)) {
      kPriorityParams.forEach(function(param) {
        if (params.hasOwnProperty(param)) {
          this[param] = params[param];
        }
      }, this);
      
      VPUtils.copyProperties(this, params, kPriorityParams);
    }
  };
  
  engine.debug = debug;
  
  // Engine method definitions start here
  
  engine.prototype.init = function init() {
    this.pipelines = {};
    this._surfaces = {};
    this.settings = {};

    initialisers.forEach(function(init) {
      try {
        init.apply(this);
      } catch(e) {
        debug("Caught error %o when calling initialiser %o", e, init);
      }
    }, this);
    this.reset(true);
  };
  
  engine.prototype.reset = function reset(skipClear) {
    if (!skipClear) {
      clearPipelines.apply(this);
      this.clearSettings();
    }

    resetters.forEach(function(reset) {
      try {
        reset.apply(this, [skipClear]);
      } catch(e) {
        debug("Caught error %o when calling resetter %o", e, reset);
      }
    }, this);
  };
  
  engine.prototype.callResetter = function callResetter(name) {
    if (VPUtils.hasMethod(resetNames, name)) {
      var args = Array.prototype.slice.call(arguments, 1);
      resetNames[name].apply(this, args);
    } else {
      debug("No resetter named %o found", name);
    }
  };

  engine.prototype.checkDependencies = function checkDependencies(definitions) {
    for (var name in definitions) {
      if (definitions.hasOwnProperty(name)) {
        var obj = definitions[name];
        if (obj.dependencies) {
          obj.dependencies.forEach(function(dep) {
            if (dep.action) {
              var actionDef = actionDefinitions[dep.action];
              if (!actionDef) {
                debug("Action dependency (%o) for %o not found", dep.action, obj);
                throw new TypeError("Action " + dep.action + " not available");
              }
              if (dep.version && (dep.version > actionDef.version)) {
                debug("Action dependency (%o) for %o requires newer version than registered", dep.action, obj);
                throw new TypeError("Action " + dep.action + " version " + dep.version + " not fulfilled");
              }
            } else if (dep.renderer) {
              var renderDef = rendererDefinitions[dep.renderer];
              if (!renderDef) {
                debug("renderer dependency (%o) for %o not found", dep.renderer, obj);
                throw new TypeError("Renderer " + dep.renderer + " not available");
              }
              if (dep.version && (dep.version > renderDef.version)) {
                debug("renderer dependency (%o) for %o requires newer version than registered", dep.renderer, obj);
                throw new TypeError("Renderer " + dep.renderer + " version " + dep.version + " not fulfilled");
              }
            } else {
              debug("Don't know how to check for this dependency: %o", dep);
            }
          });
        }
      }
    }
  };


  // settings-related actions
  engine.prototype.getSettings = function getSettings(path, allowUndef, adjusting) {
    var settings;
    if (Array.isArray(path)) {
      settings = this.settings;
      // set 'adjusting' to return parent
      var depth = adjusting ? path.length - 1: path.length;
      for (var i = 0; i < depth; i++) {
        if (settings) {
          var name = path[i];
          if (VPUtils.isString(name) || VPUtils.isNumber(name)) {
            if (!settings[name] && adjusting) {
              if (VPUtils.isNumber(path[i+1])) {
                settings[name] = new Array(path[i+1]);
              } else {
                settings[name] = {};
              }
            }
            settings = settings[name];
          } else {
            settings = undefined;
            break;
          }
        } else {
          break;
        }
      }
    } else if (VPUtils.isString(path)) {
      settings = this.settings[path];
    }
    if (VPUtils.isUndefined(settings) && !allowUndef) {
      debug("Warning: settings '%o' could not be found", path);
      settings = {};
    }
    return settings;
  };

  function clone(obj){
    if(obj == null || typeof(obj) != 'object')
      return obj;

    var temp = new obj.constructor();
    for(var key in obj)
      temp[key] = clone(obj[key]);

    return temp;
  }

  engine.prototype.adjustSettings = function adjustSettings(path, newSettings, clear) {
    if (!Array.isArray(path)) {
      path = [path];
    }
    
    var settings = this.getSettings(path, true, true);
    var leaf = path[path.length - 1];
    
    if (!leaf) {
      // global merge/blat
      // NB this is non-recursive, thus objects don't get merged, just replaced
      if (VPUtils.isObject(newSettings)) {
        for (var property in newSettings) {
          settings[property] = clone(newSettings[property]);
          adjustCallbacks.forEach(function(callback) {
            callback.apply(this, [path, property, true]);
          }, this);
        }
      } else {
        debug("Warning: adjustSettings with no path attempted to merge in non-object newSettings %o, ignoring", newSettings);
      }
    } else if (Array.isArray(newSettings)) {
      if (clear || !Array.isArray(settings[leaf])) {
        settings[leaf] = [];
      }
      settings = settings[leaf];
      newSettings.forEach(function(val, index) {
        settings[index] = val;
      });
    } else if (VPUtils.isObject(newSettings)) {
      if (clear || !VPUtils.isObject(settings[leaf])) {
        settings[leaf] = {};
      }
      settings = settings[leaf];
      for (var property in newSettings) {
        settings[property] = newSettings[property];
        adjustCallbacks.forEach(function(callback) {
          callback.apply(this, [path, property, true]);
        }, this);
      }
    } else {
      settings[leaf] = newSettings;
    }
    
    return settings;
  };
  
  engine.prototype.copySettings = function copySettings(path, newSettingsPath, clear) {
    return this.adjustSettings(path, this.getSettings(newSettingsPath), clear);
  };
  
  engine.prototype.clearSettings = function clearSettings(path) {
    if (!path) {
      delete this.settings;
      this.settings = {};
    } else {
      if (!Array.isArray(path)) {
        path = [path];
      }
      var settings = this.settings;
      for (var i = 0; i < path.length - 1; i++) {
        if (settings) {
          settings = settings[path[i]];
        }
      }
      if (settings) {
        delete settings[path[path.length - 1]];
      }
    }
  };
  
  engine.prototype.defaultTimeType = 'relative';
  
  engine.prototype.getTime = function getTime(type, time) {
    if (!VPUtils.isString(type)) {
      time = type;
      type = this.defaultTimeType;
    }
    if (VPUtils.hasMethod(timeGetters, type)) {
      return timeGetters[type].apply(this,[time]);
    }
    var baseTime = 0;
    time = time || 0;
    return time - baseTime;
  };

  
  // Surface handling stuff
  Object.defineProperty(engine.prototype, 'surfaces', {
    get: function getSurfaces() {
      return this._surfaces;
    },
    set: function setSurfaces(surfaces) {
      this.clearSurfaces();
      surfaces = surfaces || {};
      
      for (var name in surfaces) {
        if (surfaces.hasOwnProperty(name)) {
          this.addSurface(name, surfaces[name]);
        }
      }
    }
  });
  
  engine.prototype.getSurfaceType = function getSurfaceType(el) {
    if (el instanceof HTMLCanvasElement) {
      return 'canvas';
    } else if (el instanceof HTMLVideoElement) {
      return 'video';
    } else if (el instanceof HTMLImageElement) {
      return 'image';
    } else if (el instanceof HTMLElement) {
      return 'element';
    } else {
      return 'unknown';
    }
  };
  
  engine.prototype.addSurface = function addSurface(name, surface) {
    var view, source, newSurface, type;
    
    if (!VPUtils.isString(name) || !VPUtils.isObject(surface)) {
      debug("Error: addSurface called without a name (%o) or surface object (%o)", name, surface);
      return;
    }
    
    var surfaceInfo = Object.create(surface);
    surfaceInfo.name = name;
    
    if (this._surfaces[name]) {
      debug("Warning: surface named %o was already set to %o, but will be replaced with new surface %o", name, this._surfaces[name], surface);
      this.removeSurface(name);
    }
    
    if (surface.outlet) {
      if (this.controller) {
        newSurface = this.controller[surface.outlet];
        if (!newSurface) {
          debug("Error: addSurface can't find controller outlet %o in controller %o", surface.outlet, this.controller);
        }
        if (surface.addToView) {
          debug("Warning: addSurface ignoring addToView flag set on 'outlet' surface %o", surface);
          surfaceInfo.addToView = false;
        }
      } else {
        debug("Error: addSurface ignoring outlet %o because no controller set", surface.outlet);
      }
    } else if (surface.selector) {
      if (surface.addToView) {
        debug("Warning: addSurface ignoring addToView flag set on 'selector' surface %o", surface);
        surfaceInfo.addToView = false;
      }
      view = this.view || (this.controller ? this.controller.view : undefined) || document;
      var elements = view.querySelectorAll(surface.selector);
      if (elements.length === 0) {
        debug("Error: addSurface could not find element in view %o with selector %o", view, surface.selector);
      } else { 
        if (elements.length >= 2) {
          debug("Warning: addSurface found multiple elements matching selector %o. Using first", surface.selector);
        }
        newSurface = elements[0];
      }
    } else if (surface.source) {
      if (/\.(?:png|gif|jpg|jpeg)$/i.test(surface.source)) {
        // is an image
        newSurface = new Image();
        newSurface.src = surface.source;
      } else if (/\.(?:m4v|mov|mp4|ogv|webm)$/i.test(surface.source)) {
        // is a video element, so we need to make one
        debug("Warning: addSurface video element support is problematic %o", surface);
        newSurface = document.createElement("video");
        newSurface.src = surface.source;
      } else {
        debug("Error: addSurface ignored surface %o - source %o filetype not understood", surface, surface.source);
      }
    } else if (surface.cssCanvas) {
      // NB this is only supported in WebKit/Blink browsers
      var width = surface.width || 300;
      var height = surface.height || 300;
      var ctx = document.getCSSCanvasContext(surface.cssCanvasType || '2d', surface.cssCanvas, width, height);
      newSurface = ctx.canvas;
    } else if (surface.element) {
      newSurface = surface.element;
    } else {
      // default to new canvas element
      newSurface = document.createElement("canvas");
      if (surface.width) {
        newSurface.width = surface.width;
      }
      if (surface.height) {
        newSurface.height = surface.height;
      }
    }
    
    if (newSurface) {
      surfaceInfo.type = this.getSurfaceType(newSurface);
      newSurface.surfaceSettings = surfaceInfo;
      this._surfaces[name] = newSurface;
      if (surface.className) {
        newSurface.classList.add(surface.className);
      }
      if (surfaceInfo.addToView) {
        view = this.view || (this.controller ? this.controller.view : undefined) || document.body;
        if (VPUtils.isString(surfaceInfo.addToView)) {
          view = view.querySelector(surfaceInfo.addToView) || view;
        }
        if (view) {
          view.appendChild(newSurface);
        } else {
          debug("Warning: addSurface cannot addToView (%o) surface %o because no view available", surfaceInfo.addToView, surface);
        }
      }
    }
  };
  
  engine.prototype.clearSurfaces = function clearSurfaces() {
    for (var name in this._surfaces) {
      this.removeSurface(name);
    }
  };
  
  engine.prototype.removeSurface = function removeSurface(name) {
    var surface = this._surfaces[name];
    var surfaceDef = surface.surfaceSettings;
    if (surfaceDef && surfaceDef.addToView) {
      if (surface.parentNode) {
        surface.parentNode.removeChild(surface);
      }
    }
    delete this._surfaces[name];
  };
  
  
  // Pipeline-related actions
  engine.prototype.addPipeline = function addPipeline(name, params) {
    if (this.pipelines[name] && this.pipelines[name].timer) {
      debug("Error: addPipeline - pipeline named %o already exists (%o) and is running. ignoring new definition %o", name, this.pipelines[name], params);
      return;
    }

    var checkObj = {};
    checkObj[name] = params;
    this.checkDependencies(checkObj);
    
    this.pipelines[name] = params;
    
    this.initPipeline(name, { ignoreWarnings: true });
    
    var settings = this.getSettings(params.settings);
    if (settings.autoEnable) {
      this.startPipeline(name);
    }
  };

  engine.prototype.startPipeline = function startPipeline(name, options) {
    var pipeline = this.pipelines[name];
    if (!pipeline) {
      debug("Error: startPipeline cannot find pipeline named %o", name);
      return;
    }
    if (pipeline.timer) {
      debug("Warning: startPipeline %o already running", name);
      return;
    }
    var settings = this.getSettings(pipeline.settings);
    var fps = settings.fps || 60;
    pipeline.lastTime = Date.now();
    if (pipeline.startStages) {
      this.processStages(pipeline.startStages);
    }
    pipeline.timer = VPUtils.delayedCall(this, processPipeline, 1000/fps, name, options);
  };

  engine.prototype.stopPipeline = function stopPipeline(name, options) {
    var pipeline = this.pipelines[name];
    if (!pipeline) {
      debug("Error: stopPipeline cannot find pipeline named %o", name);
      return;
    }
    if (pipeline.timer) {
      debug("Stopping pipeline %o %o", name, pipeline.timer);
      window.clearTimeout(pipeline.timer);
      pipeline.timer = undefined;
      if (pipeline.stopStages) {
        this.processStages(pipeline.stopStages);
      }
    } else if (!options || !options.ignoreWarnings) {
      debug("Warning: stopPipeline %o is not running", name);
    }
  };

  engine.prototype.initPipeline = function initPipeline(name, options) {
    options = options || {};
    var pipeline = this.pipelines[name];
    if (!pipeline) {
      if (!options.ignoreWarnings) {
        debug("Error: initPipeline cannot find pipeline named %o", name);
      }
      return;
    }
    if (pipeline.timer) {
      if (!options.ignoreWarnings) {
        debug("Warning: initPipeline %o already running", name);
      }
      return;
    }
    if (pipeline.initStages) {
      this.processStages(pipeline.initStages);
    }
  };

  engine.prototype.processStages = function processStages(stages, pipeline, source, destination) {
    var newSource, stage, result;
    stages = this.getSettings(stages, true) || stages;
    if (!Array.isArray(stages)) {
      if (VPUtils.isObject(stages)) {
        // if stage list contained a single settings reference then you can get an object here, so coerce and continue
        stages = [stages];
      } else {
        debug("Error: processStages stages list %o is not an array (pipeline %o)", stages, pipeline);
        return;
      }
    }
    for (var i = 0; i < stages.length; i++) {
      result = undefined;
      stage = this.getSettings(stages[i], true) || stages[i];
      result = this.processStage(stage, pipeline, source, destination);
      
      if (result === null) {
        return null;
      } else if (VPUtils.isObject(result)) {
        if (result.result === null) {
          return null;
        }
        if (!stage.keepSource) {
          source = result.source || source;
        }
        destination = result.destination || destination;
      } else if (this.getSurfaceType(result)) {
        // result usable as a surface, so we'll use that as new source
        if (!stage.keepSource) {
          source = result;
        }
      }
    }
    
    return { source: source, destination: destination };
  };
  
  engine.prototype.processStage = function processStage(stage, pipeline, source, destination) {
    var result;
    if (Array.isArray(stage)) {
      result = this.processStages(stage, pipeline, source, destination);
    } else if (VPUtils.isFunction(stage)) {
      try {
        result = stage.apply(this, [source, destination, pipeline]);
      } catch (e) {
        debug("Caught error %o performing stage function %o", e, stage);
      }
    } else {
      if (stage.condition !== undefined) {
        result = this.checkCondition(stage, pipeline, source, destination);
        if (result === null) {
          return null;
        }
        if (!result) {
          return;
        }
        result = undefined;
      }
      if (stage.destination) {
        if (VPUtils.isString(stage.destination)) {
          destination = this._surfaces[stage.destination];
        } else {
          destination = stage.destination;
        }
      }
      if (stage.source) {
        if (VPUtils.isString(stage.source)) {
          source = this._surfaces[stage.source];
        } else {
          source = stage.source;
        }
      }
      if (stage.action) {
        try {
          if (stage.inController) {
            result = this.controller[stage.action].apply(this.controller, stage.arguments);
          } else {
            result = this[stage.action].apply(this, stage.arguments);
          }
        } catch (e) {
          debug("Caught error %o performing action stage %o", e, stage);
        }
      } else if (stage.render) {
        try {
          result = this.doRender(stage.render, source, destination, stage.settings, pipeline, stage);
        } catch (e) {
          debug("Caught error %o performing rendering stage %o", e, stage);
          throw(e);
        }
      } else if (stage.stages) {
        result = this.processStages(stage.stages, pipeline, source, destination);
      } else if (!stage.condition) {
        debug("VPAnimEngine.processStages didn't understand stage %o - skipping", stage);
      }
    }
    
    if (this.getSurfaceType(result)) {
      source = result;
    }
    
    return { source: source, destination: destination, result: result };
  };
  
  engine.prototype.checkCondition = function checkCondition(params, pipeline, source, destination) {
    var result;
    if (VPUtils.isBoolean(params.condition)) {
      result = params.condition;
    } else if (VPUtils.isString(params.condition)) {
      if (params.conditionInController) {
        result = this.controller[params.condition].apply(this.controller, params.conditionArguments || [params]);
      } else {
        result = this[params.condition].apply(this, params.conditionArguments || [params]);
      }
    } else if (Array.isArray(params.condition)) {
      result = this.getSettings(params.condition);
    } else if (VPUtils.isFunction(params.condition)) {
      result = params.condition.apply(this, params.conditionArguments || [params]);
    } else if (VPUtils.isObject(params.condition)) {
      result = this.processStage(params.condition, pipeline, source, destination);
      if (!params.condition.render) {
        debug("Checked condition for %o, result was %o", params, result);
      }
      if (params.condition.negate && !params.negate) {
        debug("In checkCondition - result was %o, but negating", result);
        result = !result;
      }
    }
    
    if (params.negate) {
      result = !result;
    }
    
    return result;
  };

  engine.prototype.doRender = function doRender(type, source, destination, settings, pipeline, stage) {
    if (VPUtils.hasMethod(renderers, type)) {
      if (VPUtils.isString(source)) {
        source = this._surfaces[source];
      }
      if (VPUtils.isString(destination)) {
        destination = this._surfaces[destination];
      }
      if (VPUtils.isString(settings) || Array.isArray(settings)) {
        settings = this.getSettings(settings);
      }
      return renderers[type].apply(this, [source, destination, settings, pipeline, stage]);
    } else {
      debug("Error: doRender type %o not supported", type);
    }
  };

  Object.defineProperty(engine.prototype, 'runningPipelines', {
    get: function getRunningPipelines() {
      var pipe, pipeline, pipes = [];
      for (pipe in this.pipelines) {
        pipeline = this.pipelines[pipe];
        if (pipeline.timer) {
          pipes.push(pipe);
        }
      }
      return pipes;
    }
  });

  engine.prototype.pushAutoStage = function pushAutoStage(pipeline, action, options) {
    if (!pipeline) {
      debug("Error: pushAutoStage attempted to push an action to pipeline which does not exist");
    } else {
      options = options || {};
      if (!Array.isArray(pipeline.autoStages)) {
        pipeline.autoStages = [action];
      } else {
        if (options.single && pipeline.autoStages.indexOf(action) !== -1) {
          return;
        } else if (options.unshift) {
          pipeline.autoStages.unshift(action);
        } else {
          pipeline.autoStages.push(action);
        }
      }
    }
  };


  // Pipeline utility functions
  function clearPipelines() {
    for (var pipe in this.pipelines) {
      this.stopPipeline(pipe, { ignoreWarnings: true });
      delete this.pipelines[pipe];
    }
  };

  function processPipeline(name, options) {
    var pipeline = this.pipelines[name];
    if (!pipeline) {
      debug("Error: processPipeline could not find pipeline named %o", name);
      return;
    }

    if (!pipeline.timer) {
      debug("pipeline %o attempted to be processed, but no timer set - aborting", name);
      return;
    }

    pipeProcessCallbacks.forEach(function(callback) {
      callback.apply(this, [pipeline, options]);
    }, this);

    var newTime = Date.now();

    var settings = this.getSettings(pipeline.settings);

    this.processStages(pipeline.stages, pipeline);
    if (pipeline.autoStages) {
      this.processStages(pipeline.autoStages);
      delete pipeline.autoStages;
    }

    if (pipeline.timer) {
      var renderTime = Date.now() - newTime;
      var fps = settings.fps || 60;
      pipeline.timer = VPUtils.delayedCall(this, processPipeline, Math.max((1000/fps) - renderTime, 2), name, options);
    }
  };
  
  
  // Engine object methods - accessible only on VPAnimEngine and not instances
  Object.defineProperty(engine, 'renderers', {
    get: function getRenderers() {
      return renderers;
    }
  });

  engine.addRenderer = function addRenderer(rendererDef) {
    var rendererDef;
    var renderer = rendererDef.renderer;
    var name = rendererDef.name;
    
    if (!name) {
      throw new TypeError("VPAnimEngine.addRenderer no name given when adding renderer");
    }
    
    rendererDef.version = rendererDef.version || 0;
    
    if (VPUtils.hasProperty(renderers, name)) {
      debug("VPAnimEngine.addRenderer: Renderer %o already added - ignoring", name);
    } else {
      if (VPUtils.isFunction(renderer)) {
        renderers[name] = renderer;
        rendererDefinitions[name] = rendererDef;
      } else {
        throw new TypeError("VPAnimEngine.addRenderer renderer named " + name + " did not include renderer function");
      }
    }
  };
  
  engine.addAction = function addAction(action) {
    if (!VPUtils.isObject(action)) {
      throw new TypeError("addAction must be called with an action definition object");
    }
    if (!action.name) {
      throw new TypeError("addAction action definition object invalid");
    }
    
    action.version = action.version || 0;

    if (VPUtils.hasProperty(engine.prototype, action.name)) {
      if (actionDefinitions[action.name]) {
        var actionDef = actionDefinitions[action.name];
        if (actionDef.version && (actionDef.version > (action.version || 0))) {
          throw new TypeError("addAction: an action named " + action.name + " already exists with a higher version and so cannot be added");
        }
        debug("addAction: warning - action named %s already exists (%o) and will be replaced by new definition %o", action.name, actionDef, action);
      } else {
        throw new TypeError("addAction: cannot add an action named " + action.name + " since that name is already used");
      }
    }
    
    actionDefinitions[action.name] = action;
    
    if (action.action) {
      engine.prototype[action.name] = action.action;
    } else if (action.value) {
      engine.prototype[action.name] = action.value;
    }
  };
  
  engine.addActions = function addActions(actions) {
    if (!Array.isArray(actions)) {
      throw new TypeError("addActions must be called with an array of actions");
    }
    
    actions.forEach(function(action) {
      engine.addAction(action);
    });
  };
  
  Object.defineProperty(engine, 'actions', {
    get: function getActions() {
      return actionDefinitions;
    }
  });
  
  engine.addAdjustCallback = function addAdjustCallback(callback) {
    adjustCallbacks.push(callback);
  };

  engine.addPipeProcessCallback = function addPipeProcessCallback(callback) {
    pipeProcessCallbacks.push(callback);
  };
  
  engine.addInitialiser = function addInitialiser(name, method) {
    if (VPUtils.hasProperty(initNames, name)) {
      debug("VPAnimEngine.addInitialiser: initialiser %o already added - ignoring", name);
    } else {
      if (VPUtils.isFunction(method)) {
        initNames[name] = true;
        initialisers.push(method);
      } else {
        debug("VPAnimEngine.addInitialiser: initialiser %o (%o) was not a function", name, method);
      }
    }
  };
  
  Object.defineProperty(engine, 'initialisers', {
    get: function getInitialisers() {
      return initialisers;
    }
  });

  engine.addResetter = function addResetter(name, method) {
    if (VPUtils.hasProperty(resetNames, name)) {
      debug("VPAnimEngine.addResetter: resetter %o already added - ignoring", name);
    } else {
      if (VPUtils.isFunction(method)) {
        resetNames[name] = method;
        resetters.push(method);
      } else {
        debug("VPAnimEngine.addResetter: resetter %o (%o) was not a function", name, method);
      }
    }
  };
  
  Object.defineProperty(engine, 'resetters', {
    get: function getResetters() {
      return resetters;
    }
  });
  
  Object.defineProperty(engine, 'timeGetters', {
    get: function getTimeGetters() {
      return timeGetters;
    }
  });
  
  engine.addTimeGetter = function addTimeGetter(name, method) {
    if (VPUtils.hasProperty(timeGetters, name)) {
      debug("VPAnimEngine.addTimeGetter: time getter %o already added - ignoring", name);
    } else {
      if (VPUtils.isFunction(method)) {
        timeGetters[name] = method;
      } else {
        debug("VPAnimEngine.addTimeGetter: time getter %o (%o) was not a function", name, method);
      }
    }
  };
  
  return engine;
}());

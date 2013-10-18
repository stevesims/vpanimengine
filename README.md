# VPAnimEngine
by [Vert Pixels Ltd.](http://vertpixels.com)

## Description

VPAnimEngine is a collection of JavaScript libraries for creating and running programatically driven animations.

## Usage

VPAnimEngine is an extensible animation library collection that provides programatic ways to create and run animation pipelines. Those pipelines may be used to render to HTML5 canvas, or they can be used to animate DOM elements.

## Notes

VPAnimEngine is a family of libraries, at the heart of which is the core VPAnimEngine library module. By itself, VPAnimEngine can do very little animation, and one must use a "renderer" module. Further enhancements can be obtained through the addition of "action" modules. There are quite a few renderer modules provided here for you to experiment with, and creating new ones is relatively easy.

Basic documentation is provided, however this is a work in progress. Some basic examples will be added soon.

VPAnimEngine was designed so as to allow for animations to be defined purely as JSON data. In part this is to allow for the development of tools to aid in animation pipeline design. Additionally it was intended to allow for identical animation pipeline definitions to be used with versions of VPAnimEngine ported to different platforms, such as an Objective-C-based port on iOS or a Java-based port on Android. No such ports yet exist, but when we get the chance and/or a project demands it we'll be working on that.

The provided renderers generally deal with either manipulating an HTML5 2D canvas, or the HTML DOM (style or class attributes). We do not currently include any renderers that work with WebGL, however these are possible and we have experimented with this. No promises, but some examples may follow.

## Real-life Examples

VPAnimEngine started out as the technology that drove the music visualizer in the [Deadmau5 iTunes LP 4x4=12](https://itunes.apple.com/us/album/4x4-12-deluxe-version/id406919167).

From there it developed and went on to be used as the basis for several other visualizers in various different iTunes LPs, gaining new features and new modules along the way.

It's latest public outing has been in the [Tinie Tempah Demonstration album promo site](http://listen.tinietempah.com/), which also makes use of our application framework [VPBooklet](https://github.com/stevesims/vpbooklet). It was used there to drive title-card canvas animations, produce a kaleidoscope effect, gradually draw a line-art heart, 'glitch' some images and videos, and also to provide fallback animation support to users Internet Explorer 9, as that browser does not provide CSS3 animation support.

Besides VPAnimEngine, the Deadmau5 iTunes LP also spawned [VPTimelineHandler](https://github.com/stevesims/vptimelinehandler). This companion library can be used to add time-driven events to animations, and is used in the Tinie Tempah site to drive lyrics displays.

## Compatibility

VPAnimEngine requires a modern browser environment in which to run, one in which HTML5 and ECMAScript 5 is supported. Practically speaking this means most versions of Safari and Chrome, recent versions of Firefox (from late 2012 onwards), and IE 9.

It is possible to use VPAnimEngine in older environments through the use of compatibility shims and/or polyfills.

## License

VPAnimEngine is licensed under the [BSD License](http://opensource.org/licenses/BSD-2-Clause)

## Credits

VPAnimEngine was designed and built by Steve Sims and John-Paul Harold of Vert Pixels Ltd.

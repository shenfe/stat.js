(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('jQueryOrZepto')) :
	typeof define === 'function' && define.amd ? define(['exports', 'jQueryOrZepto'], factory) :
	(factory((global.Mine = {}),global.$));
}(this, (function (exports,$) { 'use strict';

$ = $ && $.hasOwnProperty('default') ? $['default'] : $;

function select(sel) {
    return $(sel);
}

var config = function (conf) {};

var bind = function () {};

var unbind = function () {};

var check = function () {};

var send = function () {};

exports.config = config;
exports.bind = bind;
exports.unbind = unbind;
exports.check = check;
exports.send = send;
exports.select = select;

Object.defineProperty(exports, '__esModule', { value: true });

})));

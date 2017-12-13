(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.Stat = {})));
}(this, (function (exports) { 'use strict';

/* Polyfills */

var gid = (function () {
  var n = 0;
  return function () {
    return n++
  }
})();

var isBoolean = function (v) {
  return typeof v === 'boolean'
};

var isNumber = function (v) {
  return typeof v === 'number'
};

var isNumeric = function (v) {
  var n = parseInt(v);
  if (isNaN(n)) return false
  return (typeof v === 'number' || typeof v === 'string') && n == v
};

var isString = function (v) {
  return typeof v === 'string'
};

var isFunction = function (v) {
  return typeof v === 'function'
};

var isObject = function (v) {
  return v != null && Object.prototype.toString.call(v) === '[object Object]'
};

var isArray = function (v) {
  return Object.prototype.toString.call(v) === '[object Array]'
};

var isBasic = function (v) {
  return v == null
    || typeof v === 'boolean'
    || typeof v === 'number'
    || typeof v === 'string'
    || typeof v === 'function'
};

var isInstance = function (v, creator) {
  return typeof creator === 'function' && v instanceof creator
};

var isDirectInstance = function (v, creator) {
  return v.constructor === creator
};

var isNode = function (v) {
  if (typeof Node !== 'function') return false
  return v instanceof Node
};

var isNamedNodeMap = function (v) {
  return v instanceof NamedNodeMap
};

var isEventName = function (v) {
  if (!isString(v)) return false
  return v.startsWith('on') // TODO
};

var isCSSSelector = function (v) {
  return v.indexOf(' ') > 0 || v.indexOf('.') >= 0
    || v.indexOf('[') >= 0 || v.indexOf('#') >= 0
};

var each = function (v, func, arrayReverse) {
  if (isObject(v)) {
    for (var p in v) {
      if (!v.hasOwnProperty(p)) continue
      var r = func(v[p], p);
      if (r === false) break
    }
  } else if (isArray(v)) {
    if (!arrayReverse) {
      for (var i = 0, len = v.length; i < len; i++) {
        var r = func(v[i], i);
        if (r === false) break
      }
    } else {
      for (var i = v.length - 1; i >= 0; i--) {
        var r = func(v[i], i);
        if (r === false) break
      }
    }
  } else if (isNode(v)) {
    var ret = false;
    switch (v.nodeType) {
      case Node.ELEMENT_NODE:
        break
      case Node.TEXT_NODE:
      case Node.COMMENT_NODE:
      case Node.PROCESSING_INSTRUCTION_NODE:
      case Node.DOCUMENT_NODE:
      case Node.DOCUMENT_TYPE_NODE:
      case Node.DOCUMENT_FRAGMENT_NODE:
      default:
        ret = true;
    }
    if (ret) return
    for (var i = 0, childNodes = v.childNodes, len = v.childNodes.length; i < len; i++) {
      func(childNodes[i]);
      each(childNodes[i], func);
    }
  } else if (isNamedNodeMap(v)) {
    for (var i = 0, len = v.length; i < len; i++) {
      var r = func(v[i]['nodeValue'], v[i]['nodeName']);
      if (r === false) break
    }
  } else if (isFunction(v.forEach)) {
    v.forEach(func);
  }
};

var eachUnique = function (arr, func) {
  if (!isArray(arr)) return
  var map = {};
  for (var i = 0, len = arr.length; i < len; i++) {
    if (!isNumber(arr[i]) || !isString(arr[i]) || map[arr[i]]) continue
    map[arr[i]] = true;
    var r = func(arr[i]);
    if (r === false) break
  }
};

var unique = function (arr) {
  var r = [];
  eachUnique(arr, function (v) {
    r.push(v);
  });
  return r
};

var clone = function (val) {
  var r = val;
  if (isObject(val)) {
    r = {};
    each(val, function (v, p) {
      r[p] = clone(v);
    });
  } else if (isArray(val)) {
    r = [];
    each(val, function (v) {
      r.push(clone(v));
    });
  }
  return r
};

var hasProperty = function (val, p) {
  if (isObject(val)) {
    return val.hasOwnProperty(p)
  } else if (isArray(val)) {
    var n = parseInt(p);
    return isNumeric(p) && val.length > n && n >= 0
  }
  return false
};

var clear = function (val, p, withBasicVal) {
  var inRef = isString(p) || isNumber(p);
  var target = inRef ? val[p] : val;

  if (isObject(target) || isArray(target)) {
    each(target, function (v, p) {
      clear(target, p);
    });
    if (isArray(target)) {
      shrinkArray(target);
    }
  }

  if (inRef) {
    val[p] = withBasicVal;
  }
};

var shrinkArray = function (arr, len) {
  var limited = isNumber(len);
  if (!limited) {
    each(arr, function (v, i) {
      if (v === undefined) arr.length--;
    }, true);
  } else {
    each(arr, function (v, i) {
      if (i >= len) arr.length--;
      else return false
    }, true);
    while (arr.length < len) {
      arr.push(null);
    }
  }
  return arr
};

var touchLeaves = function (obj) {
  each(obj, function (v, p) {
    if (isBasic(v)) {
      obj[p] = v;
    } else {
      touchLeaves(v);
    }
  });
};

var extend = function (dest, srcs, clean) {
  if (!isObject(dest)) return null
  var args = Array.prototype.slice.call(arguments, 1,
    arguments[arguments.length - 1] === true ? (arguments.length - 1) : arguments.length);
  clean = arguments[arguments.length - 1] === true ? true : false;

  function extendObj (obj, src, clean) {
    if (!isObject(src)) return
    each(src, function (v, p) {
      if (!hasProperty(obj, p) || isBasic(v)) {
        if (obj[p] !== v) {
          obj[p] = clone(v);
        }
      } else {
        extendObj(obj[p], v, clean);
      }
    });
    if (clean) {
      each(obj, function (v, p) {
        if (!hasProperty(src, p)) {
          clear(obj, p);
        }
      });
      if (isArray(obj)) {
        shrinkArray(obj);
      }
    }
  }

  each(args, function (src) {
    extendObj(dest, src, clean);
  });
  return dest
};

/**
 * throttle节流函数
 * @refer https://stackoverflow.com/a/27078401
 */
var throttle = function (func, wait, options) {
  var context, args, result;
  var timeout = null;
  var previous = 0;
  if (!options) options = {};
  var later = function () {
    previous = options.leading === false ? 0 : Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };
  return function () {
    var now = Date.now();
    if (!previous && options.leading === false) previous = now;
    var remaining = wait - (now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result
  }
};

var Util = {
  gid,
  isBoolean,
  isNumber,
  isNumeric,
  isString,
  isFunction,
  isObject,
  isArray,
  isBasic,
  isInstance,
  isDirectInstance,
  isNode,
  isNamedNodeMap,
  isEventName,
  isCSSSelector,
  each,
  eachUnique,
  unique,
  clone,
  hasProperty,
  clear,
  shrinkArray,
  touchLeaves,
  extend,
  throttle
};

var TYPE = {
  click: 'click',
  view: 'view',
  load: 'load'
};

var SEND_TYPE = {
  ajax: 'ajaxGet',
  script: 'loadScript',
  image: 'loadImage'
};

var CONF = {
  commonData: false,
  throttleForView: 100,
  eventToType: {},
  typeEnum: {},
  excludeType: [],
  typeAttrPrefix: 'data-stat-',
  defaultCodeAttr: 'data-stat-code',
  defaultDataAttr: 'data-stat-data',
  defaultTimestampParamInUrl: 'stat_timestamp',
  defaultTypeParamInUrl: 'stat_type',
  defaultCodeParamInUrl: 'stat_code',
  defaultDataParamInUrl: 'stat_data',
  sendBy: {
    type: SEND_TYPE.ajax,
    url: '/',
    argsStr: queryStringifyObject
  },
  codeOptions: {}
};

/**
 * [description]
 * @param  {Object} conf [description]
 * @return {[type]}      [description]
 */
var config = function (conf) {
  if (!Util.isObject(conf)) return false
  Util.each(conf, function (v, k) {
    if (CONF.hasOwnProperty(k)) {
      if (!Util.isObject(CONF[k])) {
        CONF[k] = v;
      } else {
        Util.extend(CONF[k], v);
      }
    } else {
      CONF.codeOptions[k] = v;
    }
  });
  Util.each(TYPE, function (v, k) {
    var attrName = CONF.typeAttrPrefix + v;
    CONF.eventToType[v] = attrName;
    CONF.typeEnum[v] = true;
    if (CONF.excludeType.indexOf(v) !== -1) {
      CONF.typeEnum[v] = false;
    }
  });
};

config();

/**
 * [parseDataFromString description]
 * @param  {String} str [description]
 * @return {Object}     [description]
 */
function parseDataFromString (str) {
  var r = null;
  try {
    r = JSON.parse(str);
  } catch (e) {
    r = str;
  }
  return r
}

/**
 * [queryParamStringifyData description]
 * @param  {?} data      [description]
 * @return {String}      [description]
 */
function queryParamStringifyData (data) {
  if (data == null) return ''
  if (Util.isBasic(data)) return encodeURIComponent(String(data))
  return encodeURIComponent(JSON.stringify(data))
}

/**
 * [queryStringifyObject description]
 * @param  {Object} obj [description]
 * @return {String}     [description]
 */
function queryStringifyObject (obj) {
  var r = [];
  Util.each(obj, function (v, k) {
    r.push(queryParamStringifyData(k) + '=' + queryParamStringifyData(v));
  });
  return r.join('&')
}

/**
 * Get code and data in a Node.
 * @param  {Node} el    [description]
 * @return {Object}     [description]
 */
function getDataOfNode (el) {
  var data = {};
  var code = el.getAttribute(CONF.defaultCodeAttr);
  if (code) {
    data[CONF.defaultCodeParamInUrl] = code;
    var codeConf = CONF.codeOptions[code];
    if (codeConf) {
      var extraData = codeConf.data;
      if (Util.isFunction(codeConf.data)) {
        extraData = codeConf.data.call(el, el);
      }
      if (Util.isObject(extraData)) {
        Util.extend(data, extraData);
      }
    }
  }

  var statData = el.getAttribute(CONF.defaultDataAttr);
  if (statData) {
    statData = parseDataFromString(statData);
    if (!Util.isObject(statData)) {
      var t = String(statData);
      statData = {};
      statData[CONF.defaultDataParamInUrl] = t;
    }
  } else {
    statData = {};
    Util.each(el.attributes, function (value, name) {
      if (name.startsWith(CONF.defaultDataAttr + '-')) {
        statData[name.substr(CONF.defaultDataAttr.length + 1)] = value;
      }
    });
  }
  Util.extend(data, statData);

  return data
}

function getDataOfObj (obj) {
  var data = {};
  var code = obj.code;
  if (code) {
    data[CONF.defaultCodeParamInUrl] = code;
    var codeConf = CONF.codeOptions[code];
    if (codeConf) {
      var extraData = codeConf.data;
      if (Util.isObject(extraData)) {
        Util.extend(data, extraData);
      }
    }
  }
  var statData = obj.data;
  if (statData) {
    if (!Util.isObject(statData)) {
      var t = String(statData);
      statData = {};
      statData[CONF.defaultDataParamInUrl] = t;
    }
    Util.extend(data, statData);
  }
  return data
}

var getUrlData = function (type, elOrObj) {
  var data = {};
  if (Util.isNode(elOrObj)) {
    Util.extend(data, getDataOfNode(elOrObj));
  } else {
    Util.extend(data, getDataOfObj(elOrObj));
  }
  if (CONF.commonData) {
    data[CONF.defaultTypeParamInUrl] = type;
    data[CONF.defaultTimestampParamInUrl] = (new Date()).getTime();
  }
  return data
};

var xhttp;
var imgElement;
var sendFunc;
sendFunc = {
  ajaxGet: function (url, callback) {
    if (!xhttp) {
      xhttp = new XMLHttpRequest();
    }
    xhttp.onerror = xhttp.onload = function () {
      callback && callback();
    };
    xhttp.open('GET', url);
    xhttp.send();
  },
  loadImage: function loadImage (url, callback) {
    if (!imgElement) imgElement = new Image();
    imgElement.src = url;
    imgElement.onerror = imgElement.onload = function () {
      callback && callback();
    };
  },
  loadScript: function (url, callback) {
    var statScriptEl = document.createElement('script');
    var $script = $(statScriptEl);
    $('head').append($script);
    $script.attr('type', 'text/javascript');
    $script.attr('src', url);
    statScriptEl.onerror = statScriptEl.onload = function () {
      callback && callback();
      var url = CONF.sendBy.url;
      if (Util.isFunction(url)) url = url();
      var $scriptOld = $('script[src^="' + url + '"]');
      if ($scriptOld) {
        $scriptOld.remove();
        $scriptOld = null;
      }
    };
  }
};

/**
 * [description]
 * @param  {String} type        [description]
 * @param  {Object|Node} target [description]
 * @param  {Function} callback  [description]
 * @return {[type]}             [description]
 */
var send = function (type, target, callback) {
  if (typeof type !== 'string') return false
  if (!target) return false
  var url = CONF.sendBy.url;
  if (Util.isFunction(url)) url = url();
  if (!Util.isString(url)) return false
  url += '?' + CONF.sendBy.argsStr(getUrlData(type, target));
  sendFunc[CONF.sendBy.type](url, callback);
  console.log(url);
};

/**
 * [bindDataToNode description]
 * @param  {Node} el     [description]
 * @param  {Object|String} data [description]
 * @return {[type]}      [description]
 */
function bindDataToNode (el, data) {
  if (Util.isString(data)) {
    $(el).attr(CONF.defaultDataAttr, data);
  } else if (Util.isObject(data)) {
    if (data.code && data.data) {
      $(el).attr(CONF.defaultCodeAttr, data.code);
      data = data.data;
    }
    Util.each(data, function (v, k) {
      $(el).attr(CONF.defaultDataAttr + '-' + k, v == null ? ''
        : (Util.isBasic(v) ? String(v) : JSON.stringify(v)));
    });
  }
}

/**
 * [description]
 * @param  {Node} el                  [description]
 * @param  {String|Array|Undefined} type [description]
 * @param  {Object|Undefined} data     [description]
 */
var bind = function (el, type, data) {

  if (Util.isObject(data)) bindDataToNode(el, data);

  if (Util.isArray(type)) {
    Util.each(type, function (v) {
      if (CONF.typeEnum[v]) bind(el, v);
    });
  } else if (Util.isString(type) && CONF.typeEnum[type]) {
    $(el).attr(CONF.eventToType[type], '');
  } else {
    Util.each(CONF.typeEnum, function (v, k) {
      bind(el, k);
    });
  }

};

/**
 * [description]
 * @param  {Node} el               [description]
 * @param  {String|Array|Undefined} type [description]
 */
var unbind = function (el, type) {
  if (Util.isString(type) && CONF.typeEnum[type]) {
    $(el).removeAttr(CONF.eventToType[type]);
  } else if (Util.isArray(type)) {
    Util.each(type, function (v) {
      if (CONF.typeEnum[v]) unbind(el, v);
    });
  } else {
    Util.each(CONF.typeEnum, function (v, k) {
      unbind(el, k);
    });
  }
};

/**
 * [description]
 * @param  {Node} el   [description]
 * @return {[type]}    [description]
 */
var check = function (el) {
  var r = {};
  var $el = $(el);
  Util.each(CONF.typeEnum, function (v, type) {
    if ($el.attr(CONF.eventToType[type]) == null) {
      r[type] = false;
    }
  });
  return r
};

function isInView (el, whole) {
  if ($(el).is(':hidden')) return false

  var eTop = $(el).offset().top;
  var eBottom = $(el).height() + eTop;
  var wTop = $(window).scrollTop();
  var wBottom = $(window).height() + wTop;

  if (!whole) {
    return !(eBottom <= wTop || eTop >= wBottom)
  } else {
    if (eBottom <= wTop)
      return 'eeww'
    if (eTop <= wTop && wTop <= eBottom && eBottom <= wBottom)
      return 'ewew'
    if (eTop <= wTop && eBottom >= wBottom)
      return 'ewwe'
    if (eTop >= wTop && eBottom <= wBottom)
      return 'weew'
    if (wTop <= eTop && eTop <= wBottom && wBottom <= eBottom)
      return 'wewe'
    if (eTop >= wBottom)
      return 'wwee'
    return false
  }
}

function historyEndsWithWholeInView (list) {
  var len = list.length;
  if (list[len - 1] === 'weew') return true
  if (list[len - 1] === 'wewe'
    && list[len - 2] === 'ewwe'
    && list[len - 3] === 'ewew') return true
  if (list[len - 1] === 'ewew'
    && list[len - 2] === 'ewwe'
    && list[len - 3] === 'wewe') return true
  return false
}

var forceAllViewStat = Util.throttle(function () {
    $('[' + CONF.eventToType[TYPE.view] + ']').each(function (i, el) {
      var $el = $(el);
      var once = true;
      var whole = false;

      var onceAttr = $el.attr(CONF.eventToType[TYPE.view] + '-once');
      if (String(onceAttr) === 'false') {
        once = false;
      }
      var wholeAttr = $el.attr(CONF.eventToType[TYPE.view] + '-whole');
      if (wholeAttr != null && String(wholeAttr) !== 'false') {
        whole = true;
      }

      var code = $el.attr(CONF.defaultCodeAttr);
      if (CONF.codeOptions[code] && CONF.codeOptions[code].view) {
        if (CONF.codeOptions[code].view.once === false) {
          once = false;
        }
        if (CONF.codeOptions[code].view.whole === true) {
          whole = true;
        }
      }

      var judge = isInView(el, whole);
      var prefix = CONF.typeAttrPrefix.replace('data-', '');
      if (!whole) {
        if (!judge) {
          $el.data(prefix + 'view-status', false);
          return
        } else {
          if ($el.data(prefix + 'view-status')) return
          $el.data(prefix + 'view-status', true);
        }
        send(TYPE.view, el);
        once && $el.removeAttr(CONF.eventToType[TYPE.view]);
      } else {
        if (!$el.data(prefix + 'view-status')) {
          $el.data(prefix + 'view-status', []);
        }
        var statusHistory = $el.data('stat-view-status');
        if (statusHistory[statusHistory.length - 1] === judge) return
        statusHistory.push(judge);
        if (historyEndsWithWholeInView(statusHistory)) {
          send(TYPE.view, el);
          once && $el.removeAttr(CONF.eventToType[TYPE.view]);
        }
      }
    });
  }, (typeof CONF.throttleForView === 'number' && CONF.throttleForView >= 100)
  ? CONF.throttleForView : 100
);

var forceAllLoadStat = function () {
  var $load = $('[' + CONF.eventToType[TYPE.load] + ']');
  if ($load.length) {
    $load.each(function (i, el) {
      send(TYPE.load, el, function () {
        $(el).removeAttr(CONF.eventToType[TYPE.load]);
      });
    });
  }
};

// stat_click
var initClick = function () {
  if (CONF.typeEnum[TYPE.click]) {
    $('body').on(TYPE.click, '[' + CONF.eventToType[TYPE.click] + ']', function (e) {
      send(TYPE.click, this);
    });
  }
};

// stat_load
var initLoad = function () {
  if (CONF.typeEnum[TYPE.load]) {
    forceAllLoadStat();
  }
};

// stat_view
var initView = function () {
  if (CONF.typeEnum[TYPE.view]) {
    forceAllViewStat();
    $(window).on('scroll', forceAllViewStat);
  }
};

var init = function (conf) {
  config(conf);

  initClick();
  initLoad();
  initView();
};

var index = {
  TYPE,
  init,
  initClick,
  initLoad,
  initView,
  config,
  bind,
  unbind,
  check,
  send,
  forceAllViewStat,
  forceAllLoadStat
};

exports.TYPE = TYPE;
exports.SEND_TYPE = SEND_TYPE;
exports.config = config;
exports.send = send;
exports.bind = bind;
exports.unbind = unbind;
exports.check = check;
exports.forceAllViewStat = forceAllViewStat;
exports.forceAllLoadStat = forceAllLoadStat;
exports.initClick = initClick;
exports.initLoad = initLoad;
exports.initView = initView;
exports.init = init;
exports['default'] = index;

Object.defineProperty(exports, '__esModule', { value: true });

})));

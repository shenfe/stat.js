(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.Stat = {})));
}(this, (function (exports) { 'use strict';

/* Polyfills */

var isNumber = function (v) {
    return typeof v === 'number';
};

var isNumeric = function (v) {
    var n = parseInt(v);
    if (isNaN(n)) return false;
    return (typeof v === 'number' || typeof v === 'string') && n == v;
};

var isString = function (v) {
    return typeof v === 'string';
};

var isFunction = function (v) {
    return typeof v === 'function';
};

var isObject = function (v) {
    return Object.prototype.toString.call(v) === '[object Object]';
};

var isArray = function (v) {
    return Object.prototype.toString.call(v) === '[object Array]';
};

var isBasic = function (v) {
    return v == null
        || typeof v === 'boolean'
        || typeof v === 'number'
        || typeof v === 'string'
        || typeof v === 'function';
};

var isNode = function (v) {
    if (typeof Node !== 'function') return false;
    return v instanceof Node;
};

var isNamedNodeMap = function (v) {
    return v instanceof NamedNodeMap;
};

var each = function (v, func, arrayReverse) {
    if (isObject(v)) {
        for (var p in v) {
            if (!v.hasOwnProperty(p)) continue;
            var r = func(v[p], p);
            if (r === false) break;
        }
    } else if (isArray(v)) {
        if (!arrayReverse) {
            for (var i = 0, len = v.length; i < len; i++) {
                var r = func(v[i], i);
                if (r === false) break;
            }
        } else {
            for (var i = v.length - 1; i >= 0; i--) {
                var r = func(v[i], i);
                if (r === false) break;
            }
        }
    } else if (isNode(v)) {
        var ret = false;
        switch (v.nodeType) {
            case Node.ELEMENT_NODE:
                break;
            case Node.TEXT_NODE:
            case Node.COMMENT_NODE:
            case Node.PROCESSING_INSTRUCTION_NODE:
            case Node.DOCUMENT_NODE:
            case Node.DOCUMENT_TYPE_NODE:
            case Node.DOCUMENT_FRAGMENT_NODE:
            default:
                ret = true;
        }
        if (ret) return;
        for (var i = 0, childNodes = v.childNodes, len = v.childNodes.length; i < len; i++) {
            func(childNodes[i]);
            each(childNodes[i], func);
        }
    } else if (isNamedNodeMap(v)) {
        for (var i = 0, len = v.length; i < len; i++) {
            var r = func(v[i]['nodeValue'], v[i]['nodeName']);
            if (r === false) break;
        }
    } else if (Util.isFunction(v.forEach)) {
        v.forEach(func);
    }
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
    return r;
};

var hasProperty = function (val, p) {
    if (isObject(val)) {
        return val.hasOwnProperty(p);
    } else if (isArray(val)) {
        var n = parseInt(p);
        return isNumeric(p) && val.length > n && n >= 0;
    }
    return false;
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
            else return false;
        }, true);
        while (arr.length < len) {
            arr.push(null);
        }
    }
    return arr;
};

var extend = function (dest, srcs, clean) {
    if (!isObject(dest)) return null;
    var args = Array.prototype.slice.call(arguments, 1,
        arguments[arguments.length - 1] === true ? (arguments.length - 1) : arguments.length);

    function extendObj(obj, src, clean) {
        if (!isObject(src)) return;
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
    return dest;
};

/**
 * throttle节流函数
 * @refer https://stackoverflow.com/a/27078401
 */
function throttle(func, wait, options) {
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
        return result;
    };
}

/**
 * [parseDataFromString description]
 * @param  {String} str [description]
 * @return {Object}     [description]
 */
function parseDataFromString(str) {
    var r = null;
    try {
        r = JSON.parse(str);
    } catch (e) {
        r = str;
    }
    return r;
}

/**
 * [setCommonData description]
 * @param {Object} data [description]
 */
function setCommonData(data) {
    data._ = '' + (new Date()).getTime() + '_' + String(Math.random()).substr(2, 4);
}

/**
 * Get code and data in a Node.
 * @param  {Node} el    [description]
 * @return {Object}     [description]
 */
function getDataOfNode(el) {
    var data = {};

    var code = el.getAttribute(CONF.defaultCodeAttr);
    if (code != null) {
        data[CONF.defaultCodeParamInUrl] = code;
        var codeConf = CONF.codeOptions[code];
        if (codeConf) {
            var extraData;
            if (isFunction(codeConf.data)) {
                extraData = codeConf.data.call(el, el);
            } else if (isObject(codeConf.data)) {
                extraData = codeConf.data;
            }
            if (isObject(extraData)) {
                extend(data, extraData);
            }
        }
    }

    var attrData = el.getAttribute(CONF.defaultDataAttr);
    if (attrData != null) {
        attrData = parseDataFromString(attrData);
        if (!isObject(attrData)) {
            var t = String(attrData);
            attrData = {};
            attrData[CONF.defaultDataParamInUrl] = t;
        }
    } else {
        attrData = {};
        each(el.attributes, function (value, name) {
            if (name.startsWith(CONF.defaultDataAttr + '-')) {
                attrData[name.substr(CONF.defaultDataAttr.length + 1)] = value;
            }
        });
    }
    extend(data, attrData);

    return data;
}

/**
 * [queryParamStringifyData description]
 * @param  {?} data      [description]
 * @return {String}      [description]
 */
function queryParamStringifyData(data) {
    if (data == null) return '';
    if (isBasic(data)) return encodeURIComponent(String(data));
    return encodeURIComponent(JSON.stringify(data));
}

/**
 * [queryStringifyObject description]
 * @param  {Object} obj [description]
 * @return {String}     [description]
 */
function queryStringifyObject(obj) {
    var r = [];
    each(obj, function (v, p) {
        r.push(queryParamStringifyData(p) + '=' + queryParamStringifyData(v));
    });
    return r.join('&');
}

/**
 * [loadScript description]
 * @param  {String}   url      [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function loadScript(url, callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    if (script.readyState) { // IE
        script.onreadystatechange = function () {
            if (script.readyState === 'loaded' || script.readyState === 'complete') {
                script.onreadystatechange = null;
                callback && callback();
            }
        };
    } else {
        script.onload = function () {
            callback && callback();
        };
    }
    script.src = url;
    (document.getElementsByTagName('head')[0] || document.body).appendChild(script);
}

/**
 * [loadImage description]
 * @param  {String}   url      [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function loadImage(url, callback) {
    var img = new Image();
    img.src = url;
    if (callback) img.onload = callback;
}

var CONF = {
    loopForLoad: true,
    throttleForView: 100,
    typeEnum: {
        'click': true,
        'view': true,
        'load': true
    },
    typeAttrPrefix: 'stat-',
    defaultCodeAttr: 'stat-code',
    defaultDataAttr: 'stat-data',
    defaultTypeParamInUrl: 'stat_type',
    defaultCodeParamInUrl: 'stat_code',
    defaultDataParamInUrl: 'stat_data',
    sendBy: {
        type: 'image',
        url: '/',
        argsStr: queryStringifyObject
    },
    codeOptions: {}
};
(function () {
    CONF.eventToType = {};
    CONF.typeAttrEnum = {};
    each(CONF.typeEnum, function (v, p) {
        CONF.eventToType[p] = CONF.typeAttrPrefix + p;
        CONF.typeAttrEnum[CONF.typeAttrPrefix + p] = v;
    });
})();

/**
 * [description]
 * @param  {Object} conf [description]
 * @return {[type]}      [description]
 */
var config = function (conf) {
    if (!isObject(conf)) return false;
    each(conf, function (v, p) {
        if (CONF.hasOwnProperty(p)) {
            CONF[p] = (isBasic(v) || isBasic(CONF[p])) ? v : extend(CONF[p], v);
        } else {
            CONF.codeOptions[p] = v;
        }
    });
};

/**
 * [bindDataToNode description]
 * @param  {Node} el     [description]
 * @param  {Object|String} data [description]
 * @return {[type]}      [description]
 */
function bindDataToNode(el, data) {
    if (isString(data)) {
        $(el).attr(CONF.defaultDataAttr, data);
    } else if (isObject(data)) {
        if (data.code && data.data) {
            $(el).attr(CONF.defaultCodeAttr, data.code);
            data = data.data;
        }
        each(data, function (v, p) {
            $(el).attr(CONF.defaultDataAttr + '-' + p, v == null ? ''
                : (isBasic(v) ? String(v) : JSON.stringify(v)));
        });
    }
}

/**
 * [description]
 * @param  {Node} el                  [description]
 * @param  {String|Array|Object} type [description]
 * @param  {Object|Undefined} obj     [description]
 * @return {[type]}                   [description]
 */
var bind = function (el, type, obj) {
    if (isObject(obj)) bindDataToNode(el, obj);
    if (isObject(type)) {
        bindDataToNode(el, type);
    } else if (isString(type)) {
        if (type === 'all') {
            each(CONF.typeEnum, function (v, p) {
                bind(el, p);
            });
        } else if (CONF.typeEnum[type]) {
            $(el).attr(CONF.eventToType[type], '');
        }
    } else if (isArray(type)) {
        each(type, function (v) {
            bind(el, v);
        });
    }
};

/**
 * [description]
 * @param  {Node} el               [description]
 * @param  {String|Undefined} type [description]
 * @return {[type]}                [description]
 */
var unbind = function (el, type) {
    if (!type || type === 'all') {
        each(CONF.typeEnum, function (v, p) {
            unbind(el, p);
        });
    } else if (CONF.typeEnum[type]) {
        $(el).removeAttr(CONF.eventToType[type]);
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
    each(CONF.typeEnum, function (v, type) {
        if ($el.attr(CONF.eventToType[type]) == null) {
            r[type] = false;
        }
    });
    return r;
};

/**
 * [description]
 * @param  {String} type        [description]
 * @param  {Object|Node} target [description]
 * @param  {Function} callback  [description]
 * @return {[type]}             [description]
 */
var send = function (type, target, callback) {
    if (typeof type !== 'string') return false;
    var data = {};
    data[CONF.defaultTypeParamInUrl] = type;
    if (isNode(target)) {
        extend(data, getDataOfNode(target));
    } else if (isObject(target)) {
        if (target.code && target.data) {
            var t = target;
            target = t.data;
            target[CONF.defaultCodeParamInUrl] = t.code;
        }
        extend(data, target);
    } else {
        return false;
    }
    setCommonData(data);

    var url = CONF.sendBy.url;
    if (isFunction(url)) url = url();
    if (!isString(url)) return false;
    url += '?' + CONF.sendBy.argsStr(data);
    switch (CONF.sendBy.type) {
        case 'script':
            loadScript(url, callback);
            break;
        case 'image':
        default:
            loadImage(url, callback);
    }

    console.log(url);
};

function isInView(el, whole) {
    var eTop = $(el).offset().top;
    var eBottom = $(el).height() + eTop;
    var wTop = $(window).scrollTop();
    var wBottom = $(window).height() + wTop;

    if (!whole) {
        return !(eBottom <= wTop || eTop >= wBottom);
    } else {
        if (eBottom <= wTop)
            return 'eeww';
        if (eTop <= wTop && wTop <= eBottom && eBottom <= wBottom)
            return 'ewew';
        if (eTop <= wTop && eBottom >= wBottom)
            return 'ewwe';
        if (eTop >= wTop && eBottom <= wBottom)
            return 'weew';
        if (wTop <= eTop && eTop <= wBottom && wBottom <= eBottom)
            return 'wewe';
        if (eTop >= wBottom)
            return 'wwee';
        return false;
    }
}

function historyEndsWithWholeInView(list) {
    var len = list.length;
    if (list[len - 1] === 'weew') return true;
    if (list[len - 1] === 'wewe'
        && list[len - 2] === 'ewwe'
        && list[len - 3] === 'ewew') return true;
    if (list[len - 1] === 'ewew'
        && list[len - 2] === 'ewwe'
        && list[len - 3] === 'wewe') return true;
    return false;
}

var forceAllViewStat = throttle(function () {
    $('[' + CONF.eventToType['view'] + ']').each(function (i, el) {
        var $el = $(el);
        var once = true;
        var whole = false;

        determine_once_and_whole: {
            var onceAttr = $el.attr(CONF.eventToType['view'] + '-once');
            if (String(onceAttr) === 'false') {
                once = false;
            }
            var wholeAttr = $el.attr(CONF.eventToType['view'] + '-whole');
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
        }

        var judge = isInView(el, whole);
        if (!whole) {
            if (!judge) {
                $el.data('stat-view-status', false);
                return;
            } else {
                if ($el.data('stat-view-status')) return;
                $el.data('stat-view-status', true);
            }
            send('view', el);
            once && $el.removeAttr(CONF.eventToType['view']);
        } else {
            if (!$el.data('stat-view-status')) {
                $el.data('stat-view-status', []);
            }
            var statusHistory = $el.data('stat-view-status');
            if (statusHistory[statusHistory.length - 1] === judge) return;
            statusHistory.push(judge);
            if (historyEndsWithWholeInView(statusHistory)) {
                send('view', el);
                once && $el.removeAttr(CONF.eventToType['view']);
            }
        }
    });
}, (typeof CONF.throttleForView === 'number' && CONF.throttleForView >= 100)
    ? CONF.throttleForView : 100
);

var init = function () {
    stat_click: {
        $('body').on('click', '[' + CONF.eventToType['click'] + ']', function (e) {
            send('click', this);
        });
    }

    stat_load: {
        function sendAllLoadStat() {
            $('[' + CONF.eventToType['load'] + ']').each(function (i, el) {
                send('load', el, function () {
                    $(el).removeAttr(CONF.eventToType['load']);
                });
            });
        }
        sendAllLoadStat();
        CONF.loopForLoad && window.setInterval(
            sendAllLoadStat,
            (typeof CONF.loopForLoad === 'number' && CONF.loopForLoad > 100) ? CONF.loopForLoad : 1000
        );
    }

    stat_view: {
        forceAllViewStat();
        $(window).on('scroll', forceAllViewStat);
    }
};

$(init);

exports.config = config;
exports.bind = bind;
exports.unbind = unbind;
exports.check = check;
exports.send = send;
exports.forceAllViewStat = forceAllViewStat;

Object.defineProperty(exports, '__esModule', { value: true });

})));

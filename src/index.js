import './Polyfill'

import * as Util from './Util'

import $ from 'jQueryOrZepto'

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
            if (Util.isFunction(codeConf.data)) {
                extraData = codeConf.data.call(el, el);
            } else if (Util.isObject(codeConf.data)) {
                extraData = codeConf.data;
            }
            if (Util.isObject(extraData)) {
                Util.extend(data, extraData);
            }
        }
    }

    var attrData = el.getAttribute(CONF.defaultDataAttr);
    if (attrData != null) {
        attrData = parseDataFromString(attrData);
        if (!Util.isObject(attrData)) {
            var t = String(attrData);
            attrData = {};
            attrData[CONF.defaultDataParamInUrl] = t;
        }
    } else {
        attrData = {};
        Util.each(el.attributes, function (attr) {
            var name = attr.name, value = attr.value;
            if (name.startsWith(CONF.defaultDataAttr + '-')) {
                attrData[name.substr(CONF.defaultDataAttr.length + 1)] = value;
            }
        });
    }
    Util.extend(data, attrData);

    return data;
}

/**
 * [queryParamStringifyData description]
 * @param  {?} data      [description]
 * @return {String}      [description]
 */
function queryParamStringifyData(data) {
    if (data == null) return '';
    if (Util.isBasic(data)) return encodeURIComponent(String(data));
    return encodeURIComponent(JSON.stringify(data));
}

/**
 * [queryStringifyObject description]
 * @param  {Object} obj [description]
 * @return {String}     [description]
 */
function queryStringifyObject(obj) {
    var r = [];
    Util.each(obj, function (v, p) {
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
    Util.each(CONF.typeEnum, function (v, p) {
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
    if (!Util.isObject(conf)) return false;
    Util.each(conf, function (v, p) {
        if (CONF.hasOwnProperty(p)) {
            CONF[p] = v;
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
    if (Util.isString(data)) {
        $(el).attr(CONF.defaultDataAttr, data);
    } else if (Util.isObject(data)) {
        Util.each(data, function (v, p) {
            $(el).attr(CONF.defaultDataAttr + '-' + p, v == null ? ''
                : (Util.isBasic(v) ? String(v) : JSON.stringify(v)));
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
    if (Util.isObject(obj)) bindDataToNode(el, obj);
    if (Util.isObject(type)) {
        bindDataToNode(el, type);
    } else if (Util.isString(type)) {
        if (type === 'all') {
            Util.each(CONF.typeEnum, function (v, p) {
                bind(el, p);
            });
        } else if (CONF.typeEnum[type]) {
            $(el).attr(CONF.eventToType[type], '');
        }
    } else if (Util.isArray(type)) {
        Util.each(type, function (v) {
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
        Util.each(CONF.typeEnum, function (v, p) {
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
    Util.each(CONF.typeEnum, function (v, type) {
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
 * @return {[type]}             [description]
 */
var send = function (type, target) {
    if (typeof type !== 'string') return false;
    var data = {};
    data[CONF.defaultTypeParamInUrl] = type;
    if (Util.isNode(target)) {
        Util.extend(data, getDataOfNode(target));
    } else if (Util.isObject(target)) {
        Util.extend(data, target);
    } else {
        return false;
    }
    setCommonData(data);

    var url = CONF.sendBy.url;
    if (Util.isFunction(url)) url = url();
    if (!Util.isString(url)) return false;
    url += '?' + CONF.sendBy.argsStr(data);
    switch (CONF.sendBy.type) {
        case 'image':
            loadImage(url);
            break;
        case 'script':
            loadScript(url);
            break;
        default:
    }

    console.log(url);
};

var init = function () {
    $('body').on('click', '[' + CONF.eventToType['click'] + ']', function (e) {
        send('click', this);
    });
};

$(init);

export { config, bind, unbind, check, send }

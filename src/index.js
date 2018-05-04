import './Polyfill'

import * as Util from './Util'

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
        Util.each(el.attributes, function (value, name) {
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
    var parent = document.getElementsByTagName('head')[0] || document.body;
    var script = document.createElement('script');
    script.type = 'text/javascript';
    if (script.readyState) { // IE
        script.onreadystatechange = function () {
            if (script.readyState === 'loaded' || script.readyState === 'complete') {
                script.onreadystatechange = null;
                callback && callback();
                parent.removeChild(script);
                script = null;
                parent = null;
            }
        };
    } else {
        script.onload = function () {
            callback && callback();
            parent.removeChild(script);
        };
    }
    script.src = url;
    parent.appendChild(script);
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
            CONF[p] = (Util.isBasic(v) || Util.isBasic(CONF[p])) ? v : Util.extend(CONF[p], v);
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
        if (data.code && data.data) {
            $(el).attr(CONF.defaultCodeAttr, data.code);
            data = data.data;
        }
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
 * @param  {Function} callback  [description]
 * @return {[type]}             [description]
 */
var send = function (type, target, callback) {
    if (typeof type !== 'string') return false;
    var data = {};
    data[CONF.defaultTypeParamInUrl] = type;
    if (Util.isNode(target)) {
        Util.extend(data, getDataOfNode(target));
    } else if (Util.isObject(target)) {
        if (target.code && target.data) {
            var t = target;
            target = t.data;
            target[CONF.defaultCodeParamInUrl] = t.code;
        }
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
    if ($(el).is(':hidden')) return false;
    
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

var forceAllViewStat = Util.throttle(function () {
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
            var callback;
            var ohref;
            if (this.nodeName.toLowerCase() === 'a') {
                if (this.protocol !== 'javascript:') {
                    ohref = this.href;
                    this.setAttribute('data-href', ohref);
                    this.href = 'javascript:void(0);';
                } else if (this.hasAttribute('data-href')) {
                    ohref = this.getAttribute('data-href');
                }
                if (ohref) {
                    callback = function () {
                        location.href = ohref;
                    };
                }
            }
            send('click', this, callback);
        });
    }

    stat_load: {
        var sendAllLoadStat = function () {
            $('[' + CONF.eventToType['load'] + ']').each(function (i, el) {
                send('load', el, function () {
                    $(el).removeAttr(CONF.eventToType['load']);
                });
            });
        };
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

export { config, bind, unbind, check, send, forceAllViewStat }

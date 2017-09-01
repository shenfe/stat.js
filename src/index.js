import './Polyfill'

import * as Util from './Util'

import $ from 'jQueryOrZepto'

function select(sel) {
    return $(sel);
}

var CONF = {
    typeAttrEnum: {
        'stat-click': true,
        'stat-view': true,
        'stat-load': true
    },
    typeAttrPrefix: 'stat-',
    defaultCodeAttr: 'stat-code',
    defaultDataAttr: 'stat-data',
    defaultTypeParamInUrl: 'stat_type',
    defaultCodeParamInUrl: 'stat_code',
    defaultDataParamInUrl: 'stat_data',
    send: function () {},
    codeOptions: {}
};

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
    data.time = (new Date()).getTime();
}

/**
 * [getDataOfNode description]
 * @param  {Node} el    [description]
 * @return {Object}     [description]
 */
function getDataOfNode(el) {
    var data = el.getAttribute(CONF.defaultDataAttr);
    if (data != null) {
        data = parseDataFromString(data);
        if (!Util.isObject(data)) {
            var t = String(data);
            data = {};
            data[CONF.defaultDataParamInUrl] = t;
        }
    } else {
        data = {};
        Util.each(el.attributes, function (attr) {
            var name = attr.name, value = attr.value;
            if (name.startsWith(CONF.defaultDataAttr + '-')) { // param data
                data[name.substr(CONF.defaultDataAttr.length + 1)] = value;
            } else if (CONF.typeAttrEnum[name]) { // type
                data[CONF.defaultTypeParamInUrl] = name.substr(CONF.typeAttrPrefix.length);
            } else if (name === CONF.defaultCodeAttr) { // code
                data[CONF.defaultCodeParamInUrl] = value;
            }
        });
    }
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

var config = function (conf) {};

var bind = function () {};

var unbind = function () {};

var check = function () {};

var send = function () {};

export { config, bind, unbind, check, send, select }

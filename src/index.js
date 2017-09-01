import './Polyfill'

import * as Util from './Util'

import $ from 'jQueryOrZepto'

function select(sel) {
    return $(sel);
}

var CONF = {
    defaultDataAttr: 'stat-data',
    defaultDataParamName: 'stat_data',
    send: function () {},
    statKeys: {}
};

function queryStringifyData(data, paramName) {
    function parseData(data) {
        var r = null;
        try {
            r = JSON.parse(data);
        } catch (e) {
            r = data;
        }
        return r;
    }
    function queryParamStringifyData(data) {
        if (Util.isBasic(data)) return encodeURIComponent(String(data));
        return encodeURIComponent(JSON.stringify(data));
    }
    data = parseData(data);
    if (!Util.isObject(data)) {
        if (typeof paramName !== 'string') paramName = CONF.defaultDataParamName;
        return queryParamStringifyData(paramName) + '=' + queryParamStringifyData(data);
    }
    var r = [];
    Util.each(data, function (v, p) {
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

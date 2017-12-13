import './Polyfill'

import Util from './Util'

export var TYPE = {
  click: 'click',
  view: 'view',
  load: 'load'
}

export var SEND_TYPE = {
  ajax: 'ajaxGet',
  script: 'loadScript',
  image: 'loadImage'
}

var CONF = {
  commonData: false,
  throttleForView: 100,
  eventToType: {},
  typeEnum: {},
  excludeType: [],
  typeAttrPrefix: 'stat-',
  defaultCodeAttr: 'stat-code',
  defaultDataAttr: 'stat-data',
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
}

/**
 * [description]
 * @param  {Object} conf [description]
 * @return {[type]}      [description]
 */
export var config = function (conf) {
  if (!Util.isObject(conf)) return false
  Util.each(conf, function (v, k) {
    if (CONF.hasOwnProperty(k)) {
      if (!Util.isObject(CONF[k])) {
        CONF[k] = v
      } else {
        Util.extend(CONF[k], v)
      }
    } else {
      CONF.codeOptions[k] = v
    }
  })
  Util.each(TYPE, function (v, k) {
    var attrName = CONF.typeAttrPrefix + v
    CONF.eventToType[v] = attrName
    CONF.typeEnum[v] = true
    if (CONF.excludeType.indexOf(v) !== -1) {
      CONF.typeEnum[v] = false
    }
  })
}

config()

/**
 * [parseDataFromString description]
 * @param  {String} str [description]
 * @return {Object}     [description]
 */
function parseDataFromString (str) {
  var r = null
  try {
    r = JSON.parse(str)
  } catch (e) {
    r = str
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
  var r = []
  Util.each(obj, function (v, k) {
    r.push(queryParamStringifyData(k) + '=' + queryParamStringifyData(v))
  })
  return r.join('&')
}

/**
 * Get code and data in a Node.
 * @param  {Node} el    [description]
 * @return {Object}     [description]
 */
function getDataOfNode (el) {
  var data = {}
  var code = el.getAttribute(CONF.defaultCodeAttr)
  if (code) {
    data[CONF.defaultCodeParamInUrl] = code
    var codeConf = CONF.codeOptions[code]
    if (codeConf) {
      var extraData = codeConf.data
      if (Util.isFunction(codeConf.data)) {
        extraData = codeConf.data.call(el, el)
      }
      if (Util.isObject(extraData)) {
        Util.extend(data, extraData)
      }
    }
  }

  var statData = el.getAttribute(CONF.defaultDataAttr)
  if (statData) {
    statData = parseDataFromString(statData)
    if (!Util.isObject(statData)) {
      var t = String(statData)
      statData = {}
      statData[CONF.defaultDataParamInUrl] = t
    }
  } else {
    statData = {}
    Util.each(el.attributes, function (value, name) {
      if (name.startsWith(CONF.defaultDataAttr + '-')) {
        statData[name.substr(CONF.defaultDataAttr.length + 1)] = value
      }
    })
  }
  Util.extend(data, statData)

  return data
}

function getDataOfObj (obj) {
  var data = {}
  var code = obj.code
  if (code) {
    data[CONF.defaultCodeParamInUrl] = code
    var codeConf = CONF.codeOptions[code]
    if (codeConf) {
      var extraData = codeConf.data
      if (Util.isObject(extraData)) {
        Util.extend(data, extraData)
      }
    }
  }
  var statData = obj.data
  if (statData) {
    if (!Util.isObject(statData)) {
      var t = String(statData)
      statData = {}
      statData[CONF.defaultDataParamInUrl] = t
    }
    Util.extend(data, statData)
  }
  return data
}

var getUrlData = function (type, elOrObj) {
  var data = {}
  if (Util.isNode(elOrObj)) {
    Util.extend(data, getDataOfNode(elOrObj))
  } else {
    Util.extend(data, getDataOfObj(elOrObj))
  }
  if (CONF.commonData) {
    data[CONF.defaultTypeParamInUrl] = type
    data[CONF.defaultTimestampParamInUrl] = (new Date()).getTime()
  }
  return data
}

var xhttp, imgElement, sendFunc
sendFunc = {
  ajaxGet: function (url, callback) {
    if (!xhttp) {
      xhttp = new XMLHttpRequest()
    }
    xhttp.onerror = xhttp.onload = function () {
      callback && callback()
    }
    xhttp.open('GET', url)
    xhttp.send()
  },
  loadImage: function loadImage (url, callback) {
    if (!imgElement) imgElement = new Image()
    imgElement.src = url
    imgElement.onerror = imgElement.onload = function () {
      callback && callback()
    }
  },
  loadScript: function (url, callback) {
    var statScriptEl = document.createElement('script')
    var $script = $(statScriptEl)
    $('head').append($script)
    $script.attr('type', 'text/javascript')
    $script.attr('src', url)
    statScriptEl.onerror = statScriptEl.onload = function () {
      callback && callback()
      var url = CONF.sendBy.url
      if (Util.isFunction(url)) url = url()
      var $scriptOld = $('script[src^="' + url + '"]')
      if ($scriptOld) {
        $scriptOld.remove()
        $scriptOld = null
      }
    }
  }
}

/**
 * [description]
 * @param  {String} type        [description]
 * @param  {Object|Node} target [description]
 * @param  {Function} callback  [description]
 * @return {[type]}             [description]
 */
export var send = function (type, target, callback) {
  if (typeof type !== 'string') return false
  if (!target) return false
  var url = CONF.sendBy.url
  if (Util.isFunction(url)) url = url()
  if (!Util.isString(url)) return false
  url += '?' + CONF.sendBy.argsStr(getUrlData(type, target))
  sendFunc[CONF.sendBy.type](url, callback)
  console.log(url)
}

/**
 * [bindDataToNode description]
 * @param  {Node} el     [description]
 * @param  {Object|String} data [description]
 * @return {[type]}      [description]
 */
function bindDataToNode (el, data) {
  if (Util.isString(data)) {
    $(el).attr(CONF.defaultDataAttr, data)
  } else if (Util.isObject(data)) {
    if (data.code && data.data) {
      $(el).attr(CONF.defaultCodeAttr, data.code)
      data = data.data
    }
    Util.each(data, function (v, k) {
      $(el).attr(CONF.defaultDataAttr + '-' + k, v == null ? ''
        : (Util.isBasic(v) ? String(v) : JSON.stringify(v)))
    })
  }
}

/**
 * [description]
 * @param  {Node} el                  [description]
 * @param  {String|Array|Undefined} type [description]
 * @param  {Object|Undefined} data     [description]
 */
export var bind = function (el, type, data) {

  if (Util.isObject(data)) bindDataToNode(el, data)

  if (Util.isArray(type)) {
    Util.each(type, function (v) {
      if (CONF.typeEnum[v]) bind(el, v)
    })
  } else if (Util.isString(type) && CONF.typeEnum[type]) {
    $(el).attr(CONF.eventToType[type], '')
  } else {
    Util.each(CONF.typeEnum, function (v, k) {
      bind(el, k)
    })
  }

}

/**
 * [description]
 * @param  {Node} el               [description]
 * @param  {String|Array|Undefined} type [description]
 */
export var unbind = function (el, type) {
  if (Util.isString(type) && CONF.typeEnum[type]) {
    $(el).removeAttr(CONF.eventToType[type])
  } else if (Util.isArray(type)) {
    Util.each(type, function (v) {
      if (CONF.typeEnum[v]) unbind(el, v)
    })
  } else {
    Util.each(CONF.typeEnum, function (v, k) {
      unbind(el, k)
    })
  }
}

/**
 * [description]
 * @param  {Node} el   [description]
 * @return {[type]}    [description]
 */
export var check = function (el) {
  var r = {}
  var $el = $(el)
  Util.each(CONF.typeEnum, function (v, type) {
    if ($el.attr(CONF.eventToType[type]) == null) {
      r[type] = false
    }
  })
  return r
}

function isInView (el, whole) {
  if ($(el).is(':hidden')) return false

  var eTop = $(el).offset().top
  var eBottom = $(el).height() + eTop
  var wTop = $(window).scrollTop()
  var wBottom = $(window).height() + wTop

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
  var len = list.length
  if (list[len - 1] === 'weew') return true
  if (list[len - 1] === 'wewe'
    && list[len - 2] === 'ewwe'
    && list[len - 3] === 'ewew') return true
  if (list[len - 1] === 'ewew'
    && list[len - 2] === 'ewwe'
    && list[len - 3] === 'wewe') return true
  return false
}

export var forceAllViewStat = Util.throttle(function () {
    $('[' + CONF.eventToType[TYPE.view] + ']').each(function (i, el) {
      var $el = $(el)
      var once = true
      var whole = false

      var onceAttr = $el.attr(CONF.eventToType[TYPE.view] + '-once')
      if (String(onceAttr) === 'false') {
        once = false
      }
      var wholeAttr = $el.attr(CONF.eventToType[TYPE.view] + '-whole')
      if (wholeAttr != null && String(wholeAttr) !== 'false') {
        whole = true
      }

      var code = $el.attr(CONF.defaultCodeAttr)
      if (CONF.codeOptions[code] && CONF.codeOptions[code].view) {
        if (CONF.codeOptions[code].view.once === false) {
          once = false
        }
        if (CONF.codeOptions[code].view.whole === true) {
          whole = true
        }
      }

      var judge = isInView(el, whole)
      if (!whole) {
        if (!judge) {
          $el.data('stat-view-status', false)
          return
        } else {
          if ($el.data('stat-view-status')) return
          $el.data('stat-view-status', true)
        }
        send(TYPE.view, el)
        once && $el.removeAttr(CONF.eventToType[TYPE.view])
      } else {
        if (!$el.data('stat-view-status')) {
          $el.data('stat-view-status', [])
        }
        var statusHistory = $el.data('stat-view-status')
        if (statusHistory[statusHistory.length - 1] === judge) return
        statusHistory.push(judge)
        if (historyEndsWithWholeInView(statusHistory)) {
          send(TYPE.view, el)
          once && $el.removeAttr(CONF.eventToType[TYPE.view])
        }
      }
    })
  }, (typeof CONF.throttleForView === 'number' && CONF.throttleForView >= 100)
  ? CONF.throttleForView : 100
)

export var forceAllLoadStat = function () {
  var $load = $('[' + CONF.eventToType[TYPE.load] + ']')
  if ($load.length) {
    $load.each(function (i, el) {
      send(TYPE.load, el, function () {
        $(el).removeAttr(CONF.eventToType[TYPE.load])
      })
    })
  }
}

// stat_click
export var initClick = function () {
  if (CONF.typeEnum[TYPE.click]) {
    $('body').on(TYPE.click, '[' + CONF.eventToType[TYPE.click] + ']', function (e) {
      send(TYPE.click, this)
    })
  }
}

// stat_load
export var initLoad = function () {
  if (CONF.typeEnum[TYPE.load]) {
    forceAllLoadStat()
  }
}

// stat_view
export var initView = function () {
  if (CONF.typeEnum[TYPE.view]) {
    forceAllViewStat()
    $(window).on('scroll', forceAllViewStat)
  }
}

export var init = function (conf) {
  config(conf)

  initClick()
  initLoad()
  initView()
}

export default {
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
}

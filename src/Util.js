export var gid = (function () {
  var n = 0
  return function () {
    return n++
  }
})()

export var isBoolean = function (v) {
  return typeof v === 'boolean'
}

export var isNumber = function (v) {
  return typeof v === 'number'
}

export var isNumeric = function (v) {
  var n = parseInt(v)
  if (isNaN(n)) return false
  return (typeof v === 'number' || typeof v === 'string') && n == v
}

export var isString = function (v) {
  return typeof v === 'string'
}

export var isFunction = function (v) {
  return typeof v === 'function'
}

export var isObject = function (v) {
  return v != null && Object.prototype.toString.call(v) === '[object Object]'
}

export var isArray = function (v) {
  return Object.prototype.toString.call(v) === '[object Array]'
}

export var isBasic = function (v) {
  return v == null
    || typeof v === 'boolean'
    || typeof v === 'number'
    || typeof v === 'string'
    || typeof v === 'function'
}

export var isInstance = function (v, creator) {
  return typeof creator === 'function' && v instanceof creator
}

export var isDirectInstance = function (v, creator) {
  return v.constructor === creator
}

export var isNode = function (v) {
  if (typeof Node !== 'function') return false
  return v instanceof Node
}

export var isNamedNodeMap = function (v) {
  return v instanceof NamedNodeMap
}

export var isEventName = function (v) {
  if (!isString(v)) return false
  return v.startsWith('on') // TODO
}

export var isCSSSelector = function (v) {
  return v.indexOf(' ') > 0 || v.indexOf('.') >= 0
    || v.indexOf('[') >= 0 || v.indexOf('#') >= 0
}

export var each = function (v, func, arrayReverse) {
  if (isObject(v)) {
    for (var p in v) {
      if (!v.hasOwnProperty(p)) continue
      var r = func(v[p], p)
      if (r === false) break
    }
  } else if (isArray(v)) {
    if (!arrayReverse) {
      for (var i = 0, len = v.length; i < len; i++) {
        var r = func(v[i], i)
        if (r === false) break
      }
    } else {
      for (var i = v.length - 1; i >= 0; i--) {
        var r = func(v[i], i)
        if (r === false) break
      }
    }
  } else if (isNode(v)) {
    var ret = false
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
        ret = true
    }
    if (ret) return
    for (var i = 0, childNodes = v.childNodes, len = v.childNodes.length; i < len; i++) {
      func(childNodes[i])
      each(childNodes[i], func)
    }
  } else if (isNamedNodeMap(v)) {
    for (var i = 0, len = v.length; i < len; i++) {
      var r = func(v[i]['nodeValue'], v[i]['nodeName'])
      if (r === false) break
    }
  } else if (isFunction(v.forEach)) {
    v.forEach(func)
  }
}

export var eachUnique = function (arr, func) {
  if (!isArray(arr)) return
  var map = {}
  for (var i = 0, len = arr.length; i < len; i++) {
    if (!isNumber(arr[i]) || !isString(arr[i]) || map[arr[i]]) continue
    map[arr[i]] = true
    var r = func(arr[i])
    if (r === false) break
  }
}

export var unique = function (arr) {
  var r = []
  eachUnique(arr, function (v) {
    r.push(v)
  })
  return r
}

export var clone = function (val) {
  var r = val
  if (isObject(val)) {
    r = {}
    each(val, function (v, p) {
      r[p] = clone(v)
    })
  } else if (isArray(val)) {
    r = []
    each(val, function (v) {
      r.push(clone(v))
    })
  }
  return r
}

export var hasProperty = function (val, p) {
  if (isObject(val)) {
    return val.hasOwnProperty(p)
  } else if (isArray(val)) {
    var n = parseInt(p)
    return isNumeric(p) && val.length > n && n >= 0
  }
  return false
}

export var clear = function (val, p, withBasicVal) {
  var inRef = isString(p) || isNumber(p)
  var target = inRef ? val[p] : val

  if (isObject(target) || isArray(target)) {
    each(target, function (v, p) {
      clear(target, p)
    })
    if (isArray(target)) {
      shrinkArray(target)
    }
  }

  if (inRef) {
    val[p] = withBasicVal
  }
}

export var shrinkArray = function (arr, len) {
  var limited = isNumber(len)
  if (!limited) {
    each(arr, function (v, i) {
      if (v === undefined) arr.length--
    }, true)
  } else {
    each(arr, function (v, i) {
      if (i >= len) arr.length--
      else return false
    }, true)
    while (arr.length < len) {
      arr.push(null)
    }
  }
  return arr
}

export var touchLeaves = function (obj) {
  each(obj, function (v, p) {
    if (isBasic(v)) {
      obj[p] = v
    } else {
      touchLeaves(v)
    }
  })
}

export var extend = function (dest, srcs, clean) {
  if (!isObject(dest)) return null
  var args = Array.prototype.slice.call(arguments, 1,
    arguments[arguments.length - 1] === true ? (arguments.length - 1) : arguments.length)
  clean = arguments[arguments.length - 1] === true ? true : false

  function extendObj (obj, src, clean) {
    if (!isObject(src)) return
    each(src, function (v, p) {
      if (!hasProperty(obj, p) || isBasic(v)) {
        if (obj[p] !== v) {
          obj[p] = clone(v)
        }
      } else {
        extendObj(obj[p], v, clean)
      }
    })
    if (clean) {
      each(obj, function (v, p) {
        if (!hasProperty(src, p)) {
          clear(obj, p)
        }
      })
      if (isArray(obj)) {
        shrinkArray(obj)
      }
    }
  }

  each(args, function (src) {
    extendObj(dest, src, clean)
  })
  return dest
}

/**
 * throttle节流函数
 * @refer https://stackoverflow.com/a/27078401
 */
export var throttle = function (func, wait, options) {
  var context, args, result
  var timeout = null
  var previous = 0
  if (!options) options = {}
  var later = function () {
    previous = options.leading === false ? 0 : Date.now()
    timeout = null
    result = func.apply(context, args)
    if (!timeout) context = args = null
  }
  return function () {
    var now = Date.now()
    if (!previous && options.leading === false) previous = now
    var remaining = wait - (now - previous)
    context = this
    args = arguments
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = func.apply(context, args)
      if (!timeout) context = args = null
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining)
    }
    return result
  }
}

export default {
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
}

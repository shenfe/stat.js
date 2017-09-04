# stat.js

前端埋点通用方案，支持加载、点击、曝光统计，支持声明式、命令式。

## 使用方式

stat.js导出为umd模块。

### 脚本引入

通过script标签引入后，全局变量Stat即为模块。

```html
<script src="//path/to/stat.js" charset="utf-8"></script>
```

### 模块引入

```js
var Stat = require('path/to/stat.js');
```

### HTML标签属性形式声明

```html
<a stat-click stat-code="key1" stat-data='{"name":"a1"}' href="javascript:void(0);">click this</a>
<div stat-view stat-code="key2" stat-data='{"name":"div1"}'>view this</div>
<div stat-view stat-code="key2" stat-data-name="div2" style="position:absolute;top:2000px;left:0px;">view this</div>
<div stat-view stat-code="key4" stat-data-name="div3" stat-view-once="false" style="position:absolute;top:2100px;left:0px;">view this</div>
<a stat-click stat-view stat-load stat-code="key3" stat-data-name="a2" href="javascript:void(0);">click or view this</a>
```

### JavaScript API调用

#### config

配置。

```js
Stat.config({
    defaultDataAttr: 'stat-data',
    defaultCodeAttr: 'stat-code',

    'key1': {
        data: function (node) {
            return {
                url: node.getAttribute('href')
            };
        }
    },
    'key2': {
        view: {
            once: true,
            whole: false
        }
    },

    sendBy: {
        type: 'image',
        url: function () {
            return '//some-domain.com/some-path';
        }
    }
});
```

#### bind

绑定。

```js
Stat.bind($target, 'click', {
    code: 'key1',
    data: (function (el) {
        return {
            url: el.href,
            text: el.innerText
        };
    })($target)
});
```

#### check

检查绑定状态。

```js
var bindingStatus = Stat.check($target);
bindingStatus.click && console.log('Target element has bound click-type stat.');
```

#### unbind

解绑。

```js
Stat.unbind($target, 'click');
```

#### send

发送统计请求。

```js
Stat.send('view', $target);
Stat.send('view', {
    code: 'key1',
    data: {
        name: 'a1'
    }
});
```

#### forceAllViewStat

强制检查所有需要曝光统计的元素，一般用于动态改变html元素的情况。

```js
Stat.forceAllViewStat();
```

## Build

stat.js依赖jQuery或Zepto，但可以选择是否将jQuery或Zepto打包进代码中。

```bash
npm run build               # 默认包含jQuery
npm run build:jquery-in     # 包含jQuery
npm run build:jquery-out    # 不包含jQuery
npm run build:zepto-in      # 包含Zepto
npm run build:zepto-out     # 不包含Zepto
```

## License

MIT

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

支持三种行为统计：点击、曝光、加载，对应以下示例中`stat-click`、`stat-view`、`stat-load`属性。点击，指元素被click一次则发送一个请求。曝光，指元素进入可见范围时发送一个请求，可选择是否仅统计一次，可选择是否元素全部进入可见范围才算作曝光。加载，指元素在页面中加载时发送一个请求。

需要为统计对象定义编码，例如“首页feed流中的项”的统计编码为key1。统计编码在HTML标签中的属性名可自定义，以下示例中为`stat-code`。

可以为统计对象通过HTML标签属性的方式指定统计请求所要携带的统计数据。统计数据在HTML标签中的属性名可自定义，以下示例中为`stat-data`。如果使用`stat-data`定义统计数据，则属性值最好是JSON字符串。也可以通过`stat-data-paramname="paramvalue"`的方式定义统计数据，如以下示例中的`stat-data-name`。

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
    defaultDataAttr: 'stat-data', // 统计数据的HTML标签属性名
    defaultCodeAttr: 'stat-code', // 统计编码的HTML标签属性名

    'key1': {
        data: function (node) { // 通过函数定义编码为key1的统计对象需要携带的数据
            return {
                url: node.getAttribute('href')
            };
        }
    },
    'key2': {
        view: { // 设置编码为key2的统计对象的曝光统计
            once: true, // 是否仅统计一次，默认为是
            whole: false // 是否元素全部进入可见范围才算作曝光，默认为否
        }
    },

    sendBy: { // 设置统计请求的发送方式，默认为图片请求
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

## 可能发生的问题

如果在埋点统计的绑定事件执行之前，元素已绑定了事件并在事件处理时阻止了默认行为（`e.preventDefault()`），那么绑定的统计事件可能不会被触发。这时请考虑取消对默认行为的阻止，酌情变通。

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

[MIT](http://opensource.org/licenses/MIT)

Copyright © 2017-present, [shenfe](https://github.com/shenfe)

# stat.js

前端埋点通用方案，支持加载、点击、曝光统计，支持声明式、命令式。

## Usage

```html
<body>
    <a stat-click stat-code="key1" stat-data="{...}" href="javascript:void(0);">click this</a>
    <div stat-view stat-code="key2" stat-data="{...}">view this</div>
    <a stat-click stat-view stat-code="key3" stat-data="{...}" href="javascript:void(0);">click or view this</a>
    <a id="test" href="javascript:void(0);">click this</a>
    <script src="//path/to/stat.js" charset="utf-8"></script>
    <script type="text/javascript">
        Stat.config({
            /* The default attribute that stores the statistic (stat, for short) data */
            defaultDataAttr: 'stat-data',
            /* The default attribute that stores the stat code which represents a unique stat object */
            defaultCodeAttr: 'stat-code',

            /* Each stat code and its options */
            'key1': {
                data: function (node) {
                    return {
                        url: node.getAttribute('href')
                    };
                }
            },
            'key2': {
                view: {
                    once: true, /* If one time is enough */
                    whole: false /* If the whole area should be viewed */
                }
            }

            /* Specify the way to send stat requests */
            sendBy: {
                type: 'image',
                url: function () {}, /* String or Function */
                argsStr: function (data) {
                    /**/
                }
            }
        });
    </script>
    <script type="text/javascript">
        window.onload = function () {
            var $target = document.getElementById('test');

            Stat.bind($target, 'click', {
                code: 'key1',
                data: (function (el) {
                    return {
                        url: el.href,
                        text: el.innerText
                    };
                })($target)
            });

            $target.addEventListener('click', function (e) {
                var bindingStatus = Stat.check(this);
                if (bindingStatus.click) {
                    Stat.unbind(this, 'click');
                }
            }, false);

            Stat.send('load', $target);
        };
    </script>
</body>
```

## License

MIT

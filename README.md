# mine.js

前端埋点通用方案，支持点击、曝光等多种统计需求，支持命令式、声明式等多种方式。

## Usage

```html
<body>
    <a stat-key1="{...}" href="javascript:void(0);">click this</a>
    <div stat-key2="{...}">view this</div>
    <a stat-key1 stat-key2 stat-data="{...}" href="javascript:void(0);">click or view this</a>
    <a id="test" class="some-class" some-data="..." href="javascript:void(0);">click this</a>
    <script src="//path/to/mine.js" charset="utf-8"></script>
    <script type="text/javascript">
        Mine.config({
            /* The default attribute that stores the statistic (stat, for short) data. */
            defaultDataAttr: 'stat-data',

            /* Each stat key and its options */
            'stat-key1': {
                type: 'click', /* The behavior type, such as 'click', 'view', 'load'. */
                data: function (node) {
                    return {
                        url: node.getAttribute('href')
                    };
                } /* If not defined, the stat data would be got from the key attribute's value and the default data attribute's value. */
            },
            'stat-key2': {
                type: 'view',
                once: false, /* If one time is enough. */
                whole: false /* If the whole area should be viewed. */
            },
            'stat-key3': {
                type: 'load'
            },

            /* Specify the way to send stat requests. */
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

            Mine.bind({
                target: $target,
                key: 'stat-key1',
                dataStr: $target.getAttribute('some-data')
            });

            $target.addEventListener('click', function (e) {
                var bindingStatus = Mine.check(this);
                if (bindingStatus['stat-key1']) {
                    Mine.unbind({
                        target: this,
                        key: 'all' /* If `all`, all bound keys would be unbound from the target. */
                    });
                }
            }, false);

            Mine.send({
                target: $target, /* If not defined, define `data`. */
                key: 'stat-key3',
                data: { /**/ } /* If not defined, define `target`. */
            });
        };
    </script>
</body>
```

## License

MIT

const fs = require('fs');
const path = require('path');
const uglifyjs = require('uglify-js');

const uglify = false;

const args = process.argv.slice(2);
args.forEach(function (val, index, array) {
    console.log(`${index}: ${val}`);
});

let moduleStr = fs.readFileSync(path.resolve(process.cwd(), './temp/stat.js'), 'utf8').replace('global.$', '$');
if (uglify) {
    moduleStr = uglifyjs.minify(moduleStr, {
        mangle: {
            ie8: true
        }
    }).code;
}

let outputFile = args[1] || './dist/stat.js';
let option = args[0] || 'jquery-in';
let jQueryOrZepto = option.indexOf('jquery') >= 0 ? 'jquery' : 'zepto';
let jz = (option.indexOf('-in') < 0) ? '' : fs.readFileSync(path.resolve(process.cwd(), `./src/lib/${jQueryOrZepto}.min.js`), 'utf8');

fs.writeFileSync(path.resolve(process.cwd(), outputFile),
`(function () {
    ${jz}

    (function (window, $, undefined) {
        ${moduleStr}
    })(window, (typeof jQuery === 'undefined') ? Zepto : jQuery);
})();`
);

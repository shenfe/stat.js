const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const args = process.argv.slice(2);
args.forEach(function (val, index, array) {
    console.log(`${index}: ${val}`);
});

let moduleStr = fs.readFileSync(path.resolve(process.cwd(), './temp/stat.js'), 'utf8');
let jz = ''
let outputFile = './dist/stat.js';
if(args.length>1){
    outputFile = args[1];
    let option = args[0];
    let jQueryOrZepto = option.indexOf('jquery') >= 0 ? 'jquery' : 'zepto';
    jz = fs.readFileSync(path.resolve(process.cwd(), `./src/lib/${jQueryOrZepto}.min.js`), 'utf8');
}

fs.writeFileSync(path.resolve(process.cwd(), outputFile),
`(function () {
    ${jz}

    (function (window, $, undefined) {
        ${moduleStr}
    })(window, (typeof jQuery === 'undefined') ? Zepto : jQuery);
})();`
);

shell.cp(outputFile,'./index.js')

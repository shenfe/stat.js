const fs = require('fs')
const path = require('path')
const uglifyjs = require('uglify-js')

const uglify = false

const args = process.argv.slice(2)
args.forEach(function (val, index, array) {
    console.log(`${index}: ${val}`)
})

const moduleStr = fs.readFileSync(path.resolve(process.cwd(), './temp/mine.js'), 'utf8').replace('global.$', '$')

let outputFile = args[1] || './dist/mine.js'
let option = args[0] || 'jquery-in'
let jQueryOrZepto = option.indexOf('jquery') >= 0 ? 'jquery' : 'zepto'
let inOrOut = option.indexOf('-in') >= 0 ? 0 : 1

fs.writeFileSync(path.resolve(process.cwd(), outputFile),
    fs.readFileSync(path.resolve(process.cwd(), './src/template.js'), 'utf8').replace(
        '/* jQuery or Zepto source code here. Better not to edit this comment. */',
        inOrOut === 1 ? '' : fs.readFileSync(path.resolve(process.cwd(), `./src/lib/${jQueryOrZepto}.min.js`), 'utf8')
    ).replace(
        '/* Module source code here. Better not to edit this comment. */',
        uglify === false ? moduleStr : uglifyjs.minify(moduleStr, {
            mangle: {
                ie8: true
            }
        }).code
    )
)

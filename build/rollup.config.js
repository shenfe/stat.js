const uglify = require('rollup-plugin-uglify')

module.exports = {
    input: 'src/index.js',
    name: 'Stat',
    output: {
        file: 'temp/stat.js',
        format: 'umd'
    },
    plugins: [
        // uglify({
        //     // mangle: false,
        //     ie8: true
        // })
    ]
}

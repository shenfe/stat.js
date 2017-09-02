module.exports = {
    input: 'src/index.js',
    name: 'Stat',
    output: {
        file: 'temp/stat.js',
        format: 'umd'
    },
    globals: {
        jQueryOrZepto: '$'
    }
};

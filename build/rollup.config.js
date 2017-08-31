module.exports = {
    input: 'src/index.js',
    name: 'Mine',
    output: {
        file: 'temp/mine.js',
        format: 'umd'
    },
    globals: {
        jQueryOrZepto: '$'
    }
};

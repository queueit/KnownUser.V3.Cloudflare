const {src, dest, series} = require("gulp");
const zip = require("gulp-zip");
const jsonModify = require('gulp-json-modify');
const vinylSource = require('vinyl-source-stream');
const browserify = require('browserify');

function bundle(){
    const browserifyTask = browserify();
    browserifyTask.add("./app.js")

    return browserifyTask.bundle()
        .pipe(vinylSource('queueitknownuser.bundle.js'))
        .pipe(dest('./dist'))
}

function makePackage() {
    return src([
        './dist/queueitknownuser.bundle.js',
    ])
        .pipe(zip('worker.zip'))
        .pipe(dest('./dist'));
}

exports.stripPackage = () => {
    return src(['./package.json'])
        .pipe(jsonModify({ key: 'devDependencies', value: {}}))
        .pipe(jsonModify({ key: 'scripts', value: {}}))
        .pipe(dest('./'))
}

exports.buildArtifacts = series(bundle, makePackage);
exports.default = exports.buildArtifacts;
exports.bundle = bundle;
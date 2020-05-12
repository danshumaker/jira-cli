"use strict";

var gulpfile = require('gulp');
var babel = require('gulp-babel');

gulpfile.task("copy_src", function () {
  return gulpfile.src(["lib/**/*.js"], { base: '.' })
    .pipe(gulpfile.dest("build"));
});
gulpfile.task("copy_bin", function () {
  return gulpfile.src(["bin/**/*.js"], { base: '.' })
    .pipe(gulpfile.dest("build"));
});

gulpfile.task("compile-es6-src", function () {
  return gulpfile.src("lib/**/*.js")
    .pipe(babel({"plugins": ["babel-plugin-transform-amd-to-commonjs"]}))
    .pipe(gulpfile.dest("build/js/lib"));
});
gulpfile.task("compile-es6-bin", function () {
  return gulpfile.src("bin/**/*.js")
    .pipe(babel({"plugins": ["babel-plugin-transform-amd-to-commonjs"]}))
    .pipe(gulpfile.dest("build/js/bin"));
});

gulpfile.task("default", gulpfile.series(["compile-es6-src", "compile-es6-bin"]));

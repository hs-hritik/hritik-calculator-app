/* eslint-disable strict, no-console */
/* global module */

const gulp = require("gulp");
const sketch = require("gulp-sketch");
const iconfont = require("gulp-iconfont");
const consolidate = require("gulp-consolidate");
const rename = require("gulp-rename");

/**
 * Get current timestamp
 */
const getTimeStamp = function() {
  // "Thu Jun 04 2015 12:39:51 GMT+0530 (IST)" => 12:39:51
  const time = new Date().toString().split(" ")[4];
  return ` (${time})`;
};

/**
 * Generate icon fonts from sketch file.
 */
const generateIconFonts = function(sourceSketchFile, outputFontName, outputFontDest, onGlyphs) {
  gulp
    .src(sourceSketchFile)
    .pipe(
      sketch({
        export: "artboards",
        formats: "svg"
      })
    )
    .pipe(iconfont({fontName: outputFontName}))
    .on("glyphs", onGlyphs)
    .pipe(gulp.dest(outputFontDest));
};

/**
 * Compile Ladash templates
 * It takes options and files to be compiled. Where each file object
 * contains template, file name and output folder.
 */
const compileLodash = function(options, files) {
  files.forEach(function(file) {
    if (!file.template || !file.name || !file.outputFolder) {
      console.error(
        "Wrong file object passed. Please make sure all file " +
          "objects contain template, name and outputFolder."
      );
      return;
    }
    gulp
      .src(file.template)
      .pipe(consolidate("lodash", options))
      .pipe(rename(file.name))
      .pipe(gulp.dest(file.outputFolder));
  });
};

module.exports = {
  getTimeStamp,
  generateIconFonts,
  compileLodash
};

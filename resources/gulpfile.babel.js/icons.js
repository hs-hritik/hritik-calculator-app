const gulp = require("gulp");
const gutil = require("gulp-util");
const which = require("npm-which");
const {argv} = require("yargs");
const {generateIconFonts, compileLodash} = require("./utils");

const PATHS = {
  design: {
    base: "design",
    sketchFile: "design/icons.sketch",
    previewTmpl: "design/lodash-templates/_icons-preview-page.html",
    sassMapTmpl: "design/lodash-templates/_icons-sass-map.scss"
  },
  fonts: "static/fonts",
  hestia: {
    data: "styles/hestia/data"
  }
};

/**
 * Task to generate iconfont
 */
const iconsTask = () => {
  try {
    which.sync("sketchtool", {cwd: __dirname});
  } catch (error) {
    gutil.log(gutil.colors.red("Error: ") + error.message);
    const errorMsg = "please install sketchtool from here - http://www.sketchapp.com/tool/";
    gutil.log(gutil.colors.red("Error: ") + errorMsg);
    return;
  }

  const sketchFile = PATHS.design.sketchFile;
  const iconFontName = "hesticons";
  const iconFontDest = `${PATHS.fonts}/${iconFontName}`;

  const filesToCompile = [
    {
      template: PATHS.design.previewTmpl,
      name: `${iconFontName}-preview.html`,
      outputFolder: PATHS.design.base
    },
    {
      template: PATHS.design.sassMapTmpl,
      name: `_${iconFontName}-icon-code.scss`,
      outputFolder: PATHS.hestia.data
    }
  ];

  const onGlyphs = function(glyphs) {
    const OPTIONS = {
      glyphs: glyphs.map(function(glyph) {
        return {
          name: glyph.name,
          codepoint: glyph.unicode[0].charCodeAt(0)
        };
      }),
      fontName: iconFontName,
      fontPath: `../${iconFontDest}/`,
      className: "s"
    };
    compileLodash(OPTIONS, filesToCompile);
  };

  if (argv.watch || argv.w) {
    gulp.watch(sketchFile, {ignoreInitial: false}, () =>
      generateIconFonts(sketchFile, iconFontName, iconFontDest, onGlyphs)
    );
    return;
  }

  return generateIconFonts(sketchFile, iconFontName, iconFontDest, onGlyphs);
};

exports.icons = iconsTask;

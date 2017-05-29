/**
 * Rule for function call - space between function name & it's parenthesis.
 * @author Aniket Hendre <aniket@helpshift.com>
 * @created Sep 24, 2015
 * @module func-call-spacing
 */

"use strict";

module.exports = function (context) {
  var sourceCode = context.getSourceCode ();

  return {
    "CallExpression": function  (node) {
      var lastCalleeToken = sourceCode.getLastToken (node.callee),
          tokens = sourceCode.getTokens (node),
          index = tokens.indexOf (lastCalleeToken),
          length = tokens.length,
          message;

      while (index < length && tokens [index].value !== "(") {
        ++index;
      }

      if (index >= length) {
        return;
      }

      if (context.options [0] === "always") {
        if (sourceCode.isSpaceBetweenTokens (tokens [index - 1], tokens [index])) {
          return;
        } else {
          message = "Space between function name & paren is expected.";
        }
      }

      if (context.options [0] === "never") {
        if (!sourceCode.isSpaceBetweenTokens (tokens [index - 1], tokens [index])) {
          return;
        } else {
          message = "Unexpected space between function name & paren.";
        }
      }

      context.report ({
        node: node,
        loc: lastCalleeToken.loc.start,
        message: message,
      });
    }
  };
};

module.exports.schema = [{
  "enum": ["always", "never"]
}];

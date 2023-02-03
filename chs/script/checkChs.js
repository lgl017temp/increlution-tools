"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var startLine = 13;
var fileStr = (0, fs_1.readFileSync)("../increlution-chs.js").toString("utf8");
var match = fileStr.match(/var cnItems = \{([\s\S]+?)\r\n\}/);
if (match) {
    var cnItems = match[1];
    // console.log("起-------------");
    // console.log(cnItems.substring(0, 1000));
    // console.log("止-------------");
    // console.log(cnItems.substring(cnItems.length - 1000, cnItems.length));
    // console.log("-------------");
    var cnItemsArr = cnItems.split(",\r\n");
    // console.log(cnItemsArr);
    var items_1 = {};
    cnItemsArr.forEach(function (itemStr, i) {
        var lineNo = (i + 1 + startLine);
        var item = eval("({".concat(itemStr, "})"));
        var key = Object.keys(item)[0];
        if (key) {
            //去重
            if (items_1[key]) {
                var oldLineNum = items_1[key];
                console.log("line: ".concat(oldLineNum, ", repeat key"), key);
            }
            items_1[key] = lineNo;
            var value = item[key];
            if (typeof value === "string") {
                var strangeChar = value.match(/[^0-9a-zA-Z ：，。…！？、（）“”‘’,.!+-×/%<>#:←\n\t\[\]\(\)\u4e00-\u9fa5]/g);
                if (strangeChar) {
                    console.log("line: ".concat(lineNo, ", key: ").concat(key), strangeChar, strangeChar.map(function (c) { return c.charCodeAt(0); }));
                }
                if (value.endsWith(")") || value.endsWith("）") || key.endsWith(")")) {
                    console.log("line: ".concat(lineNo, ", key: ").concat(key, ", \u7ED3\u5C3E\u62EC\u53F7\""));
                }
            }
        }
    });
}
else {
    console.warn("未成功匹配");
}

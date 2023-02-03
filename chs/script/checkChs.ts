import { readFileSync } from "fs";

let startLine = 13;
let fileStr = readFileSync("../increlution-chs.js").toString("utf8");

let match = fileStr.match(/var cnItems = \{([\s\S]+?)\r\n\}/);
if (match) {
	let cnItems = match[1];

	// console.log("起-------------");
	// console.log(cnItems.substring(0, 1000));
	// console.log("止-------------");
	// console.log(cnItems.substring(cnItems.length - 1000, cnItems.length));
	// console.log("-------------");

	let cnItemsArr = cnItems.split(",\r\n");
	// console.log(cnItemsArr);

	let items = {};
	cnItemsArr.forEach((itemStr, i) => {
		let lineNo = (i + 1 + startLine);
		let item = eval(`({${itemStr}})`) as Record<string, string>;
		let key = Object.keys(item)[0];

		if (key) {
			//去重
			if (items[key]) {
				let oldLineNum = items[key];
				console.log(`line: ${oldLineNum}, repeat key`, key);
			}

			items[key] = lineNo;

			let value = item[key];
			if (typeof value === "string") {
				let strangeChar = value.match(/[^0-9a-zA-Z ：，。…！？、（）“”‘’,.!+-×/%<>#:←\n\t\[\]\(\)\u4e00-\u9fa5]/g);
				if (strangeChar) {
					console.log(`line: ${lineNo}, key: ${key}`, strangeChar, strangeChar.map(c => c.charCodeAt(0)));
				}

				if (value.endsWith(")") || value.endsWith("）") || key.endsWith(")")) {
					console.log(`line: ${lineNo}, key: ${key}, 结尾括号"`);
				}
			}
		}

	})
} else {
	console.warn("未成功匹配");
}

import esbuild, { minify } from "rollup-plugin-esbuild";
import commonjs from 'rollup-plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import resolve from 'rollup-plugin-node-resolve';
import { readdirSync } from 'fs';

let files = readdirSync("src/buildType");
let types = files.filter(file => file.endsWith(".ts")).map(file => file.replace(/\.ts$/, ""));

let exp = [];
types.forEach(type => {
	let banner = `/* 
 * https://github.com/lgl017temp/increlution-tools
 * 流程图汉化可使用gitxy的, 也可使用项目内修改过的版本，详见项目下说明
 * 将本文件放在electron-index.html旁，以下代码段放在最后html最后
 * <script src="IncrelutionTools_${type}.js" type="module" charset="utf-8"></script>
 */`;

	exp.push({
		input: `src/buildType/${type}.ts`,
		output: {
			file: process.env.BUILD === 'production' ? `dist/IncrelutionTools_${type}.js` : `debug/IncrelutionTools_${type}.js`,
			banner
		},
		plugins: [
			nodePolyfills(),
			nodeResolve({
				browser: true,
			}),
			resolve({
				preferBuiltins: false,
			}),
			commonjs(),
			esbuild({
				minify: process.env.BUILD === 'production',
			}),
			process.env.BUILD === 'production' ? minify({
				logLevel: "silent",
				banner
			}) : undefined,
		]
	});
});

export default exp;
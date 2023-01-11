import esbuild, { minify } from "rollup-plugin-esbuild";
import commonjs from 'rollup-plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import resolve from 'rollup-plugin-node-resolve';

let types = ["all", "chart", "cheat"];

let exp = [];
types.forEach(type => {
	let banner = `/* 
 * 将本文件放在electron-index.html旁，以下代码段放在最后html最后
 * <script src="IncrelutionTools_${type}.js" type="module" charset="utf-8"></script>
 */`;

	exp.push({
		input: `src/buildType/${type}.ts`,
		output: {
			file: `dist/IncrelutionTools_${type}.js`,
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
				minify: true,
			}),
			minify({
				logLevel: "silent",
				banner
			}),
		]
	});
});

export default exp;
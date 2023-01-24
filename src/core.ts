import type DecimalType from "break_infinity.js";

export interface Plugin {
	settings?: Record<string, any>;
	init?: () => void;
	toggle?: () => void;
	changeLocale?: () => void;
}
export interface Autoable {
	isAutomationUnlocked: boolean;
	shouldAutomate: number | null;
	timesCompleted: number;
}
export interface Game {
	jobs: Autoable[];
	construction: Autoable[];
	exploration: Autoable[];

	lastTimeStamp: number;
	inventory: {
		amount: DecimalType & {
			__proto__: DecimalType;
		};
	}[][];
	skills: {
		generationLevel: DecimalType;
		generationExperience: DecimalType;
		instinctLevel: DecimalType;
		instinctExperience: DecimalType;
	}[];
	health: DecimalType;
}
export type RecordTree<K extends (string | number | symbol), V> = {
	[key in K]: V | RecordTree<K, V>;
}

declare let game: undefined | Game;

export let settings: Record<string, any> = {
	locale: "cn",
};
export let locales: Record<string, RecordTree<string, string>> = {};
let rollbackLocale = "cn";

export let plugins: Plugin[] = [];

class ToolContainer extends HTMLElement {
	wrapper: HTMLBodyElement;

	constructor() {
		super();

		const shadow = this.attachShadow({mode: 'open'});

		const linkBootstrap = document.createElement('link');
		linkBootstrap.href = "helpers/bootstrap.min.css";
		linkBootstrap.rel = "stylesheet";
		linkBootstrap.type = "text/css";
		shadow.appendChild(linkBootstrap);

		const linkFontawesome = document.createElement('link');
		linkFontawesome.href = "helpers/fontawesome-pro-5.13.0-web/css/all.min.css";
		linkFontawesome.rel = "stylesheet";
		linkFontawesome.type = "text/css";
		shadow.appendChild(linkFontawesome);

		const linkGsrv = document.createElement('link');
		linkGsrv.href = "gsrv.css";
		linkGsrv.rel = "stylesheet";
		linkGsrv.type = "text/css";
		shadow.appendChild(linkGsrv);

		this.wrapper = document.createElement('body');
		if (window.document.body.classList.contains("dark")) {
			this.wrapper.classList.add("dark");
		}
		shadow.appendChild(this.wrapper);

		const classObserver = new MutationObserver((mutations) => {
			mutations.forEach(mutation => {
				if (mutation.type !== "attributes" && mutation.attributeName !== "class") {
					return;
				};

				if (window.document.body.classList.contains("dark")) {
					this.wrapper.classList.add("dark");
				} else {
					this.wrapper.classList.remove("dark");
				}
			});
		});
		classObserver.observe(window.document.body, {attributes: true});
	}

	getFormControlStyle(type: keyof HTMLElementTagNameMap = "input") {
		let el = document.createElement(type) as any;
		el.classList.add("form-control");
		el.style.display = "none";
		this.wrapper.appendChild(el);

		let map = el.computedStyleMap();
		let result: Record<string, string[]> = {};
		map.forEach((v: any[], k: string) => {
			result[k] = v.map(vv => vv.toString());
		});
		
		this.wrapper.removeChild(el);
		return result;
	}
}

export let btnContainer: JQuery<HTMLElement>;
export let rootEl: JQuery<ToolContainer>;
let optionBtn: JQuery<HTMLElement>;
export function init() {
	load();

	let css = document.createElement("style");
	css.innerHTML = `#action-containers-column .row.game-block-container:last-child { margin-bottom: 30px; }`;
	document.head.appendChild(css);

	customElements.define("tool-container", ToolContainer); //使用自定义元素的shadow-element避免被汉化脚本抓取
	// btnContainer = $(`<div style="display: flex; align-items: flex-end;flex-wrap: wrap;flex-direction: row;justify-content: flex-end;position: absolute; bottom: 0; left: 0; max-width: 100vw;"></div>`);
	rootEl = $(`<tool-container style="display: flex; align-items: flex-end;flex-wrap: wrap;flex-direction: row;justify-content: flex-end;position: absolute; bottom: 0; left: 0; max-width: 100vw;"></tool-container>`);
	btnContainer = $((rootEl[0] as ToolContainer).wrapper);

	optionBtn = $(`<button style="margin-left: 40px;height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-right: 10px;" type="button" class="btn btn-block btn-light""><span>${getLocal(`lang[${settings.locale}]`)}</span></button>`);
	btnContainer.append(optionBtn);
	optionBtn.on("click", function(e) {
		let localeList = Object.keys(locales);
		let idx = localeList.indexOf(settings.locale);
		if (idx === -1) {
			idx = 0;
		}
		idx++;
		idx %= localeList.length;
		settings.locale = localeList[idx];

		save();

		changeLocale();
	});

	plugins.forEach(p => {
		if (p.settings) {
			Object.keys(p.settings).forEach(key => {
				if (settings[key] === undefined) {
					settings[key] = p.settings![key];
				}
			});
		}
		if (p.init) {
			p.init();
		}
	});

	rootEl.appendTo("body");
	
	toggle();
}

export function load() {
	if (localStorage && localStorage.getItem("cheatSettings")) {
		let save = JSON.parse(localStorage.getItem("cheatSettings") as string);
		Object.keys(save).forEach(k => {
			(settings as any)[k] = save[k];
		});
	}
}

export function save() {
	if (localStorage) {
		localStorage.setItem("cheatSettings", JSON.stringify(settings));
	}
}

export function toggle() {
	plugins.forEach(p => {
		if (p.toggle) {
			p.toggle();
		}
	});
}
export function changeLocale() {
	optionBtn.find("span").html(getLocal(`lang[${settings.locale}]`) as string);

	plugins.forEach(p => {
		if (p.changeLocale) {
			p.changeLocale();
		}
	});
}
export function getLocal(key: string) {
	let local = locales[settings.locale];
	let keys = key.split(/\.|\[/).map(s => s.replace(/\]$/, ""));
	let result: string | RecordTree<string, string> = local;
	let useRollback = false;
	keys.every(k => {
		if (result instanceof Object) {
			result = result[k];
			return true;
		} else {
			console.error(`message not found: ${key}, in locale ${settings.locale}`);
			useRollback = true;
			return false;
		}
	});
	if (result === undefined) {
		console.error(`message not found: ${key}, in locale ${settings.locale}`);
		useRollback = true;
	}

	if (!useRollback) {
		return result;
	}

	let notMatch = false;
	local = locales[rollbackLocale];
	result = local;
	keys.every(k => {
		if (result instanceof Object) {
			result = result[k];
			return true;
		} else {
			console.error(`message not found: ${key}, in locale ${rollbackLocale}`);
			notMatch = true;
			return false;
		}
	});
	if (result === undefined) {
		console.error(`message not found: ${key}, in locale ${rollbackLocale}`);
		notMatch = true;
	}

	if (!notMatch) {
		return result;
	}

	return key;
}

export function doEval(str: string) {
	return window.Function(`"use strict";return ${str};`)();
}

let gameLoadPromiseResolve: () => void;
export let gameLoadPromise = new Promise<void>((resolve) => {
	gameLoadPromiseResolve = resolve;
});
let interval = setInterval(function() {
	if (game) {
		clearInterval(interval);

		init();

		gameLoadPromiseResolve();
	}
}, 1000);

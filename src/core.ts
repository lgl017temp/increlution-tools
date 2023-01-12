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
		generationExperience: DecimalType;
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

export let btnContainer: JQuery<HTMLElement>;
let optionBtn: JQuery<HTMLElement>;
export function init() {
	load();

	btnContainer = $(`<div style="display: flex; align-items: flex-end;flex-wrap: wrap;flex-direction: row;justify-content: flex-end;position: absolute; bottom: 0; left: 0; max-width: 100vw;"></div>`);

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

	btnContainer.appendTo("body");
	
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

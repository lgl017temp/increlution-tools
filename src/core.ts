import type DecimalType from "break_infinity.js";

export interface Plugin {
	init?: () => void;
	toggle?: () => void;
	settings?: Record<string, any>;
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

declare let game: undefined | Game;

export let settings: Record<string, any> = {};

export let plugins: Plugin[] = [];

export let btnContainer: JQuery<HTMLElement>;
export function init() {
	load();

	btnContainer = $(`<div style="display: flex; align-items: flex-end;flex-wrap: wrap;flex-direction: row;justify-content: flex-end;position: absolute; bottom: 0; right:0; max-width: 100vw;"></div>`);

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
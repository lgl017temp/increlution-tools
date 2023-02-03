import type DecimalType from "break_infinity.js";
declare let Decimal: typeof DecimalType;

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

	options: {
		defaultAutomation: number[];
	}

	newGamePlus: {
		dna: DecimalType;
	}
}
export enum GameOptionsDefaultAutomation {
	food = 0,
	rawFood = 1,
	resource = 2,
	construction = 3,
	exploration = 4,
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
		this.wrapper.style.backgroundColor = "transparent";
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

		readGameData();
	}
}, 1000);

//#region 类型声明

export type FuncString = string;
export type AllType = "skill" | "job" | "construction" | "exploration" | "boss" | "hostile";

export interface Dependency {
	type: AllType | "resources";
	id: string;
	phase?: number;
}
export interface Skill {
	id: number;
	icon: string;
	name: string;
	shouldShow: FuncString | (() => boolean);

	dependency?: Dependency[];
	used?: boolean;
	level?: number;
}
export interface SkillGame extends Skill {
	shouldShow: () => boolean;
}
export interface SkillInfo extends Skill {
	shouldShow: FuncString;
}

export interface Job {
	baseCanRun: FuncString | (() => boolean);
	baseShouldShow: FuncString | (() => boolean);
	canRun: FuncString | (() => boolean);
	icon: string;
	id: number;
	name: string;
	onComplete: () => void;
	requiredProgress: DecimalType;
	requiredResourceId?: number;
	rewardedItems: Record<string, {
		itemId: number;
		itemType: number;
	}>;
	shouldShow: FuncString | (() => boolean);
	skillId: number;
	tooltip: string;
	getTooltip?: () => string;
	automationRequirement?: number;
	requiredResourceAmount?: DecimalType;

	automationUnlockAlternative?: number;
	completionDamage?: DecimalType;
	
	isExcludedFromPassiveJobs?: boolean;
	foodTrade: {
		bonusAmount: DecimalType;
		maxBonusId: number;
		maxId: number;
		requiredFoodValue: DecimalType;
	}

	dependency?: Dependency[];
	used?: boolean;
	level?: number;
}
export interface JobGame extends Job {
	baseCanRun: () => boolean;
	baseShouldShow: () => boolean;
	canRun: () => boolean;
	shouldShow: () => boolean;
}
export interface JobInfo extends Job {
	baseCanRun: FuncString;
	baseShouldShow: FuncString;
	canRun: FuncString;
	shouldShow: FuncString;
}

export interface Construction {
	baseCanRun: FuncString | (() => boolean);
	baseShouldShow: FuncString | (() => boolean);
	canRun: FuncString | (() => boolean);
	id: number;
	name: string;
	onComplete: () => void;
	requiredProgress: DecimalType;
	requiredResources: Record<string, {
		itemId: number;
		amount: DecimalType;
	}>;
	shouldShow: FuncString | (() => boolean);
	skillId: number;
	tooltip: string;
	getTooltip?: () => string;
	automationRequirement?: number;

	inventorySize?: DecimalType;
	decayMultiplier?: DecimalType;
	automationUnlockAlternative?: number;
	maxHealthGainMultiplier?: DecimalType;

	dependency?: Dependency[];
	used?: boolean;
	level?: number;
}
export interface ConstructionGame extends Construction {
	baseCanRun: () => boolean;
	baseShouldShow: () => boolean;
	canRun: () => boolean;
	shouldShow: () => boolean;
}
export interface ConstructionInfo extends Construction {
	baseCanRun: FuncString;
	baseShouldShow: FuncString;
	canRun: FuncString;
	shouldShow: FuncString;
}

export interface Exploration {
	baseCanRun: FuncString | (() => boolean);
	baseShouldShow: FuncString | (() => boolean);
	canRun: FuncString | (() => boolean);
	completedStory: string;
	getCompletedStory?: () => string;
	id: number;
	name: string;
	onComplete: () => void;
	requiredProgress: DecimalType;
	shouldShow: FuncString | (() => boolean);
	skillId: number;
	tooltip: string;
	getTooltip?: () => string;
	automationRequirement?: number;

	isRepeatable?: boolean;
	skipCompletedStory?: boolean;

	isStoryBranch?: boolean;
	startsBranch?: boolean;
	branchColor?: string;

	bossId?: number;
	bossDamage?: number;
	bossPhases?: number[];
	bossScalingVariable?: number;
	bossScalingVariableIncrease?: number;

	additionalDamagePerMs?: DecimalType;
	maxHealthGainMultiplier?: DecimalType;
	automationUnlockAlternative?: number;
	decayMultiplier?: DecimalType;
	completionDamage?: DecimalType;
	awardItem?: {amount: DecimalType; type: number; id: number};
	multiplierRequirement?: DecimalType;
	failDamage?: DecimalType;
	completionScaling?: DecimalType;

	requiredResources?: Record<string, {
		itemId: number;
		amount: DecimalType;
	}>;

	dependency?: Dependency[];
	used?: boolean;
	level?: number;
	addBoss?: number;
}
export interface ExplorGame extends Exploration {
	baseCanRun: () => boolean;
	baseShouldShow: () => boolean;
	canRun: () => boolean;
	shouldShow: () => boolean;
}
export interface ExplorInfo extends Exploration {
	baseCanRun: FuncString;
	baseShouldShow: FuncString;
	canRun: FuncString;
	shouldShow: FuncString;
}

export interface Hostile {
	baseShouldShow: FuncString | (() => boolean);
	bossId: number;
	bossPhases: number[];
	canRun: FuncString | (() => boolean);
	completionDamage?: DecimalType;
	completionBossHealing?: DecimalType;
	completionSpeedIncrease?: DecimalType;
	enemy: number;
	id: number;
	name: string;
	onComplete: () => void;
	requiredProgress: DecimalType;
	shouldShow: FuncString | (() => boolean);
	tooltip: string;

	dependency?: Dependency[];
	used?: boolean;
	level?: number;
}
export interface HostileGame extends Hostile {
	baseShouldShow: () => boolean;
	canRun: () => boolean;
	shouldShow: () => boolean;
}
export interface HostileInfo extends Hostile {
	baseShouldShow: FuncString;
	canRun: FuncString;
	shouldShow: FuncString;
}

export interface Enemy {
	name: string;
	icon: string;
}
export interface Boss {
	name: string;
	phases: Record<string, {
		health?: number;
		storyId?: number;
		shouldFinish?: boolean;
	}>;

	id: number;
	dependency?: Dependency[];
	used?: boolean;
	level?: number;
}
export interface BossPhase {
	phase: number;
	health?: number;
	storyId?: number;
	shouldFinish?: boolean;

	bossId: number;
	id: number;
	dependency?: Dependency[];
	used?: boolean;
	level?: number;
}
export interface BossAttr {
	bossBarIcon?: string;
	description?: string;
	scalingMultiplier?: DecimalType;
	showOnBossBar: boolean;
}
export interface BossStory {
	name: string;
	completedStory: string;
}

export interface ItemType {
	id: number;
	name: string;
}

export interface Food {
	id: number;
	autoJobId: number;
	name: string;
	health: DecimalType;
	description: string;
	getDescription?: () => string;

	used?: boolean;
}

export interface Resource {
	id: number;
	autoJobId: number;
	name: string;
	description: string;

	isFoodResource?: boolean;

	used?: boolean;
}

export interface Perk {
	getUpgradeDescriptionForLevel: (...args: any[]) => DecimalType;
	icon: string;
	name: string;
	priceBase: DecimalType;
	priceScale: DecimalType;
	tooltip: string;
}

export interface Chep {
	jobId: number;
	constructionId: number;
	explorationId: number;
}

//#endregion

//#region 解析数据
let readDataPromiseResolve: () => void;
export let readDataPromise = new Promise<void>((resolve) => {
	readDataPromiseResolve = resolve;
});

export let gameData = new class GameData {
	skill: Record<string, SkillInfo> = {};
	job: Record<string, JobInfo> = {};
	construction: Record<string, ConstructionInfo> = {};
	exploration: Record<string, ExplorInfo> = {};
	hostile: Record<string, HostileInfo> = {};
	itemType: Record<string, ItemType>  = {};
	food: Record<string, Food>  = {};
	resource: Record<string, Resource>  = {};
	boss: Record<string, Boss> = {};
	bossPhase: Record<string, Record<string, BossPhase>> = {};
	bossAttr: Record<string, Record<string, BossAttr>> = {};
	bossStory: Record<string, Record<string, BossStory>> = {};
	enemy: Record<string, Enemy> = {};
	perk: Record<string, Perk> = {};
}();

export let numUnits = ["", "K", "M", "B", "T", "Qa"];
export function formatNum(val: DecimalType | number) {
	if (typeof val !== "number") {
		val = val.toNumber();
	}
	let idx = 0;
	while (val >= 1000) {
		idx++;
		val = val / 1000;
	}
	return +(val.toFixed(2)) + numUnits[idx];
};
let allString: string[] = [];
export function getString(idx: string | number) {
	idx = +idx;
	return allString[idx];
};
export let icons: Record<string, string> = {
	"fa-wheat" : "\uf72d",
	"fa-axe" : "\uf6b2",
	"fa-hammer" : "\uf6e3",
	"fa-running" : "\uf70c",
	"fa-fish" : "\uf578",
	"fa-hat-chef" : "\uf86b",
	"fa-shovel" : "\uf713",
	"fa-swords" : "\uf71d",
	"fa-bow-arrow" : "\uf6b9",
	"fa-anchor" : "\uf13d",
	"fa-comments" : "\uf086",
	"fa-hourglass-half" : "\uf252",

	"fa-heart" : "\uf004",
	"health" : "\uf004",

	"fa-heart-broken" : "\uf7a9",
	"healthDec" : "\uf7a9",

	"fa-trailer" : "\uf941",
	"inventory" : "\uf941",
	
	"fa-angle-double-up" : "\uf102",
	"add" : "\uf102",

	"fa-angle-double-down" : "\uf103",
	"dec" : "\uf103",
	
	"fa-engine-warning" : "\uf5f2",
	"fail" : "\uf5f2",
	
	"fa-check" : "\uf00c",
	"ok" : "\uf00c",
	
	"fa-arrow-alt-square-up" : "\uf353",
	"full" : "\uf353",

	"fa-skull": "\uf54c",
	"fa-shield": "\uf132",
	"fa-archway": "\uf557",
}

export let varNames: Record<string, string> = {};
export let vars: Record<string, string> = {};
export let cheps: number[] = [];
function readGameData() {
	$.ajax({
		url: "gniller-min.js", 
		dataType: "text",
		success: (jsStr: string) => {
			window.gameData = gameData;
			window.vars = vars;
			window.varNames = varNames;
			window.allString = allString;

			excractGameData(jsStr);
			checkDataProp();
			analysisGameData();
		
			let count = 0;
			do {
				buildDataLevel();
			} while (checkDataLevel() && count < 100);

			//去重
			Object.keys(gameData.skill).forEach((key) => {
				let data = gameData.skill[key];
				let conds = data.dependency;
				if (conds) {
					data.dependency = mergeCond(conds);
				}
			});
			Object.keys(gameData.job).forEach((key) => {
				let data = gameData.job[key];
				let conds = data.dependency;
				if (conds) {
					data.dependency = mergeCond(conds);
				}
			});
			Object.keys(gameData.construction).forEach((key) => {
				let data = gameData.construction[key];
				let conds = data.dependency;
				if (conds) {
					data.dependency = mergeCond(conds);
				}
			});
			Object.keys(gameData.exploration).forEach((key) => {
				let data = gameData.exploration[key];
				let conds = data.dependency;
				if (conds) {
					data.dependency = mergeCond(conds);
				}
			});
			Object.keys(gameData.boss).forEach((key) => {
				let data = gameData.boss[key];
				let conds = data.dependency;
				if (conds) {
					data.dependency = mergeCond(conds);
				}
			});
			Object.values(gameData.bossPhase).forEach(bossPhase => {
				Object.keys(bossPhase).forEach((key) => {
					let data = bossPhase[key];
					let conds = data.dependency;
					if (conds) {
						data.dependency = mergeCond(conds);
					}
				});
			})
			Object.keys(gameData.hostile).forEach((key) => {
				let data = gameData.hostile[key];
				let conds = data.dependency;
				if (conds) {
					data.dependency = mergeCond(conds);
				}
			});
		
			readDataPromiseResolve();
		}
	})
}

function findJsName(jsStr: string, regex: RegExp, name: string) {
	let allMatch = jsStr.match(new RegExp(regex, "g"));
	if (allMatch && allMatch.length === 1) {
		let match = jsStr.match(regex);
		if (match && match[1]) {
			vars[name] = match[1];
			varNames[match[1]] = name;
		}
	} else {
		console.log(allMatch, regex);
		throw new Error("not match or multi: " + name);
	}
}
function excractGameData(jsStr: string) {
	Object.keys(window).filter(key => key.startsWith("a0_")).forEach(key => {
		if(window[key] && window[key][0]) {
			if (window[key][0].shouldShow) {
				if (window[key][0].name === "Farming") { //skill
					varNames[key] = "skill";
				} else if (window[key][0].name === "Gather berries") { //job
					varNames[key] = "job";
				} else if (window[key][0].name === "Wooden cart") { //construction
					varNames[key] = "construction";
				} else if (window[key][0].name === "Explore the area") { //exploration
					varNames[key] = "exploration";
				} else if (window[key][0].name === "Titan arrow") { //hostile
					varNames[key] = "hostile";
				}
			} else if (window[key][0].name === "Food") { //itemType
				varNames[key] = "itemType";
			} else if (window[key][0][0] && window[key][0][0].name === "Berry") { //item
				varNames[key] = "item";
			} else if (window[key][0].name === "Stone Titan" && !window[key][0].phases) { //enemy
				varNames[key] = "enemy";
			} else if (window[key][0].name === "Stone Titan" && window[key][0].phases) { //boss
				varNames[key] = "boss";
			} else if (window[key][0][0] && window[key][0][0].bossBarIcon) { //bossAttr
				varNames[key] = "bossAttr";
			} else if (window[key][0].name === "" && window[key][0].completedStory === "") { //boss0Story
				varNames[key] = "boss0Story";
			} else if (window[key][0].jobId !== undefined && window[key][0].constructionId !== undefined && window[key][0].explorationId !== undefined) { //chep
				varNames[key] = "chep";
			} else if (typeof window[key][0] === "boolean" && window[key].length === game!.construction.length) { //notFinishInThisTick
				varNames[key] = "notFinishInThisTick";
			} else if (window[key][0].name === "Generation exp. req.") { //perk
				varNames[key] = "perk";
			}
		} else if (window[key] && typeof window[key] === "object" && window[key].toNumber && window[key].toNumber() === 0) {
			varNames[key] = "0";
		} else if (window[key] && typeof window[key] === "object" && window[key].toNumber && window[key].toNumber() === 1) {
			varNames[key] = "1";
		} else if (window[key] && typeof window[key] === "object" && window[key].toNumber && window[key].toNumber() === 100) {
			varNames[key] = "100";
		}
		// if (typeof window[key] !== "function") {
		// 	console.log(key, window[key]);
		// }
		// a0_0x134533
	});
	Object.keys(varNames).forEach(key => {
		vars[varNames[key]] = key;
	});
	findJsName(jsStr, /^const (a0_0x[0-9a-f]+?)=\[/, "allString");
	allString.splice(0);
	allString.push(...(doEval(vars.allString) as string[]).map(s => window.atob(s)));

	findJsName(jsStr, new RegExp(`const (a0_0x[0-9a-f]+?)=function\\(_0x(?:[0-9a-f]+?),_0x(?:[0-9a-f]+?)\\){_0x(?:[0-9a-f]+?)=_0x(?:[0-9a-f]+?)-0x0;let _0x(?:[0-9a-f]+?)=${vars.allString}\\[_0x(?:[0-9a-f]+?)\\];`), "getString");
	
	findJsName(jsStr, new RegExp(`function (a0_0x[0-9a-f]+?)\\(_0x(?:[0-9a-f]+?)=0x0\\){if\\(a0_0x(?:[0-9a-f]+?)==null\\)`), "getInventorySize");
	findJsName(jsStr, new RegExp(`function (a0_0x[0-9a-f]+?)\\(_0x(?:[0-9a-f]+?),_0x(?:[0-9a-f]+?)\\){return game\\[(?:'inventory'|${vars.getString}\\('0x(?:[0-9a-f]+?)'\\))\\]\\[_0x(?:[0-9a-f]+?)\\]\\[_0x(?:[0-9a-f]+?)\\]\\[(?:'amount'|${vars.getString}\\('0x(?:[0-9a-f]+?)'\\))\\]\\[(?:'cmp'|${vars.getString}\\('0x(?:[0-9a-f]+?)'\\))\\]\\(${vars.getInventorySize}\\(\\)\\)>=0x0;}`), "isFullItem");
	findJsName(jsStr, new RegExp(`function (a0_0x[0-9a-f]+?)\\(_0x(?:[0-9a-f]+?)\\){for\\(let _0x(?:[0-9a-f]+?) in _0x(?:[0-9a-f]+?)\\){if\\(!${vars.isFullItem}`), "isFullAllItem");
	
	let varNum1 = Object.keys(varNames).filter(key => varNames[key] === "1");
	let varNum0 = Object.keys(varNames).filter(key => varNames[key] === "0");
	findJsName(jsStr, new RegExp(`function (a0_0x[0-9a-f]+?)\\(_0x(?:[0-9a-f]+?),_0x(?:[0-9a-f]+?)\\){return game\\[(?:'inventory'|${vars.getString}\\('0x(?:[0-9a-f]+?)'\\))\\]\\[_0x(?:[0-9a-f]+?)\\]\\[_0x(?:[0-9a-f]+?)\\]\\[(?:'amount'|${vars.getString}\\('0x(?:[0-9a-f]+?)'\\))\\]\\[${vars.getString}\\('0x(?:[0-9a-f]+?)'\\)\\]\\((?:${varNum1.join("|")})\\)>=0x0;}`), "haveItem");
	findJsName(jsStr, new RegExp(`function (a0_0x[0-9a-f]+?)\\(_0x(?:[0-9a-f]+?)\\){for\\(resourceId in _0x(?:[0-9a-f]+?)\\){if\\(!${vars.haveItem}`), "haveAllItem");

	findJsName(jsStr, new RegExp(`function (a0_0x[0-9a-f]+?)\\(_0x(?:[0-9a-f]+?)\\){if\\(${vars.job}\\[_0x(?:[0-9a-f]+?)\\]\\[(?:'completionDamage'|${vars.getString}\\('0x(?:[0-9a-f]+?)'\\))\\]==null\\)return Number\\[${vars.getString}\\('0x(?:[0-9a-f]+?)'\\)\\];`), "leftHealthOnComplete");

	findJsName(jsStr, new RegExp(`function (a0_0x[0-9a-f]+?)\\(_0x(?:[0-9a-f]+?),_0x(?:[0-9a-f]+?),_0x(?:[0-9a-f]+?)\\){let _0x(?:[0-9a-f]+?)=(?:${varNum0.join("|")});for\\(let _0x(?:[0-9a-f]+?) in game\\[(?:'inventory'|${vars.getString}\\('0x(?:[0-9a-f]+?)'\\))\\]\\[0x0\\]\\){`), "calcFoodTrade");

	findJsName(jsStr, new RegExp(`function (a0_0x[0-9a-f]+?)\\(_0x(?:[0-9a-f]+?)\\){for\\(let _0x(?:[0-9a-f]+?) in ${vars.construction}\\[_0x(?:[0-9a-f]+?)\\]\\[${vars.getString}\\('0x(?:[0-9a-f]+?)'\\)\\]\\){let _0x(?:[0-9a-f]+?)=${vars.construction}\\[_0x(?:[0-9a-f]+?)\\]\\[${vars.getString}\\('0x(?:[0-9a-f]+?)'\\)\\]\\[_0x(?:[0-9a-f]+?)\\];`), "notArriveProgressStep");

	findJsName(jsStr, new RegExp(`function (a0_0x[0-9a-f]+?)\\(_0x(?:[0-9a-f]+?)\\){if\\(game\\[(?:'boss'|${vars.getString}\\('0x(?:[0-9a-f]+?)'\\))\\]==null\\)return 0x0;`), "getBossVariable");

	findJsName(jsStr, new RegExp(`function (a0_0x[0-9a-f]+?)\\(_0x(?:[0-9a-f]+?),_0x(?:[0-9a-f]+?)=!!\\[\\],_0x(?:[0-9a-f]+?)=!\\[\\]\\){if\\(a0_0x(?:[0-9a-f]+?)\\(_0x(?:[0-9a-f]+?)\\)!=null\\)return`), "willNotDie");

	let chepsData = doEval(vars.chep) as Record<string, Chep>;
	cheps = Object.values(chepsData).map(d => d.explorationId);

	Object.keys(vars).forEach((k) => {
		let v = vars[k];
		if (k === "skill") {
			let datas = window[v] as Record<string, SkillGame>;
			Object.keys(datas).forEach((key) => {
				let data = datas[key];
				let shouldShow = getFuncStr(data.shouldShow, data);
				gameData.skill[key] = {...data, id: +key, shouldShow};
			});
		} else if (k === "job") {
			let datas = window[v] as Record<string, JobGame>;
			Object.keys(datas).forEach((key) => {
				let data = datas[key];
				let baseShouldShow = getFuncStr(data.baseShouldShow, data);
				let shouldShow = getFuncStr(data.shouldShow, data);
				let baseCanRun = getFuncStr(data.baseCanRun, data);
				let canRun = getFuncStr(data.canRun, data);
				gameData.job[key] = {...data, baseShouldShow, shouldShow, baseCanRun, canRun, tooltip: data.getTooltip ? data.getTooltip() : data.tooltip};
			});
		} else if (k === "construction") {
			let datas = window[v] as Record<string, ConstructionGame>;
			Object.keys(datas).forEach((key) => {
				let data = datas[key];
				let baseShouldShow = getFuncStr(data.baseShouldShow, data);
				let shouldShow = getFuncStr(data.shouldShow, data);
				let baseCanRun = getFuncStr(data.baseCanRun, data);
				let canRun = getFuncStr(data.canRun, data);
				gameData.construction[key] = {...data, baseShouldShow, shouldShow, baseCanRun, canRun};
			});
		} else if (k === "exploration") {
			let datas = window[v] as Record<string, ExplorGame>;
			Object.keys(datas).forEach((key) => {
				let data = datas[key];
				let baseShouldShow = getFuncStr(data.baseShouldShow, data);
				let shouldShow = getFuncStr(data.shouldShow, data);
				let baseCanRun = getFuncStr(data.baseCanRun, data);
				let canRun = getFuncStr(data.canRun, data);
				gameData.exploration[key] = {...data, baseShouldShow, shouldShow, baseCanRun, canRun};
			});
		} else if (k === "hostile") {
			let datas = window[v] as Record<string, HostileGame>;
			Object.keys(datas).forEach((key) => {
				let data = datas[key];
				let baseShouldShow = getFuncStr(data.baseShouldShow, data);
				let shouldShow = getFuncStr(data.shouldShow, data);
				let canRun = getFuncStr(data.canRun, data);
				gameData.hostile[key] = {...data, baseShouldShow, shouldShow, canRun};
			});
		} else if (k === "itemType") {
			let datas = window[v] as Record<string, ItemType>;
			Object.keys(datas).forEach((key) => {
				let data = datas[key];
				gameData.itemType[key] = {...data, id: +key};
			});
		} else if (k === "item") {
			let FoodDatas = window[v][0] as Record<string, Food>;
			Object.keys(FoodDatas).forEach((key) => {
				let data = FoodDatas[key];
				gameData.food[key] = {...data, id: +key, description: data.getDescription ? data.getDescription() : data.description};
			});
			let resourceDatas = window[v][1] as Record<string, Resource>;
			Object.keys(resourceDatas).forEach((key) => {
				let data = resourceDatas[key];
				gameData.resource[key] = {...data, id: +key};
			});
		} else if (k === "boss") {
			let datas = window[v] as Record<string, Boss>;
			Object.keys(datas).forEach((key) => {
				let data = datas[key];
				gameData.boss[key] = {...data, id: +key};

				gameData.bossPhase[key] = {};
				Object.keys(data.phases).forEach(idx => {
					gameData.bossPhase[key][idx] = {
						bossId: +key,
						id: +idx,
						phase: +idx,
						health: data.phases[idx].health,
						storyId: data.phases[idx].storyId,
						dependency: [],
					};
					if (idx === "0") {
						gameData.bossPhase[key][idx].dependency!.push({id: key, type: "boss"});
					} else {
						gameData.bossPhase[key][idx].dependency!.push({id: key, type: "boss", phase: +idx - 1});
					}
				})
			});
		} else if (k === "bossAttr") {
			let datas = window[v] as Record<string, Record<string, BossAttr>>;
			Object.keys(datas).forEach((key) => {
				let data = datas[key];
				gameData.bossAttr[key] = {...data};
			});
		} else if (k === "boss0Story") {
			let datas = window[v] as Record<string, BossStory>;
			Object.keys(datas).forEach((key) => {
				let data = datas[key];
				if (!gameData.bossStory[0]) {
					gameData.bossStory[0] = {};
				}
				gameData.bossStory[0][key] = {...data};
			});
		} else if (k === "enemy") {
			let datas = window[v] as Record<string, Enemy>;
			Object.keys(datas).forEach((key) => {
				let data = datas[key];
				gameData.enemy[key] = {...data};
			});
		} else if (k === "perk") {
			let datas = window[v] as Record<string, Perk>;
			Object.keys(datas).forEach((key) => {
				let data = datas[key];
				gameData.perk[key] = {...data};
			});
		}
	});
}
function getFuncStr(func: () => any, data: SkillGame | JobGame | ConstructionGame | ExplorGame | HostileGame) {
	let funcExcractRegex = /function\(.*?\)\{(.*)\}/;
	let match = ("" + func).match(funcExcractRegex);
	if (!match) {
		console.log("" + func);
		throw new Error("func not match");
	}
	return fixVarNames(match[1], data);
}
function fixVarNames(str: string, data: SkillGame | JobGame | ConstructionGame | ExplorGame | HostileGame) {
	let result = str;
	
	Object.keys(varNames).forEach(key => {
		result = result.replace(new RegExp(key, "g"), varNames[key]);
	});
	result = result.replace(/getString\('(0x[0-9a-f]+)'\)/g, (val, match1) => {
		return "'" + getString(match1) + "'";
	});

	result = result.replace(/([\[\(, ])(0x[0-9a-f]+)([\]\), ])/g, (val, match1, match2, match3) => {
		return match1 + doEval(match2) + match3;
	});
	result = result.replace(/(0x0)/g, "0");
	result = result.replace(/!!\[\]/g, " true");
	result = result.replace(/!\[\]/g, " false");

	result = result.replace(/(job|construction|exploration)\[_0x[0-9a-f]+\]/g, (val, match1) => {
		return match1 + "[this['id']]";
	});
	return result;
}

function checkDataProp() {
	Object.keys(gameData.skill).forEach((key) => {
		let data = gameData.skill[key];
		Object.keys(data).forEach(k => {
			if([
				"id",
				"icon",
				"name",
				"shouldShow",
			].indexOf(k) === -1) {
				console.warn("new prop", k, "skill", data);
			}
		});
	});
	Object.keys(gameData.job).forEach((key) => {
		let data = gameData.job[key];
		Object.keys(data).forEach(k => {
			if([
				"baseCanRun",
				"baseShouldShow",
				"canRun",
				"icon",
				"id",
				"name",
				"onComplete",
				"requiredProgress",
				"requiredResourceId",
				"rewardedItems",
				"shouldShow",
				"skillId",
				"tooltip",
				"getTooltip",
				"automationUnlockAlternative",
				"completionDamage",
				"automationRequirement",
				"requiredResourceAmount",
				"foodTrade",
				"isExcludedFromPassiveJobs",
			].indexOf(k) === -1) {
				console.warn("new prop", k, "job", data);
			}
		});
	});
	Object.keys(gameData.construction).forEach((key) => {
		let data = gameData.construction[key];
		Object.keys(data).forEach(k => {
			if([
				"baseCanRun",
				"baseShouldShow",
				"canRun",
				"id",
				"name",
				"onComplete",
				"requiredProgress",
				"requiredResources",
				"shouldShow",
				"skillId",
				"tooltip",
				"inventorySize",
				"decayMultiplier",
				"automationUnlockAlternative",
				"maxHealthGainMultiplier",
				"automationRequirement",
				"getTooltip",
			].indexOf(k) === -1) {
				console.warn("new prop", k, "construction", data);
			}
		});
	});
	Object.keys(gameData.exploration).forEach((key) => {
		let data = gameData.exploration[key];
		Object.keys(data).forEach(k => {
			if([
				"baseCanRun",
				"baseShouldShow",
				"canRun",
				"completedStory",
				"getCompletedStory",
				"id",
				"name",
				"onComplete",
				"requiredProgress",
				"shouldShow",
				"skillId",
				"tooltip",
				"getTooltip",
				"isStoryBranch",
				"startsBranch",
				"branchColor",
				"additionalDamagePerMs",
				"maxHealthGainMultiplier",
				"automationUnlockAlternative",
				"decayMultiplier",
				"completionDamage",
				"awardItem",
				"multiplierRequirement",
				"failDamage",
				"completionScaling",
				"automationRequirement",
				"isRepeatable",
				"skipCompletedStory",
				"bossId",
				"bossDamage",
				"bossPhases",
				"bossScalingVariable",
				"bossScalingVariableIncrease",
			].indexOf(k) === -1) {
				console.warn("new prop", k, "exploration", data);
			}
		});
	});
	Object.keys(gameData.hostile).forEach((key) => {
		let data = gameData.hostile[key];
		Object.keys(data).forEach(k => {
			if([
				"baseShouldShow",
				"bossId",
				"bossPhases",
				"canRun",
				"completionDamage",
				"completionBossHealing",
				"completionSpeedIncrease",
				"enemy",
				"id",
				"name",
				"onComplete",
				"requiredProgress",
				"shouldShow",
				"tooltip",
			].indexOf(k) === -1) {
				console.warn("new prop", k, "hostile", data);
			}
		});
	});
	Object.keys(gameData.boss).forEach((key) => {
		let data = gameData.boss[key];
		Object.keys(data).forEach(k => {
			if([
				"name",
				"phases",
				"id",
			].indexOf(k) === -1) {
				console.warn("new prop", k, "boss", data);
			}
		});
	});
	Object.keys(gameData.bossAttr).forEach((key) => {
		let data = gameData.bossAttr[key];
		Object.values(data).forEach(d => {
			Object.keys(d).forEach(k => {
				if([
					"bossBarIcon",
					"description",
					"scalingMultiplier",
					"showOnBossBar",
				].indexOf(k) === -1) {
					console.warn("new prop", k, "bossAttr", data);
				}
			});
		})
	});
}
function analysisGameData() {
	//分析
	Object.keys(gameData.skill).forEach((key) => {
		let data = gameData.skill[key];
		let conds: Dependency[] = [];
		conds.push(...getCond(data.shouldShow, "skill", data));
		data.dependency = conds;
	});
	Object.keys(gameData.job).forEach((key) => {
		let data = gameData.job[key];
		let conds: Dependency[] = [];
		conds.push(...getCond(data.baseShouldShow, "job", data));
		conds.push(...getCond(data.baseCanRun, "job", data));
		conds.push(...getCond(data.shouldShow, "job", data));
		conds.push(...getCond(data.canRun, "job", data));
		data.dependency = conds;
	});
	Object.keys(gameData.construction).forEach((key) => {
		let data = gameData.construction[key];
		let conds: Dependency[] = [];
		conds.push(...getCond(data.baseShouldShow, "construction", data));
		conds.push(...getCond(data.baseCanRun, "construction", data));
		conds.push(...getCond(data.shouldShow, "construction", data));
		conds.push(...getCond(data.canRun, "construction", data));
		data.dependency = conds;
	});
	Object.keys(gameData.exploration).forEach((key) => {
		let data = gameData.exploration[key];
		let conds: Dependency[] = [];
		conds.push(...getCond(data.baseShouldShow, "exploration", data));
		conds.push(...getCond(data.baseCanRun, "exploration", data));
		conds.push(...getCond(data.shouldShow, "exploration", data));
		conds.push(...getCond(data.canRun, "exploration", data));
		data.dependency = conds;
	});
	Object.keys(gameData.hostile).forEach((key) => {
		let data = gameData.hostile[key];
		let conds: Dependency[] = [];
		conds.push(...getCond(data.baseShouldShow, "exploration", data));
		conds.push(...getCond(data.shouldShow, "exploration", data));
		conds.push(...getCond(data.canRun, "exploration", data));
		data.dependency = conds;
	});
}
function getCond(str: FuncString, type: AllType, data: SkillInfo | JobInfo | ConstructionInfo | ExplorInfo | HostileInfo) {
	str = str.replace(/;$/, "");
	let strArr = str.split(";");
	let strArr2 = strArr.map(arr => arr.split("&&("));
	let strArr3 = strArr2.map(arr2 => arr2.map(arr => arr.split(/\|\||&&/)));

	let cond: Dependency[] = [];
	strArr3.forEach(arr2 => {
		arr2.forEach(arr => {
			arr.forEach(s => {
				s = s.replace(/^return[ ]?/, "").replace(/;$/, "").replace(/^\(/, "").replace(/\)$/, "");
				if (s === "typeof game!=='undefined'") {
				} else if (s === "true") {
				} else if (s.match(new RegExp("^game\\['skills'\\]\\["+data.id+"\\]\\['instinctLevel'\\]\\['cmp'\\]\\(1\\)>=0$"))) {
				} else if (s === "job[this['id']]['baseShouldShow'](") {
				} else if (s === "job[this['id']]['baseCanRun'](") {
				} else if (s === "construction[this['id']]['baseShouldShow'](") {
				} else if (s === "construction[this['id']]['baseCanRun'](") {
				} else if (s === "exploration[this['id']]['baseShouldShow'](") {
				} else if (s === "exploration[this['id']]['baseCanRun'](") {
				} else if (s === "hostile[this['id']]['baseShouldShow'](") {
				} else if (s === "game['construction'][this['id']]['currentProgress']['cmp'](0)>0") {
				} else if (s === "game['inventory'][1][this['requiredResourceId']]['amount']['cmp'](this['requiredResourceAmount'])>=0") {
				} else if (s === "game['boss']==null") {
					if (cond.length) {
						let bossId = -1;
						cond.forEach(c => {
							let d = gameData[c.type as AllType][c.id];
							if ((d as any).bossId !== undefined) {
								bossId = (d as any).bossId;
							}
						});
						if (bossId !== -1 && gameData.boss[bossId]) {
							cond.push({
								id: "" + bossId,
								type: "boss",
								phase: Object.keys(gameData.bossPhase[bossId]).reduce((max, key) => Math.max(max, +key), 0),
							});
						} else {
							console.warn("not find bossId");
						}
					} else {
						console.warn("not find bossId");
					}
				} else if (s === "game['boss']!=null") {
				} else if (s === "game['boss']['phase']>=0x4") {
					if (cond.length) {
						let bossId = -1;
						cond.forEach(c => {
							let d = gameData[c.type as AllType][c.id];
							if ((d as any).bossId !== undefined) {
								bossId = (d as any).bossId;
							}
						});
						if (bossId !== -1 && gameData.boss[bossId]) {
							cond.push({
								id: "" + bossId,
								type: "boss",
								phase: 4,
							});
						} else {
							console.warn("not find bossId");
						}
					} else {
						console.warn("not find bossId");
					}
				} else if (s === "this['isRepeatable']") {
				} else if (s === "job[this['id']]['requiredProgress']['sub'](game['jobs'][this['id']]['currentProgress'])['div'](game['skills'][job[this['id']]['skillId']]['currentMultiplier'])['cmp'](100)>0") {
				} else if (s.startsWith("leftHealthOnComplete")) {
				} else if (s.startsWith("notFinishInThisTick")) {
				} else if (s.startsWith("haveItem")) {
				} else if (s.startsWith("haveAllItem")) {
				} else if (s.startsWith("calcFoodTrade")) {
				} else if (s.startsWith("notArriveProgressStep")) {
				} else if (s.startsWith("!isFullAllItem")) {
				} else if (s.startsWith("willNotDie")) {
				} else if (s.startsWith("getBossVariable")) {
				} else if (s.startsWith("!(getBossVariable")) {
				} else if (s === "game['boss']['id']==hostile[this['id']]['bossId']") {
					let bossId = (data as Hostile).bossId;
					if (bossId !== undefined) {
						cond.push({type: "boss", id: "" + bossId});
					} else {
						console.error(data);
						throw new Error("data no bossId");
					}
				} else if (s === "hostile[this['id']]['bossPhases']['includes'](game['boss']['phase']") {
					let bossId = (data as Hostile).bossId;
					let bossPhases = (data as Hostile).bossPhases;
					if (bossId !== undefined) {
						if (bossPhases) {
							bossPhases.forEach(phase => {
								cond.push({type: "boss", id: "" + bossId, phase: phase});
							})
						} else {
							console.error(data);
							throw new Error("data no bossPhases");
						}
					} else {
						console.error(data);
						throw new Error("data no bossId");
					}
				} else if (s === "game['boss']['id']==exploration[this['id']]['bossId']") {
					let bossId = (data as ExplorInfo).bossId;
					if (bossId !== undefined) {
						cond.push({type: "boss", id: "" + bossId});
					} else {
						console.error(data);
						throw new Error("data no bossId");
					}
				} else if (s === "exploration[this['id']]['bossPhases']['includes'](game['boss']['phase']") {
					let bossId = (data as ExplorInfo).bossId;
					let bossPhases = (data as ExplorInfo).bossPhases;
					if (bossId !== undefined) {
						if (bossPhases) {
							bossPhases.forEach(phase => {
								cond.push({type: "boss", id: "" + bossId, phase: phase});
							})
						} else {
							console.error(data);
							throw new Error("data no bossPhases");
						}
					} else {
						console.error(data);
						throw new Error("data no bossId");
					}
				} else if (s.match(/let _0x(?:[0-9a-f]+?)=_0x(?:[0-9a-f]+?)!=null/)) {
				} else if (s.match(/_0x(?:[0-9a-f]+?)\['forceFight'\]!=null\?_0x(?:[0-9a-f]+?)\['forceFight'\]: false/)) {
				} else if (s.match(/^!game\['(\w+)'\]\[(\d+)\]\[('timesCompleted'|'isFinished')\]/)) {
				} else if (s.match(/^!\(game\['(\w+)'\]\[(\d+)\]\[('timesCompleted'|'isFinished')\]/)) {
				} else if (s.match(/^!game\['(\w+)'\]\[this\['id'\]\]\[('timesCompleted'|'isFinished')\]/)) {
				} else if (s.match(/^!game\['(\w+)'\]\[this\['id'\](-|\+)0x(\d+)\]\[('timesCompleted'|'isFinished')\]/)) {
				} else if (s.match(/^game\['(\w+)'\]\[(\d+)\]\[('timesCompleted'|'isFinished')\]/)) {
					let match = s.match(/^game\['(\w+)'\]\[(\d+)\]\[('timesCompleted'|'isFinished')\]/)!;
					if ((gameData as any)[match[1]] && (gameData as any)[match[1]][match[2]]) {
						if (match[1] === type && +match[2] > data.id) {
							// console.warn("cond id bigger then self, ignore", data, type, match[2]);
						} else {
							cond.push({type: match[1] as any, id: match[2]})
						}
					} else {
						console.error(match);
						throw new Error("data not found");
					}
				} else if (s.match(/^game\['(\w+)'\]\[this\['id'\](-|\+)0x(\d+)\]\[('timesCompleted'|'isFinished')\]/)) {
					let match = s.match(/^game\['(\w+)'\]\[this\['id'\](-|\+)0x(\d+)\]\[('timesCompleted'|'isFinished')\]/)!;
					let dir = 1;
					if (match[2] === "-") dir = -1;
					if ((gameData as any)[match[1]] && (gameData as any)[match[1]][data.id + (+match[3] * dir)]) {
						if (match[1] === type && (data.id + (+match[3] * dir)) > data.id) {
							// console.warn("cond id bigger then self, ignore", data, type, (data.id + (+match[3] * dir)));
						} else {
							cond.push({type: match[1] as any, id: "" + (data.id + (+match[3] * dir))})
						}
					} else {
						console.error(match);
						throw new Error("data not found");
					}
				} else if (data.name === "Return to the kids") {
					(data as ExplorInfo).requiredResources = {
						0: {
							amount: new Decimal(-1),
							itemId: 20,
						}
					}
				} else {
					console.log(s, str, strArr3, data);
				}
			});
		});
	});
	if (data.name === "Approach statue") {
		(data as ExplorInfo).addBoss = 0;
	} else if (data.name === "Return to titan") {
		gameData.bossPhase[0][2].dependency!.push({
			id: "" + data.id,
			type: "exploration",
		});
	} else if ((data as ExplorInfo).bossDamage) {
		let bossId = (data as ExplorInfo).bossId;
		let bossPhases = (data as ExplorInfo).bossPhases;
		if (bossId === undefined) {
			console.error(data);
			throw new Error("data no bossId");
		}
		if (bossPhases === undefined) {
			console.error(data);
			throw new Error("data no bossPhases");
		}
		if (bossPhases[0] === 0 && gameData.bossPhase[bossId][1]) {
			gameData.bossPhase[bossId][1].dependency!.push({
				id: "" + data.id,
				type: "exploration",
			});
		}
	}

	return cond;
}
function mergeCond(cond: Dependency[]) {
	let result: Dependency[] = [];
	cond.forEach(d => {
		if (!result.find(r => r.type === d.type && r.id === d.id && r.phase === d.phase)) {
			result.push(d);
		}
	})

	result.sort((o1, o2) => {
		if (o1.type === "boss" && o2.type === "boss") {
			let p1 = o1.phase ?? -1;
			let p2 = o2.phase ?? -1;
			return p1 - p2;
		}
		return 0;
	});
	return result;
}

function buildDataLevel() {
	let count = 0;
	let isFilish = false;
	while (!isFilish && count < 100) {
		count++;
		isFilish = true;
		let isChange = false;

		if(setLevelByParent(0)) {
			isChange = true;
		}
		try {
			Object.keys(gameData.skill).forEach((key) => {
				let data = gameData.skill[key];
				if (data.level === undefined) {
					throw new Error();
				}
				if(setLevelByParent(data.level, {id: key, type: "skill"})) {
					isChange = true;
				}
			});
		} catch (e) {
			isFilish = false;
		}
		try {
			Object.keys(gameData.job).forEach((key) => {
				let data = gameData.job[key];
				if (data.level === undefined) {
					throw new Error();
				}
				if(setLevelByParent(data.level, {id: key, type: "job"})) {
					isChange = true;
				}
				if (data.rewardedItems) {
					Object.values(data.rewardedItems).filter(r => r.itemType === 1).forEach(r => {
						if(setLevelByParent(data.level!, {id: "" + r.itemId, type: "resources"})) {
							isChange = true;
						}
					});
				}
			});
		} catch (e) {
			isFilish = false;
		}
		try {
			Object.keys(gameData.construction).forEach((key) => {
				let data = gameData.construction[key];
				if (data.level === undefined) {
					throw new Error();
				}
				if(setLevelByParent(data.level, {id: key, type: "construction"})) {
					isChange = true;
				}
			});
		} catch (e) {
			isFilish = false;
		}
		try {
			Object.keys(gameData.exploration).forEach((key) => {
				let data = gameData.exploration[key];
				if (data.level === undefined) {
					throw new Error();
				}
				if(setLevelByParent(data.level, {id: key, type: "exploration"})) {
					isChange = true;
				}
				if (data.awardItem && data.awardItem.type === 1) {
					if(setLevelByParent(data.level!, {id: "" + data.awardItem!.id, type: "resources"})) {
						isChange = true;
					}
				}
			});
		} catch (e) {
			isFilish = false;
		}
		try {
			Object.keys(gameData.boss).forEach((key) => {
				let data = gameData.boss[key];
				if (data.level === undefined) {
					throw new Error();
				}
				if(setLevelByParent(data.level, {id: key, type: "boss"})) {
					isChange = true;
				}
			});
		} catch (e) {
			isFilish = false;
		}
		try {
			Object.values(gameData.bossPhase).forEach((bossPhase) => {
				Object.keys(bossPhase).forEach((key) => {
					let data = bossPhase[key];
					if (data.level === undefined) {
						throw new Error();
					}
					if(setLevelByParent(data.level, {id: "" + data.bossId, type: "boss", phase: data.phase})) {
						isChange = true;
					}
				});
			});
		} catch (e) {
			isFilish = false;
		}
		try {
			Object.keys(gameData.hostile).forEach((key) => {
				let data = gameData.hostile[key];
				if (data.level === undefined) {
					throw new Error();
				}
				if(setLevelByParent(data.level, {id: key, type: "hostile"})) {
					isChange = true;
				}
			});
		} catch (e) {
			isFilish = false;
		}

		if (isChange) {
			isFilish = false;
		}
	}
}
function setLevelByParent(level: number, parent?: Dependency) {
	let isChange = false;
	Object.keys(gameData.skill).forEach((key) => {
		let data = gameData.skill[key];
		let isMatch = false;
		if (parent === undefined && data.dependency?.length === 0) {
			isMatch = true;
		} else if (parent !== undefined && parent.phase !== undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type && d.phase === parent.phase)) {
			if (parent.type !== "boss" || (parent.type === "boss" && data.dependency?.filter(d => d.type === "boss" && d.phase !== undefined).findIndex(d => d.id === parent.id && d.type === parent.type && d.phase === parent.phase) === 0)) {
				isMatch = true;
			}
		} else if (parent !== undefined && parent.phase === undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type)) {
			isMatch = true;
		}
		if (isMatch) {
			if (!data.level || data.level < level + 1) {
				data.level = level + 1;
				isChange = true;
			}
		}
	});
	Object.keys(gameData.job).forEach((key) => {
		let data = gameData.job[key];
		let isMatch = false;
		if (parent === undefined && data.dependency?.length === 0) {
			isMatch = true;
		} else if (parent !== undefined && parent.phase !== undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type && d.phase === parent.phase)) {
			if (parent.type !== "boss" || (parent.type === "boss" && data.dependency?.filter(d => d.type === "boss" && d.phase !== undefined).findIndex(d => d.id === parent.id && d.type === parent.type && d.phase === parent.phase) === 0)) {
				isMatch = true;
			}
		} else if (parent !== undefined && parent.phase === undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type)) {
			if (parent.type !== "exploration" || (parent.type === "exploration" && data.dependency?.filter(d => d.type === "exploration").findIndex(d => d.id === parent.id && d.type === parent.type) === 0)) {
				isMatch = true;
			}
		} else if (parent !== undefined && parent.phase === undefined && data.requiredResourceId && parent.type === "resources" && +parent.id === data.requiredResourceId) {
			isMatch = true;
		}
		if (isMatch) {
			if (!data.level || data.level < level + 1) {
				data.level = level + 1;
				isChange = true;
			}
		}
	});
	Object.keys(gameData.construction).forEach((key) => {
		let data = gameData.construction[key];
		let isMatch = false;
		if (parent === undefined && data.dependency?.length === 0) {
			isMatch = true;
		} else if (parent !== undefined && parent.phase !== undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type && d.phase === parent.phase)) {
			if (parent.type !== "boss" || (parent.type === "boss" && data.dependency?.filter(d => d.type === "boss" && d.phase !== undefined).findIndex(d => d.id === parent.id && d.type === parent.type && d.phase === parent.phase) === 0)) {
				isMatch = true;
			}
		} else if (parent !== undefined && parent.phase === undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type)) {
			isMatch = true;
		}
		if (isMatch) {
			if (!data.level || data.level < level + 1) {
				data.level = level + 1;
				isChange = true;
			}
		}
	});
	Object.keys(gameData.exploration).forEach((key) => {
		let data = gameData.exploration[key];
		let isMatch = false;
		if (parent === undefined && data.dependency?.length === 0) {
			isMatch = true;
		} else if (parent !== undefined && parent.phase !== undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type && d.phase === parent.phase)) {
			if (parent.type !== "boss" || (parent.type === "boss" && data.dependency?.filter(d => d.type === "boss" && d.phase !== undefined).findIndex(d => d.id === parent.id && d.type === parent.type && d.phase === parent.phase) === 0)) {
				isMatch = true;
			}
		} else if (parent !== undefined && parent.phase === undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type)) {
			isMatch = true;
		}
		if (isMatch) {
			if (!data.level || data.level < level + 1) {
				data.level = level + 1;
				isChange = true;
			}
		}
	});
	Object.values(gameData.bossPhase).forEach((bossPhase) => {
		Object.keys(bossPhase).forEach((key) => {
			let data = bossPhase[key];
			let isMatch = false;
			
			if (parent === undefined && data.dependency?.length === 0) {
				isMatch = true;
			} else if (parent !== undefined && parent.phase !== undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type && d.phase === parent.phase)) {
				if (parent.type !== "boss" || (parent.type === "boss" && data.dependency?.filter(d => d.type === "boss" && d.phase !== undefined).findIndex(d => d.id === parent.id && d.type === parent.type && d.phase === parent.phase) === 0)) {
					isMatch = true;
				}
			} else if (parent !== undefined && parent.phase === undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type)) {
				isMatch = true;
			}
			if (isMatch) {
				if (!data.level || data.level < level + 1) {
					data.level = level + 1;
					isChange = true;
				}
			}
		});
	});
	Object.keys(gameData.hostile).forEach((key) => {
		let data = gameData.hostile[key];
		let isMatch = false;
		if (parent === undefined && data.dependency?.length === 0) {
			isMatch = true;
		} else if (parent !== undefined && parent.phase !== undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type && d.phase === parent.phase)) {
			if (parent.type !== "boss" || (parent.type === "boss" && data.dependency?.filter(d => d.type === "boss" && d.phase !== undefined).findIndex(d => d.id === parent.id && d.type === parent.type && d.phase === parent.phase) === 0)) {
				isMatch = true;
			}
		} else if (parent !== undefined && parent.phase === undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type)) {
			isMatch = true;
		}
		if (isMatch) {
			if (!data.level || data.level < level + 1) {
				data.level = level + 1;
				isChange = true;
			}
		}
	});
	if (parent?.type === "exploration" && gameData.exploration[parent.id].addBoss !== undefined) {
		let bossId = gameData.exploration[parent.id].addBoss!;
		let data = gameData.boss[bossId];
		if (!data.dependency) {
			data.dependency = [];
		}
		data.dependency.push({
			id: parent.id,
			type: "exploration",
		});
		if (!data.level || data.level < level + 1) {
			data.level = level + 1;
			isChange = true;
		}

		Object.values(gameData.bossPhase[bossId]).forEach((phase, i) => {
			let data = phase;
			if (!data.level || data.level < level + 1) {
				data.level = level + 1;
				isChange = true;
			}
		});
	}

	return isChange;
}
function checkDataLevel() {
	Object.keys(gameData.skill).forEach((key) => {
		let data = gameData.skill[key];
		if (data.level === undefined) {
			console.log(data);
			throw new Error("data no level");
		}
	});
	Object.keys(gameData.job).forEach((key) => {
		let data = gameData.job[key];
		if (data.level === undefined) {
			console.log(data);
			throw new Error("data no level");
		}
	});
	Object.keys(gameData.construction).forEach((key) => {
		let data = gameData.construction[key];
		if (data.level === undefined) {
			console.log(data);
			throw new Error("data no level");
		}
	});
	Object.keys(gameData.exploration).forEach((key) => {
		let data = gameData.exploration[key];
		if (data.level === undefined) {
			console.log(data);
			throw new Error("data no level");
		}
	});
	Object.keys(gameData.boss).forEach((key) => {
		let data = gameData.boss[key];
		if (data.level === undefined) {
			console.log(data);
			throw new Error("data no level");
		}
	});
	Object.values(gameData.bossPhase).forEach(bossPhase => {
		Object.keys(bossPhase).forEach((key) => {
			let data = bossPhase[key];
			if (data.level === undefined) {
				console.log(data);
				throw new Error("data no level");
			}
		});
	})
	Object.keys(gameData.hostile).forEach((key) => {
		let data = gameData.hostile[key];
		if (data.level === undefined) {
			console.log(data);
			throw new Error("data no level");
		}
	});

	let change = false;
	let levels = cheps.map((c,i) => ({chep: i + 1, start: gameData.exploration[c].level, end: cheps[i + 1] ? gameData.exploration[cheps[i + 1] - 1].level! : undefined}));
	levels.forEach((lvl, i) => {
		if (levels[i - 1] && lvl.start! <= levels[i - 1].end!) {
			gameData.exploration[cheps[i]].level! = levels[i - 1].end! + 1;
			change = true;
		}
	});

	if (change) {
		return change;
	}
	
	// let bossPhases = Object.values(gameData.bossPhase).map((bossPhase) => (Object.values(bossPhase))).flat();
	// bossPhases.forEach((phase, i) => {
	// 	let levelData = getDataByLevel(phase.level!);
	// 	if (levelData.count !== 1) {
	// 		console.log(phase.level!, phase, levelData);
			
	// 		// phase.level!++;

	// 		// levelData = getDataByLevel(phase.level!);
	// 		// levelData.skill.forEach(d => {
	// 		// 	d.level!++;
	// 		// });
	// 		// levelData.job.forEach(d => {
	// 		// 	d.level!++;
	// 		// });
	// 		// levelData.construction.forEach(d => {
	// 		// 	d.level!++;
	// 		// });
	// 		// levelData.exploration.forEach(d => {
	// 		// 	d.level!++;
	// 		// });
	// 		// levelData.boss.forEach(d => {
	// 		// 	d.level!++;
	// 		// });
	// 		// levelData.bossPhase.forEach(d => {
	// 		// 	d.level!++;
	// 		// });
	// 	}
	// });

	return change;
}
//#endregion
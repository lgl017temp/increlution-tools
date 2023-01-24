import { Plugin, save, load, toggle, plugins, settings, btnContainer, gameLoadPromise, Game, getLocal, doEval } from "../core";

import type DecimalType from "break_infinity.js";
import type {} from "jquery";
import type PIXIType from "pixi.js";
import type Viewport from "pixi-viewport";
import * as PIXI from "pixi.js";
import * as pixi_viewport from "pixi-viewport";
import { type } from "os";

declare let game: undefined | Game;

declare let $: JQueryStatic;
declare let Decimal: typeof DecimalType;

declare let cnItems: Record<string, string>;
declare let cnPrefix: Record<string, string>;
declare let cnPostfix: Record<string, string>;
declare let cnRegReplace: Map<RegExp, string>;

let togglePathBtn: JQuery<HTMLElement>;
let toggleSpoilerBtn: JQuery<HTMLElement>;
plugins.push({
	init: () => {
		togglePathBtn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-right: 10px;" id="pause-button" type="button" class="btn btn-block btn-success ${settings.showPath ? 'running' : 'paused'}"><i class="fas ${settings.showPath ? 'fa-play' : 'fa-pause'}"></i> <span>${getLocal("chart.togglePath")}</span></button>`);
		btnContainer.append(togglePathBtn);
		togglePathBtn.on("click", function() {
			if (settings.showPath) {
				settings.showPath = false;
				$(this).addClass("paused").removeClass("running");
				$(this).find("i").addClass("fa-pause").removeClass("fa-play");
			} else {
				settings.showPath = true;
				$(this).removeClass("paused").addClass("running");
				$(this).find("i").removeClass("fa-pause").addClass("fa-play");
			}
			save();

			toggle();
		})

		toggleSpoilerBtn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-left: 10px;position: absolute; bottom: ${30 + 10}px; left: 0;z-index:1" id="pause-button" type="button" class="btn btn-block btn-success ${settings.spoiler ? 'running' : 'paused'}"><i class="fas ${settings.spoiler ? 'fa-play' : 'fa-pause'}"></i> <span>${getLocal("chart.spoiler")}</span></button>`);
		btnContainer.append(toggleSpoilerBtn);
		toggleSpoilerBtn.on("click", function() {
			if (settings.spoiler) {
				settings.spoiler = false;
				$(this).addClass("paused").removeClass("running");
				$(this).find("i").addClass("fa-pause").removeClass("fa-play");
			} else {
				settings.spoiler = true;
				$(this).removeClass("paused").addClass("running");
				$(this).find("i").removeClass("fa-pause").addClass("fa-play");
			}
			save();

			toggle();
		})

		pathPIXI = new PIXI.Application({
			width: imageWH[0] * window.devicePixelRatio - 2,
			height: imageWH[1] * window.devicePixelRatio - 32,
			backgroundAlpha: 0.5,
		});
		pathPIXI.ticker.stop();
		$(pathPIXI.view).css({"border-radius": "10px", border: "1px solid #666666", position: "absolute", bottom: "30px", left: "0", zoom: 1 / window.devicePixelRatio}).appendTo(btnContainer);

		pathViewPort = new pixi_viewport.Viewport({
			screenWidth: window.innerWidth,
			screenHeight: window.innerHeight,
			worldWidth: imageWH[0] * window.devicePixelRatio,
			worldHeight: imageWH[1] * window.devicePixelRatio,

			// passiveWheel: false,                            // whether the 'wheel' event is set to passive (note: if false, e.preventDefault() will be called when wheel is used over the viewport)
			interaction: pathPIXI.renderer.plugins.interaction,   // InteractionManager, available from instantiated WebGLRenderer/CanvasRenderer.plugins.interaction - used to calculate pointer position relative to canvas location on screen
		});

		// pathPIXI.stage.addChild(pathViewPort);
		pathPIXI.stage = pathViewPort;
		pathViewPort.drag()
		.pinch()
		.wheel()
		.decelerate();
		
		let isMoving = false;
		let isVisible = true;
		pathViewPort.addListener("drag-start", () => {
			// console.log("drag-start");
			pathPIXI.ticker.start();
			isMoving = true;
		}).addListener("drag-end", () => {
			// console.log("drag-end");
		}).addListener("moved", () => {
			// console.log("moved", pathPIXI.ticker.started);
			if (!pathPIXI.ticker.started && isVisible) {
				pathPIXI.ticker.start();
			}
		}).addListener("moved-end", () => {
			// console.log("moved-end");
			pathPIXI.render();
			pathPIXI.ticker.stop();
			isMoving = false;
		});

		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "hidden") {
				pathPIXI.ticker.stop();
				// console.log("hidden");
				isVisible = false;
			} else if (document.visibilityState === "visible") {
				if (isMoving) {
					pathPIXI.ticker.start();
				}
				// console.log("visible");
				isVisible = true;
			}
		});

		window.addEventListener("resize", () => {
			resizePathImage();
		});
	},
	settings: {
		showPath: false,
		spoiler: false,
	},
	toggle: () => {
		toggleSpoilerBtn.hide();
		if (settings.showPath) {
			buildPathImage();
			$(pathPIXI.view).show();
			chepBtns.forEach(btn => $(btn).show());
			// toggleSpoilerBtn.show();
		} else {
			$(pathPIXI.view).hide();
			chepBtns.forEach(btn => $(btn).hide());
			toggleSpoilerBtn.hide();
		}
		if (settings.spoiler) {
			showSpoiler();
		} else {
			hideSpoiler();
		}
	},
	changeLocale: () => {
		togglePathBtn.find("span").html(getLocal("chart.togglePath") as string);
		toggleSpoilerBtn.find("span").html(getLocal("chart.spoiler") as string);
		chepBtns.forEach((btn, i) => {
			if (i === chepBtns.length - 1) {
				btn.find("span").html(`${getLocal("chart.end")}`);
			} else {
				btn.find("span").html(`${getLocal("chart.chepPrefix")}${i + 1}${getLocal("chart.chepSuffix")}`);
			}
		});
		pathViewPort.removeChildren();
		pathInited = false;
		if (settings.showPath) {
			buildPathImage();
		}
	},
})

let numUnits = ["", "K", "M", "B", "T", "Qa"];
let formatNum = (val: DecimalType | number) => {
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
let getString = (idx: string | number) => {
	idx = +idx;
	return allString[idx];
};
let icons: Record<string, string> = {
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

//#region 类型声明

type FuncString = string;
type AllType = "skill" | "job" | "construction" | "exploration" | "boss" | "hostile";

interface Dependency {
	type: AllType | "resources";
	id: string;
	phase?: number;
}
interface Skill {
	id: number;
	icon: string;
	name: string;
	shouldShow: FuncString | (() => boolean);

	dependency?: Dependency[];
	used?: boolean;
	level?: number;
}
interface SkillGame extends Skill {
	shouldShow: () => boolean;
}
interface SkillInfo extends Skill {
	shouldShow: FuncString;
}

interface Job {
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
interface JobGame extends Job {
	baseCanRun: () => boolean;
	baseShouldShow: () => boolean;
	canRun: () => boolean;
	shouldShow: () => boolean;
}
interface JobInfo extends Job {
	baseCanRun: FuncString;
	baseShouldShow: FuncString;
	canRun: FuncString;
	shouldShow: FuncString;
}

interface Construction {
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
interface ConstructionGame extends Construction {
	baseCanRun: () => boolean;
	baseShouldShow: () => boolean;
	canRun: () => boolean;
	shouldShow: () => boolean;
}
interface ConstructionInfo extends Construction {
	baseCanRun: FuncString;
	baseShouldShow: FuncString;
	canRun: FuncString;
	shouldShow: FuncString;
}

interface Exploration {
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
interface ExplorGame extends Exploration {
	baseCanRun: () => boolean;
	baseShouldShow: () => boolean;
	canRun: () => boolean;
	shouldShow: () => boolean;
}
interface ExplorInfo extends Exploration {
	baseCanRun: FuncString;
	baseShouldShow: FuncString;
	canRun: FuncString;
	shouldShow: FuncString;
}

interface Hostile {
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
interface HostileGame extends Hostile {
	baseShouldShow: () => boolean;
	canRun: () => boolean;
	shouldShow: () => boolean;
}
interface HostileInfo extends Hostile {
	baseShouldShow: FuncString;
	canRun: FuncString;
	shouldShow: FuncString;
}

interface Enemy {
	name: string;
	icon: string;
}
interface Boss {
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
interface BossPhase {
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
interface BossAttr {
	bossBarIcon?: string;
	description?: string;
	scalingMultiplier?: DecimalType;
	showOnBossBar: boolean;
}
interface BossStory {
	name: string;
	completedStory: string;
}

interface ItemType {
	id: number;
	name: string;
}

interface Food {
	id: number;
	autoJobId: number;
	name: string;
	health: DecimalType;
	description: string;
	getDescription?: () => string;

	used?: boolean;
}

interface Resource {
	id: number;
	autoJobId: number;
	name: string;
	description: string;

	used?: boolean;
}

interface Chep {
	jobId: number;
	constructionId: number;
	explorationId: number;
}

interface DataJson {
	type: "start" | "end" | "skill" | "job" | "construction" | "exploration" | "boss" | "bossPhase" | "hostile" | "item" | "lifeEffect" | "lifeBadEffect" | "rebirthEffect" | "globalEffect";
	title?: string;
	id?: string;
	icon?: string;
	tooltip?: string[];
	exp?: string;
	extrReq?: string[];
	story?: string[];

	level: number;
	link?: string[];
	children?: DataJson[];
}

//#endregion

let readDataPromiseResolve: () => void;
export let readDataPromise = new Promise<void>((resolve) => {
	readDataPromiseResolve = resolve;
});

let pathPIXI: PIXIType.Application;
let pathViewPort: Viewport.Viewport;

//构建流程图
let varNames: Record<string, string> = {};
let vars: Record<string, string> = {};
let gameData = new class GameData {
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
}();
let cheps: number[] = [];
let imagePadding = [50, 50];
let imageWH = [window.innerWidth, window.innerHeight];
let imageTextZoom = 2;
let blockW = 250;
let blockPadding = 5;
let blockGap = [10, 20];
let lineWidth = 3;
let imageSettings: Record<"arrow" | DataJson["type"], {
	type: "normal" | "doubleCircleS" | "doubleCircleE" | "arrow";
	color?: number;
	borderColor?: number;
	bgColor?: number;
}> = {
	arrow: {type:"arrow", color: 0xDDDDDD},
	start: {type:"doubleCircleS", color: 0xDDDDDD},
	end: {type:"doubleCircleE", color: 0xDDDDDD},
	skill: {type:"normal", color: 0X40E0D0},
	job: {type:"normal", color: 0X87CEEB},
	construction: {type:"normal", color: 0XF0E68C},
	exploration: {type:"normal", color: 0XFF1493},
	boss: {type:"normal", color: 0XFF0000},
	bossPhase: {type:"normal", color: 0XFF0000},
	hostile: {type:"normal", color: 0xBA55D3},
	item: {type:"normal", color: 0xDDDDDD},
	lifeEffect: {type:"normal", color: 0xDDDDDD, borderColor: 0XDDDDDD, bgColor: 0x666666},
	lifeBadEffect: {type:"normal", color: 0xDDDDDD, borderColor: 0xFF0000, bgColor: 0x666666},
	rebirthEffect: {type:"normal", color: 0xDDDDDD, borderColor: 0X87CEEB, bgColor: 0x666666},
	globalEffect: {type:"normal", color: 0xDDDDDD, borderColor: 0XFF1493, bgColor: 0x666666},
}
let imgs: Record<string, PIXIType.Graphics> = {};
let linkImgs: Record<string, Record<string, PIXIType.Graphics>> = {};
let chepBtns: JQuery<HTMLElement>[] = [];
let pathInited = false;
function readGameData() {
	$.ajax({
		url: "gniller-min.js", 
		dataType: "text",
		success: (jsStr: string) => {
			window.gameData = gameData;
			window.vars = vars;
			window.varNames = varNames;
			window.pathPIXI = pathPIXI;
			window.pathViewPort = pathViewPort;
			window.exportNoTrans = exportNoTrans;
			window.allNoTrans = allNoTrans;
			window.translate = translate;
			window.buildJobJson = buildJobJson;

			excractGameData(jsStr);
			checkDataProp();
			analysisGameData();
		
			let count = 0;
			do {
				buildDataLevel();
			} while (checkDataLevel() && count < 100);
		
			readDataPromiseResolve();
		}
	})
}
let drawInterval: number | undefined;
function buildPathImage() {
	if (drawInterval) {
		clearInterval(drawInterval);
		drawInterval = undefined;
	}

	readDataPromise.then(() => {
		let gen = _buildPathImage();
		drawInterval = window.setInterval(() => {
			let lastRes: IteratorResult<undefined, void> | undefined = undefined;
			for (let i = 0; i < 10 && (!lastRes || !lastRes.done); i++) {
				lastRes = gen.next();
			}
			if (lastRes?.done) {
				clearInterval(drawInterval);
				drawInterval = undefined;
			}
			pathPIXI.render();
		}, 100);
	});
}
function* _buildPathImage() {
	if (pathInited) {
		return;
	}

	let centerX = imageWH[0] / 2;

	let start = buildDataImage({type: "start", level: 0});
	pathViewPort.addChild(start);
	start.x = centerX;
	start.y = imagePadding[1];
	imgs["start"] = start;

	let level = 1;
	let lastHeight = blockGap[1];
	let lastLevelData = getDataByLevel(level);
	let lineImgs: PIXIType.Graphics[] = [];
	let maxW = 0;
	while (lastLevelData.count !== 0 && level < 10000) {
		let lineHeight = 0;
		
		lastLevelData.skill.forEach(d => {
			let json = buildSkillJson(d);
			let img = buildDataImage(json);

			pathViewPort.addChild(img);
			
			img.y = imagePadding[1] + lastHeight + level * blockGap[1];
			
			lineHeight = Math.max(lineHeight, img.height);

			d.used = true;
			imgs["skill_" + d.id] = img;
			lineImgs.push(img);
		});
		lastLevelData.job.forEach(d => {
			let json = buildJobJson(d);
			let img = buildDataImage(json);

			pathViewPort.addChild(img);
			
			img.y = imagePadding[1] + lastHeight + level * blockGap[1];
			
			lineHeight = Math.max(lineHeight, img.height);

			d.used = true;
			imgs["job_" + d.id] = img;
			lineImgs.push(img);
		});
		lastLevelData.construction.forEach(d => {
			let json = buildConstructionJson(d);
			let img = buildDataImage(json);

			pathViewPort.addChild(img);
			
			img.y = imagePadding[1] + lastHeight + level * blockGap[1];
			
			lineHeight = Math.max(lineHeight, img.height);

			d.used = true;
			imgs["construction_" + d.id] = img;
			lineImgs.push(img);
		});
		lastLevelData.exploration.forEach(d => {
			let json = buildExplorJson(d);
			let img = buildDataImage(json);

			pathViewPort.addChild(img);
			
			img.y = imagePadding[1] + lastHeight + level * blockGap[1];
			
			lineHeight = Math.max(lineHeight, img.height);

			d.used = true;
			imgs["exploration_" + d.id] = img;
			lineImgs.push(img);
		});
		lastLevelData.boss.forEach(d => {
			let json = buildBossJson(d);
			let img = buildDataImage(json);

			pathViewPort.addChild(img);
			
			img.y = imagePadding[1] + lastHeight + level * blockGap[1];
			
			lineHeight = Math.max(lineHeight, img.height);

			d.used = true;
			imgs["boss_" + d.id] = img;
			lineImgs.push(img);
		});
		lastLevelData.bossPhase.forEach(d => {
			let json = buildBossPhaseJson(d);
			let img = buildDataImage(json);

			pathViewPort.addChild(img);
			
			img.y = imagePadding[1] + lastHeight + level * blockGap[1];
			
			lineHeight = Math.max(lineHeight, img.height);

			d.used = true;
			imgs["bossPhase_" + d.bossId + "_" + d.phase] = img;
			lineImgs.push(img);
		});
		lastLevelData.hostile.forEach(d => {
			let json = buildHostileJson(d);
			let img = buildDataImage(json);

			pathViewPort.addChild(img);
			
			img.y = imagePadding[1] + lastHeight + level * blockGap[1];
			
			lineHeight = Math.max(lineHeight, img.height);

			d.used = true;
			imgs["hostile_" + d.id] = img;
			lineImgs.push(img);
		});

		let sumW = 0;
		lineImgs.forEach(img => {
			sumW += img.width;
		});
		let currW = 0;
		lineImgs.forEach((img, i) => {
			img.x = centerX - (sumW + (lineImgs.length - 1) * blockGap[0]) / 2 + currW + i * blockGap[0];
			currW += img.width;
		});

		lastLevelData.skill.forEach(d => {
			if (d.dependency) {
				let img = imgs["skill_" + d.id];
				linkImgs["skill_" + d.id] = {};
				d.dependency.forEach(dd => {
					let linkArrow = buildLinkImage(dd, img);
					if (linkArrow) {
						linkImgs["skill_" + d.id][dd.type + "_" + dd.id + (dd.phase !== undefined ? "_" + dd.phase : "")] = linkArrow;
					}
				});
			}
		});
		lastLevelData.job.forEach(d => {
			if (d.dependency) {
				let img = imgs["job_" + d.id];
				linkImgs["job_" + d.id] = {};
				d.dependency.forEach(dd => {
					let linkArrow = buildLinkImage(dd, img);
					if (linkArrow) {
						linkImgs["job_" + d.id][dd.type + "_" + dd.id + (dd.phase !== undefined ? "_" + dd.phase : "")] = linkArrow;
					}
				});
			}
		});
		lastLevelData.construction.forEach(d => {
			if (d.dependency) {
				let img = imgs["construction_" + d.id];
				linkImgs["construction_" + d.id] = {};
				d.dependency.forEach(dd => {
					let linkArrow = buildLinkImage(dd, img);
					if (linkArrow) {
						linkImgs["construction_" + d.id][dd.type + "_" + dd.id + (dd.phase !== undefined ? "_" + dd.phase : "")] = linkArrow;
					}
				});
			}
		});
		lastLevelData.exploration.forEach(d => {
			if (d.dependency) {
				let img = imgs["exploration_" + d.id];
				linkImgs["exploration_" + d.id] = {};
				d.dependency.forEach(dd => {
					let linkArrow = buildLinkImage(dd, img);
					if (linkArrow) {
						linkImgs["exploration_" + d.id][dd.type + "_" + dd.id + (dd.phase !== undefined ? "_" + dd.phase : "")] = linkArrow;
					}
				});
			}
		});
		lastLevelData.boss.forEach(d => {
			if (d.dependency) {
				let img = imgs["boss_" + d.id];
				linkImgs["boss_" + d.id] = {};
				d.dependency.forEach(dd => {
					let linkArrow = buildLinkImage(dd, img);
					if (linkArrow) {
						linkImgs["boss_" + d.id][dd.type + "_" + dd.id + (dd.phase !== undefined ? "_" + dd.phase : "")] = linkArrow;
					}
				});
			}
		});
		lastLevelData.bossPhase.forEach(d => {
			if (d.dependency) {
				let img = imgs["bossPhase_" + d.bossId + "_" + d.phase];
				linkImgs["bossPhase_" + d.bossId + "_" + d.phase] = {};
				d.dependency.forEach(dd => {
					let linkArrow = buildLinkImage(dd, img);
					if (linkArrow) {
						linkImgs["bossPhase_" + d.bossId + "_" + d.phase][dd.type + "_" + dd.id + (dd.phase !== undefined ? "_" + dd.phase : "")] = linkArrow;
					}
				});
			}
		});
		lastLevelData.hostile.forEach(d => {
			if (d.dependency) {
				let img = imgs["hostile_" + d.id];
				linkImgs["hostile_" + d.id] = {};
				d.dependency.forEach(dd => {
					let linkArrow = buildLinkImage(dd, img);
					if (linkArrow) {
						linkImgs["hostile_" + d.id][dd.type + "_" + dd.id + (dd.phase !== undefined ? "_" + dd.phase : "")] = linkArrow;
					}
				});
			}
		});

		lineImgs = [];
		lastHeight += lineHeight;
		level++;
		lastLevelData = getDataByLevel(level);
		maxW = Math.max(maxW, sumW + (lineImgs.length + 1) * blockGap[0] + blockPadding * 20);

		yield;
	}

	let end = buildDataImage({type: "end", level: level});
	pathViewPort.addChild(end);
	end.x = centerX;
	end.y = imagePadding[1] + lastHeight + level * blockGap[1] + blockPadding + 15;
	imgs["end"] = end;

	cheps.forEach((c, i) => {
		if (!chepBtns[i]) {
			let btn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-left: 10px;position: absolute; bottom: ${(cheps.length - i + 2) * 30 + 10}px; left: 0" type="button" class="btn btn-block btn-light"><span>${getLocal("chart.chepPrefix")}${i + 1}${getLocal("chart.chepSuffix")}</span></button>`);
			$(btnContainer).append(btn);
	
			btn.on("click", () => {
				let img = imgs["exploration_" + c];
				pathViewPort.position = new PIXI.Point(-centerX * pathViewPort.scale.x + centerX, -img.y * pathViewPort.scale.y + imageWH[1] / 4);
			})
			
			chepBtns.push(btn);
			
			if (i === cheps.length - 1) {
				let btn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-left: 10px;position: absolute; bottom: ${60 + 10}px; left: 0" type="button" class="btn btn-block btn-light"><span>${getLocal("chart.end")}</span></button>`);
				$(btnContainer).append(btn);
		
				btn.on("click", () => {
					let img = imgs["end"];
					pathViewPort.position = new PIXI.Point(-centerX * pathViewPort.scale.x + centerX, -img.y * pathViewPort.scale.y + imageWH[1] / 4);
				})
				chepBtns.push(btn);
			}
		}

		let sy = imgs["exploration_" + c];
		let ey = imgs["exploration_" + (cheps[i + 1] - 1)];
		if (!ey) {
			let exprs = Object.keys(imgs).filter(k => k.startsWith("exploration_"));
			let lastExpr = exprs[exprs.length - 1];
			ey = imgs[lastExpr];
		}

		let chepBlock = new PIXI.Graphics();
		chepBlock.lineStyle(lineWidth, 0xff0000);
		chepBlock.moveTo(0, sy.y);
		chepBlock.lineTo(maxW, sy.y);
		chepBlock.x = centerX - maxW / 2;
		chepBlock.y = -blockGap[1] / 2;

		pathViewPort.addChild(chepBlock);

		if (i === cheps.length - 1) {
			let chepBlock = new PIXI.Graphics();
			chepBlock.lineStyle(lineWidth, 0xff0000);
			chepBlock.moveTo(0, end.y);
			chepBlock.lineTo(maxW, end.y);
			chepBlock.x = centerX - maxW / 2;
			chepBlock.y = -blockGap[1] / 2 - 15;

			pathViewPort.addChild(chepBlock);
		}
	});
	toggle();

	pathInited = true;
	pathPIXI.render();
}
function buildLinkImage(dd: Dependency, img: PIXIType.Graphics) {
	let linkImage = imgs[dd.type + "_" + dd.id];
	if (dd.type === "boss" && dd.phase !== undefined) {
		linkImage = imgs["bossPhase_" + dd.id + "_" + dd.phase];
	}
	if (!linkImage) {
		// console.warn("linkImage not match: " + JSON.stringify(dd));
		return;
	}

	let linkArrow = new PIXI.Graphics();
	pathViewPort.addChild(linkArrow);
	linkArrow.x = 0;
	linkArrow.y = 0;
	linkArrow.lineStyle(lineWidth, imageSettings.arrow.color, 0.1);
	linkArrow.moveTo(linkImage.x + linkImage.width / 2, linkImage.y + linkImage.height - lineWidth / 2)
	linkArrow.lineTo(img.x + img.width / 2, img.y - lineWidth / 2);
	
	return linkArrow;
}
function buildDataImage(json: DataJson) {
	let config = imageSettings[json.type];
	if (!config) {
		throw new Error("no config: " + json.type);
	}

	let color = 0x000000;
	if (config.color !== undefined) {
		color = config.color;
	}
	let borderColor = color;
	if (config.borderColor !== undefined) {
		borderColor = config.borderColor;
	}
	let bgColor = 0xffffff;
	if (config.bgColor !== undefined) {
		bgColor = config.bgColor;
	} else if (borderColor !== 0x000000) {
		let red = (borderColor >> 16 & 0x0000ff);
		let green = (borderColor >> 8 & 0x0000ff);
		let blue = (borderColor >> 0 & 0x0000ff);

		let rate = 0.8;
		red = 0 * rate + red * (1 - rate);
		green = 0 * rate + green * (1 - rate);
		blue = 0 * rate + blue * (1 - rate);

		bgColor = 0x000000 | (red << 16) | green << 8 | blue;
	}

	let result = new PIXI.Graphics();
	if (config.type === "normal") {
		let realBlockW = blockW;
		if (json.children) {
			let level = 0;
			let levelChild = json.children.filter(j => j.level === level);
			while (levelChild.length > 0 && level < 1000) {
				realBlockW = Math.max(realBlockW, levelChild.length * blockW + (levelChild.length - 1) * blockGap[0] + blockPadding * 2);

				level++;
				levelChild = json.children.filter(j => j.level === level);
			}
		}

		let nextHeight = blockPadding;

		let titleStyle = new PIXI.TextStyle({
			fontFamily: 'Font Awesome 5 Pro', //'Arial',
			fontSize: 14 * imageTextZoom,
			lineHeight: 16 * imageTextZoom,
			fill: color,
			wordWrap: false,
			whiteSpace: "pre",
			breakWords: true,
			wordWrapWidth: (realBlockW - blockPadding * 2) * imageTextZoom,
			lineJoin: 'round',
		});

		let textStyle = titleStyle.clone();
		textStyle.fontSize = 12 * imageTextZoom;

		let smallTextStyle = textStyle.clone();
		smallTextStyle.fontSize = 8 * imageTextZoom;
		smallTextStyle.lineHeight = 8 * imageTextZoom;

		let tooltipStyle = textStyle.clone();
		tooltipStyle.wordWrap = true;
		tooltipStyle.lineHeight = 14 * imageTextZoom;

		if (json.id) {
			let subTitleText = new PIXI.Text(json.id, smallTextStyle);
			result.addChild(subTitleText);
			subTitleText.scale.x = 1 / imageTextZoom;
			subTitleText.scale.y = 1 / imageTextZoom;
			subTitleText.x = (realBlockW - subTitleText.width) / 2;
			subTitleText.y = nextHeight;
			nextHeight += subTitleText.height;
		}

		if (json.title) {
			let text = json.title;
			if (json.icon) {
				text = `${icons[json.icon]} ${json.title}`;
			}
			let titleText = new PIXI.Text(translate(text), titleStyle);
			result.addChild(titleText);
			titleText.scale.x = 1 / imageTextZoom;
			titleText.scale.y = 1 / imageTextZoom;
			titleText.x = (realBlockW - titleText.width) / 2;
			titleText.y = nextHeight;
			nextHeight += titleText.height;
		}

		if (json.exp) {
			let text = json.exp;
			// if (json.icon) {
			// 	text = `${icons[json.icon]} ${json.exp}`;
			// }
			let expText = new PIXI.Text(text, textStyle);
			result.addChild(expText);
			expText.scale.x = 1 / imageTextZoom;
			expText.scale.y = 1 / imageTextZoom;
			expText.x = (realBlockW - expText.width) / 2;
			expText.y = nextHeight;

			nextHeight += expText.height;
		}

		if (json.extrReq && json.extrReq.length) {
			let splitLine = new PIXI.Graphics();
			result.addChild(splitLine);
			splitLine.x = 0;
			splitLine.y = nextHeight + blockPadding;
			splitLine.lineStyle(lineWidth, borderColor);
			splitLine.moveTo(0, +lineWidth / 2)
			splitLine.lineTo(realBlockW, +lineWidth / 2);

			nextHeight += lineWidth + blockPadding * 2;

			json.extrReq.forEach(req => {
				let extrReqText = new PIXI.Text(translate(req), tooltipStyle);
				result.addChild(extrReqText);
				extrReqText.scale.x = 1 / imageTextZoom;
				extrReqText.scale.y = 1 / imageTextZoom;
				extrReqText.x = blockPadding;
				extrReqText.y = nextHeight;
	
				nextHeight += extrReqText.height;
			});
		}

		if (json.tooltip && json.tooltip.length) {
			let splitLine = new PIXI.Graphics();
			result.addChild(splitLine);
			splitLine.x = 0;
			splitLine.y = nextHeight + blockPadding;
			splitLine.lineStyle(lineWidth, borderColor);
			splitLine.moveTo(0, +lineWidth / 2)
			splitLine.lineTo(realBlockW, +lineWidth / 2);

			nextHeight += lineWidth + blockPadding * 2;

			json.tooltip.forEach(tip => {
				tip = handleHtml(tip);
				if (tip.includes("<")) {
					console.log(tip);
				}
				let tooltipText = new PIXI.Text(translate(tip), tooltipStyle);
				result.addChild(tooltipText);
				tooltipText.scale.x = 1 / imageTextZoom;
				tooltipText.scale.y = 1 / imageTextZoom;
				tooltipText.x = blockPadding;
				tooltipText.y = nextHeight;
	
				nextHeight += tooltipText.height;
			});
		}

		if (json.children && json.children.length) {
			let splitLine = new PIXI.Graphics();
			result.addChild(splitLine);
			splitLine.x = 0;
			splitLine.y = nextHeight + blockPadding;
			splitLine.lineStyle(lineWidth, borderColor);
			splitLine.moveTo(0, +lineWidth / 2)
			splitLine.lineTo(realBlockW, +lineWidth / 2);

			nextHeight += lineWidth + blockPadding * 2;

			let currLevel = 0;
			let maxLineHeight = 0;
			let childImgs: Record<string, PIXIType.Graphics> = {};
			let levelChild = json.children!.filter(c => c.level === currLevel);
			json.children.sort((c1, c2) => c1.level - c2.level);
			json.children.forEach((childJson, i) => {
				if (childJson.level > currLevel) {
					nextHeight += maxLineHeight + blockGap[1];

					currLevel = childJson.level;
					levelChild = json.children!.filter(c => c.level === currLevel);
					maxLineHeight = 0;
				}
				
				let lineIdx = levelChild.indexOf(childJson);
				let child = buildDataImage(childJson);
				result.addChild(child);
				child.x = realBlockW / 2 - (blockW * levelChild.length + (levelChild.length - 1) * blockGap[0]) / 2 + (lineIdx * blockW + lineIdx * blockGap[0]);
				child.y = nextHeight;

				if (childJson.id) {
					childImgs[childJson.id] = child;
				} else {
					childImgs["child_" + i] = child;
				}
				maxLineHeight = Math.max(maxLineHeight, child.height);

				if (childJson.link) {
					childJson.link.forEach(link => {
						let linkImage = childImgs[link];
						if (!linkImage) {
							throw new Error("linkImage not match: " + link);
						}

						let linkArrow = new PIXI.Graphics();
						result.addChild(linkArrow);
						linkArrow.x = 0;
						linkArrow.y = 0;
						linkArrow.lineStyle(lineWidth, imageSettings.arrow.color);
						linkArrow.moveTo(linkImage.x + linkImage.width / 2, linkImage.y + linkImage.height - lineWidth / 2)
						linkArrow.lineTo(child.x + child.width / 2, child.y - lineWidth / 2);
					})
				}
			});
			nextHeight += maxLineHeight;
		}

		if (json.story && json.story.length) {
			let splitLine = new PIXI.Graphics();
			result.addChild(splitLine);
			splitLine.x = 0;
			splitLine.y = nextHeight + blockPadding;
			splitLine.lineStyle(lineWidth, borderColor);
			splitLine.moveTo(0, +lineWidth / 2)
			splitLine.lineTo(realBlockW, +lineWidth / 2);

			nextHeight += lineWidth + blockPadding * 2;

			json.story.forEach(story => {
				story = handleHtml(story);
				if (story.includes("<")) {
					console.log(story);
				}
				let storyText = new PIXI.Text(translate(story), tooltipStyle);
				result.addChild(storyText);
				storyText.scale.x = 1 / imageTextZoom;
				storyText.scale.y = 1 / imageTextZoom;
				storyText.x = blockPadding;
				storyText.y = nextHeight;
	
				nextHeight += storyText.height;
			});
		}

		result.lineStyle(lineWidth, borderColor);
		result.beginFill(bgColor);
		result.drawRoundedRect(0, 0, realBlockW, nextHeight + blockPadding, 10);
		result.endFill();
		
	} else if (config.type === "doubleCircleS") {
		result.beginFill(color);
		result.lineStyle(lineWidth, borderColor);
		result.drawCircle(0, 0, 10);
		result.endFill();

		result.arc(0, 0, 15, 0, Math.PI);
	} else if (config.type === "doubleCircleE") {
		result.beginFill(color);
		result.lineStyle(lineWidth, borderColor);
		result.drawCircle(0, 0, 10);
		result.endFill();

		result.arc(0, 0, 15, Math.PI, 2 * Math.PI);
	}
		
	return result;
}

let hideSpoilerInterval: number | undefined;
function hideSpoiler() {
	if (!hideSpoilerInterval) {
		hideSpoilerInterval = window.setInterval(() => {
			if (game) {
				game.skills.forEach(d => {
					if (d.instinctLevel.eq(0)) {
						
					}
				})
			}

			// Object.values(imgs).forEach(img => img.visible = true);
			// Object.values(linkImgs).forEach(links => Object.values(links).forEach(img => img.visible = true));
		}, 1000);
	}
}
function showSpoiler() {
	if (hideSpoilerInterval) {
		clearInterval(hideSpoilerInterval);
		hideSpoilerInterval = undefined;
	}

	Object.values(imgs).forEach(img => img.visible = true);
	Object.values(linkImgs).forEach(links => Object.values(links).forEach(img => img.visible = true));
}

function resizePathImage() {
	imageWH = [window.innerWidth, window.innerHeight];
	$(pathPIXI.view).css({zoom: 1 / window.devicePixelRatio});
	pathPIXI.renderer.resize(imageWH[0] * window.devicePixelRatio - 2, imageWH[1] * window.devicePixelRatio - 32);
}

function buildSkillJson(data: SkillInfo) {
	let skill = gameData.skill[data.id];
	if (!skill) {
		throw new Error("skill not match");
	}
	let result: DataJson = {type: "skill", title: `${icons[skill.icon]} ${data.name}`, id: `skill_${data.id}`, level: 0, children: []};
	return result;
}
function buildJobJson(data: JobInfo) {
	let skill = gameData.skill[data.skillId];
	if (!skill) {
		throw new Error("skill not match");
	}
	let result: DataJson = {type: "job", title: data.name, id: `job_${data.id}`, icon: skill.icon, exp: formatNum(data.requiredProgress.div(1000)), tooltip: [data.tooltip], level: 0, children: []};
	if (data.requiredResourceId !== undefined) {
		let item = gameData.resource[data.requiredResourceId];
		if (!skill) {
			throw new Error("item not match: " + data.requiredResourceId);
		}
		let amount = "";
		if (data.requiredResourceAmount) {
			amount = " *" + data.requiredResourceAmount.toNumber();
		}
		result.children!.push({type: "item", title: item.name + amount, id: `resource_${item.id}`, tooltip: [item.description], level: 0});
	}
	if (data.foodTrade !== undefined) {
		result.children!.push({type: "item", title: "Food trade", exp: formatNum(data.foodTrade.requiredFoodValue), id: `foodTrade_${data.id}`, level: 0});
	}
	Object.values(data.rewardedItems).forEach(reward => {
		let item: Resource | Food;
		let idPrefix: string;
		if (reward.itemType === 0) {
			item = gameData.food[reward.itemId];
			idPrefix = "food";
		} else if (reward.itemType === 1) {
			item = gameData.resource[reward.itemId];
			idPrefix = "resource";
		} else {
			throw new Error("itemType not match: " + reward.itemType);
		}
		if (!item) {
			throw new Error("item not match: " + reward.itemId);
		}
		let level = 0;
		let link: string[] = [];
		if (data.requiredResourceId) {
			level = 1;
			link.push(`resource_${data.requiredResourceId}`);
		}
		if (data.foodTrade) {
			level = 1;
			link.push(`foodTrade_${data.id}`);
		}
		result.children!.push({type: "item", title: item.name, id: `${idPrefix}_${item.id}`, tooltip: [item.description], level: level ? 1 : 0, link: link});
	});

	if (data.completionDamage) {
		result.children!.push({type: "lifeBadEffect", title: `${icons["health"]} -${formatNum(data.completionDamage)}`, level: 0});
	}
	return result;
}
function buildConstructionJson(data: ConstructionInfo) {
	let skill = gameData.skill[data.skillId];
	if (!skill) {
		throw new Error("skill not match");
	}
	let result: DataJson = {type: "construction", title: data.name, id: `construction_${data.id}`, icon: skill.icon, exp: formatNum(data.requiredProgress.div(1000)), tooltip: [], level: 0, children: []};
	if (data.getTooltip) {
		if (data.name === "Classic toolkit") {
			result.tooltip!.push(`Contains a wooden bow and a copper shovel, which increase the skill multipliers of <i class='far fa-shovel'></i> digging and <i class='far fa-bow-arrow'></i> hunting by 25%. These are the same tools as were available in the chapter 5 city, and do not stack.<br/>Since you don't own both of these tools yet, this may prove useful to you!`);
			result.tooltip!.push(`(finish Wooden bow and Copper shovel) Contains a wooden bow and a copper shovel, which increase the skill multipliers of <i class='far fa-shovel'></i> digging and <i class='far fa-bow-arrow'></i> hunting by 25%. These are the same tools as were available in the chapter 5 city, and do not stack.<br/>Since you already own both, this has no additional value to you`);
		} else if (data.name === "Steel belt") {
			result.tooltip!.push(`Quadruples your <i class='far fa-heart'></i> maximum health, but replaces your iron belt if you have one (you don't)`);
			result.tooltip!.push(`(finish Reinforced belt) Quadruples your <i class='far fa-heart'></i> maximum health, but replaces your iron belt if you have one (you do, effectively making this a 33.3% bonus)`);
		} else {
			console.warn(data);
		}
	} else {
		result.tooltip!.push(data.tooltip);
	}
	Object.values(data.requiredResources).forEach(require => {
		let item = gameData.resource[require.itemId];
		if (!item) {
			throw new Error("item not match: " + require.itemId);
		}
		result.children!.push({type: "item", title: `${item.name} *${require.amount}`, id: `resource_${item.id}`, tooltip: [item.description], level: 0});
	});

	//作用不齐，全部去除，统一看描述
	// if (data.inventorySize) {
	// 	result.children!.push({type: "lifeEffect", title: `${icons["inventory"]} +${formatNum(data.inventorySize)}`, level: 1, link: Object.values(data.requiredResources).map(req => `resource_${req.itemId}`)});
	// }
	// if (data.decayMultiplier) {
	// 	result.children!.push({type: "lifeEffect", title: `${icons["healthDec"]} *${formatNum(data.decayMultiplier.mul(100))}%`, level: 1, link: Object.values(data.requiredResources).map(req => `resource_${req.itemId}`)});
	// }
	// if (data.maxHealthGainMultiplier) {
	// 	result.children!.push({type: "rebirthEffect", title: `${icons["health"]}${icons["add"]} *${formatNum(data.maxHealthGainMultiplier)}`, level: 1, link: Object.values(data.requiredResources).map(req => `resource_${req.itemId}`)});
	// }
	return result;
}
function buildExplorJson(data: ExplorInfo) {
	let skill = gameData.skill[data.skillId];
	if (!skill) {
		throw new Error("skill not match");
	}
	let expStr = `${formatNum(data.requiredProgress.div(1000))}`;
	if (data.completionScaling) {
		expStr += ` *${data.completionScaling.toNumber()}${icons["add"]}`;
	}
	if (data.bossScalingVariable !== undefined && data.bossId !== undefined) {
		let icon = gameData.enemy[data.bossId].icon;
		let attr = gameData.bossAttr[data.bossId][data.bossScalingVariable];
		let attrIcon = "";
		if (attr.bossBarIcon) {
			attrIcon = icons[attr.bossBarIcon.replace("far ", "")];
			expStr += ` *${icons[icon]}${attrIcon}${icons["add"]}`;
		} else if (attr.scalingMultiplier) {
			expStr += ` *${attr.scalingMultiplier.toNumber()}${icons["add"]}`;
		}
	}
	let result: DataJson = {type: "exploration", title: data.name, id: `exploration_${data.id}`, icon: skill.icon, exp: expStr, tooltip: [], extrReq: [], story:[], level: 0, children: []};
	if (data.getTooltip) {
		if (data.name === "Sail north") {
			result.tooltip!.push(data.tooltip);
			result.tooltip!.push(`(finish chep6) From a distance, it looks like there's festivities happening on the island, as far as you can see that through this smoke<br/>Passing through this smoke triples your <i class='far fa-heart-broken'></i> health decay`);
		} else if (data.name === "Sail east") {
			result.tooltip!.push(data.tooltip);
			result.tooltip!.push(`(finish chep7) From a distance it looks like quite a few ships have moored at the shore<br/>Passing through this smoke triples your <i class='far fa-heart-broken'></i> health decay`);
		} else if (data.name === "Sail to volcano") {
			result.tooltip!.push(data.tooltip);
			result.tooltip!.push(`(finish chep8) The volcano should settle down eventually. Something tells you that's after exploring two of the other islands, but who can predict volcanoes<br/>Passing through this smoke triples your <i class='far fa-heart-broken'></i> health decay`);
		} else if (data.name === "Leave campsite") {
			result.tooltip!.push(data.tooltip);
			result.tooltip!.push(`(finish Pan of soup) Follow the trail left by the people that started the camp</br>Leaving the campsite causes you to lose access to soup`);
		} else if (data.name === "Approach dragon") {
			result.tooltip!.push(`Now that you've managed to distract the poachers for a while, let's see if this dragon lets you approach`);
			result.tooltip!.push(`(finish Fight poachers) Now that the poachers are taken care of, let's see if this dragon lets you approach`);
		} else if (data.name === "Catch soles") {
			result.tooltip!.push(`${data.tooltip} You catch it, you keep it!`);
			result.tooltip!.push(`(finish Cocowood soles) ${data.tooltip} <br/>You already own cocowood soles, so you have no use for this debris`);
		} else if (data.name === "Catch cart") {
			result.tooltip!.push(`Watch your head! A cocowood cart that increases your <i class='far fa-trailer'></i> inventory capacity by 5. If you manage to catch it intact, you can keep it!`);
			result.tooltip!.push(`(finish Strengthen cart) Watch your head! A cocowood cart that increases your <i class='far fa-trailer'></i> inventory capacity by 10. If you manage to catch it intact, you can keep it!`);
			result.tooltip!.push(`(finish Cocowood cart) Watch your head! A cocowood cart that increases your <i class='far fa-trailer'></i> inventory capacity by 5<br/>You already own a cocowood cart, so you have no use for this debris`);
			result.tooltip!.push(`(finish Strengthen cart and Cocowood cart) Watch your head! A cocowood cart that increases your <i class='far fa-trailer'></i> inventory capacity by 10<br/>You already own a cocowood cart, so you have no use for this debris`);
		} else if (data.name === "Take dog's toy") {
			result.tooltip!.push(`You can keep the iron stick if you manage to take it from the dog. It increases the multiplier of your <i class='far fa-swords'></i> combat skill by 25%.<br/>And since you don't own an iron stick yet, it may just come in handy!`);
			result.tooltip!.push(`(finish Iron stick) You can keep the iron stick if you manage to take it from the dog. It increases the multiplier of your <i class='far fa-swords'></i> combat skill by 25%.<br/>However, you already own an iron stick, so you have no use for it`);
		} else if (data.name === "Fire at titan") {
			result.tooltip!.push(`Fire your catapult at the titan to damage it from a distance! This requires a loaded catapult to work<br/>Can be completed up to ten times before the titan learns to dodge your shots, but gets harder with every successful shot up until that point<br/>You've successfully fired 0 / 10 times at the titan so far`);
		} else {
			console.warn(data);
		}
	} else {
		result.tooltip!.push(data.tooltip);
	}
	if (!data.skipCompletedStory) {
		if (data.getCompletedStory) {
			if (data.name === "Return to the kids") {
				result.story!.push(data.completedStory);
				result.story!.push(`(own 25 eggs) ${data.completedStory}. Oh, and with twenty five eggs, they were even able to feed the pets!`);
			} else if (data.name === "Abandoned camp") {
				result.story!.push("It appears that the camp was from the same tribe that you've met on the beach. But all they left behind was an empty pan");
				result.story!.push("(finish Pan of soup) It appears that the camp was from the same tribe that you've met on the beach, and they left a pan of soup behind!");
			} else if (data.name === "Cut ropes") {
				result.story!.push("Pfeew, all ropes cut! The dragon makes an almost purring sound, although it sounds more like an oven being heated. It did take some serious damage from the poachers, with all sorts of giant scratches and even some teeth missing. But it does seem able to fly to safety by itself. Before it does, it shoves one of its missing teeth towards you. Almost as if it knows that it may be of use to you. And it clearly is: your hourglass starts to tremble as it gets closer");
				result.story!.push(`(finish Sabotage camp) Pfeew, all ropes cut! And before the poachers returned too! The dragon makes an almost purring sound, although it sounds more like an oven being heated. It did take some serious damage from the poachers, with all sorts of giant scratches and even some teeth missing. But it does seem able to fly to safety by itself. Before it does, it shoves one of its missing teeth towards you. Almost as if it knows that it may be of use to you. And it clearly is: your hourglass starts to tremble as it gets closer`);
			} else if (data.name === "Cut ropes") {
				result.story!.push("Pfeew, all ropes cut! The dragon makes an almost purring sound, although it sounds more like an oven being heated. It did take some serious damage from the poachers, with all sorts of giant scratches and even some teeth missing. But it does seem able to fly to safety by itself. Before it does, it shoves one of its missing teeth towards you. Almost as if it knows that it may be of use to you. And it clearly is: your hourglass starts to tremble as it gets closer");
				result.story!.push(`(finish Sabotage camp) Pfeew, all ropes cut! And before the poachers returned too! The dragon makes an almost purring sound, although it sounds more like an oven being heated. It did take some serious damage from the poachers, with all sorts of giant scratches and even some teeth missing. But it does seem able to fly to safety by itself. Before it does, it shoves one of its missing teeth towards you. Almost as if it knows that it may be of use to you. And it clearly is: your hourglass starts to tremble as it gets closer`);
			} else if (data.name === "Meet \"her\"") {
				result.story!.push(`She looks at you with a pale stare, somewhat frightened in a way that you recognize from the look in the elder's face. As if she recognizes something in you. She proceeds to tell you: "I go by Amy these days. I came here to end the cycle. But now that you're here, I think I understand why it didn't work.`);
				result.story!.push(`(finish 2 times) "You don't remember me, do you? You've been here before." She proceeds to tell you: "I go by Amy these days. I came here to end the cycle. But now that you're here, I think I understand why it didn't work.`);
				result.story!.push(`(finish 6 times) "I know, you don't remember me. But you've been here before." She proceeds to tell you: "I go by Amy these days. I came here to end the cycle. But now that you're here, I think I understand why it didn't work.`);
			} else if (data.name === "So what now?") {
				result.story!.push(`${data.completedStory} It seems to recognize you, but you're unsure where from`);
				result.story!.push(`(finish Cut ropes) ${data.completedStory} Wait, you know this one! That's the dragon you freed from the poachers!`);
			} else if (data.name === "Fly away") {
				result.story!.push(`This beast is fast, but you've managed to hold on so far! It seems very determined in where it's bringing you. In the distance, you see an enormous constructions peeking through the clouds. And the dragon proceeds to fly directly to it`);
				result.story!.push(`(finish 1 times) This beast is fast, but you've managed to hold on so far! It seems very determined in where it's bringing you. Almost as if it's done this before? In the distance, you see an enormous constructions peeking through the clouds. And the dragon proceeds to fly directly to it`);
			} else {
				console.warn(data);
			}
		} else {
			result.story!.push(data.completedStory);
		}
	}
	if (data.additionalDamagePerMs) {
		result.extrReq!.push(`${icons["healthDec"]} +${formatNum(data.additionalDamagePerMs.mul(1000))}`);
	}
	if (data.multiplierRequirement) {
		let str = `${icons[skill.icon]} >${formatNum(data.multiplierRequirement)}`;
		if (data.failDamage) {
			str += ` ${icons["fail"]} ${icons["health"]} -${formatNum(data.failDamage)}`;
		}
		result.extrReq!.push(str);
	}
	if (data.requiredResources) {
		Object.values(data.requiredResources).forEach(require => {
			let item = gameData.resource[require.itemId];
			if (!item) {
				throw new Error("item not match: " + require.itemId);
			}
			result.children!.push({type: "item", title: `${item.name} *${require.amount.toNumber() < 0 ? icons["full"] : require.amount}`, id: `resource_${item.id}`, tooltip: [item.description], level: 0});
		});
	}
	if (data.awardItem) {
		let item: Resource | Food;
		let idPrefix: string;
		if (data.awardItem.type === 0) {
			item = gameData.food[data.awardItem.id];
			idPrefix = "food";
		} else if (data.awardItem.type === 1) {
			item = gameData.resource[data.awardItem.id];
			idPrefix = "resource";
		} else {
			throw new Error("itemType not match: " + data.awardItem.type);
		}
		if (!item) {
			throw new Error("item not match: " + data.awardItem.id);
		}
		result.children!.push({type: "item", title: item.name, id: `${idPrefix}_${item.id}`, tooltip: [item.description], level: data.requiredResources !== undefined ? 1 : 0, link: data.requiredResources !== undefined ? Object.values(data.requiredResources).map(req => `resource_${req.itemId}`) : []});
	}
	if (data.decayMultiplier) {
		result.children!.push({type: "lifeEffect", title: `${icons["healthDec"]} *${formatNum(data.decayMultiplier.mul(100))}%`, level: data.requiredResources !== undefined ? 1 : 0, link: data.requiredResources !== undefined ? Object.values(data.requiredResources).map(req => `resource_${req.itemId}`) : []});
	}
	if (data.maxHealthGainMultiplier) {
		result.children!.push({type: "rebirthEffect", title: `${icons["health"]}${icons["add"]} *${formatNum(data.maxHealthGainMultiplier)}`, level: data.requiredResources !== undefined ? 1 : 0, link: data.requiredResources !== undefined ? Object.values(data.requiredResources).map(req => `resource_${req.itemId}`) : []});
	}
	if (data.completionDamage) {
		result.children!.push({type: "lifeBadEffect", title: `${icons["health"]} -${formatNum(data.completionDamage)}`, level: 0});
	}
	if (data.bossDamage && data.bossId !== undefined) {
		let icon = gameData.enemy[data.bossId].icon;
		result.children!.push({type: "lifeEffect", title: `${icons[icon]}${icons["health"]} -${formatNum(data.bossDamage)}%`, level: 0});
	}
	if (data.bossScalingVariable !== undefined && data.bossId !== undefined) {
		if (data.bossScalingVariableIncrease !== 0) {
			let icon = gameData.enemy[data.bossId].icon;
			let attr = gameData.bossAttr[data.bossId][data.bossScalingVariable];
			let attrIcon = "";
			if (attr.bossBarIcon) {
				attrIcon = icons[attr.bossBarIcon.replace("far ", "")];
			}

			let addVal = "";
			if (data.bossScalingVariableIncrease) {
				addVal = "" + data.bossScalingVariableIncrease;
			}
			result.children!.push({type: "lifeBadEffect", title: `${icons[icon]}${attrIcon}${icons["add"]}${addVal}`, level: 0});
		}
	}

	return result;
}
function buildBossJson(data: Boss) {
	let icon = gameData.enemy[data.id].icon;
	let result: DataJson = {type: "boss", title: data.name, id: `boss_${data.id}`, icon: icon, tooltip: [], extrReq: [], story:[], level: 0, children: []};
	
	if(gameData.bossAttr[data.id]) {
		Object.values(gameData.bossAttr[data.id]).forEach(attr => {
			if (attr.showOnBossBar && attr.description) {
				let icon = "";
				// if (attr.bossBarIcon) {
				// 	icon = attr.bossBarIcon.replace("far ", "");
				// }
				let expStr = "";
				if (attr.scalingMultiplier) {
					expStr += `1 *${attr.scalingMultiplier.toNumber()}${icons["add"]}`;
				}
				result.children!.push({type: "boss", icon: icon, title: handleHtml(attr.description), level: 0, exp: expStr});
			}
		});
	}
	return result;
}
function buildBossPhaseJson(data: BossPhase) {
	let icon = gameData.enemy[data.bossId].icon;
	let name = gameData.boss[data.bossId].name;
	let result: DataJson = {type: "bossPhase", title: name + " Phase " + data.phase, id: `bossPhase_${data.id}`, icon: icon, tooltip: [], extrReq: [], story:[], level: 0, children: []};

	if(gameData.bossPhase[data.bossId] && gameData.bossPhase[data.bossId][data.id]) {
		let phase = gameData.bossPhase[data.bossId][data.id];
		if (phase.health) {
			result.children!.push({type: "boss", icon: "health", title: phase.health + "%", level: 0});
		}
	}
	if(gameData.bossStory[data.bossId] && gameData.bossStory[data.bossId][data.id]) {
		let story = gameData.bossStory[data.bossId][data.id];
		if (story.completedStory) {
			result.story!.push(story.completedStory);
		}
		if (story.name) {
			result.title = story.name;
		} else {
			if (data.id === 0 && gameData.boss[data.bossId]) {
				result.title = gameData.boss[data.bossId].name + " 100% health";
			}
		}
	}
	
	return result;
}
function buildHostileJson(data: HostileInfo) {
	let enemy = gameData.enemy[data.enemy];
	if (!enemy) {
		throw new Error("enemy not match");
	}
	let expStr = `${formatNum(data.requiredProgress.div(1000))}`;
	if (data.completionSpeedIncrease) {
		expStr += ` *${data.completionSpeedIncrease.sub(1).mul(100).abs().toNumber()}%${data.completionSpeedIncrease.gt(1) ? icons["dec"] : icons["add"]}`;
	}
	let result: DataJson = {type: "hostile", title: data.name, id: `hostile_${data.id}`, icon: enemy.icon, exp: expStr, tooltip: [], extrReq: [], story:[], level: 0, children: []};

	if (data.completionDamage) {
		result.children!.push({type: "lifeBadEffect", title: `${icons["health"]} -${formatNum(data.completionDamage)}`, level: 0});
	}
	if (data.completionBossHealing) {
		let icon = gameData.enemy[data.bossId].icon;
		result.children!.push({type: "lifeBadEffect", title: `${icons[icon]}${icons["health"]} +${formatNum(data.completionBossHealing)}%`, level: 0});
	}
	
	return result;
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
	});
	Object.keys(varNames).forEach(key => {
		vars[varNames[key]] = key;
	});
	findJsName(jsStr, /^const (a0_0x[0-9a-f]+?)=\[/, "allString");
	allString = (doEval(vars.allString) as string[]).map(s => window.atob(s));

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
function getDataByLevel(level: number) {
	let result: {count: number, skill: SkillInfo[], job: JobInfo[], construction: ConstructionInfo[], exploration: ExplorInfo[], boss: Boss[], bossPhase: BossPhase[], hostile: HostileInfo[]} = {
		count: 0,
		skill: [],
		job: [],
		construction: [],
		exploration: [],
		boss: [],
		bossPhase: [],
		hostile: [],
	};
	Object.keys(gameData.skill).forEach((key) => {
		let data = gameData.skill[key];
		if (data.level === level) {
			result.skill.push(data);
		}
	});
	Object.keys(gameData.job).forEach((key) => {
		let data = gameData.job[key];
		if (data.level === level) {
			result.job.push(data);
		}
	});
	Object.keys(gameData.construction).forEach((key) => {
		let data = gameData.construction[key];
		if (data.level === level) {
			result.construction.push(data);
		}
	});
	Object.keys(gameData.exploration).forEach((key) => {
		let data = gameData.exploration[key];
		if (data.level === level) {
			result.exploration.push(data);
		}
	});
	Object.keys(gameData.boss).forEach((key) => {
		let data = gameData.boss[key];
		if (data.level === level) {
			result.boss.push(data);
		}
	});
	Object.values(gameData.bossPhase).forEach((phase) => {
		Object.keys(phase).forEach((key) => {
			let data = phase[key];
			if (data.level === level) {
				result.bossPhase.push(data);
			}
		});
	});
	Object.keys(gameData.hostile).forEach((key) => {
		let data = gameData.hostile[key];
		if (data.level === level) {
			result.hostile.push(data);
		}
	});

	result.count = result.skill.length + result.job.length + result.construction.length + result.exploration.length + result.boss.length + result.bossPhase.length + result.hostile.length;

	return result;
}

function handleHtml(str: string) {
	str = str.replace(/<i class='far (fa-[a-z\-]+)'><\/i>/g, (str, m1) => {
		return icons[m1];
	});

	str = str.replace(/<br\/>/g, "\n");
	str = str.replace(/<\/br>/g, "\n");
	str = str.replace(/<span style='white-space:nowrap;'>/g, "");
	str = str.replace(/<span style='font-style: italic;'>/g, "");
	str = str.replace(/<span style='font-weight: 500;'>/g, "");
	str = str.replace(/<\/span>/g, "\n");
	str = str.replace(/<q>/g, "\n");
	str = str.replace(/<\/q>/g, "\n");
	return str;
}

let allNoTrans: Record<string, string> = {};
function exportNoTrans(limit = -1, from = 0) {
	let arr = Object.keys(allNoTrans);
	if (limit > 0) {
		arr = arr.splice(from, limit);
	}

	let transStr = "";
	let exportStr = "";
	arr.forEach(a => {
		transStr += a;
		transStr += "\r\n";
		transStr += "\r\n";

		exportStr += `"${a}": "${allNoTrans[a]}",\r\n`;
	});
	console.log(transStr);
	console.log(exportStr);
}
function translate(str: string) {
	if (typeof cnItems === "undefined" || settings.locale !== "cn") {
		return str;
	}
	
	let oriStr = str;
	if (cnItems[str]) {
		str = cnItems[str];
	}

	cnRegReplace.forEach((val, reg) => {
		if (reg.test(str)) {
			str = str.replace(reg, val);
		}
	});

	let macths: {key: string, value: string, index: number, len: number}[] = [];
	Object.keys(cnItems).filter(key => key).forEach((key) => {
		let last = -1;
		do {
			last = str.indexOf(key, last + 1);
			if (last !== -1) {
				macths.push({key: key, value: cnItems[key], index: last, len: key.length});
			}
		} while (last !== -1);
	});
	Object.keys(cnPrefix).filter(key => key).forEach((key) => {
		let last = -1;
		do {
			last = str.indexOf(key, last + 1);
			if (last !== -1) {
				macths.push({key: key, value: cnPrefix[key], index: last, len: key.length});
			}
		} while (last !== -1);
	});
	Object.keys(cnPostfix).filter(key => key).forEach((key) => {
		let last = -1;
		do {
			last = str.indexOf(key, last + 1);
			if (last !== -1) {
				macths.push({key: key, value: cnPostfix[key], index: last, len: key.length});
			}
		} while (last !== -1);
	});

	macths.sort((d1, d2) => {
		if (d1.index === d2.index) {
			return d2.len - d1.len;
		} else {
			return d1.index - d2.index;
		}
	})
	
	let offset = 0;
	macths.forEach((m) => {
		if (m.index + offset >= 0 && str.indexOf(m.key) === m.index + offset) {
			str = str.replace(m.key, m.value);
			offset += m.value.length - m.key.length;
		}
	});

	// if (str.match(/[a-zA-Z]+/g)) {
	// 	cnRegReplace.forEach((val, reg) => {
	// 		if (reg.test(str)) {
	// 			str = str.replace(reg, val);
	// 		}
	// 	});
	// }

	let isALLTrans = true;
	let notTrans = str.match(/[a-zA-Z]+/g);
	if (notTrans) {
		notTrans.forEach((val, i) => {
			if (numUnits.indexOf(val) !== -1 || val === "DNA" || val === "Boss") {
			} else {
				isALLTrans = false;
			}
		})
	}
	if (!isALLTrans) {
		console.log(oriStr, macths, str);
		allNoTrans[oriStr] = str;
	}

	return str;
}

gameLoadPromise.then(() => {
	setTimeout(() => {
		readGameData();
	}, 1000);
});
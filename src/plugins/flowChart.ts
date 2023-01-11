import { Plugin, save, load, toggle, plugins, settings, btnContainer, gameLoadPromise, Game } from "../core";

import type DecimalType from "break_infinity.js";
import type {} from "jquery";
import type PIXIType from "pixi.js";
import type Viewport from "pixi-viewport";
import * as PIXI from "pixi.js";
import * as pixi_viewport from "pixi-viewport";

declare let game: undefined | Game;

declare let $: JQueryStatic;
declare let Decimal: typeof DecimalType;
declare let a0_0x22e9fa: (num: DecimalType | number) => string;

declare let cnItems: Record<string, string>;
declare let cnPrefix: Record<string, string>;
declare let cnPostfix: Record<string, string>;
declare let cnRegReplace: Map<RegExp, string>;

let togglePathBtn: JQuery<HTMLElement>;
plugins.push({
	init: () => {
		togglePathBtn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-right: 10px;" id="pause-button" type="button" class="btn btn-block btn-success ${settings.showPath ? 'running' : 'paused'}" data-original-title="显示路线"><i class="fas ${settings.showPath ? 'fa-play' : 'fa-pause'}"></i> <span>显示路线</span></button>`);
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

		pathPIXI = new PIXI.Application({
			width: imageWH[0] * window.devicePixelRatio - 2,
			height: imageWH[1] * window.devicePixelRatio - 32,
			backgroundAlpha: 0.5,
		});
		pathPIXI.ticker.stop();
		$(pathPIXI.view).css({"border-radius": "10px", border: "1px solid #666666", position: "absolute", bottom: "30px", right: "0", zoom: 1 / window.devicePixelRatio}).appendTo(btnContainer);

		pathViewPort = new pixi_viewport.Viewport({
			screenWidth: window.innerWidth * 256,
			screenHeight: window.innerHeight * 256,
			worldWidth: imageWH[0] * window.devicePixelRatio * 256,
			worldHeight: imageWH[1] * window.devicePixelRatio * 256,

			// passiveWheel: false,                            // whether the 'wheel' event is set to passive (note: if false, e.preventDefault() will be called when wheel is used over the viewport)
			interaction: pathPIXI.renderer.plugins.interaction,   // InteractionManager, available from instantiated WebGLRenderer/CanvasRenderer.plugins.interaction - used to calculate pointer position relative to canvas location on screen
		});

		pathPIXI.stage.addChild(pathViewPort);
		pathViewPort.drag()
		.pinch()
		.wheel()
		.decelerate();
		
		pathViewPort.addListener("drag-start", () => {
			console.log("drag-start");
			pathPIXI.ticker.start();
		}).addListener("drag-end", () => {
			console.log("drag-end");
		}).addListener("moved", () => {
			console.log("moved");
		}).addListener("moved-end", () => {
			console.log("moved-end");
			pathPIXI.render();
			pathPIXI.ticker.stop();
		});

		window.addEventListener("resize", () => {
			resizePathImage();
		});
	},
	settings: {
		showPath: false,
	},
	toggle: () => {
		if (settings.showPath) {
			gameLoadPromise.then(() => {
				buildPathImage();
			});
			$(pathPIXI.view).show();
			chepBtns.forEach(btn => $(btn).show());
		} else {
			$(pathPIXI.view).hide();
			chepBtns.forEach(btn => $(btn).hide());
		}
	}
})

let formatNum = a0_0x22e9fa;
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
	
	"fa-engine-warning" : "\uf5f2",
	"fail" : "\uf5f2",
	
	"fa-check" : "\uf00c",
	"ok" : "\uf00c",
	
	"fa-arrow-alt-square-up" : "\uf353",
	"full" : "\uf353",
}

type FuncString = string;

interface Skill {
	id: number;
	icon: string;
	name: string;
	shouldShow: FuncString | (() => boolean);

	dependency?: {type: string; id: string}[];
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

	automationUnlockAlternative?: number;
	completionDamage?: DecimalType;

	dependency?: {type: "skill" | "job" | "construction" | "exploration"; id: string}[];
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

	inventorySize?: DecimalType;
	decayMultiplier?: DecimalType;
	automationUnlockAlternative?: number;
	maxHealthGainMultiplier?: DecimalType;

	dependency?: {type: "skill" | "job" | "construction" | "exploration"; id: string}[];
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

	isStoryBranch?: boolean;
	startsBranch?: boolean;
	branchColor?: string;

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

	dependency?: {type: "skill" | "job" | "construction" | "exploration"; id: string}[];
	used?: boolean;
	level?: number;
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

interface DataJson {
	type: "start" | "end" | "skill" | "job" | "construction" | "exploration" | "item" | "lifeEffect" | "lifeBadEffect" | "rebirthEffect" | "globalEffect";
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
	itemType: Record<string, ItemType>  = {};
	food: Record<string, Food>  = {};
	resource: Record<string, Resource>  = {};
}();
let cheps = [
	0,
	9,
	32,
	61,
	88,
	134,
	165,
	197,
	231,
];
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
	excractGameData();
	checkDataProp();
	analysisGameData();

	let count = 0;
	do {
		buildDataLevel();
	} while (checkDataLevel() && count < 1000);
}
function buildPathImage() {
	if (pathInited) {
		return;
	}

	let centerX = imageWH[0] / 2;

	let root = buildDataImage({type: "start", level: 0});
	pathViewPort.addChild(root);
	root.x = centerX;
	root.y = imagePadding[1];

	let level = 1;
	let lastHeight = 10;
	let lastLevelData = getDataByLevel(level);
	let lineImgs: PIXIType.Graphics[] = [];
	let maxW = 0;
	while (lastLevelData.count !== 0 && level < 1000) {
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
					let linkImage = imgs[dd.type + "_" + dd.id];
					if (!linkImage) {
						throw new Error("linkImage not match: " + dd);
					}

					let linkArrow = new PIXI.Graphics();
					pathViewPort.addChild(linkArrow);
					linkArrow.x = 0;
					linkArrow.y = 0;
					linkArrow.lineStyle(lineWidth, imageSettings.arrow.color, 0.1);
					linkArrow.moveTo(linkImage.x + linkImage.width / 2, linkImage.y + linkImage.height - lineWidth / 2)
					linkArrow.lineTo(img.x + img.width / 2, img.y - lineWidth / 2);

					linkImgs["skill_" + d.id][dd.type + "_" + dd.id] = linkArrow;
				});
			}
		});
		lastLevelData.job.forEach(d => {
			if (d.dependency) {
				let img = imgs["job_" + d.id];
				linkImgs["job_" + d.id] = {};
				d.dependency.forEach(dd => {
					let linkImage = imgs[dd.type + "_" + dd.id];
					if (!linkImage) {
						if (dd.type === "exploration") {
							return;
						}
						throw new Error("linkImage not match: " + dd);
					}

					let linkArrow = new PIXI.Graphics();
					pathViewPort.addChild(linkArrow);
					linkArrow.x = 0;
					linkArrow.y = 0;
					linkArrow.lineStyle(lineWidth, imageSettings.arrow.color, 0.1);
					linkArrow.moveTo(linkImage.x + linkImage.width / 2, linkImage.y + linkImage.height - lineWidth / 2)
					linkArrow.lineTo(img.x + img.width / 2, img.y - lineWidth / 2);

					linkImgs["job_" + d.id][dd.type + "_" + dd.id] = linkArrow;
				});
			}
		});
		lastLevelData.construction.forEach(d => {
			if (d.dependency) {
				let img = imgs["construction_" + d.id];
				linkImgs["construction_" + d.id] = {};
				d.dependency.forEach(dd => {
					let linkImage = imgs[dd.type + "_" + dd.id];
					if (!linkImage) {
						throw new Error("linkImage not match: " + dd);
					}

					let linkArrow = new PIXI.Graphics();
					pathViewPort.addChild(linkArrow);
					linkArrow.x = 0;
					linkArrow.y = 0;
					linkArrow.lineStyle(lineWidth, imageSettings.arrow.color, 0.1);
					linkArrow.moveTo(linkImage.x + linkImage.width / 2, linkImage.y + linkImage.height - lineWidth / 2)
					linkArrow.lineTo(img.x + img.width / 2, img.y - lineWidth / 2);

					linkImgs["construction_" + d.id][dd.type + "_" + dd.id] = linkArrow;
				});
			}
		});
		lastLevelData.exploration.forEach(d => {
			if (d.dependency) {
				let img = imgs["exploration_" + d.id];
				linkImgs["exploration_" + d.id] = {};
				d.dependency.forEach(dd => {
					let linkImage = imgs[dd.type + "_" + dd.id];
					if (!linkImage) {
						throw new Error("linkImage not match: " + dd);
					}

					let linkArrow = new PIXI.Graphics();
					pathViewPort.addChild(linkArrow);
					linkArrow.x = 0;
					linkArrow.y = 0;
					linkArrow.lineStyle(lineWidth, imageSettings.arrow.color, 0.1);
					linkArrow.moveTo(linkImage.x + linkImage.width / 2, linkImage.y + linkImage.height - lineWidth / 2)
					linkArrow.lineTo(img.x + img.width / 2, img.y - lineWidth / 2);

					linkImgs["exploration_" + d.id][dd.type + "_" + dd.id] = linkArrow;
				});
			}
		});

		lineImgs = [];
		lastHeight += lineHeight;
		level++;
		lastLevelData = getDataByLevel(level);
		maxW = Math.max(maxW, sumW + (lineImgs.length + 1) * blockGap[0] + blockPadding * 20);
	}

	cheps.forEach((c, i) => {
		let btn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-right: 10px;position: absolute; bottom: ${(cheps.length - i) * 30 + 10}px; right: 0" type="button" class="btn btn-block btn-light" data-original-title="第${i + 1}章"><span>第${i + 1}章</span></button>`);
		$(btnContainer).append(btn);

		btn.on("click", () => {
			let img = imgs["exploration_" + c];
			pathViewPort.position = new PIXI.Point(-centerX * pathViewPort.scale.x + centerX, -img.y * pathViewPort.scale.y + imageWH[1] / 4);
		})

		chepBtns.push(btn);

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
	});
	toggle();

	console.log("-------------");

	pathInited = true;
	pathPIXI.render();
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
			let titleText = new PIXI.Text(translate(json.title), titleStyle);
			result.addChild(titleText);
			titleText.scale.x = 1 / imageTextZoom;
			titleText.scale.y = 1 / imageTextZoom;
			titleText.x = (realBlockW - titleText.width) / 2;
			titleText.y = nextHeight;
			nextHeight += titleText.height;
		}

		if (json.exp) {
			let text = json.exp;
			if (json.icon) {
				text = `${icons[json.icon]} ${json.exp}`;
			}
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

		result.arc(0, 0, 15, Math.PI, 0);
	}
		
	return result;
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
	let result: DataJson = {type: "job", title: data.name, id: `job_${data.id}`, icon: skill.icon, exp: formatNum(data.requiredProgress), tooltip: [data.tooltip], level: 0, children: []};
	if (data.requiredResourceId !== undefined) {
		let item = gameData.resource[data.requiredResourceId];
		if (!skill) {
			throw new Error("item not match: " + data.requiredResourceId);
		}
		result.children!.push({type: "item", title: item.name, id: `resource_${item.id}`, tooltip: [item.description], level: 0});
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
		result.children!.push({type: "item", title: item.name, id: `${idPrefix}_${item.id}`, tooltip: [item.description], level: data.requiredResourceId !== undefined ? 1 : 0, link: data.requiredResourceId !== undefined ? [`resource_${data.requiredResourceId}`] : []});
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
	let result: DataJson = {type: "construction", title: data.name, id: `construction_${data.id}`, icon: skill.icon, exp: formatNum(data.requiredProgress), tooltip: [data.tooltip], level: 0, children: []};
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
	let expStr = `${formatNum(data.requiredProgress)}`;
	if (data.completionScaling) {
		expStr += ` *${data.completionScaling.toNumber()}${icons["add"]}`;
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
		} else {
			console.warn(data);
		}
	} else {
		result.tooltip!.push(data.tooltip);
	}
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
	
	return result;
}

function excractGameData() {
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
				}
			} else if (window[key][0].name === "Food") { //itemType
				varNames[key] = "itemType";
			} else if (window[key][0][0] && window[key][0][0].name === "Berry") { //item
				varNames[key] = "item";
			}
		}
	});
	Object.keys(varNames).forEach(key => {
		vars[varNames[key]] = key;
	});
	Object.keys(window).filter(key => key.startsWith("a0_")).forEach(key => {
		if(window[key] && window[key][0]) {
			if (window[key][0].shouldShow) {
				if (window[key][0].name === "Farming") { //skill
					let datas = window[key] as Record<string, SkillGame>;
					Object.keys(datas).forEach((key) => {
						let data = datas[key];
						let shouldShow = getFuncStr(data.shouldShow, data);
						gameData.skill[key] = {...data, id: +key, shouldShow};
					});
				} else if (window[key][0].name === "Gather berries") { //job
					let datas = window[key] as Record<string, JobGame>;
					Object.keys(datas).forEach((key) => {
						let data = datas[key];
						let baseShouldShow = getFuncStr(data.baseShouldShow, data);
						let shouldShow = getFuncStr(data.shouldShow, data);
						let baseCanRun = getFuncStr(data.baseCanRun, data);
						let canRun = getFuncStr(data.canRun, data);
						gameData.job[key] = {...data, baseShouldShow, shouldShow, baseCanRun, canRun, tooltip: data.getTooltip ? data.getTooltip() : data.tooltip};
					});
				} else if (window[key][0].name === "Wooden cart") { //construction
					let datas = window[key] as Record<string, ConstructionGame>;
					Object.keys(datas).forEach((key) => {
						let data = datas[key];
						let baseShouldShow = getFuncStr(data.baseShouldShow, data);
						let shouldShow = getFuncStr(data.shouldShow, data);
						let baseCanRun = getFuncStr(data.baseCanRun, data);
						let canRun = getFuncStr(data.canRun, data);
						gameData.construction[key] = {...data, baseShouldShow, shouldShow, baseCanRun, canRun};
					});
				} else if (window[key][0].name === "Explore the area") { //Exploration
					let datas = window[key] as Record<string, ExplorGame>;
					Object.keys(datas).forEach((key) => {
						let data = datas[key];
						let baseShouldShow = getFuncStr(data.baseShouldShow, data);
						let shouldShow = getFuncStr(data.shouldShow, data);
						let baseCanRun = getFuncStr(data.baseCanRun, data);
						let canRun = getFuncStr(data.canRun, data);
						gameData.exploration[key] = {...data, baseShouldShow, shouldShow, baseCanRun, canRun};
					});
				}
			} else if (window[key][0].name === "Food") { //itemType
				let datas = window[key] as Record<string, ItemType>;
				Object.keys(datas).forEach((key) => {
					let data = datas[key];
					gameData.itemType[key] = {...data, id: +key};
				});
			} else if (window[key][0][0] && window[key][0][0].name === "Berry") { //item
				let FoodDatas = window[key][0] as Record<string, Food>;
				Object.keys(FoodDatas).forEach((key) => {
					let data = FoodDatas[key];
					gameData.food[key] = {...data, id: +key, description: data.getDescription ? data.getDescription() : data.description};
				});
				let resourceDatas = window[key][1] as Record<string, Resource>;
				Object.keys(resourceDatas).forEach((key) => {
					let data = resourceDatas[key];
					gameData.resource[key] = {...data, id: +key};
				});
			}
		}
	});
}
function getFuncStr(func: () => any, data: SkillGame | JobGame | ConstructionGame | ExplorGame) {
	let funcExcractRegex = /function\(.*?\)\{(.*)\}/;
	let match = ("" + func).match(funcExcractRegex);
	if (!match) {
		throw new Error("func not match");
	}
	return fixVarNames(match[1], data);
}
function fixVarNames(str: string, data: SkillGame | JobGame | ConstructionGame | ExplorGame) {
	let result = str;
	result = result.replace(/a0_0x2115\('.*?'\)/g, (val) => {
		return "'" + eval(val) + "'";
	});
	Object.keys(varNames).forEach(key => {
		result = result.replace(new RegExp(key, "g"), varNames[key]);
	});

	result = result.replace(/([\[\(, ])(0x[0-9a-f]+)([\]\), ])/g, (val, match1, match2, match3) => {
		return match1 + eval(match2) + match3;
	});
	result = result.replace(/(0x0)/g, "0");
	result = result.replace(/a0_0x514b1f/g, (val, match1, match2) => {
		return "haveItem";
	});
	result = result.replace(/a0_0x45dc5c/g, (val, match1, match2) => {
		return "haveAllItem";
	});
	result = result.replace(/a0_0x598e4e/g, (val, match1, match2) => {
		return "notArriveProgressStep";
	});
	result = result.replace(/a0_0x3feec9/g, (val, match1, match2) => {
		return "isFullItem";
	});
	result = result.replace(/a0_0x121173/g, (val, match1, match2) => {
		return "leftHealthOnComplete";
	});
	result = result.replace(/a0_0x4d7d81/g, (val, match1, match2) => {
		return "notFinishInThisTick";
	});
	result = result.replace(/a0_0x1cd15e/g, (val, match1, match2) => {
		return "willNotDie";
	});
	result = result.replace(/a0_0x2a2cc8/g, (val, match1, match2) => {
		return "1";
	});
	result = result.replace(/a0_0x4f296b/g, (val, match1, match2) => {
		return "0";
	});
	result = result.replace(/!!\[\]/g, " true");
	result = result.replace(/!\[\]/g, " false");
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
				console.warn("new prop", k, data);
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
			].indexOf(k) === -1) {
				console.warn("new prop", k, data);
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
			].indexOf(k) === -1) {
				console.warn("new prop", k, data);
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
			].indexOf(k) === -1) {
				console.warn("new prop", k, data);
			}
		});
	});
}
function analysisGameData() {
	Object.keys(gameData.skill).forEach((key) => {
		let data = gameData.skill[key];
		let conds: {type: "skill" | "job" | "construction" | "exploration"; id: string}[] = [];
		conds.push(...getCond(data.shouldShow, "skill", data));
		conds = mergeCond(conds);
		data.dependency = conds;
	});
	Object.keys(gameData.job).forEach((key) => {
		let data = gameData.job[key];
		let conds: {type: "skill" | "job" | "construction" | "exploration"; id: string}[] = [];
		conds.push(...getCond(data.baseShouldShow, "job", data));
		conds.push(...getCond(data.baseCanRun, "job", data));
		conds.push(...getCond(data.shouldShow, "job", data));
		conds.push(...getCond(data.canRun, "job", data));
		conds = mergeCond(conds);
		data.dependency = conds;
	});
	Object.keys(gameData.construction).forEach((key) => {
		let data = gameData.construction[key];
		let conds: {type: "skill" | "job" | "construction" | "exploration"; id: string}[] = [];
		conds.push(...getCond(data.baseShouldShow, "construction", data));
		conds.push(...getCond(data.baseCanRun, "construction", data));
		conds.push(...getCond(data.shouldShow, "construction", data));
		conds.push(...getCond(data.canRun, "construction", data));
		conds = mergeCond(conds);
		data.dependency = conds;
	});
	Object.keys(gameData.exploration).forEach((key) => {
		let data = gameData.exploration[key];
		let conds: {type: "skill" | "job" | "construction" | "exploration"; id: string}[] = [];
		conds.push(...getCond(data.baseShouldShow, "exploration", data));
		conds.push(...getCond(data.baseCanRun, "exploration", data));
		conds.push(...getCond(data.shouldShow, "exploration", data));
		conds.push(...getCond(data.canRun, "exploration", data));
		conds = mergeCond(conds);
		data.dependency = conds;
	});
}
function getCond(str: FuncString, type: "skill" | "job" | "construction" | "exploration", data: SkillInfo | JobInfo | ConstructionInfo | ExplorInfo) {
	str = str.replace(/;$/, "");
	let strArr = str.split(";");
	let strArr2 = strArr.map(arr => arr.split("&&("));
	let strArr3 = strArr2.map(arr2 => arr2.map(arr => arr.split(/\|\||&&/)));

	let cond: {type: "skill" | "job" | "construction" | "exploration"; id: string}[] = [];
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
				} else if (s === "game['construction'][this['id']]['currentProgress']['cmp'](0)>0") {
				} else if (s === "let _0x5eec02=_0x4e9a2a!=null") {
				} else if (s === "_0x4e9a2a['forceFight']!=null?_0x4e9a2a['forceFight']: false") {
				} else if (s.startsWith("leftHealthOnComplete")) {
				} else if (s.startsWith("notFinishInThisTick")) {
				} else if (s.startsWith("haveItem")) {
				} else if (s.startsWith("haveAllItem")) {
				} else if (s.startsWith("notArriveProgressStep")) {
				} else if (s.startsWith("!isFullItem")) {
				} else if (s.startsWith("willNotDie")) {
				} else if (s.match(/^!game\['(\w+)'\]\[(\d+)\]\[('timesCompleted'|'isFinished')\]/)) {
				} else if (s.match(/^!game\['(\w+)'\]\[(\d+)\]\[('timesCompleted'|'isFinished')\]/)) {
				} else if (s.match(/^!game\['(\w+)'\]\[this\['id'\]\]\[('timesCompleted'|'isFinished')\]/)) {
				} else if (s.match(/^!game\['(\w+)'\]\[this\['id'\](-|\+)0x(\d+)\]\[('timesCompleted'|'isFinished')\]/)) {
				} else if (s.match(/^game\['(\w+)'\]\[(\d+)\]\[('timesCompleted'|'isFinished')\]/)) {
					let match = s.match(/^game\['(\w+)'\]\[(\d+)\]\[('timesCompleted'|'isFinished')\]/)!;
					if ((gameData as any)[match[1]] && (gameData as any)[match[1]][match[2]]) {
						if (match[1] === type && +match[2] > data.id) {
							console.warn("cond id bigger then self, ignore", data, type, match[2]);
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
							console.warn("cond id bigger then self, ignore", data, type, (data.id + (+match[3] * dir)));
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

	return cond;
}
function mergeCond(cond: {type: "skill" | "job" | "construction" | "exploration"; id: string}[]) {
	let result: {type: "skill" | "job" | "construction" | "exploration"; id: string}[] = [];
	cond.forEach(d => {
		if (!result.find(r => r.type === d.type && r.id === d.id)) {
			result.push(d);
		}
	})
	return result;
}

function buildDataLevel() {
	let count = 0;
	let isFilish = false;
	while (!isFilish && count < 1000) {
		count++;
		isFilish = true;

		setLevelByParent(0);
		try {
			Object.keys(gameData.skill).forEach((key) => {
				let data = gameData.skill[key];
				if (data.level === undefined) {
					throw new Error();
				}
				setLevelByParent(data.level, {id: key, type: "skill"})
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
				setLevelByParent(data.level, {id: key, type: "job"})
				if (data.rewardedItems) {
					Object.values(data.rewardedItems).filter(r => r.itemType === 1).forEach(r => {
						setLevelByParent(data.level!, {id: "" + r.itemId, type: "resources"});
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
				setLevelByParent(data.level, {id: key, type: "construction"})
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
				setLevelByParent(data.level, {id: key, type: "exploration"})
				if (data.awardItem && data.awardItem.type === 1) {
					setLevelByParent(data.level!, {id: "" + data.awardItem!.id, type: "resources"});
				}
			});
		} catch (e) {
			isFilish = false;
		}
	}
}
function setLevelByParent(level: number, parent?: {type: "skill" | "job" | "construction" | "exploration" | "resources"; id: string}) {
	Object.keys(gameData.skill).forEach((key) => {
		let data = gameData.skill[key];
		let isMatch = false;
		if (parent === undefined && data.dependency?.length === 0) {
			isMatch = true;
		} else if (parent !== undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type)) {
			isMatch = true;
		}
		if (isMatch) {
			if (!data.level || data.level < level + 1) {
				data.level = level + 1;
			}
		}
	});
	Object.keys(gameData.job).forEach((key) => {
		let data = gameData.job[key];
		let isMatch = false;
		if (parent === undefined && data.dependency?.length === 0) {
			isMatch = true;
		} else if (parent !== undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type)) {
			if (parent.type !== "exploration" || (parent.type === "exploration" && data.dependency?.filter(d => d.type === "exploration").findIndex(d => d.id === parent.id && d.type === parent.type) === 0)) {
				isMatch = true;
			}
		} else if (parent !== undefined && data.requiredResourceId && parent.type === "resources" && +parent.id === data.requiredResourceId) {
			isMatch = true;
		}
		if (isMatch) {
			if (!data.level || data.level < level + 1) {
				data.level = level + 1;
			}
		}
	});
	Object.keys(gameData.construction).forEach((key) => {
		let data = gameData.construction[key];
		let isMatch = false;
		if (parent === undefined && data.dependency?.length === 0) {
			isMatch = true;
		} else if (parent !== undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type)) {
			isMatch = true;
		}
		if (isMatch) {
			if (!data.level || data.level < level + 1) {
				data.level = level + 1;
			}
		}
	});
	Object.keys(gameData.exploration).forEach((key) => {
		let data = gameData.exploration[key];
		let isMatch = false;
		if (parent === undefined && data.dependency?.length === 0) {
			isMatch = true;
		} else if (parent !== undefined && data.dependency?.find(d => d.id === parent.id && d.type === parent.type)) {
			isMatch = true;
		}
		if (isMatch) {
			if (!data.level || data.level < level + 1) {
				data.level = level + 1;
			}
		}
	});
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

	let change = false;
	let levels = cheps.map((c,i) => ({chep: i + 1, start: gameData.exploration[c].level, end: cheps[i + 1] ? gameData.exploration[cheps[i + 1] - 1].level! : undefined}));
	
	levels.forEach((lvl, i) => {
		if (levels[i - 1] && lvl.start! <= levels[i - 1].end!) {
			gameData.exploration[cheps[i]].level! = levels[i - 1].end! + 1;
			change = true;
		}
	});

	return change;
}
function getDataByLevel(level: number) {
	let result: {count: number; skill: SkillInfo[], job: JobInfo[], construction: ConstructionInfo[], exploration: ExplorInfo[]} = {
		count: 0,
		skill: [],
		job: [],
		construction: [],
		exploration: [],
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

	result.count = result.skill.length + result.job.length + result.construction.length + result.exploration.length;

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
function translate(str: string) {
	if (typeof cnItems === "undefined") {
		return str;
	}
	
	let oriStr = str;
	if (cnItems[str]) {
		str = cnItems[str];
	}

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

	if (str.match(/[a-zA-Z]+/g)) {
		cnRegReplace.forEach((val, reg) => {
			if (reg.test(str)) {
				str = str.replace(reg, val);
			}
		});
	}

	let notTrans = str.match(/[a-zA-Z]+/g);
	if (notTrans) {
		notTrans.forEach((val, i) => {
			if (val === "K" || val === "M" || val === "B" || val === "T" || val === "DNA") {
			} else {
				console.log(oriStr, macths, str);
			}
		})
	}

	return str;
}

gameLoadPromise.then(() => {
	readGameData();
});
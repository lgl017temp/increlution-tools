import { Plugin, save, load, toggle, plugins, settings, btnContainer, rootEl, gameLoadPromise, Game, getLocal, doEval, gameData, readDataPromise, cheps, icons, SkillInfo, JobInfo, ConstructionInfo, ExplorInfo, Boss, BossPhase, HostileInfo, Dependency, formatNum, Resource, Food, numUnits } from "../core";

import type DecimalType from "break_infinity.js";
import type {} from "jquery";
import type PIXIType from "pixi.js";
import type Viewport from "pixi-viewport";
import * as PIXI from "pixi.js";
import * as pixi_viewport from "pixi-viewport";

declare let game: undefined | Game;

declare let $: JQueryStatic;
declare let Decimal: typeof DecimalType;

declare let cnItems: Record<string, string>;
declare let cnPrefix: Record<string, string>;
declare let cnPostfix: Record<string, string>;
declare let cnRegReplace: Map<RegExp, string>;

let togglePathBtn: JQuery<HTMLElement>;
let toggleSpoilerBtn: JQuery<HTMLElement>;
let toggleHighLightNotAutoBtn: JQuery<HTMLElement>;
let jumpToBtn: JQuery<HTMLElement>;
let btnsOffset = 4;
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

		toggleHighLightNotAutoBtn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-left: 10px;position: absolute; bottom: ${60 + 10}px; left: 0;z-index:1" id="pause-button" type="button" class="btn btn-block btn-success ${settings.highLightNotAuto ? 'running' : 'paused'}"><i class="fas ${settings.highLightNotAuto ? 'fa-play' : 'fa-pause'}"></i> <span>${getLocal("chart.highLightNotAuto")}</span></button>`);
		btnContainer.append(toggleHighLightNotAutoBtn);
		toggleHighLightNotAutoBtn.on("click", function() {
			if (settings.highLightNotAuto) {
				settings.highLightNotAuto = false;
				$(this).addClass("paused").removeClass("running");
				$(this).find("i").addClass("fa-pause").removeClass("fa-play");
			} else {
				settings.highLightNotAuto = true;
				$(this).removeClass("paused").addClass("running");
				$(this).find("i").removeClass("fa-pause").addClass("fa-play");
			}
			save();

			toggle();
		})

		jumpToBtn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-left: 10px;position: absolute; bottom: ${90 + 10}px; left: 0;z-index:1" type="button" class="btn btn-block btn-light"><span><span>${getLocal("chart.jumpTo")}</span><select style="display: inline-block;width: 152px;text-align:center;height: 17px;font-size:10px;vertical-align:text-bottom;padding:0;" class="form-control" /></span></button>`);
		btnContainer.append(jumpToBtn);
		jumpToBtn.find("select").on("change", function(e) {
			let val = $(this).val() as string;
			if (imgs[val]) {
				let img = imgs[val];
				let centerX = imageWH[0] / 2;
				pathViewPort.position = new PIXI.Point(-img.x * pathViewPort.scale.x + centerX, -img.y * pathViewPort.scale.y + imageWH[1] / 4);
			}
		})
		jumpToBtn.on("click", function(e) {
			if (e.target instanceof HTMLSelectElement) {
				return;
			}
			let val = jumpToBtn.find("select").val() as string;
			if (imgs[val]) {
				let img = imgs[val];
				let centerX = imageWH[0] / 2;
				pathViewPort.position = new PIXI.Point(-(img.x + img.width / 2) * pathViewPort.scale.x + centerX, -img.y * pathViewPort.scale.y + imageWH[1] / 4);
			}
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
		// .pinch()
		// .wheel()
		.decelerate();

		let zoom = 0;
		pathPIXI.view.addEventListener("wheel", (e) => {
			if (e.deltaY < 0) {
				zoom++;
			} else {
				zoom--;
			}

			pathViewPort.setZoom(Math.pow(1.2, zoom), true);

			pathPIXI.render();
		});
		
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
		highLightNotAuto: false,
	},
	toggle: () => {
		if (settings.showPath) {
			buildPathImage();
			$(pathPIXI.view).show();
			chepBtns.forEach(btn => $(btn).show());
			toggleSpoilerBtn.show();
			toggleHighLightNotAutoBtn.show();
			jumpToBtn.show();
		} else {
			$(pathPIXI.view).hide();
			chepBtns.forEach(btn => $(btn).hide());
			toggleSpoilerBtn.hide();
			toggleHighLightNotAutoBtn.hide();
			jumpToBtn.hide();
		}
		if (settings.spoiler) {
			showSpoiler();
		} else {
			hideSpoiler();
		}
		if (settings.highLightNotAuto) {
			enableHighLightNotAuto();
		} else {
			disableHighLightNotAuto();
		}
	},
	changeLocale: () => {
		togglePathBtn.find("span").html(getLocal("chart.togglePath") as string);
		toggleSpoilerBtn.find("span").html(getLocal("chart.spoiler") as string);
		toggleHighLightNotAutoBtn.find("span").html(getLocal("chart.highLightNotAuto") as string);
		jumpToBtn.find("span").find("span").html(getLocal("chart.jumpTo") as string);
		chepBtns.forEach((btn, i) => {
			if (i === chepBtns.length - 1) {
				btn.find("span").html(`${getLocal("chart.end")}`);
			} else {
				btn.find("span").html(`${getLocal("chart.chepPrefix")}${i + 1}${getLocal("chart.chepSuffix")}`);
			}
		});
		jumpToBtn.find("select").empty();
		pathViewPort.removeChildren();
		pathInited = false;
		if (settings.showPath) {
			buildPathImage();
		}
	},
})

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

let pathPIXI: PIXIType.Application;
let pathViewPort: Viewport.Viewport;

//构建流程图
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

	cheps.forEach((c, i) => {
		if (!chepBtns[i]) {
			let btn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-left: 10px;position: absolute; bottom: ${(cheps.length - i + btnsOffset) * 30 + 10}px; left: 0" type="button" class="btn btn-block btn-light"><span>${getLocal("chart.chepPrefix")}${i + 1}${getLocal("chart.chepSuffix")}</span></button>`);
			$(btnContainer).append(btn);
	
			btn.on("click", () => {
				let img = imgs["exploration_" + c];
				pathViewPort.position = new PIXI.Point(-centerX * pathViewPort.scale.x + centerX, -img.y * pathViewPort.scale.y + imageWH[1] / 4);
			})
			
			chepBtns.push(btn);
			
			if (i === cheps.length - 1) {
				let btn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-left: 10px;position: absolute; bottom: ${30 * btnsOffset + 10}px; left: 0" type="button" class="btn btn-block btn-light"><span>${getLocal("chart.end")}</span></button>`);
				$(btnContainer).append(btn);
		
				btn.on("click", () => {
					let img = imgs["end"];
					pathViewPort.position = new PIXI.Point(-centerX * pathViewPort.scale.x + centerX, -img.y * pathViewPort.scale.y + imageWH[1] / 4);
				})
				chepBtns.push(btn);
			}
		}
	});

	let start = buildDataImage({type: "start", level: 0});
	pathViewPort.addChild(start);
	start.x = centerX;
	start.y = imagePadding[1];
	imgs["start"] = start;
	jumpToBtn.find("select").append($(`<option value="start">${translate("Start")}</option>`));

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
			jumpToBtn.find("select").append($(`<option value="${"skill_" + d.id}">${translate(json.title ?? "")}(skill_${d.id})</option>`));
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
			jumpToBtn.find("select").append($(`<option value="job_${d.id}">${icons[json.icon!]} ${translate(json.title ?? "")}(job_${d.id})</option>`));
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
			jumpToBtn.find("select").append($(`<option value="construction_${d.id}">${icons[json.icon!]} ${translate(json.title ?? "")}(construction_${d.id})</option>`));
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
			jumpToBtn.find("select").append($(`<option value="exploration_${d.id}">${icons[json.icon!]} ${translate(json.title ?? "")}(exploration_${d.id})</option>`));
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
			jumpToBtn.find("select").append($(`<option value="boss_${d.id}">${icons[json.icon!]} ${translate(json.title ?? "")}(boss_${d.id})</option>`));
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
			jumpToBtn.find("select").append($(`<option value="bossPhase_${d.bossId}_${d.phase}">${icons[json.icon!]} ${translate(json.title ?? "")}(bossPhase_${d.bossId}_${d.phase})</option>`));
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
	jumpToBtn.find("select").append($(`<option value="end">${translate("End")}</option>`));

	cheps.forEach((c, i) => {
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

			json.tooltip.forEach((tip, i) => {
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

				if (i !== json.tooltip!.length - 1) {
					let splitLine = new PIXI.Graphics();
					result.addChild(splitLine);
					splitLine.x = 0;
					splitLine.y = nextHeight + blockPadding;
					splitLine.lineStyle(lineWidth, borderColor, 0.3);
					splitLine.moveTo(0, +lineWidth / 2)
					splitLine.lineTo(realBlockW, +lineWidth / 2);

					nextHeight += lineWidth + blockPadding * 2;
				}
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
function checkVisible(data: Dependency): boolean {
	if (!game) {
		return false;
	}

	let deps: Dependency[] = [];
	let completed = false;
	switch (data.type) {
		case "skill":
			deps = gameData.skill[data.id].dependency!;
			completed = game.skills[+data.id].instinctLevel.gt(0) || game.skills[+data.id].instinctExperience.gt(0);
			break;
		case "job":
			deps = gameData.job[data.id].dependency!;
			completed = game.jobs[+data.id].timesCompleted > 0;
			break;
		case "construction":
			deps = gameData.construction[data.id].dependency!;
			completed = game.construction[+data.id].timesCompleted > 0;
			break;
		case "exploration":
			deps = gameData.exploration[data.id].dependency!;
			completed = game.exploration[+data.id].timesCompleted > 0;
			break;
		case "hostile":
			deps = gameData.hostile[data.id].dependency!;
			break;
		case "boss":
			if (data.phase === undefined) {
				deps = gameData.boss[data.id].dependency!;
			} else {
				deps = gameData.bossPhase[data.id][data.phase].dependency!;
			}
			break;
		default:
			deps = undefined as any;
	}

	if (completed) {
		return true;
	}

	if (deps === undefined) {
		throw new Error("no deps");
	}

	let result = true;
	result = deps.every((dep, i) => {
		if (dep.type === "skill") {
			let d = game!.skills[+dep.id];
			if (!d) {
				console.log(dep);
				throw new Error("no dep data");
			}
			return !(d.instinctLevel.eq(0) && d.instinctExperience.eq(0));
		} else if (dep.type === "job") {
			let d = game!.jobs[+dep.id];
			if (!d) {
				console.log(dep);
				throw new Error("no dep data");
			}
			return d.timesCompleted;
		} else if (dep.type === "construction") {
			let d = game!.construction[+dep.id];
			if (!d) {
				console.log(dep);
				throw new Error("no dep data");
			}
			return d.timesCompleted;
		} else if (dep.type === "exploration") {
			let d = game!.exploration[+dep.id];
			if (!d) {
				console.log(dep);
				throw new Error("no dep data");
			}
			return d.timesCompleted;
		} else if (dep.type === "hostile") {
			console.warn("no hostile dep check");
			return true;
		} else if (dep.type === "boss") {
			if (dep.phase === undefined) {
				let selfVisible = checkVisible({type: "boss", id: dep.id});
				return selfVisible;
			} else {
				// console.warn("no boss phase dep check");
				let selfVisible = checkVisible({type: "boss", id: dep.id, phase: dep.phase});
				return selfVisible;
			}
		}
	});

	return result;
}
function formatSpoiler(visible: boolean, key: string) {
	let img = imgs[key];
	let links = linkImgs[key];
	let el = jumpToBtn.find("select").find(`option[value='${key}']`)[0];
	if (!visible) {
		if (img && img.visible) {
			img.visible = false;
		}
		if (links) {
			Object.values(links).forEach((link) => {
				if (link.visible) {
					link.visible = false;
				}
			});
		}
		if (el && el.style.display !== "none") {
			el.style.display = "none";
		}
	} else {
		if (img && !img.visible) {
			img.visible = true;
		}
		if (links) {
			Object.values(links).forEach((link) => {
				if (!link.visible) {
					link.visible = true;
				}
			});
		}
		if (el && el.style.display !== "") {
			el.style.display = "";
		}
	}
}
function hideSpoiler() {
	if (!hideSpoilerInterval) {
		hideSpoilerInterval = window.setInterval(_hideSpoiler, 1000);
		_hideSpoiler();
	}
}
function _hideSpoiler() {
	Object.values(gameData.skill).forEach((d, i) => {
		let visible = checkVisible({id: "" +i, type: "skill"});
		formatSpoiler(visible, "skill_" + i);
	})
	Object.values(gameData.job).forEach((d, i) => {
		let visible = checkVisible({id: "" +i, type: "job"});
		formatSpoiler(visible, "job_" + i);
	})
	Object.values(gameData.construction).forEach((d, i) => {
		let visible = checkVisible({id: "" +i, type: "construction"});
		formatSpoiler(visible, "construction_" + i);
	})
	Object.values(gameData.exploration).forEach((d, i) => {
		let visible = checkVisible({id: "" +i, type: "exploration"});
		formatSpoiler(visible, "exploration_" + i);
	})
	Object.values(gameData.hostile).forEach((d, i) => {
		let visible = checkVisible({id: "" +i, type: "hostile"});
		formatSpoiler(visible, "hostile_" + i);
	})
	Object.values(gameData.boss).forEach((d, i) => {
		let visible = checkVisible({id: "" +i, type: "boss"});
		formatSpoiler(visible, "boss_" + i);
	})
	Object.values(gameData.bossPhase).forEach(bossPhase => {
		Object.values(bossPhase).forEach((d, i) => {
			let visible = checkVisible({id: "" +d.bossId, type: "boss", phase: i});
			formatSpoiler(visible, "bossPhase_" + d.bossId + "_" + i);
		})
	})
	pathPIXI.render();
}
function showSpoiler() {
	if (hideSpoilerInterval) {
		clearInterval(hideSpoilerInterval);
		hideSpoilerInterval = undefined;
	}

	Object.values(imgs).forEach(img => img.visible = true);
	Object.values(linkImgs).forEach(links => Object.values(links).forEach(img => img.visible = true));
	jumpToBtn.find("select").find("option").each((idx, option) => {
		option.style.display = "";
	});

	pathPIXI.render();
}

let highLightNotAutoInterval: number | undefined;
let autoAlpha = 0.3;
function checkAuto(data: Dependency): boolean {
	if (!game) {
		return false;
	}

	let result = false;
	switch (data.type) {
		case "skill":
			result = true;
			break;
		case "job":
			result = game.jobs[+data.id].isAutomationUnlocked;
			break;
		case "construction":
			result = game.construction[+data.id].isAutomationUnlocked;
			break;
		case "exploration":
			result = game.exploration[+data.id].isAutomationUnlocked;
			break;
		case "hostile":
			result = true
			break;
		case "boss":
			let deps = gameData.boss[data.id].dependency!;
			if (data.phase !== undefined) {
				deps = gameData.bossPhase[data.id][data.phase].dependency!;
			}
			if (deps === undefined) {
				throw new Error("no deps");
			}
			result = deps.every((dep, i) => {
				return checkAuto({type: dep.type, id: dep.id, phase: dep.phase});
			});
			break;
		default:
			result = false;
	}

	return result;
}
function formatHighLight(auto: boolean, key: string, color = "") {
	let img = imgs[key];
	let el = jumpToBtn.find("select").find(`option[value='${key}']`)[0];
	if (auto) {
		if (img && img.alpha !== autoAlpha) {
			img.alpha = autoAlpha;
		}
		if (el && el.style.color !== color) {
			el.style.color = color;
		}
	} else {
		if (img && img.alpha !== 1) {
			img.alpha = 1;
		}
		if (el && el.style.color !== "") {
			el.style.color = "";
		}
	}
}
function enableHighLightNotAuto() {
	if (!highLightNotAutoInterval) {
		highLightNotAutoInterval = window.setInterval(_enableHighLightNotAuto, 1000);
		_enableHighLightNotAuto();
	}
}
function _enableHighLightNotAuto() {
	let color = "";
	try {
		let c = rootEl[0].getFormControlStyle().color[0];
		c = c.replace("rgb", "rgba").replace(")", ", " + autoAlpha + ")");
		color = c;
	} catch (error) {
	}
	Object.values(gameData.skill).forEach((d, i) => {
		let auto = checkAuto({id: "" +i, type: "skill"});
		formatHighLight(auto, "skill_" + i, color);
	})
	Object.values(gameData.job).forEach((d, i) => {
		let auto = checkAuto({id: "" +i, type: "job"});
		formatHighLight(auto, "job_" + i, color);
	})
	Object.values(gameData.construction).forEach((d, i) => {
		let auto = checkAuto({id: "" +i, type: "construction"});
		formatHighLight(auto, "construction_" + i, color);
	})
	Object.values(gameData.exploration).forEach((d, i) => {
		let auto = checkAuto({id: "" +i, type: "exploration"});
		formatHighLight(auto, "exploration_" + i, color);
	})
	Object.values(gameData.hostile).forEach((d, i) => {
		let auto = checkAuto({id: "" +i, type: "hostile"});
		formatHighLight(auto, "hostile_" + i, color);
	})
	Object.values(gameData.boss).forEach((d, i) => {
		let auto = checkAuto({id: "" +i, type: "boss"});
		formatHighLight(auto, "boss_" + i, color);
	})
	Object.values(gameData.bossPhase).forEach(bossPhase => {
		Object.values(bossPhase).forEach((d, i) => {
			let auto = checkAuto({id: "" +d.bossId, type: "boss", phase: i});
			formatHighLight(auto, "bossPhase_" + d.bossId + "_" + i, color);
		})
	})

	let el = jumpToBtn.find("select").find(`option[value='start']`)[0];
	formatHighLight(true, "start", color);

	el = jumpToBtn.find("select").find(`option[value='end']`)[0];
	formatHighLight(true, "end", color);

	pathPIXI.render();
}
function disableHighLightNotAuto() {
	if (highLightNotAutoInterval) {
		clearInterval(highLightNotAutoInterval);
		highLightNotAutoInterval = undefined;
	}

	Object.values(imgs).forEach(img => img.alpha = 1);
	jumpToBtn.find("select").find("option").each((idx, option) => {
		option.style.color = "";
	});

	pathPIXI.render();
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
	let result: DataJson = {type: "bossPhase", title: name + " Phase " + data.phase, id: `bossPhase_${data.bossId}_${data.id}`, icon: icon, tooltip: [], extrReq: [], story:[], level: 0, children: []};

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
	let result: DataJson = {type: "hostile", title: data.name, id: `hostile_${data.id}`, icon: enemy.icon, exp: expStr, tooltip: [data.tooltip], extrReq: [], story:[], level: 0, children: []};

	if (data.completionDamage) {
		result.children!.push({type: "lifeBadEffect", title: `${icons["health"]} -${formatNum(data.completionDamage)}`, level: 0});
	}
	if (data.completionBossHealing) {
		let icon = gameData.enemy[data.bossId].icon;
		result.children!.push({type: "lifeBadEffect", title: `${icons[icon]}${icons["health"]} +${formatNum(data.completionBossHealing)}%`, level: 0});
	}
	
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
	str = str.replace(/<\/span>/g, "");
	str = str.replace(/<q>/g, "\"");
	str = str.replace(/<\/q>/g, "\"");
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
			if (numUnits.indexOf(val) !== -1 || val === "DNA" || val === "boss") {
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
		// window.pathPIXI = pathPIXI;
		// window.pathViewPort = pathViewPort;
		// window.imgs = imgs;
		window.exportNoTrans = exportNoTrans;
		window.allNoTrans = allNoTrans;
		// window.translate = translate;
	}, 1000);
});
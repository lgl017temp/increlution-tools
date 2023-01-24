import { Plugin, save, load, toggle, plugins, settings, btnContainer, rootEl, gameLoadPromise, Game, getLocal } from "../core";

import type DecimalType from "break_infinity.js";
declare let Decimal: typeof DecimalType;

declare let game: undefined | Game;

let speedBtn: JQuery<HTMLElement>;
let skillBtn: JQuery<HTMLElement>;
let healthBtn: JQuery<HTMLElement>;
let storgeBtn: JQuery<HTMLElement>;
let rebirthBtn: JQuery<HTMLElement>;
let autoBtn: JQuery<HTMLElement>;

let toggleCheatBtn: JQuery<HTMLElement>;

plugins.push({
	init: () => {
		toggleCheatBtn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-right: 10px;" id="pause-button" type="button" class="btn btn-block btn-success ${settings.showCheat ? 'running' : 'paused'}"><i class="fas ${settings.showCheat ? 'fa-play' : 'fa-pause'}"></i> <span>${getLocal("cheat.toggleCheat")}</span></button>`);
		btnContainer.append(toggleCheatBtn);
		toggleCheatBtn.on("click", function() {
			if (settings.showCheat) {
				settings.showCheat = false;
				$(this).addClass("paused").removeClass("running");
				$(this).find("i").addClass("fa-pause").removeClass("fa-play");
			} else {
				settings.showCheat = true;
				$(this).removeClass("paused").addClass("running");
				$(this).find("i").removeClass("fa-pause").addClass("fa-play");
			}
			save();

			toggle();
		})
		
		speedBtn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-right: 10px;" id="pause-button" type="button" class="btn btn-block btn-success ${settings.speedEn ? 'running' : 'paused'}"><i class="fas ${settings.speedEn ? 'fa-play' : 'fa-pause'}"></i> <span><input style="display: inline-block;width: 52px;text-align:center;height: 12px;font-size:12px;" type="text" class="form-control" maxlength="3"> <span>${getLocal("cheat.speed")}</span></span></button>`);
		btnContainer.append(speedBtn);
		speedBtn.find("input").val(settings.speedMul).on("input", function() {
			let mul = +$(this).val()!;
			if (isNaN(mul) || mul === Infinity || mul === -Infinity || mul % 1 !== 0 || mul <= 0) {
				$(this).val(settings.speedMul);
				return;
			}
			settings.speedMul = mul;
			save();
		});
		speedBtn.on("click", function(e) {
			if (e.target instanceof HTMLInputElement) {
				return;
			}
			if (settings.speedEn) {
				settings.speedEn = false;
				$(this).addClass("paused").removeClass("running");
				$(this).find("i").addClass("fa-pause").removeClass("fa-play");
			} else {
				settings.speedEn = true;
				$(this).removeClass("paused").addClass("running");
				$(this).find("i").removeClass("fa-pause").addClass("fa-play");
			}
			save();
		});

		skillBtn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-right: 10px;" id="pause-button" type="button" class="btn btn-block btn-success ${settings.skillEn ? 'running' : 'paused'}"><i class="fas ${settings.skillEn ? 'fa-play' : 'fa-pause'}"></i> <span><input style="display: inline-block;width: 52px;text-align:center;height: 12px;font-size:12px;" type="text" class="form-control" maxlength="3"> <span>${getLocal("cheat.skill")}</span></span></button>`);
		btnContainer.append(skillBtn);
		skillBtn.find("input").val(settings.skillMul).on("input", function() {
			let mul = +$(this).val()!;
			if (isNaN(mul) || mul === Infinity || mul === -Infinity || mul % 1 !== 0 || mul <= 0) {
				$(this).val(settings.skillMul);
				return;
			}
			settings.skillMul = mul;
			save();
		});
		skillBtn.on("click", function(e) {
			if (e.target instanceof HTMLInputElement) {
				return;
			}
			if (settings.skillEn) {
				settings.skillEn = false;
				$(this).addClass("paused").removeClass("running");
				$(this).find("i").addClass("fa-pause").removeClass("fa-play");
			} else {
				settings.skillEn = true;
				$(this).removeClass("paused").addClass("running");
				$(this).find("i").removeClass("fa-pause").addClass("fa-play");
			}
			save();
		});

		healthBtn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-right: 10px;" id="pause-button" type="button" class="btn btn-block btn-success ${settings.healthEn ? 'running' : 'paused'}"><i class="fas ${settings.healthEn ? 'fa-play' : 'fa-pause'}"></i> <span>${getLocal("cheat.health")}</span></button>`);
		btnContainer.append(healthBtn);
		healthBtn.on("click", function() {
			if (settings.healthEn) {
				settings.healthEn = false;
				$(this).addClass("paused").removeClass("running");
				$(this).find("i").addClass("fa-pause").removeClass("fa-play");
			} else {
				settings.healthEn = true;
				$(this).removeClass("paused").addClass("running");
				$(this).find("i").removeClass("fa-pause").addClass("fa-play");
			}
			save();
		});

		storgeBtn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-right: 10px;" id="pause-button" type="button" class="btn btn-block btn-success ${settings.inventoryEn ? 'running' : 'paused'}"><i class="fas ${settings.inventoryEn ? 'fa-play' : 'fa-pause'}"></i> <span>${getLocal("cheat.storge")}</span></button>`);
		btnContainer.append(storgeBtn);
		storgeBtn.on("click", function() {
			if (settings.inventoryEn) {
				settings.inventoryEn = false;
				$(this).addClass("paused").removeClass("running");
				$(this).find("i").addClass("fa-pause").removeClass("fa-play");
			} else {
				settings.inventoryEn = true;
				$(this).removeClass("paused").addClass("running");
				$(this).find("i").removeClass("fa-pause").addClass("fa-play");
			}
			save();
		});

		rebirthBtn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-right: 10px;" id="pause-button" type="button" class="btn btn-block btn-success ${settings.rebirthEn ? 'running' : 'paused'}"><i class="fas ${settings.rebirthEn ? 'fa-play' : 'fa-pause'}"></i> <span>${getLocal("cheat.rebirth")}</span></button>`);
		btnContainer.append(rebirthBtn);
		rebirthBtn.on("click", function() {
			if (settings.rebirthEn) {
				settings.rebirthEn = false;
				$(this).addClass("paused").removeClass("running");
				$(this).find("i").addClass("fa-pause").removeClass("fa-play");
			} else {
				settings.rebirthEn = true;
				$(this).removeClass("paused").addClass("running");
				$(this).find("i").removeClass("fa-pause").addClass("fa-play");
			}
			save();
		});
		
		let confirmed = 3;
		let confirmInterval = 0;
		autoBtn = $(`<button style="height:20px;padding:0 10px;font-size:12px;width: fit-content; display: inline-block; vertical-align: sub; margin-right: 10px;" type="button" class="btn btn-block btn-light" data-original-title="${getLocal("cheat.autoTip")}"><span>${getLocal("cheat.auto")}</span></button>`);
		btnContainer.append(autoBtn);
		autoBtn.on("mousedown", function() {
			$(this).find("span").html("&emsp;&emsp;"+confirmed+"&emsp;&emsp;");
			confirmInterval = window.setInterval(() => {
				if (confirmed != 0) {
					confirmed--;
					$(this).find("span").html("&emsp;&emsp;"+confirmed+"&emsp;&emsp;");
				} else {
					if (game) {
						clearInterval(confirmInterval);
						confirmed = 3;
						$(this).find("span").html(getLocal("cheat.auto") as string);

						game.jobs.forEach(d => {
							if (!d.isAutomationUnlocked) {
								d.isAutomationUnlocked = true;
								if (d.shouldAutomate === null) {
									d.shouldAutomate = 0;
								}
							}
						});
						game.construction.forEach(d => {
							if (!d.isAutomationUnlocked) {
								d.isAutomationUnlocked = true;
								if (d.shouldAutomate === null) {
									d.shouldAutomate = 0;
								}
							}
						});
						game.exploration.forEach(d => {
							if (!d.isAutomationUnlocked) {
								d.isAutomationUnlocked = true;
								if (d.shouldAutomate === null) {
									d.shouldAutomate = 0;
								}
							}
						});
						setTimeout(() => {
							$("#option-export-save-button").click();
							setTimeout(() => {
								navigator.clipboard.readText().then((saveText) => {
									$("#import-save-textarea").val(saveText);
									$("#import-save-textarea").trigger("change");
									$("#import-save-confirm-button").click();
								});
							}, 200);
						}, 1000);
					}
				}
			}, 1000);
			
		});
		$(document).on("mouseup", function() {
			clearInterval(confirmInterval);
			confirmed = 3;
			autoBtn.find("span").html(getLocal("cheat.auto") as string);
		});
	},
	settings: {
		speedMul: 10,
		speedEn: false,
		
		skillMul: 10,
		skillEn: false,
		
		inventoryEn: false,
		healthEn: false,

		rebirthEn: false,

		showCheat: false,
	},
	toggle: () => {
		if (settings.showCheat) {
			speedBtn.show();
			skillBtn.show();
			healthBtn.show();
			storgeBtn.show();
			rebirthBtn.show();
			autoBtn.show();
		} else {
			speedBtn.hide();
			skillBtn.hide();
			healthBtn.hide();
			storgeBtn.hide();
			rebirthBtn.hide();
			autoBtn.hide();
		}
	},
	changeLocale: () => {
		speedBtn.find("span").find("span").html(getLocal("cheat.speed") as string);
		skillBtn.find("span").find("span").html(getLocal("cheat.skill") as string);
		healthBtn.find("span").html(getLocal("cheat.health") as string);
		storgeBtn.find("span").html(getLocal("cheat.storge") as string);
		rebirthBtn.find("span").html(getLocal("cheat.rebirth") as string);
		autoBtn.find("span").html(getLocal("cheat.auto") as string);
		autoBtn.attr("data-original-title", getLocal("cheat.autoTip") as string);
		toggleCheatBtn.find("span").html(getLocal("cheat.toggleCheat") as string);
	},
});

gameLoadPromise.then(() => {
	//10倍速
	setInterval(function () {
		try {
			if (game && settings.speedEn) {
				game["lastTimeStamp"] -= 0x14 * (settings.speedMul - 1);
			}
		} catch (error) {
			
		}
	}, 0x14);
	
	//自动重生
	setInterval(function () {
		try {
			if (settings.rebirthEn) {
				$("#reincarnate-button:visible").click();
			}
		} catch (error) {
			
		}
	}, 200);
	
	
	if (game) {
		let __add = game.inventory[0][0].amount.__proto__.add;
		game.inventory[0][0].amount.__proto__.add = function(this: DecimalType, t: DecimalType) {
			//物品不减
			if (settings.inventoryEn) {
				let isInventory = game!.inventory.find(i => i.find(d => d.amount === this));
				if (isInventory) {
					if(t.lessThan(0)){
						t = new Decimal(0);
					}
				}
			}

			//技能10倍经验
			if (settings.skillEn) {
				let isSkill = game!.skills.find(s => s.generationExperience === this || s.instinctExperience === this);
				if (isSkill) {
					if(t.greaterThan(0)){
						t = t.mul(settings.skillMul);
					}
				}
			}

			//生命不减
			if (settings.healthEn) {
				let isHealth = game!.health === this;
				if (isHealth) {
					if(t.lessThan(0)){
						t = new Decimal(0);
					}
				}
			}

			return (__add.bind(this))(t);
		}
	}
})

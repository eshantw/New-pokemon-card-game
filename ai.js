// =========================================================
// 🤖 Pokémon TCG Pro - 高智慧電腦 AI 決策引擎 (ai.js) v5.0
// 升級：前排0能起步保護、後備殘血降權、防秒殺換人、痛苦平分/傷藥防呆
// =========================================================

// 1. 預判玩家對指定電腦寶可夢可造成的最大傷害
window.calcPlayerDamageOnCpu = function(playerP, cpuP) {
  if (!playerP || !cpuP) return 0;
  let maxDmg = 0;
  playerP.attacks.forEach(atk => {
    if (window.canUseAttack(playerP, atk)) {
      let d = atk.d;
      const cpuWeak = Array.isArray(cpuP.weakness) ? cpuP.weakness : [cpuP.weakness];
      if (cpuWeak.includes(playerP.type)) d = Math.floor(d * 1.5);
      if (atk.special !== 'ignore_resistance' && (cpuP.resistance.type === playerP.type || cpuP.resistance.type === 'any')) {
        d -= cpuP.resistance.val;
      }
      if (playerP.buff && playerP.buff.turns > 0) d += playerP.buff.dmg;
      if (d > maxDmg) maxDmg = d;
    }
  });
  return Math.max(0, maxDmg);
};

// 2. 預判電腦寶可夢對玩家可造成的最大傷害
window.calcCpuMaxDamageOnPlayer = function(cpuP, playerP, simulatedExtraEnergy = null) {
  if (!cpuP || !playerP) return 0;
  const tempMon = {
    ...cpuP,
    attachedEnergy: simulatedExtraEnergy ? [...cpuP.attachedEnergy, simulatedExtraEnergy] : [...cpuP.attachedEnergy]
  };
  let maxDmg = 0;
  tempMon.attacks.forEach(atk => {
    if (window.canUseAttack(tempMon, atk)) {
      let d = atk.d;
      const pWeak = Array.isArray(playerP.weakness) ? playerP.weakness : [playerP.weakness];
      if (pWeak.includes(tempMon.type)) d = Math.floor(d * 1.5);
      if (atk.special !== 'ignore_resistance' && (playerP.resistance.type === tempMon.type || playerP.resistance.type === 'any')) {
        d -= playerP.resistance.val;
      }
      if (tempMon.buff && tempMon.buff.turns > 0) d += tempMon.buff.dmg;
      if (d > maxDmg) maxDmg = d;
    }
  });
  return Math.max(0, maxDmg);
};

// 3. 智慧能量分配：解決耿鬼與帝牙盧卡 0 能量起步問題，並對後備殘血怪降權
window.smartAttachEnergyToBestTarget = function(cpuTeam, energyType) {
  const playerActive = window.state.teams[1].pokemon[window.state.teams[1].activeIdx];
  const activeP = cpuTeam.pokemon[cpuTeam.activeIdx];

  function evaluateMonEnergyNeed(p, eType, isActiveMon) {
    let maxCostLen = 0;
    let hasScaling = false;
    p.attacks.forEach(atk => {
      if (atk.cost.length > maxCostLen) maxCostLen = atk.cost.length;
      if (atk.special && atk.special.includes('plus_dmg_per_')) hasScaling = true;
    });

    if (p.attachedEnergy.length >= maxCostLen && !hasScaling) {
      return -999;
    }

    let baseMatchScore = -1;
    const usableBefore = p.attacks.filter(atk => window.canUseAttack(p, atk)).length;
    const maxDmgBefore = window.calcCpuMaxDamageOnPlayer(p, playerActive, null);

    const tempMon = { ...p, attachedEnergy: [...p.attachedEnergy, eType] };
    const usableAfter = tempMon.attacks.filter(atk => window.canUseAttack(tempMon, atk)).length;
    const maxDmgAfter = window.calcCpuMaxDamageOnPlayer(p, playerActive, eType);

    for (let atk of p.attacks) {
      let eCopy = [...p.attachedEnergy];
      let rainbowCount = eCopy.filter(e => e === 'rainbow').length;
      eCopy = eCopy.filter(e => e !== 'rainbow');

      let neededCosts = [...atk.cost];
      let onlyNeedsAny = neededCosts.every(c => c === 'any');

      for (let i = neededCosts.length - 1; i >= 0; i--) {
        let c = neededCosts[i];
        if (c !== 'any') {
          let idx = eCopy.indexOf(c);
          if (idx !== -1) {
            eCopy.splice(idx, 1);
            neededCosts.splice(i, 1);
          } else if (rainbowCount > 0) {
            rainbowCount--;
            neededCosts.splice(i, 1);
          }
        }
      }

      if (onlyNeedsAny && (p.attachedEnergy.length < atk.cost.length)) {
        baseMatchScore = Math.max(baseMatchScore, 100);
      } else if (neededCosts.includes(eType)) {
        baseMatchScore = Math.max(baseMatchScore, 100);
      } else if (eType === 'rainbow' && neededCosts.length > 0) {
        baseMatchScore = Math.max(baseMatchScore, 95);
      } else {
        let anyNeeded = neededCosts.filter(c => c === 'any').length;
        if (anyNeeded > 0 && (eCopy.length + rainbowCount) < anyNeeded) {
          baseMatchScore = Math.max(baseMatchScore, 50);
        }
      }
    }

    if (baseMatchScore === -1) return -999;

    let totalScore = baseMatchScore;

    // 🌟 核心修正1：前排起步保護加權 (解決 0 能耿鬼與帝牙盧卡被搶能問題)
    if (isActiveMon && !p.status.asleep && !p.status.paralyze && p.status.cant_attack === 0) {
      if (usableBefore === 0 && usableAfter > 0) {
        totalScore += 140; // 貼上後立刻能開火
      } else if (usableBefore === 0 && usableAfter === 0) {
        totalScore += 110; // 前排雖然還差 1 顆，但給予強烈起跑培育權
      } else if (maxDmgAfter > maxDmgBefore) {
        totalScore += 80;
      }
      if (maxDmgAfter >= playerActive.currHp) {
        totalScore += 160; // 斬殺優先
      }
    }

    // 體質權重
    totalScore += (p.hp / 10);
    totalScore += (p.attachedEnergy.length * 10);

    // 🌟 核心修正2：後備殘血怪 (HP <= 30) 無條件降權，不再搶前排能量 (解決阿勃梭魯問題)
    if (!isActiveMon && p.currHp <= 30) {
      totalScore -= 70;
    }

    const incomingDmg = window.calcPlayerDamageOnCpu(playerActive, p);
    if (!isActiveMon && p.currHp <= incomingDmg && incomingDmg > 0 && usableAfter === 0) {
      totalScore -= 80;
    }

    return totalScore;
  }

  let bestTarget = activeP;
  let highestScore = evaluateMonEnergyNeed(activeP, energyType, true);

  const aliveBenches = cpuTeam.pokemon.filter((p, idx) => idx !== cpuTeam.activeIdx && p.currHp > 0);
  for (let benchP of aliveBenches) {
    let bScore = evaluateMonEnergyNeed(benchP, energyType, false);
    if (bScore > highestScore) {
      highestScore = bScore;
      bestTarget = benchP;
    }
  }

  bestTarget.attachedEnergy.push(energyType);
  return bestTarget;
};

// 4. 氣絕換人評分系統：納入招式最高輸出傷害，杜絕低傷怪先上後逃
window.findBestCpuBenchReplacement = function(cpuTeam, extraPendingEnergy = null) {
  const playerActive = window.state.teams[1].pokemon[window.state.teams[1].activeIdx];
  let bestIdx = -1;
  let bestScore = -9999;

  cpuTeam.pokemon.forEach((p, idx) => {
    if (idx === cpuTeam.activeIdx || p.currHp <= 0) return;

    let score = 0;
    const myWeakness = Array.isArray(p.weakness) ? p.weakness : [p.weakness];
    const playerWeakness = Array.isArray(playerActive.weakness) ? playerActive.weakness : [playerActive.weakness];

    if (playerWeakness.includes(p.type)) score += 40;
    if (myWeakness.includes(playerActive.type)) score -= 65;

    const canAttackNow = p.attacks.some(atk => window.canUseAttack(p, atk));
    const tempMon = extraPendingEnergy ? { ...p, attachedEnergy: [...p.attachedEnergy, extraPendingEnergy] } : p;
    const canAttackWithPending = tempMon.attacks.some(atk => window.canUseAttack(tempMon, atk));
    const maxMyDmg = window.calcCpuMaxDamageOnPlayer(p, playerActive, extraPendingEnergy);

    // 🌟 核心修正3：將招式傷害納入上場評分 (雷鳥龍 80 傷優先於魔牆人偶 30 傷)
    score += (maxMyDmg * 0.6);

    if (canAttackNow) {
      score += 55;
    } else if (canAttackWithPending) {
      score += 45;
    } else {
      score -= 25;
    }

    if (maxMyDmg >= playerActive.currHp) score += 95;

    const incomingDmg = window.calcPlayerDamageOnCpu(playerActive, p);
    const willBeOneShot = (p.currHp <= incomingDmg && incomingDmg > 0);

    if (willBeOneShot) {
      if (maxMyDmg >= playerActive.currHp) score += 20;
      else if (canAttackNow || canAttackWithPending) score -= 40;
      else score -= 110;
    } else {
      score += (p.currHp / p.hp) * 30 + (p.currHp / 5);
    }

    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  });

  return bestIdx;
};

// 5. 電腦回合主流程控制
window.runCpuTurn = function() {
  window.state.step = 'action';
  window.state.hasAttachedEnergyThisTurn = false;
  window.state.isAttacking = false;
  window.updateHint("🤖 電腦正在進行戰略計算與行動...");
  window.render();

  setTimeout(() => {
    const cpuTeam = window.state.teams[2];
    const playerActive = window.state.teams[1].pokemon[window.state.teams[1].activeIdx];
    let activeP = cpuTeam.pokemon[cpuTeam.activeIdx];

    const drawnEnergy = window.getSmartEnergyType(cpuTeam);
    const tDB = window.CLOUD_TRAINERS_DB || (typeof TRAINERS_DB !== 'undefined' ? TRAINERS_DB : []);
    const trainerChance = window.getTrainerDrawChance(cpuTeam);
    if (Math.random() < trainerChance && cpuTeam.hand.length < 7 && tDB.length > 0) {
      const trainer = tDB[Math.floor(Math.random() * tDB.length)];
      cpuTeam.hand.push({ cardType: 'trainer', ...trainer });
      window.addLog(`🎁 電腦獲得道具：「${trainer.name}」！`);
      window.render();
    }

    setTimeout(() => {
      window.runCpuTacticalTrainerPhase(cpuTeam);

      setTimeout(() => {
        activeP = cpuTeam.pokemon[cpuTeam.activeIdx];
        const currentPlayerActive = window.state.teams[1].pokemon[window.state.teams[1].activeIdx];
        const incomingPlayerDmg = window.calcPlayerDamageOnCpu(currentPlayerActive, activeP);
        const myMaxDmgIfStay = window.calcCpuMaxDamageOnPlayer(activeP, currentPlayerActive, drawnEnergy);

        const willDieNextTurn = (activeP.currHp <= incomingPlayerDmg && incomingPlayerDmg > 0 && myMaxDmgIfStay < currentPlayerActive.currHp);
        const isDisabled = (activeP.status.asleep || activeP.status.paralyze || activeP.status.confused);

        const bestBenchIdx = window.findBestCpuBenchReplacement(cpuTeam, drawnEnergy);
        const benchCandidate = bestBenchIdx !== -1 ? cpuTeam.pokemon[bestBenchIdx] : null;

        // 🌟 核心修正4：撤退安全檢查嚴格化 (替補必須存活或能反殺，否則嚴禁換人送死)
        let isBenchSafer = false;
        if (benchCandidate) {
          const dmgToBench = window.calcPlayerDamageOnCpu(currentPlayerActive, benchCandidate);
          const benchCanSurvive = (benchCandidate.currHp > dmgToBench);
          const benchDmg = window.calcCpuMaxDamageOnPlayer(benchCandidate, currentPlayerActive, drawnEnergy);
          if (benchCanSurvive || benchDmg >= currentPlayerActive.currHp) {
            isBenchSafer = true;
          }
        }

        const switchIdx = cpuTeam.hand.findIndex(c => c.cardType === 'trainer' && c.id === 'switch');

        if (switchIdx !== -1 && bestBenchIdx !== -1 && (willDieNextTurn || isDisabled) && isBenchSafer) {
          cpuTeam.hand.splice(switchIdx, 1);
          window.retreatToBench(cpuTeam, bestBenchIdx);
          window.addLog(`🔄 電腦使用「交替」！換上安全的 ${cpuTeam.pokemon[bestBenchIdx].name}！`);
          activeP = cpuTeam.pokemon[cpuTeam.activeIdx];
          window.render();
        } else if (willDieNextTurn && isBenchSafer && activeP.attachedEnergy.length >= 1 && bestBenchIdx !== -1) {
          activeP.attachedEnergy.pop();
          window.retreatToBench(cpuTeam, bestBenchIdx);
          window.addLog(`🏃 電腦預判即死威脅，消耗 1 能量撤退，派遣 ${cpuTeam.pokemon[bestBenchIdx].name} 上場！`);
          activeP = cpuTeam.pokemon[cpuTeam.activeIdx];
          window.render();
        } else if (willDieNextTurn && isBenchSafer && activeP.attachedEnergy.length === 0 && bestBenchIdx !== -1) {
          const isLastLifeCrisis = (cpuTeam.lostLives >= 2);
          const isHighValueBoss = (activeP.hp >= 120);

          if (isLastLifeCrisis || isHighValueBoss) {
            window.retreatToBench(cpuTeam, bestBenchIdx);
            window.addLog(`🏃 電腦為保全核心戰力，消耗當回合能量緊急撤退，派遣 ${cpuTeam.pokemon[bestBenchIdx].name} 上場！`);
            activeP = cpuTeam.pokemon[cpuTeam.activeIdx];
            window.state.hasAttachedEnergyThisTurn = true;
            window.render();
          }
        }

        setTimeout(() => {
          if (!window.state.hasAttachedEnergyThisTurn) {
            const targetP = window.smartAttachEnergyToBestTarget(cpuTeam, drawnEnergy);
            window.addLog(`🤖 電腦抽取 [${window.getTypeName(drawnEnergy)}] 能量，附著給 ${targetP.name}。`);
            window.state.hasAttachedEnergyThisTurn = true;
            window.render();
          }

          setTimeout(() => {
            activeP = cpuTeam.pokemon[cpuTeam.activeIdx];
            window.runCpuBuffAndRecoveryPhase(cpuTeam, activeP);
            activeP = cpuTeam.pokemon[cpuTeam.activeIdx];

            setTimeout(() => {
              if (activeP.status.asleep) {
                window.addLog(`💤 電腦 ${activeP.name} 睡眠中，無法攻擊。`);
                setTimeout(window.processEndOfTurn, 900);
                return;
              }
              if (activeP.status.paralyze) {
                window.addLog(`⚡ 電腦 ${activeP.name} 麻痺中，無法攻擊。`);
                setTimeout(window.processEndOfTurn, 900);
                return;
              }
              if (activeP.status.cant_attack > 0) {
                window.addLog(`🚫 電腦 ${activeP.name} 受副作用影響無法攻擊。`);
                setTimeout(window.processEndOfTurn, 900);
                return;
              }

              const chosen = window.selectSmartAttack(activeP, window.state.teams[1].pokemon[window.state.teams[1].activeIdx]);
              if (chosen) {
                window.executeAttack(null, 2, chosen.idx);
              } else {
                window.addLog(`🤖 電腦能量不足，結束回合。`);
                setTimeout(window.processEndOfTurn, 900);
              }
            }, 600);
          }, 500);
        }, 550);
      }, 550);
    }, 600);
  }, 700);
};

// 6. 戰術干擾道具決策
window.runCpuTacticalTrainerPhase = function(cpuTeam) {
  let hand = cpuTeam.hand;
  const playerTeam = window.state.teams[1];
  const playerActive = playerTeam.pokemon[playerTeam.activeIdx];
  const cpuActive = cpuTeam.pokemon[cpuTeam.activeIdx];

  const swapIdx = hand.findIndex(c => c.cardType === 'trainer' && c.id === 'mystery_swap');
  if (swapIdx !== -1 && (cpuActive.currHp / cpuActive.hp) <= 0.25 && cpuActive.attachedEnergy.length === 0) {
    const currentIds = [...window.state.teams[1].pokemon, ...window.state.teams[2].pokemon].map(p => p.id);
    const candidates = window.CLOUD_POKEMON_DB.filter(p => !currentIds.includes(p.id) && !p.name.includes('超級') && !p.name.includes('超極巨') && !p.name.includes('極巨化'));
    if (candidates.length > 0) {
      const newP = candidates[Math.floor(Math.random() * candidates.length)];
      const oldName = cpuActive.name;
      cpuTeam.pokemon[cpuTeam.activeIdx] = {
        ...newP, currHp: newP.hp, attachedEnergy: [], uid: cpuActive.uid,
        status: { poison: false, paralyze: false, burn: false, asleep: false, confused: false, immune_next: false, reduce_dmg_20: false, reduce_dmg_30: false, reduce_dmg_50: false, cant_attack: 0, enemy_dmg_minus_30: 0, pending_buff_dmg: 0 },
        buff: { dmg: 0, turns: 0, hasFocusSash: false, potHelmet: 0, fullFaceGuard: 0 }, isDead: false, dynamax: { turns: 0, originalForm: null }, mega: { turns: 0, originalForm: null }, transformState: null
      };
      hand.splice(swapIdx, 1);
      window.addLog(`🎲 電腦殘血孤注一擲！使用「神秘置換」將 ${oldName} 替換為滿血的 ${newP.name}！`);
      window.render();
    }
  }

  const bossIdx = hand.findIndex(c => c.cardType === 'trainer' && c.id === 'boss_orders');
  const catcherIdx = hand.findIndex(c => c.cardType === 'trainer' && c.id === 'pokemon_catcher');

  if (bossIdx !== -1 || catcherIdx !== -1) {
    const isBoss = (bossIdx !== -1);
    const itemIdx = isBoss ? bossIdx : catcherIdx;

    let targetBenchIdx = -1;
    let bestKillIdx = -1;
    let maxAtkDmg = 0;
    cpuActive.attacks.forEach(atk => {
      if (window.canUseAttack(cpuActive, atk) && atk.d > maxAtkDmg) maxAtkDmg = atk.d;
    });

    playerTeam.pokemon.forEach((p, idx) => {
      if (idx !== playerTeam.activeIdx && p.currHp > 0) {
        let estDmg = maxAtkDmg;
        const pWeak = Array.isArray(p.weakness) ? p.weakness : [p.weakness];
        if (pWeak.includes(cpuActive.type)) estDmg = Math.floor(estDmg * 1.5);
        if (p.currHp <= estDmg && estDmg > 0) {
          bestKillIdx = idx;
        }
      }
    });

    if (bestKillIdx !== -1 && (playerActive.currHp > maxAtkDmg || playerTeam.lostLives >= 2)) {
      targetBenchIdx = bestKillIdx;
    }

    if (targetBenchIdx === -1) {
      const incomingDmg = window.calcPlayerDamageOnCpu(playerActive, cpuActive);
      if (incomingDmg >= cpuActive.currHp && incomingDmg > 0) {
        let weakTargetIdx = -1;
        let zeroEnergyIdx = -1;

        playerTeam.pokemon.forEach((p, idx) => {
          if (idx !== playerTeam.activeIdx && p.currHp > 0) {
            const pWeak = Array.isArray(p.weakness) ? p.weakness : [p.weakness];
            if (pWeak.includes(cpuActive.type)) weakTargetIdx = idx;
            if (p.attachedEnergy.length === 0) zeroEnergyIdx = idx;
          }
        });

        targetBenchIdx = (weakTargetIdx !== -1) ? weakTargetIdx : zeroEnergyIdx;
      }
    }

    if (targetBenchIdx !== -1) {
      hand.splice(itemIdx, 1);
      if (isBoss) {
        window.retreatToBench(playerTeam, targetBenchIdx);
        window.addLog(`📢 電腦發動「老大指令」！強制將玩家後備的 ${playerTeam.pokemon[targetBenchIdx].name} 拖上戰場！`);
      } else {
        const isHeads = Math.random() >= 0.5;
        if (isHeads) {
          window.retreatToBench(playerTeam, targetBenchIdx);
          window.addLog(`🥅 電腦使用「捕捉器」(正面成功)！強制將玩家後備的 ${playerTeam.pokemon[targetBenchIdx].name} 拖上戰場！`);
        } else {
          window.addLog(`🥅 電腦使用「捕捉器」(反面失效)！`);
        }
      }
      window.render();
    }
  }
};

// 7. 資源、補血、防具與爆發道具決策 (痛苦平分與傷藥連動防呆)
window.runCpuBuffAndRecoveryPhase = function(cpuTeam, activeP) {
  let hand = cpuTeam.hand;
  const playerActive = window.state.teams[1].pokemon[window.state.teams[1].activeIdx];

  const energySearchIdx = hand.findIndex(c => c.cardType === 'trainer' && c.id === 'energy_search');
  if (energySearchIdx !== -1 && hand.length < 6) {
    hand.splice(energySearchIdx, 1);
    const eType1 = window.getSmartEnergyType(cpuTeam);
    const eType2 = window.getSmartEnergyType(cpuTeam);
    hand.push({ cardType: 'energy', type: eType1 });
    hand.push({ cardType: 'energy', type: eType2 });
    window.addLog(`🔍 電腦使用「能量搜索」，檢索了 2 張能量卡加入手牌！`);
  }

  const stretcherIdx = hand.findIndex(c => c.cardType === 'trainer' && c.id === 'rescue_stretcher');
  if (stretcherIdx !== -1) {
    const deadMonIdx = cpuTeam.pokemon.findIndex(p => p.currHp <= 0);
    if (deadMonIdx !== -1) {
      const deadP = cpuTeam.pokemon[deadMonIdx];
      deadP.currHp = Math.ceil(deadP.hp / 2);
      deadP.isDead = false;
      hand.splice(stretcherIdx, 1);
      window.addLog(`🚑 電腦使用了「擔架」，復活了 ${deadP.name} 並恢復半血！`);
    }
  }

  const profIdx = hand.findIndex(c => c.cardType === 'trainer' && c.id === 'prof_research');
  if (profIdx !== -1 && hand.length <= 2) {
    hand.splice(0, hand.length);
    const tDB = window.CLOUD_TRAINERS_DB || (typeof TRAINERS_DB !== 'undefined' ? TRAINERS_DB : []);
    for (let i = 0; i < 2; i++) {
      if (tDB.length > 0) hand.push({ cardType: 'trainer', ...tDB[Math.floor(Math.random() * tDB.length)] });
    }
    window.addLog(`🔬 電腦發動「博士研究」，重組手牌獲得新道具！`);
  }

  const recyclerIdx = hand.findIndex(c => c.cardType === 'trainer' && c.id === 'lucky_recycler');
  if (recyclerIdx !== -1 && hand.length >= 2) {
    let discardIdx = (recyclerIdx === 0) ? 1 : 0;
    for (let i = 0; i < hand.length; i++) {
      if (i === recyclerIdx) continue;
      const card = hand[i];
      if ((card.id === 'pot_helmet' && activeP.hp >= 100) || (card.id === 'focus_sash' && activeP.hp > 120) || card.cardType === 'energy') {
        discardIdx = i; break;
      }
    }
    const discardedCard = hand[discardIdx];
    const maxIdx = Math.max(recyclerIdx, discardIdx);
    const minIdx = Math.min(recyclerIdx, discardIdx);
    hand.splice(maxIdx, 1);
    hand.splice(minIdx, 1);

    const tDB = window.CLOUD_TRAINERS_DB || (typeof TRAINERS_DB !== 'undefined' ? TRAINERS_DB : []);
    const pool = ["potion", "super_potion", "full_heal", "switch", "muscle_band", "focus_sash", "full_face_guard", "boss_orders"];
    const chosenId = pool[Math.floor(Math.random() * pool.length)];
    const newItem = tDB.find(t => t.id === chosenId) || { id: chosenId, name: "實用道具", icon: "🎁" };

    hand.push({ cardType: 'trainer', ...newItem });
    window.addLog(`🎰 電腦獻祭了「${discardedCard.name || '手牌'}」，幸運回收獲得「${newItem.name}」！`);
  }

  const sashIdx = hand.findIndex(c => c.cardType === 'trainer' && c.id === 'focus_sash');
  if (sashIdx !== -1 && activeP.hp <= 120 && !activeP.buff.hasFocusSash) {
    activeP.buff.hasFocusSash = true;
    window.addLog(`🎗️ 電腦為 ${activeP.name} 裝備了氣勢披帶！`);
    hand.splice(sashIdx, 1);
  }

  // 🌟 核心修正5：傷藥與痛苦平分連動防呆 (若唯一能放的招式是痛苦平分且能吸血，暫不喝藥)
  const healIdx = hand.findIndex(c => c.cardType === 'trainer' && (c.id === 'potion' || c.id === 'super_potion'));
  if (healIdx !== -1) {
    const item = hand[healIdx];
    const healVal = item.id === 'potion' ? 30 : 50;

    let willUsePainSplitProfit = false;
    const canUseAttacks = activeP.attacks.filter(atk => window.canUseAttack(activeP, atk));
    if (canUseAttacks.length === 1 && canUseAttacks[0].special === 'pain_split') {
      if (playerActive.currHp > activeP.currHp + 20) {
        willUsePainSplitProfit = true; // 留著殘血直接平分更賺
      }
    }

    if (!willUsePainSplitProfit && activeP.currHp <= activeP.hp - healVal) {
      const oldHp = activeP.currHp;
      activeP.currHp = Math.min(activeP.hp, activeP.currHp + healVal);
      window.showHeal(activeP.uid, activeP.currHp - oldHp);
      window.addLog(`💊 電腦使用了「${item.name}」，回復了 ${activeP.currHp - oldHp} HP！`);
      hand.splice(healIdx, 1);
    }
  }

  const fullHealIdx = hand.findIndex(c => c.cardType === 'trainer' && c.id === 'full_heal');
  if (fullHealIdx !== -1 && (activeP.status.asleep || activeP.status.paralyze || activeP.status.confused || activeP.status.poison || activeP.status.burn)) {
    activeP.status.asleep = activeP.status.paralyze = activeP.status.confused = activeP.status.poison = activeP.status.burn = false;
    if (window.FX && window.FX.clearStatusFX) window.FX.clearStatusFX(activeP.uid);
    window.addLog(`🌿 電腦使用了「萬能藥」，解除了異常狀態！`);
    hand.splice(fullHealIdx, 1);
  }

  const guardIdx = hand.findIndex(c => c.cardType === 'trainer' && (c.id === 'full_face_guard' || c.id === 'pot_helmet'));
  if (guardIdx !== -1) {
    const item = hand[guardIdx];
    if (item.id === 'pot_helmet' && activeP.hp < 100 && activeP.buff.potHelmet <= 0) {
      activeP.buff.potHelmet = 3;
      if (window.FX && window.FX.triggerShieldFX) window.FX.triggerShieldFX(activeP.uid);
      window.addLog(`🪖 電腦為 ${activeP.name} 裝備了鍋型頭盔！`);
      hand.splice(guardIdx, 1);
    } else if (item.id === 'full_face_guard' && activeP.buff.fullFaceGuard <= 0) {
      activeP.buff.fullFaceGuard = 4;
      if (window.FX && window.FX.triggerShieldFX) window.FX.triggerShieldFX(activeP.uid);
      window.addLog(`🛡️ 電腦為 ${activeP.name} 裝備了全罩防守！`);
      hand.splice(guardIdx, 1);
    }
  }

  const hasUsableAttack = activeP.attacks.some(atk => window.canUseAttack(activeP, atk));

  const rouletteIdx = hand.findIndex(c => c.cardType === 'trainer' && c.id === 'power_roulette');
  if (rouletteIdx !== -1 && hasUsableAttack) {
    const powerPool = [5, 10, 15, 20, 30];
    const randPower = powerPool[Math.floor(Math.random() * powerPool.length)];
    activeP.buff.dmg += randPower;
    activeP.buff.turns = Math.max(activeP.buff.turns, 1);
    if (window.FX && window.FX.triggerBuff) window.FX.triggerBuff(activeP.uid);
    window.addLog(`🎡 電腦轉動了力量輪盤！${activeP.name} 本回合攻擊力爆發 +${randPower}！`);
    hand.splice(rouletteIdx, 1);
  }

  const bandIdx = hand.findIndex(c => c.cardType === 'trainer' && c.id === 'muscle_band');
  if (bandIdx !== -1 && hasUsableAttack && activeP.buff.turns <= 0) {
    activeP.buff.dmg = 20;
    activeP.buff.turns = 2;
    if (window.FX && window.FX.triggerBuff) window.FX.triggerBuff(activeP.uid);
    window.addLog(`💪 電腦評估具備出招能力，為 ${activeP.name} 裝備了力量頭帶！`);
    hand.splice(bandIdx, 1);
  }

  const megaIdx = hand.findIndex(c => c.cardType === 'trainer' && c.id === 'mega_stone');
  if (megaIdx !== -1 && !cpuTeam.usedMega && activeP.megaId && hasUsableAttack && activeP.currHp > 50) {
    window.state.selectedHandItem = { index: megaIdx, data: hand[megaIdx] };
    window.useTrainerCard(2, cpuTeam.activeIdx);
  }
  const gmaxIdx = hand.findIndex(c => c.cardType === 'trainer' && c.id === 'dynamax_band');
  if (gmaxIdx !== -1 && !cpuTeam.usedDynamax && activeP.gmaxId && hasUsableAttack) {
    window.state.selectedHandItem = { index: gmaxIdx, data: hand[gmaxIdx] };
    window.useTrainerCard(2, cpuTeam.activeIdx);
  }

  window.render();
};

// 8. 智慧選招系統：加入負評分防自殘檢查
window.selectSmartAttack = function(activeP, playerActive) {
  const readyAttacks = [];
  activeP.attacks.forEach((atk, idx) => {
    if (window.canUseAttack(activeP, atk)) {
      readyAttacks.push({ atk, idx });
    }
  });

  if (readyAttacks.length === 0) return null;

  const playerTeam = window.state.teams[1];
  const cpuTeam = window.state.teams[2];

  function evaluateAttack(atk) {
    let dmg = atk.d;
    const sp = atk.special || '';

    if (sp === 'hex_damage_40' && (playerActive.status.poison || playerActive.status.burn || playerActive.status.asleep || playerActive.status.confused || playerActive.status.paralyze)) {
      dmg += 40;
    }
    if (sp.startsWith('red_hp_burst_') && (activeP.currHp / activeP.hp) < 0.3) {
      dmg += parseInt(sp.split('_').pop()) || 30;
    }
    if (sp.startsWith('plus_dmg_if_status_') && (activeP.status.poison || activeP.status.burn || activeP.status.asleep || activeP.status.confused || activeP.status.paralyze)) {
      dmg += parseInt(sp.split('_').pop()) || 30;
    }
    if (sp === 'plus_dmg_per_extra_energy_10') {
      dmg += Math.max(0, activeP.attachedEnergy.length - atk.cost.length) * 10;
    }
    if (sp.startsWith('flip_') && sp.includes('x')) {
      const times = parseInt(sp.split('_')[1]) || 2;
      const mult = parseInt(sp.split('x')[1]) || 20;
      dmg = Math.floor(times * 0.5 * mult);
    }

    if (dmg > 0) {
      if (activeP.buff && activeP.buff.turns > 0) dmg += activeP.buff.dmg;
      const playerWeakness = Array.isArray(playerActive.weakness) ? playerActive.weakness : [playerActive.weakness];
      if (playerWeakness.includes(activeP.type)) dmg = Math.floor(dmg * 1.5);
      if (sp !== 'ignore_resistance' && (playerActive.resistance.type === activeP.type || playerActive.resistance.type === 'any')) {
        dmg -= playerActive.resistance.val;
      }
    }
    dmg = Math.max(0, dmg);

    let score = dmg;

    // 🌟 核心修正6：痛苦平分嚴格效益計算 (若平分會自損血，評分設為 -999，絕不施放)
    if (sp === 'pain_split') {
      let expectedAvg = Math.ceil((activeP.currHp + playerActive.currHp) / 2);
      let selfHpDiff = expectedAvg - activeP.currHp;
      let enemyHpDiff = playerActive.currHp - expectedAvg;
      if (selfHpDiff > 0 && enemyHpDiff > 0) {
        score = selfHpDiff * 1.5 + enemyHpDiff;
      } else {
        score = -999; // 自己扣血或對方回血時，嚴禁施放！
      }
    }
    if (sp === 'heal_choose_50' || sp === 'heal_choose_70') {
      const needHeal = cpuTeam.pokemon.some(p => p.currHp > 0 && (p.hp - p.currHp) >= 30);
      score = needHeal ? 65 : -999;
    }
    if (sp === 'aoe_10' || sp === 'aoe_20') {
      const aoeVal = sp === 'aoe_20' ? 20 : 10;
      playerTeam.pokemon.forEach((p, idx) => {
        if (idx !== playerTeam.activeIdx && p.currHp > 0) {
          score += aoeVal;
          if (p.currHp <= aoeVal) score += 80;
        }
      });
    }
    if (sp === 'asleep' && !playerActive.status.asleep) score += 25;
    if (sp === 'poison' && !playerActive.status.poison) score += 20;
    if (sp === 'confuse' && !playerActive.status.confused) score += 20;

    return { estDmg: dmg, score: score };
  }

  const killAttacks = [];
  const scoredAttacks = [];

  readyAttacks.forEach(a => {
    const { estDmg, score } = evaluateAttack(a.atk);
    if (estDmg >= playerActive.currHp) {
      killAttacks.push({ ...a, estDmg });
    }
    scoredAttacks.push({ ...a, estDmg, score });
  });

  if (killAttacks.length > 0) {
    const safeKill = killAttacks.find(a => {
      const sp = a.atk.special || '';
      return !sp.includes('self_dmg') && !sp.includes('discard_') && !sp.includes('cant_act');
    });
    return safeKill || killAttacks[0];
  }

  scoredAttacks.sort((a, b) => b.score - a.score);

  // 🌟 核心防呆：若最佳招式分數仍為負值 (如痛苦平分自殘)，寧可不出招結束回合
  if (scoredAttacks[0] && scoredAttacks[0].score < 0) {
    return null;
  }

  return scoredAttacks[0];
};
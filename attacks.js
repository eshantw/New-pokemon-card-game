// ==========================================
// ⚔️ 寶可夢招式特殊效果庫 & 場地環境引擎 (attacks.js)
// ==========================================

window.AttackEffects = {
  // ☠️ 中毒相關
  'poison': (attacker, defender, log) => { 
    defender.status.poison = true; 
    log.text += ` ☠️ 對手中毒！`; 
  },
  'poison_flip': (attacker, defender, log, coinResult) => { 
    if (coinResult) { 
      defender.status.poison = true; 
      log.text += ` ☠️ 對手中毒！`; 
    } 
  },

  // 🔥 灼傷相關 (雨天環境下免疫灼傷)
  'burn': (attacker, defender, log) => { 
    if (window.state && window.state.currentStadium === 'rain') {
      log.text += ` (🌧️ 雨天暴雨澆熄了火苗，免疫灼傷！)`;
      return;
    }
    defender.status.burn = true; 
    log.text += ` 🔥 對手灼傷！`; 
  },
  'burn_flip': (attacker, defender, log, coinResult) => { 
    if (coinResult) { 
      if (window.state && window.state.currentStadium === 'rain') {
        log.text += ` (🌧️ 雨天暴雨澆熄了火苗，免疫灼傷！)`;
        return;
      }
      defender.status.burn = true; 
      log.text += ` 🔥 對手灼傷！`; 
    } 
  },

  // 💤 睡眠相關 (電氣場地下免疫睡眠)
  'asleep': (attacker, defender, log) => { 
    if (window.state && window.state.currentStadium === 'electric') {
      log.text += ` (⚡ 電氣力場轟鳴，免疫睡眠！)`;
      return;
    }
    defender.status.asleep = true; 
    log.text += ` 💤 對手睡眠！`; 
  },
  'asleep_flip': (attacker, defender, log, coinResult) => { 
    if (coinResult) { 
      if (window.state && window.state.currentStadium === 'electric') {
        log.text += ` (⚡ 電氣力場轟鳴，免疫睡眠！)`;
        return;
      }
      defender.status.asleep = true; 
      log.text += ` 💤 對手睡眠！`; 
    } 
  },
  'asleep_self': (attacker, defender, log) => { 
    if (window.state && window.state.currentStadium === 'electric') {
      log.text += ` (⚡ 電氣場地使自己無法入睡，副作用無效！)`;
      return;
    }
    attacker.status.asleep = true; 
    log.text += ` 💤 副作用：自己陷入睡眠！`; 
  },

  // ❄️ 凍結相關
  'freeze_flip': (attacker, defender, log, coinResult) => {
    if (coinResult) {
      defender.status.frozen = true;
      defender.status.frozenTurns = 3;
      log.text += ` ❄️ 極寒凍結！對手陷入凍結狀態(3回合)！`; 
    }
  },

  // 💫 混亂與麻痺相關
  'confuse': (attacker, defender, log) => { defender.status.confused = true; log.text += ` 💫 對手混亂！`; },
  'confuse_flip': (attacker, defender, log, coinResult) => { if (coinResult) { defender.status.confused = true; log.text += ` 💫 對手混亂！`; } },
  'confuse_self_flip': (attacker, defender, log, coinResult) => { if (!coinResult) { attacker.status.confused = true; log.text += ` 💫 副作用：自己陷入混亂！`; } },
  'paralyze_flip': (attacker, defender, log, coinResult) => { if (coinResult) { defender.status.paralyze = true; log.text += ` ⚡ 對手麻痺！`; } },
  
  // 🌟 異常狀態增傷
  'hex_damage_40': (attacker, defender, log, coinResult, baseDmg) => { 
    const hasS = defender.status.poison || defender.status.burn || defender.status.asleep || defender.status.confused || defender.status.paralyze || defender.status.frozen; 
    if(hasS) { log.text += ` (禍不單行追加 40 傷害！)`; return baseDmg + 40; } 
    return baseDmg; 
  },
  'plus_dmg_if_status_30': (attacker, defender, log, coinResult, baseDmg) => { 
    const hasS = attacker.status.poison || attacker.status.burn || defender.status.asleep || defender.status.confused || attacker.status.paralyze || defender.status.frozen; 
    if(hasS) { log.text += ` (潛能激發追加 30 傷害！)`; return baseDmg + 30; } 
    return baseDmg; 
  },
  'plus_dmg_if_status_40': (attacker, defender, log, coinResult, baseDmg) => { 
    const hasS = attacker.status.poison || attacker.status.burn || defender.status.asleep || defender.status.confused || attacker.status.paralyze || defender.status.frozen; 
    if(hasS) { log.text += ` (潛能激發追加 40 傷害！)`; return baseDmg + 40; } 
    return baseDmg; 
  },

  // ⚖️ 體力重新分配與治療
  'pain_split': (attacker, defender, log) => {
    let avg = Math.ceil((attacker.currHp + defender.currHp) / 2);
    let newAttackerHp = Math.min(attacker.hp, avg);
    let newDefenderHp = Math.min(defender.hp, avg);
    let attackerDiff = newAttackerHp - attacker.currHp;
    let defenderDiff = newDefenderHp - defender.currHp;
    attacker.currHp = newAttackerHp;
    if (attackerDiff > 0) window.showHeal(attacker.uid, attackerDiff); else if (attackerDiff < 0) window.showDamage(attacker.uid, Math.abs(attackerDiff));
    defender.currHp = newDefenderHp;
    if (defenderDiff > 0) window.showHeal(defender.uid, defenderDiff); else if (defenderDiff < 0) window.showDamage(defender.uid, Math.abs(defenderDiff));
    log.text += ` ⚖️ 發動分擔痛楚，雙方生命值重新分配！`;
  },

  'heal_self_20': (attacker, defender, log) => { attacker.currHp = Math.min(attacker.hp, attacker.currHp + 20); window.showHeal(attacker.uid, 20); log.text += ` 💚 恢復了 20 HP！`; },
  'heal_self_30': (attacker, defender, log) => { attacker.currHp = Math.min(attacker.hp, attacker.currHp + 30); window.showHeal(attacker.uid, 30); log.text += ` 💚 恢復了 30 HP！`; },
  
  'heal_all_allies_30': (attacker, defender, log) => { 
    const myTeam = window.state.teams[window.state.currentTeam];
    myTeam.pokemon.forEach(p => { 
      if (p.currHp > 0) {
        let oldHp = p.currHp;
        p.currHp = Math.min(p.hp, p.currHp + 30); 
        if(p.currHp > oldHp) window.showHeal(p.uid, p.currHp - oldHp);
      }
    });
    log.text += ` 💚 聖光發動！我方全體恢復 HP！`; 
  },

  // 💥 紅血爆發
  'red_hp_burst_30': (attacker, defender, log, coinResult, baseDmg) => { 
    if ((attacker.currHp / attacker.hp) < 0.3) { log.text += ` (💥紅血爆發，傷害+30！)`; return baseDmg + 30; } 
    return baseDmg; 
  },
  'red_hp_burst_40': (attacker, defender, log, coinResult, baseDmg) => { if ((attacker.currHp / attacker.hp) < 0.3) { log.text += ` (💥紅血爆發，傷害+40！)`; return baseDmg + 40; } return baseDmg; },
  'red_hp_burst_50': (attacker, defender, log, coinResult, baseDmg) => { if ((attacker.currHp / attacker.hp) < 0.3) { log.text += ` (💥紅血爆發，傷害+50！)`; return baseDmg + 50; } return baseDmg; },
  'red_hp_burst_60': (attacker, defender, log, coinResult, baseDmg) => { if ((attacker.currHp / attacker.hp) < 0.3) { log.text += ` (💥紅血爆發，傷害+60！)`; return baseDmg + 60; } return baseDmg; },
  
  // ⚡ 能量加成
  'plus_dmg_per_extra_energy_10': (attacker, defender, log, coinResult, baseDmg, atk) => { 
    let extraCount = Math.max(0, attacker.attachedEnergy.length - atk.cost.length);
    let added = extraCount * 10;
    if (added > 0) log.text += ` (額外 ${extraCount} 能量追加 ${added} 傷害！)`; 
    return baseDmg + added; 
  },

  // 🛡️ 傷害減免與自傷副作用
  'self_dmg_20': (attacker, defender, log) => { attacker.currHp = Math.max(0, attacker.currHp - 20); window.showDamage(attacker.uid, 20); log.text += ` (副作用：自傷 20)`; },
  'self_dmg_30': (attacker, defender, log) => { attacker.currHp = Math.max(0, attacker.currHp - 30); window.showDamage(attacker.uid, 30); log.text += ` (副作用：自傷 30)`; },
  'cant_act_next': (attacker, defender, log) => { attacker.status.cant_attack = 2; log.text += ` (下回禁攻)`; },
  'cant_act_next_and_discard_1': (attacker, defender, log) => { attacker.status.cant_attack = 2; if(attacker.attachedEnergy.length > 0) attacker.attachedEnergy.pop(); log.text += ` (下回禁攻且棄 1 能)`; },
  'seal_both_discard': (attacker, defender, log) => { defender.status.cant_attack = 1; if(attacker.attachedEnergy.length > 0) attacker.attachedEnergy.pop(); if(defender.attachedEnergy.length > 0) defender.attachedEnergy.pop(); log.text += ` (雙方棄能，敵禁攻)`; },
  'immune_next_flip': (attacker, defender, log, coinResult) => { if(coinResult) { attacker.status.immune_next = true; log.text += ` (下回免傷)`; } },
  'reduce_dmg_taken_20': (attacker, defender, log) => { attacker.status.reduce_dmg_20 = true; log.text += ` (下回受傷-20)`; },
  'reduce_dmg_taken_30': (attacker, defender, log) => { attacker.status.reduce_dmg_30 = true; },
  'reduce_dmg_taken_50': (attacker, defender, log) => { attacker.status.reduce_dmg_50 = true; },
  'reduce_dmg_taken_flip': (attacker, defender, log, coinResult) => { if(coinResult) { attacker.status.reduce_dmg_30 = true; log.text += ` (受傷-30)`; } },
  'reduce_dmg_taken_flip_30': (attacker, defender, log, coinResult) => { if(coinResult) { attacker.status.reduce_dmg_30 = true; log.text += ` (受傷-30)`; } },
  'enemy_dmg_minus_30': (attacker, defender, log) => { defender.status.enemy_dmg_minus_30 = 2; },
  
  'calm_mind_20': (attacker, defender, log) => { 
    attacker.status.pending_buff_dmg = 20;
    attacker.status.reduce_dmg_20 = true; 
    log.text += ` (冥想發動：下回攻擊+20，且目前受傷-20)`;
  },

  'seal_attack': (attacker, defender, log) => { defender.status.cant_attack = 1; if(attacker.attachedEnergy.length > 0) attacker.attachedEnergy.pop(); },
  'discard_1_fire': (attacker, defender, log) => { let r=0; attacker.attachedEnergy = attacker.attachedEnergy.filter(e => { if((e==='fire'||e==='rainbow') && r<1) { r++; return false; } return true; }); },
  'discard_2_fire': (attacker, defender, log) => { let r=0; attacker.attachedEnergy = attacker.attachedEnergy.filter(e => { if((e==='fire'||e==='rainbow') && r<2) { r++; return false; } return true; }); },
  'discard_enemy_energy': (attacker, defender, log) => { if(defender.attachedEnergy.length > 0) defender.attachedEnergy.pop(); },
  'discard_enemy_energy_flip': (attacker, defender, log, coinResult) => { if(coinResult && defender.attachedEnergy.length > 0) defender.attachedEnergy.pop(); },
  'discard_1_elec_and_paralyze': (attacker, defender, log) => { let r=false; attacker.attachedEnergy = attacker.attachedEnergy.filter(e => { if((e==='electric'||e==='rainbow') && !r) { r=true; return false; } return true; }); defender.status.paralyze = true; log.text += ` ⚡ 麻痺！`; },
  'ignore_resistance': (attacker, defender, log, coinResult, baseDmg) => { log.text += ` (無視對手防禦)`; return baseDmg; },
  'damage_flip_20': (attacker, defender, log, coinResult, baseDmg) => { if(coinResult) { log.text += ' (+20傷害！)'; return baseDmg + 20; } return baseDmg; },
  'damage_flip_25': (attacker, defender, log, coinResult, baseDmg) => { if(coinResult) { log.text += ' (+25傷害！)'; return baseDmg + 25; } return baseDmg; },
  'damage_flip_30': (attacker, defender, log, coinResult, baseDmg) => { if(coinResult) { log.text += ' (+30傷害！)'; return baseDmg + 30; } return baseDmg; },

  'discard_1_any': (attacker, defender, log) => {
    if(attacker.attachedEnergy.length > 0) { attacker.attachedEnergy.pop(); log.text += ` (自棄 1 能量)`; }
  },
  'discard_2_any': (attacker, defender, log) => {
    let count = 0;
    while(attacker.attachedEnergy.length > 0 && count < 2) { attacker.attachedEnergy.pop(); count++; }
    if(count > 0) log.text += ` (自棄 ${count} 能量)`;
  },

  'aoe_20': (attacker, defender, log) => { log.text += ` (波及對手全體後備 20 傷害！)`; },
  'aoe_10': (attacker, defender, log) => { log.text += ` (波及對手全體後備 10 傷害！)`; }
};

// ==========================================
// 🌍 獨立場地與天氣系統引擎 (StadiumEngine)
// ==========================================
window.StadiumEngine = {
  // 1. 打出場地卡 (設定 6 個半回合 = 3 個完整大回合)
  playCard(cardIndex, teamNum) {
    const team = window.state.teams[teamNum];
    const card = team.hand[cardIndex];
    if (!card) return;

    const sKey = card.key || card.stadiumKey || (window.STADIUM_CARDS_DEF && window.STADIUM_CARDS_DEF[card.id] ? (window.STADIUM_CARDS_DEF[card.id].key || window.STADIUM_CARDS_DEF[card.id].stadiumKey) : null);

    team.hand.splice(cardIndex, 1);
    window.state.currentStadium = sKey;
    window.state.stadiumHalfTurns = 6; 

    const tName = window.state.teamNames[teamNum];
    window.addLog(`🌍 ${tName} 打出了場地卡【${card.name}】！(持續 3 大回合) 全場環境已改變！`);

    // 雨天：立刻清除全場灼傷
    if (sKey === 'rain') {
      [1, 2].forEach(t => {
        window.state.teams[t].pokemon.forEach(p => {
          if (p && p.status && p.status.burn) {
            p.status.burn = false;
            if (window.FX && window.FX.clearStatusFX) window.FX.clearStatusFX(p.uid);
          }
        });
      });
      window.addLog(`🌧️ 暴雨傾盆！全場寶可夢的灼傷狀態全數熄滅！`);
    }

    // 電氣場地：立刻喚醒全場睡眠
    if (sKey === 'electric') {
      [1, 2].forEach(t => {
        window.state.teams[t].pokemon.forEach(p => {
          if (p && p.status && p.status.asleep) {
            p.status.asleep = false;
            if (window.FX && window.FX.clearStatusFX) window.FX.clearStatusFX(p.uid);
          }
        });
      });
      window.addLog(`⚡ 電氣力場轟鳴！全場所有睡眠中的寶可夢都被震醒了！`);
    }

    this.updateVisual();
    if (typeof window.render === 'function') window.render();
  },

  // 2. 更新中央寶可球徽章 (格式：☀️ 晴天(3))
  updateVisual() {
    const badge = document.getElementById('stadium-badge');
    if (!badge) return;
    if (!window.state.currentStadium || window.state.stadiumHalfTurns <= 0 || !window.STADIUMS_DB) {
      badge.style.display = 'none';
      return;
    }
    const sData = window.STADIUMS_DB.find(s => s.key === window.state.currentStadium || s.stadiumKey === window.state.currentStadium);
    if (!sData) { badge.style.display = 'none'; return; }

    const displayColor = sData.color || sData.badgeColor || '#00f2ff';
    const bigTurnsRemaining = Math.ceil(window.state.stadiumHalfTurns / 2);
    badge.textContent = `${sData.icon} ${sData.name}(${bigTurnsRemaining})`;
    badge.style.display = 'block';
    badge.style.background = 'rgba(10, 14, 22, 0.88)';
    badge.style.border = `2px solid ${displayColor}`;
    badge.style.color = displayColor;
    badge.style.textShadow = `0 0 8px ${displayColor}`;
  },

  // 3. 點擊檢視當前場地說明
  inspectCurrent() {
    if (!window.state.currentStadium || !window.STADIUMS_DB) return;
    const sData = window.STADIUMS_DB.find(s => s.key === window.state.currentStadium || s.stadiumKey === window.state.currentStadium);
    if (sData) {
      const bigTurnsRemaining = Math.ceil(window.state.stadiumHalfTurns / 2);
      window.showAlert(`🌍 【當前生效場地】\n${sData.icon} ${sData.fullName || sData.name} (剩餘 ${bigTurnsRemaining} 回合)\n\n💡 戰術效果：\n${sData.desc}`);
    }
  },

  // 4. 計算場地對傷害的加減益
  applyDamageMod(attacker, dmg, log) {
    const curStadium = window.state.currentStadium;
    if (curStadium === 'sun') {
      if (attacker.type === 'fire') { dmg += 10; log.text += ` (☀️晴天火傷+10)`; }
      if (attacker.type === 'water') { dmg = Math.max(0, dmg - 10); log.text += ` (☀️晴天水傷-10)`; }
    } else if (curStadium === 'rain') {
      if (attacker.type === 'fire') { dmg = Math.max(0, dmg - 20); log.text += ` (🌧️雨天火傷-20)`; }
    } else if (curStadium === 'electric') {
      if (attacker.type === 'electric') { dmg += 20; log.text += ` (⚡電場電傷+20)`; }
    }
    return dmg;
  },

  // 5. 攻擊命中後的場地特殊效果 (雨天導電後備打擊、草場睡眠、冰雪凍結)
  applyOnHitEffects(attacker, defender, enemyTeam, stadiumFlipResult, currentTargetStatus, log) {
    const curStadium = window.state.currentStadium;
    let targetStatus = currentTargetStatus;

    // 🌧️ 雨天：雷屬攻擊擲幣正面 ➔ 對手全體後備 10 傷害 + 電擊特效
    if (curStadium === 'rain' && attacker.type === 'electric') {
      if (Math.random() < 0.5) {
        window.addLog(`⚡ 雨天導電！暴雨使對手備戰全員各受 10 點濺射傷害！`);
        enemyTeam.pokemon.forEach((p, idx) => {
          if (idx !== enemyTeam.activeIdx && p.currHp > 0) {
            p.currHp = Math.max(0, p.currHp - 10);
            const pEl = document.getElementById(p.uid);
            if (pEl && window.FX) {
              const pRect = pEl.getBoundingClientRect();
              window.FX.triggerHit(pRect.left + pRect.width / 2, pRect.top + pRect.height / 2, 'electric', 10, 'light');
              window.showDamage(p.uid, 10);
            }
            if (p.currHp <= 0 && !p.isDead) {
              p.isDead = true;
              enemyTeam.lostLives++;
              if (window.FX && window.FX.clearStatusFX) window.FX.clearStatusFX(p.uid);
              log.text += ` 💀 後備 ${p.name} 氣絕！`; 
            }
          }
        });
      }
    }

    // 🍃 青草原野：硬幣正面使對手睡眠
    if (curStadium === 'grass' && attacker.type === 'grass' && curStadium !== 'electric') {
      if (stadiumFlipResult === true) {
        defender.status.asleep = true;
        targetStatus = 'asleep';
        window.addLog(`🍃 青草原野花粉爆發！硬幣正面，${defender.name} 陷入睡眠狀態！`);
      } else if (stadiumFlipResult === false) {
        window.addLog(`🍃 青草原野硬幣反面，花粉催眠未生效。`);
      }
    }

    // ❄️ 冰雪場地：依硬幣彈窗結果判定凍結 (持續自己 3 回合)
    if (curStadium === 'snow' && attacker.type === 'water') {
      if (stadiumFlipResult === true) {
        defender.status.frozen = true;
        defender.status.frozenTurns = 3;
        targetStatus = 'frozen';
        window.addLog(`❄️ 極寒凍結！硬幣正面，${defender.name} 陷入凍結狀態！（無法攻擊與撤退，扣血 3 次後解凍）`);
      } else if (stadiumFlipResult === false) {
        window.addLog(`❄️ 冰雪場地硬幣反面，未觸發凍結。`);
      }
    }

    return targetStatus;
  },

  // 6. 回合結束時的凍結與場地結算 (回傳是否有寶可夢因此氣絕)
  processEndTurnTeam(t, activeP) {
    let died = false;
    const curStadium = window.state.currentStadium;

    // ❄️ 凍結狀態結算：扣血 3 次（30 HP）自動解凍
    if (activeP && activeP.currHp > 0 && activeP.status.frozen && t === window.state.currentTeam) {
      activeP.currHp = Math.max(0, activeP.currHp - 10);
      window.showDamage(activeP.uid, 10);
      if (window.FX && window.FX.triggerStatusFX) {
        window.FX.triggerStatusFX(activeP.uid, 'frozen');
      }
      activeP.status.frozenTurns--;
      window.addLog(`❄️ ${activeP.name} 受到 10 點凍結低溫傷害！(剩餘 ${activeP.status.frozenTurns} 次)`);
      if (activeP.status.frozenTurns <= 0) {
        activeP.status.frozen = false;
        activeP.status.frozenTurns = 0;
        window.addLog(`❄️ ${activeP.name} 身上的冰層徹底碎裂解凍！`);
      }
      if (activeP.currHp <= 0 && !activeP.isDead) {
        activeP.isDead = true;
        window.state.teams[t].lostLives++;
        if (window.FX && window.FX.clearStatusFX) window.FX.clearStatusFX(activeP.uid);
        died = true;
        window.addLog(`💀 ${activeP.name} 氣絕！`);
      }
    }

    // ☀️ 晴天：草屬性每回合結束恢復 10 HP
    if (curStadium === 'sun' && t === window.state.currentTeam) {
      window.state.teams[t].pokemon.forEach(p => {
        if (p.currHp > 0 && p.type === 'grass' && p.currHp < p.hp) {
          const healAmt = Math.min(10, p.hp - p.currHp);
          p.currHp += healAmt;
          window.showHeal(p.uid, healAmt);
          window.addLog(`☀️ 晴天光合作用！${p.name} 回復了 ${healAmt} HP！`);
        }
      });
    }

    // 🟣 幽暗沼澤：除了草與紫屬性，整隊備戰席每回合結束均受到劇毒侵蝕扣 10 HP (帶中毒特效)
    if (curStadium === 'swamp' && t === window.state.currentTeam) {
      let swampCount = 0;
      window.state.teams[t].pokemon.forEach(p => {
        if (p.currHp > 0 && p.type !== 'grass' && p.type !== 'purple') {
          p.currHp = Math.max(0, p.currHp - 10);
          window.showDamage(p.uid, 10);
          if (window.FX && window.FX.triggerStatusFX) window.FX.triggerStatusFX(p.uid, 'poison');
          swampCount++;
          if (p.currHp <= 0 && !p.isDead) {
            p.isDead = true;
            window.state.teams[t].lostLives++;
            if (window.FX && window.FX.clearStatusFX) window.FX.clearStatusFX(p.uid);
            died = true;
            window.addLog(`💀 幽暗沼澤毒氣侵蝕！${p.name} 氣絕！`);
          }
        }
      });
      if (swampCount > 0) {
        window.addLog(`🟣 幽暗沼澤劇毒瀰漫！侵蝕了整支隊伍！`);
      }
    }

    return died;
  },

  // 7. 推進場地半回合倒數 (6次半回合 = 3個完整大回合)
  tickTurnCounter() {
    if (window.state.currentStadium && window.state.stadiumHalfTurns > 0) {
      window.state.stadiumHalfTurns--;
      if (window.state.stadiumHalfTurns === 0) {
        window.addLog(`🌍 場地效果已消散，戰場恢復平靜！`);
        window.state.currentStadium = null;
      }
      this.updateVisual();
    }
  }
};

// 保持與舊程式碼相容的捷徑呼叫
window.playStadiumCard = (idx, t) => window.StadiumEngine.playCard(idx, t);
window.updateStadiumVisual = () => window.StadiumEngine.updateVisual();
window.inspectCurrentStadium = () => window.StadiumEngine.inspectCurrent();
// ==========================================
// ⚔️ 寶可夢招式特殊效果庫 (attacks.js)
// ==========================================

window.AttackEffects = {
  'poison': (attacker, defender, log) => { defender.status.poison = true; log.text += ` ☠️ 對手中毒！`; },
  'poison_flip': (attacker, defender, log, coinResult) => { if (coinResult) { defender.status.poison = true; log.text += ` ☠️ 對手中毒！`; } },
  'burn': (attacker, defender, log) => { defender.status.burn = true; log.text += ` 🔥 對手灼傷！`; },
  'burn_flip': (attacker, defender, log, coinResult) => { if (coinResult) { defender.status.burn = true; log.text += ` 🔥 對手灼傷！`; } },
  'asleep': (attacker, defender, log) => { defender.status.asleep = true; log.text += ` 💤 對手睡眠！`; },
  'asleep_flip': (attacker, defender, log, coinResult) => { if (coinResult) { defender.status.asleep = true; log.text += ` 💤 對手睡眠！`; } },
  'asleep_self': (attacker, defender, log) => { attacker.status.asleep = true; log.text += ` 💤 副作用：自己陷入睡眠！`; },
  'confuse': (attacker, defender, log) => { defender.status.confused = true; log.text += ` 💫 對手混亂！`; },
  'confuse_flip': (attacker, defender, log, coinResult) => { if (coinResult) { defender.status.confused = true; log.text += ` 💫 對手混亂！`; } },
  'confuse_self_flip': (attacker, defender, log, coinResult) => { if (!coinResult) { attacker.status.confused = true; log.text += ` 💫 副作用：自己陷入混亂！`; } },
  'paralyze_flip': (attacker, defender, log, coinResult) => { if (coinResult) { defender.status.paralyze = true; log.text += ` ⚡ 對手麻痺！`; } },
  
  'hex_damage_40': (attacker, defender, log, coinResult, baseDmg) => { 
    const hasS = defender.status.poison || defender.status.burn || defender.status.asleep || defender.status.confused || defender.status.paralyze; 
    if(hasS) { log.text += ` (禍不單行追加 40 傷害！)`; return baseDmg + 40; } 
    return baseDmg; 
  },

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

  'red_hp_burst_30': (attacker, defender, log, coinResult, baseDmg) => { 
    if ((attacker.currHp / attacker.hp) < 0.3) { 
      log.text += ` (💥紅血爆發，傷害+30！)`; 
      return baseDmg + 30; 
    } 
    return baseDmg; 
  },
  'red_hp_burst_40': (attacker, defender, log, coinResult, baseDmg) => { if ((attacker.currHp / attacker.hp) < 0.3) { log.text += ` (💥紅血爆發，傷害+40！)`; return baseDmg + 40; } return baseDmg; },
  'red_hp_burst_50': (attacker, defender, log, coinResult, baseDmg) => { if ((attacker.currHp / attacker.hp) < 0.3) { log.text += ` (💥紅血爆發，傷害+50！)`; return baseDmg + 50; } return baseDmg; },
  'red_hp_burst_60': (attacker, defender, log, coinResult, baseDmg) => { if ((attacker.currHp / attacker.hp) < 0.3) { log.text += ` (💥紅血爆發，傷害+60！)`; return baseDmg + 60; } return baseDmg; },
  'plus_dmg_if_status_30': (attacker, defender, log, coinResult, baseDmg) => { const hasS = attacker.status.poison || attacker.status.burn || attacker.status.asleep || attacker.status.confused || attacker.status.paralyze; if(hasS) { log.text += ` (潛能激發追加 30 傷害！)`; return baseDmg + 30; } return baseDmg; },
  'plus_dmg_if_status_40': (attacker, defender, log, coinResult, baseDmg) => { const hasS = attacker.status.poison || attacker.status.burn || attacker.status.asleep || attacker.status.confused || attacker.status.paralyze; if(hasS) { log.text += ` (潛能激發追加 40 傷害！)`; return baseDmg + 40; } return baseDmg; },
  
  'plus_dmg_per_extra_energy_10': (attacker, defender, log, coinResult, baseDmg, atk) => { 
    let extraCount = Math.max(0, attacker.attachedEnergy.length - atk.cost.length);
    let added = extraCount * 10;
    if (added > 0) log.text += ` (額外 ${extraCount} 能量追加 ${added} 傷害！)`; 
    return baseDmg + added; 
  },

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
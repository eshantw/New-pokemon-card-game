// ==========================================
// 🎨 Pokémon TCG Pro - 特效引擎 (fx.js)
// ==========================================

(function() {
  const canvas = document.getElementById('fx-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const flash = document.getElementById('screen-flash');

  let particles = [];
  let sparks = [];
  let projectiles = [];
  let leaves = [];
  let ripples = [];
  let specials = [];
  let healPillars = [];
  let starBursts = [];
  let sleepZs = [];
  let shields = [];
  let screenShake = 0;
  let hitStop = 0;

  function resizeCanvas() {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const ELEM_COLORS = {
    fire: '#FF4400',
    water: '#0088FF',
    grass: '#00FF44',
    electric: '#FFDD00',
    normal: '#FFFFFF',
    brown: '#A0522D',
    purple: '#9B59B6'
  };

  function drawStar(ctx, rOuter, rInner) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / 5;
    ctx.beginPath();
    ctx.moveTo(0, -rOuter);
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(Math.cos(rot) * rOuter, Math.sin(rot) * rOuter);
      rot += step;
      ctx.lineTo(Math.cos(rot) * rInner, Math.sin(rot) * rInner);
      rot += step;
    }
    ctx.lineTo(0, -rOuter);
    ctx.closePath();
    ctx.stroke();
  }

  function drawFourPointStar(ctx, cx, cy, outerRadius, color) {
    const innerRadius = outerRadius * 0.28;
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = '#FFA200';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = (i % 2 === 0) ? outerRadius : innerRadius;
      const currAngle = (i * Math.PI) / 4;
      const px = cx + Math.cos(currAngle) * r;
      const py = cy + Math.sin(currAngle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHexagon(ctx, x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = x + size * Math.cos(angle);
      const hy = y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  window.FX = {
    triggerHeal(uid) { window.FX.triggerFivePointedStarFX(uid, 'heal'); },
    triggerBuff(uid) { window.FX.triggerFivePointedStarFX(uid, 'buff'); },

    triggerFivePointedStarFX(uid, type) {
      const el = document.getElementById(uid);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const bottomY = rect.bottom - 10;

      healPillars.push({
        x: cx, y: bottomY, w: rect.width * 1.1, h: rect.height * 1.2, rot: 0, l: 1.0, d: 0.016, color: type
      });

      for (let i = 0; i < 30; i++) {
        particles.push({
          x: cx + (Math.random() - 0.5) * rect.width * 0.9,
          y: bottomY - Math.random() * 20,
          vx: (Math.random() - 0.5) * 1.5, vy: -(Math.random() * 5 + 3),
          s: 3 + Math.random() * 4,
          c: type === 'buff' ? (Math.random() > 0.3 ? '#FFEAA7' : '#FFF9DB') : (Math.random() > 0.3 ? '#74C69D' : '#D8F3DC'),
          l: 1.0, d: 0.02
        });
      }
    },

    triggerShieldFX(uid) {
      const el = document.getElementById(uid);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      shields.push({
        x: cx, y: cy, size: 28, l: 1.0, d: 0.02, pulse: 0
      });

      for (let i = 0; i < 20; i++) {
        particles.push({
          x: cx + (Math.random() - 0.5) * rect.width * 0.8,
          y: cy + rect.height * 0.4,
          vx: (Math.random() - 0.5) * 1.2, vy: -(Math.random() * 3 + 1.5),
          s: 2.5 + Math.random() * 3, c: '#00F2FF', l: 1.0, d: 0.025
        });
      }
    },

    clearStatusFX(uid) {
      specials = specials.filter(s => s.uid !== uid);
    },

    triggerSubSpark(x, y, color) {
      starBursts.push({
        x, y, scale: 0.1, maxScale: 0.5, rot: Math.random() * Math.PI, c: color, l: 1.0, d: 0.08
      });
      for (let i = 0; i < 4; i++) {
        particles.push({
          x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
          s: 2 + Math.random() * 2, c: color, l: 1.0, d: 0.05
        });
      }
    },

    triggerHit(x, y, elem, dmg, tier) {
      const color = ELEM_COLORS[elem] || '#FFFFFF';

      if (elem === 'electric' && (tier === 'heavy' || tier === 'ultra')) {
        ripples.push({ x, y: y + 20, r: 10, maxR: 130, lw: 7, c: '#FFE600', l: 1.0, d: 0.03 });
        starBursts.push({ x, y, scale: 0.2, maxScale: 1.4, rot: 0, c: '#FFE600', l: 1.0, d: 0.04 });
        
        const arcCount = 14;
        for (let i = 0; i < arcCount; i++) {
          const angle = (i * Math.PI * 2) / arcCount + (Math.random() - 0.5) * 0.3;
          specials.push({
            type: 'thunder_arc',
            sx: x, sy: y,
            tx: x + Math.cos(angle) * (110 + Math.random() * 30),
            ty: y + Math.sin(angle) * (110 + Math.random() * 30),
            c: Math.random() > 0.3 ? '#FFE600' : '#FFFFFF',
            w: 3.5, l: 1.0, d: 0.04
          });
        }
      } else if (elem === 'water') {
        ripples.push({ x, y, r: 8, maxR: tier === 'heavy' ? 140 : 85, lw: 6, c: '#00B4D8', l: 1.0, d: 0.035 });
        starBursts.push({ x, y, scale: 0.15, maxScale: tier === 'heavy' ? 1.2 : 0.75, rot: Math.random() * Math.PI, c: '#00B4D8', l: 1.0, d: 0.045 });
      } else if (elem === 'fire') {
        sparks.push({ x, y, color: '#FF4400', l: 1.0, scale: 0.4, maxScale: tier === 'heavy' ? 1.6 : 0.9 });
        starBursts.push({ x, y, scale: 0.2, maxScale: tier === 'heavy' ? 1.3 : 0.8, rot: Math.PI / 4, c: '#FF6B00', l: 1.0, d: 0.04 });
      } else if (elem === 'purple') {
        starBursts.push({ x, y, scale: 0.25, maxScale: 1.3, rot: Math.PI / 6, c: '#D6B3E8', l: 1.0, d: 0.045 });
      } else if (elem === 'brown') {
        starBursts.push({ x, y, scale: 0.25, maxScale: 1.3, rot: Math.PI / 4, c: '#DFB7A1', l: 1.0, d: 0.045 });
      } else if (elem === 'normal') {
        sparks.push({ x, y, color: '#FFFFFF', l: 1.0, scale: 0.4, maxScale: 1.4 });
        starBursts.push({ x, y, scale: 0.2, maxScale: 1.2, rot: Math.random() * Math.PI, c: '#FFEAA7', l: 1.0, d: 0.04 });
      }

      for (let i = 0; i < (tier === 'heavy' ? 30 : 15); i++) {
        particles.push({
          x, y, vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 14,
          s: 3 + Math.random() * 4, c: color, l: 1.0, d: 0.03
        });
      }

      if (tier === 'ultra') { screenShake = 45; hitStop = 8; }
      else if (tier === 'heavy') { screenShake = 22; hitStop = 3; }
      else { screenShake = 8; hitStop = 1; }
    },

    triggerStatusFX(uid, statusType) {
      const el = document.getElementById(uid);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rw = rect.width * 0.6;
      const rh = rect.height * 0.6;

      if (statusType === 'asleep') {
        for (let i = 0; i < 8; i++) {
          sleepZs.push({
            x: cx + (Math.random() - 0.5) * 35, y: cy + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 1.5 + 0.5, vy: -(Math.random() * 2 + 1.5),
            size: 14 + Math.random() * 12, rot: (Math.random() - 0.5) * 0.4,
            l: 1.0, d: 0.012
          });
        }
      } else if (statusType === 'confused' || statusType === 'confuse') {
        // 🌟 1. 修正混亂位置：以插畫區 (.card-img) 計算，精確盤旋於角色頭部上方 (綠色圈選處)
        specials = specials.filter(s => !(s.type === 'confuse_star' && s.uid === uid));
        const imgEl = el.querySelector('.card-img');
        let headX = cx;
        let headY = cy - 30; // 預設降至頭部高度
        if (imgEl) {
          const imgRect = imgEl.getBoundingClientRect();
          headX = imgRect.left + imgRect.width / 2;
          headY = imgRect.top + imgRect.height * 0.28; // 插畫窗偏上方約頭部位置
        }

        for (let i = 0; i < 6; i++) {
          specials.push({
            type: 'confuse_star',
            uid: uid,
            x: headX,
            y: headY,
            angle: (i * Math.PI * 2) / 6,
            radiusX: 38, // 橢圓水平長軸
            radiusY: 13, // 橢圓垂直短軸
            rotSpeed: 0.065,
            l: 1.0,
            d: 0.005
          });
        }
      } else if (statusType === 'paralyze') {
        for (let i = 0; i < 8; i++) {
          const a1 = Math.random() * Math.PI * 2;
          const a2 = a1 + (Math.random() - 0.5) * 1.5;
          specials.push({
            type: 'thunder_arc',
            sx: cx + Math.cos(a1) * (rw + Math.random() * 15),
            sy: cy + Math.sin(a1) * (rh + Math.random() * 15),
            tx: cx + Math.cos(a2) * (rw + Math.random() * 15),
            ty: cy + Math.sin(a2) * (rh + Math.random() * 15),
            c: '#F4D23C', w: 3.5, l: 1.0, d: 0.03
          });
        }
      } else if (statusType === 'poison') {
        for (let i = 0; i < 25; i++) {
          particles.push({
            x: cx + (Math.random() - 0.5) * 45, y: cy + (Math.random() - 0.5) * 35,
            vx: (Math.random() - 0.5) * 4, vy: -(Math.random() * 5 + 2),
            s: 8 + Math.random() * 8, c: '#904090', l: 1.0, d: 0.02
          });
        }
      } else if (statusType === 'burn') {
        for (let i = 0; i < 25; i++) {
          particles.push({
            x: cx + (Math.random() - 0.5) * 40, y: cy + (Math.random() - 0.5) * 30,
            vx: (Math.random() - 0.5) * 5, vy: -(Math.random() * 7 + 3),
            s: 6 + Math.random() * 7, c: Math.random() > 0.4 ? '#FF4400' : '#FFBB00',
            l: 1.0, d: 0.03
          });
        }
      }
    },

    castSkill({ attackerUid, defenderUid, element, isUltimate, isUltra, damage, onHit }) {
      const aEl = document.getElementById(attackerUid);
      const dEl = document.getElementById(defenderUid);
      if (!dEl) return;

      const dRect = dEl.getBoundingClientRect();
      const tx = dRect.left + dRect.width / 2;
      const ty = dRect.top + dRect.height / 2;

      let sx = window.innerWidth / 2;
      let sy = window.innerHeight / 2;
      if (aEl) {
        const aRect = aEl.getBoundingClientRect();
        sx = aRect.left + aRect.width / 2;
        sy = aRect.top + aRect.height / 2;
      }

      if (isUltra) {
        if (flash) { flash.style.opacity = '0.9'; setTimeout(() => { flash.style.opacity = '0'; }, 120); }
        screenShake = 50;
        specials.push({
          type: 'mega_aura', x: tx, y: ty, r: 20, maxR: 260, l: 1.0, d: 0.018, c: element === 'fire' ? '#FF2200' : '#FF00FF'
        });

        let count = 0;
        const burst = setInterval(() => {
          projectiles.push({
            x: sx + (Math.random() - 0.5) * 80, y: sy + (Math.random() - 0.5) * 80,
            tx: tx + (Math.random() - 0.5) * 50, ty: ty + (Math.random() - 0.5) * 50,
            speed: 0.22, progress: 0, c: '#FF00FF', type: 'mega_slash'
          });
          count++;
          if (count >= 12) {
            clearInterval(burst);
            setTimeout(() => {
              window.FX.triggerHit(tx, ty, element, damage, 'ultra');
              if (onHit) onHit(tx, ty);
            }, 150);
          }
        }, 40);
        return;
      }

      if (element === 'electric' && isUltimate) {
        if (flash) { flash.style.opacity = '0.85'; setTimeout(() => { flash.style.opacity = '0'; }, 100); }
        specials.push({ type: 'thunder_huge', x: tx, y: ty, l: 1.0 });
        setTimeout(() => { window.FX.triggerHit(tx, ty, element, damage, 'heavy'); if (onHit) onHit(tx, ty); }, 120);
      } else if (element === 'electric') {
        projectiles.push({ x: sx, y: sy, tx: tx, ty: ty, speed: 0.16, progress: 0, c: '#FFEE55', type: 'electric_ball' });
        setTimeout(() => { window.FX.triggerHit(tx, ty, element, damage, 'light'); if (onHit) onHit(tx, ty); }, 180);
      } else if (element === 'water' && !isUltimate) {
        projectiles.push({ x: sx, y: sy, tx: tx, ty: ty, speed: 0.16, progress: 0, c: '#00B4D8', type: 'water_drop', scale: 1.5 });
        setTimeout(() => { window.FX.triggerHit(tx, ty, element, damage, 'light'); if (onHit) onHit(tx, ty); }, 180);
      } else if (element === 'water' && isUltimate) {
        let count = 0;
        const burst = setInterval(() => {
          const subTx = tx + (Math.random() - 0.5) * 35;
          const subTy = ty + (Math.random() - 0.5) * 35;
          projectiles.push({
            x: sx + (Math.random() - 0.5) * 45, y: sy + (Math.random() - 0.5) * 45,
            tx: subTx, ty: subTy, speed: 0.18, progress: 0, c: '#00B4D8', type: 'water_drop', scale: 1.35,
            onArrive: () => window.FX.triggerSubSpark(subTx, subTy, '#00B4D8')
          });
          count++;
          if (count >= 6) {
            clearInterval(burst);
            setTimeout(() => { window.FX.triggerHit(tx, ty, element, damage, 'heavy'); if (onHit) onHit(tx, ty); }, 120);
          }
        }, 50);
      } else if (element === 'fire' && !isUltimate) {
        projectiles.push({ x: sx, y: sy, tx: tx, ty: ty, speed: 0.16, progress: 0, c: '#FF4400', type: 'fire_ball', rad: 24 });
        setTimeout(() => { window.FX.triggerHit(tx, ty, element, damage, 'light'); if (onHit) onHit(tx, ty); }, 180);
      } else if (element === 'fire' && isUltimate) {
        let count = 0;
        const burst = setInterval(() => {
          for (let i = 0; i < 2; i++) {
            const subTx = tx + (Math.random() - 0.5) * 45;
            const subTy = ty + (Math.random() - 0.5) * 45;
            projectiles.push({
              x: sx + (Math.random() - 0.5) * 30, y: sy + (Math.random() - 0.5) * 30,
              tx: subTx, ty: subTy, speed: 0.18 + Math.random() * 0.04, progress: 0,
              c: Math.random() > 0.3 ? '#FF4400' : '#FFAA00', type: 'flamethrower', rad: 14 + Math.random() * 10,
              onArrive: () => window.FX.triggerSubSpark(subTx, subTy, '#FF6B00')
            });
          }
          count++;
          if (count >= 6) {
            clearInterval(burst);
            setTimeout(() => { window.FX.triggerHit(tx, ty, element, damage, 'heavy'); if (onHit) onHit(tx, ty); }, 120);
          }
        }, 45);
      } else if (element === 'grass' && isUltimate) {
        let count = 0;
        const burst = setInterval(() => {
          projectiles.push({ x: sx + (Math.random() - 0.5) * 60, y: sy + (Math.random() - 0.5) * 60, tx: tx + (Math.random() - 0.5) * 40, ty: ty + (Math.random() - 0.5) * 40, c: '#52B788', type: 'grass_leaf', speed: 0.17, progress: 0 });
          count++;
          if (count >= 8) {
            clearInterval(burst);
            setTimeout(() => {
              ripples.push({ x: tx, y: ty, r: 15, maxR: 160, l: 1.0, d: 0.03, lw: 8, c: '#74c69d' });
              window.FX.triggerHit(tx, ty, element, damage, 'ultra');
              if (onHit) onHit(tx, ty);
              for (let i = 0; i < 45; i++) {
                leaves.push({
                  x: tx + (Math.random() - 0.5) * 220, y: ty - 180 + (Math.random() - 0.5) * 100,
                  vx: (Math.random() - 0.5) * 16 + 2, vy: Math.random() * 14 + 6,
                  angle: Math.random() * Math.PI * 2, vAngle: (Math.random() - 0.5) * 0.4,
                  s: 9 + Math.random() * 8, c: Math.random() > 0.5 ? '#40916c' : '#74c69d',
                  l: 1.0, d: 0.016
                });
              }
            }, 150);
          }
        }, 45);
      } else if (element === 'purple' && isUltimate) {
        specials.push({ type: 'purple_flower', x: tx, y: ty, r: 10, maxR: 130, rot: 0, l: 1.0, d: 0.02 });
        setTimeout(() => { window.FX.triggerHit(tx, ty, element, damage, 'heavy'); if (onHit) onHit(tx, ty); }, 220);
      } else if (element === 'brown' && isUltimate) {
        let count = 0;
        const burst = setInterval(() => {
          const subTx = tx + (Math.random() - 0.5) * 40;
          const subTy = ty + (Math.random() - 0.5) * 40;
          projectiles.push({
            x: sx + (Math.random() - 0.5) * 40, y: sy + (Math.random() - 0.5) * 40,
            tx: subTx, ty: subTy, speed: 0.18, progress: 0, c: '#A0522D', type: 'rock',
            onArrive: () => window.FX.triggerSubSpark(subTx, subTy, '#DFB7A1')
          });
          count++;
          if (count >= 5) {
            clearInterval(burst);
            setTimeout(() => { window.FX.triggerHit(tx, ty, element, damage, 'heavy'); if (onHit) onHit(tx, ty); }, 120);
          }
        }, 50);
      } else if (element === 'normal' && isUltimate) {
        let count = 0;
        const burst = setInterval(() => {
          const subTx = tx + (Math.random() - 0.5) * 45;
          const subTy = ty + (Math.random() - 0.5) * 45;
          projectiles.push({
            x: sx + (Math.random() - 0.5) * 50 - 60, y: sy + (Math.random() - 0.5) * 50 - 60,
            tx: subTx, ty: subTy, speed: 0.17, progress: 0, c: '#FFFFFF', type: 'comet',
            onArrive: () => window.FX.triggerSubSpark(subTx, subTy, '#FFEAA7')
          });
          count++;
          if (count >= 6) {
            clearInterval(burst);
            setTimeout(() => { window.FX.triggerHit(tx, ty, element, damage, 'heavy'); if (onHit) onHit(tx, ty); }, 120);
          }
        }, 45);
      } else if (isUltimate) {
        let count = 0;
        const burst = setInterval(() => {
          projectiles.push({
            x: sx + (Math.random() - 0.5) * 40, y: sy + (Math.random() - 0.5) * 40,
            tx: tx + (Math.random() - 0.5) * 30, ty: ty + (Math.random() - 0.5) * 30,
            c: ELEM_COLORS[element] || '#fff', type: element, speed: 0.2, progress: 0
          });
          count++;
          if (count >= 4) {
            clearInterval(burst);
            setTimeout(() => { window.FX.triggerHit(tx, ty, element, damage, 'heavy'); if (onHit) onHit(tx, ty); }, 120);
          }
        }, 50);
      } else {
        projectiles.push({ x: sx, y: sy, tx: tx, ty: ty, speed: 0.18, progress: 0, c: ELEM_COLORS[element] || '#fff', type: element });
        setTimeout(() => { window.FX.triggerHit(tx, ty, element, damage, 'light'); if (onHit) onHit(tx, ty); }, 160);
      }
    }
  };

  function renderFrame() {
    if (hitStop > 0) { hitStop--; requestAnimationFrame(renderFrame); return; }

    const field = document.getElementById('battle-field');
    if (screenShake > 0) {
      if (field) { field.style.transform = `translate(${(Math.random() - 0.5) * screenShake}px, ${(Math.random() - 0.5) * screenShake}px)`; }
      screenShake *= 0.85;
      if (screenShake < 0.5) { screenShake = 0; if (field) field.style.transform = ''; }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    // 1. 五星芒光柱
    healPillars = healPillars.filter(hp => hp.l > 0);
    healPillars.forEach(hp => {
      ctx.save();
      ctx.globalAlpha = hp.l;
      const isBuff = (hp.color === 'buff');
      const grad = ctx.createLinearGradient(0, hp.y, 0, hp.y - hp.h);
      if (isBuff) {
        grad.addColorStop(0, 'rgba(255, 234, 167, 0.5)');
        grad.addColorStop(0.5, 'rgba(255, 203, 5, 0.25)');
      } else {
        grad.addColorStop(0, 'rgba(56, 239, 125, 0.5)');
        grad.addColorStop(0.5, 'rgba(116, 198, 157, 0.25)');
      }
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(hp.x - hp.w / 2, hp.y - hp.h, hp.w, hp.h);

      ctx.strokeStyle = isBuff ? '#FFF9DB' : '#D8F3DC';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 6; i++) {
        const lx = hp.x - hp.w / 2 + (i + 0.5) * (hp.w / 6);
        ctx.beginPath();
        ctx.moveTo(lx, hp.y);
        ctx.lineTo(lx, hp.y - hp.h * (0.6 + (i % 3) * 0.2));
        ctx.stroke();
      }

      ctx.translate(hp.x, hp.y);
      ctx.scale(1, 0.35);
      const strokeColor = isBuff ? '#FFCB05' : '#52B788';
      ctx.strokeStyle = strokeColor;
      ctx.shadowBlur = 15;
      ctx.shadowColor = strokeColor;

      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, hp.w * 0.55, 0, Math.PI * 2);
      ctx.arc(0, 0, hp.w * 0.48, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.rotate(-hp.rot * 1.5);
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 20; i++) {
        const angle = (i * Math.PI) / 10;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * hp.w * 0.48, Math.sin(angle) * hp.w * 0.48);
        ctx.lineTo(Math.cos(angle) * hp.w * 0.55, Math.sin(angle) * hp.w * 0.55);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.rotate(hp.rot);
      ctx.lineWidth = 2.5;
      drawStar(ctx, hp.w * 0.46, hp.w * 0.2);
      ctx.lineWidth = 1.5;
      drawStar(ctx, hp.w * 0.2, hp.w * 0.08);
      ctx.beginPath();
      ctx.arc(0, 0, hp.w * 0.12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
      hp.rot += 0.012;
      hp.l -= hp.d;
    });

    // 2. 蜂巢護盾
    shields = shields.filter(sh => sh.l > 0);
    shields.forEach(sh => {
      ctx.save();
      ctx.translate(sh.x, sh.y);
      sh.pulse += 0.08;
      const pulseAlpha = 0.6 + Math.sin(sh.pulse) * 0.25;
      ctx.globalAlpha = sh.l * pulseAlpha;

      ctx.strokeStyle = '#00F2FF';
      ctx.fillStyle = 'rgba(0, 242, 255, 0.12)';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#00F2FF';

      const s = sh.size;
      const dx = s * 1.5;
      const dy = s * Math.sqrt(3);

      const hexPositions = [
        [0, 0], [0, -dy], [0, dy],
        [dx, -dy / 2], [dx, dy / 2],
        [-dx, -dy / 2], [-dx, dy / 2],
        [dx * 2, 0], [-dx * 2, 0]
      ];

      hexPositions.forEach(([hx, hy]) => {
        drawHexagon(ctx, hx, hy, s * 0.95);
      });

      ctx.restore();
      sh.l -= sh.d;
    });

    // 3. 睡眠 Z 字
    sleepZs = sleepZs.filter(z => z.l > 0);
    sleepZs.forEach(z => {
      ctx.save();
      ctx.translate(z.x, z.y);
      ctx.rotate(z.rot);
      ctx.globalAlpha = z.l;
      ctx.fillStyle = '#C7D2FE';
      ctx.font = `bold ${z.size}px 'Arial', sans-serif`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#818CF8';
      ctx.fillText('Z', 0, 0);
      ctx.restore();
      z.x += z.vx; z.y += z.vy; z.l -= z.d;
    });

    // 4. 星芒爆裂
    starBursts = starBursts.filter(sb => sb.l > 0);
    starBursts.forEach(sb => {
      ctx.save();
      ctx.translate(sb.x, sb.y);
      ctx.globalAlpha = sb.l;
      const s = sb.scale;
      const color = sb.c || '#00d2d3';

      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 16;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(0, 0, 28 * s, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 4 + sb.rot);
        const len = (i % 2 === 0 ? 140 : 70) * s;
        const w = (i % 2 === 0 ? 5 : 2.5) * s;
        ctx.beginPath();
        ctx.moveTo(0, -w); ctx.lineTo(len, 0); ctx.lineTo(0, w); ctx.lineTo(-len * 0.15, 0);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      sb.scale += (sb.maxScale - sb.scale) * 0.25;
      sb.l -= sb.d;
    });

    // 5. 葉片
    leaves = leaves.filter(l => l.l > 0);
    leaves.forEach(l => {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.angle);
      ctx.globalAlpha = l.l;
      ctx.fillStyle = l.c;
      ctx.beginPath();
      ctx.moveTo(0, -l.s);
      ctx.quadraticCurveTo(l.s * 0.75, 0, 0, l.s);
      ctx.quadraticCurveTo(-l.s * 0.75, 0, 0, -l.s);
      ctx.fill();
      ctx.restore();
      l.x += l.vx; l.y += l.vy; l.angle += l.vAngle; l.l -= l.d;
    });

    // 6. 漣漪
    ripples = ripples.filter(r => r.l > 0);
    ripples.forEach(r => {
      ctx.save();
      ctx.strokeStyle = r.c;
      ctx.lineWidth = r.lw * r.l;
      ctx.globalAlpha = r.l;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      r.r += (r.maxR - r.r) * 0.12;
      r.l -= r.d;
    });

    // 7. 特殊
    specials = specials.filter(s => s.l > 0);
    specials.forEach(s => {
      if (s.type === 'thunder_huge') {
        ctx.save();
        ctx.strokeStyle = '#FFFFFF';
        ctx.shadowBlur = 50;
        ctx.shadowColor = '#FFEE00';
        ctx.lineWidth = 48 * s.l;
        ctx.beginPath();
        let curX = s.x + (Math.random() - 0.5) * 35, curY = 0;
        ctx.moveTo(curX, curY);
        while (curY < s.y) {
          curX += (Math.random() - 0.5) * 65; curY += 45;
          ctx.lineTo(curX, curY);
        }
        ctx.stroke();
        ctx.restore();
        s.l -= 0.12;
      } else if (s.type === 'thunder_arc') {
        ctx.save();
        ctx.strokeStyle = s.c;
        ctx.lineWidth = (s.w || 3) * s.l;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFF';
        ctx.beginPath();
        ctx.moveTo(s.sx, s.sy);
        ctx.lineTo(s.sx + (s.tx - s.sx) * 0.5 + (Math.random() - 0.5) * 20, s.sy + (s.ty - s.sy) * 0.5 + (Math.random() - 0.5) * 20);
        ctx.lineTo(s.tx, s.ty);
        ctx.stroke();
        ctx.restore();
        s.l -= (s.d || 0.08);
      } else if (s.type === 'purple_flower') {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.globalAlpha = s.l;
        for (let i = 0; i < 6; i++) {
          ctx.rotate(Math.PI / 3);
          const grad = ctx.createRadialGradient(0, 0, 5, s.r * 0.4, 0, s.r * 0.6);
          grad.addColorStop(0, '#D6B3E8');
          grad.addColorStop(0.5, '#9B59B6');
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(s.r * 0.45, 0, s.r * 0.45, s.r * 0.22, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        s.rot += 0.12;
        s.r += (s.maxR - s.r) * 0.12;
        s.l -= s.d;
      } else if (s.type === 'confuse_star') {
        // 🌟 混亂橢圓旋轉星芒
        ctx.save();
        const rx = s.radiusX || 38;
        const ry = s.radiusY || 13;
        const posX = s.x + Math.cos(s.angle) * rx;
        const posY = s.y + Math.sin(s.angle) * ry;
        const depthScale = 0.75 + 0.25 * ((Math.sin(s.angle) + 1) / 2);
        
        ctx.globalAlpha = s.l * depthScale;
        drawFourPointStar(ctx, posX, posY, 6.5 * depthScale, '#FFAA00');
        ctx.restore();
        s.angle += s.rotSpeed;
      } else if (s.type === 'mega_aura') {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha = s.l;
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, s.r);
        grad.addColorStop(0, s.c);
        grad.addColorStop(0.5, 'rgba(255,0,255,0.4)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        s.r += (s.maxR - s.r) * 0.12;
        s.l -= s.d;
      }
    });

    // 8. 彈道
    projectiles = projectiles.filter(p => p.progress < 1);
    projectiles.forEach(p => {
      p.progress += p.speed;
      if (p.progress > 1) {
        p.progress = 1;
        if (p.onArrive) p.onArrive();
      }
      const curX = p.x + (p.tx - p.x) * p.progress;
      const curY = p.y + (p.ty - p.y) * p.progress;
      const angle = Math.atan2(p.ty - p.y, p.tx - p.x);

      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(angle);

      if (p.type === 'electric_ball') {
        ctx.shadowBlur = 16; ctx.shadowColor = '#FFDD00'; ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#FFE600'; ctx.lineWidth = 3.5;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.moveTo(0, (i - 1) * 5);
          ctx.lineTo(-24, (i - 1) * 7 + (Math.random() - 0.5) * 12);
          ctx.lineTo(-50, (i - 1) * 9 + (Math.random() - 0.5) * 16);
          ctx.stroke();
        }
      } else if (p.type === 'water_drop') {
        const sc = p.scale || 1.4;
        ctx.scale(sc, sc);
        ctx.fillStyle = p.c; ctx.shadowBlur = 12; ctx.shadowColor = '#90E0EF';
        ctx.beginPath(); ctx.moveTo(14, 0); ctx.quadraticCurveTo(0, -9, -16, 0); ctx.quadraticCurveTo(0, 9, 14, 0); ctx.fill();
      } else if (p.type === 'fire_ball' || p.type === 'flamethrower') {
        const rad = p.rad || 24;
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, rad);
        grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(0.35, p.c); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2); ctx.fill();
      } else if (p.type === 'grass_leaf' || p.type === 'grass') {
        ctx.rotate(p.progress * Math.PI * 5);
        ctx.fillStyle = '#52B788'; ctx.shadowBlur = 10; ctx.shadowColor = '#74C69D';
        ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(10, 0, 0, 14); ctx.quadraticCurveTo(-10, 0, 0, -14); ctx.fill();
      } else if (p.type === 'rock') {
        ctx.fillStyle = '#A0522D'; ctx.shadowBlur = 10; ctx.shadowColor = '#DFB7A1';
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
      } else if (p.type === 'comet') {
        ctx.fillStyle = '#FFFFFF'; ctx.shadowBlur = 14; ctx.shadowColor = '#FFEAA7';
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
        const tailGrad = ctx.createLinearGradient(0, 0, -45, 0);
        tailGrad.addColorStop(0, 'rgba(255,255,255,0.85)'); tailGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = tailGrad; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(-45, 0); ctx.lineTo(0, 7); ctx.fill();
      } else if (p.type === 'mega_slash') {
        ctx.fillStyle = '#FF00FF'; ctx.shadowBlur = 20; ctx.shadowColor = '#00FFFF';
        ctx.beginPath(); ctx.ellipse(0, 0, 25, 8, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });

    // 9. 火花
    sparks = sparks.filter(s => s.l > 0);
    sparks.forEach(s => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.globalAlpha = s.l;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 50 * s.scale);
      grad.addColorStop(0, '#FFF'); grad.addColorStop(0.4, s.color); grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, 60 * s.scale, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      s.scale += (s.maxScale - s.scale) * 0.2; s.l -= 0.04;
    });

    particles = particles.filter(p => p.l > 0);
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.l; ctx.fillStyle = p.c; ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      p.x += p.vx; p.y += p.vy; p.l -= p.d;
    });

    requestAnimationFrame(renderFrame);
  }
  requestAnimationFrame(renderFrame);
})();
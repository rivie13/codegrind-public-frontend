/**
 * profileCardRenderer.js — Player HUD card drawn on the CyberGrid canvas.
 *
 * Displays: avatar silhouette, username, role title, level, XP progress bar.
 * Positioned in the top-right corner; designed for all 3 zoom levels.
 */

import { hexToRgb, rgbStr } from './pixelUtils';

const DEFAULT_GUEST_CTA = 'Sign up to save your progress';

/* ── XP formula (mirrors backend xp.service.js) ──────────────── */
const XP_CONFIG = { base: 150, linear: 45, quadratic: 18 };

function getXpForNextLevel(level) {
  const step = Math.max(level - 1, 0);
  return XP_CONFIG.base + XP_CONFIG.linear * step + XP_CONFIG.quadratic * step * step;
}

function getTotalXpForLevel(level) {
  let total = 0;
  for (let current = 1; current < level; current += 1) {
    total += getXpForNextLevel(current);
  }
  return total;
}

function calculateLevelFromXp(totalXp) {
  let level = 1;
  while (totalXp >= getTotalXpForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

function calculateLevelProgress(totalXp, level) {
  const currentLevelXp = getTotalXpForLevel(level);
  const xpIntoLevel = totalXp - currentLevelXp;
  const xpToNextLevel = getXpForNextLevel(level);
  return { xpIntoLevel, xpToNextLevel };
}

/* ── Role tiers (mirrors backend xp.service.js ROLE_TIERS) ──── */
const ROLE_TIERS = [
  { name: 'Greenhorn', minLevel: 0, maxLevel: 2, color: '#808080' },
  { name: 'Script Kiddie', minLevel: 3, maxLevel: 7, color: '#00FF8C' },
  { name: 'Debugger', minLevel: 8, maxLevel: 14, color: '#00CCFF' },
  { name: 'Stack Whisperer', minLevel: 15, maxLevel: 24, color: '#8866FF' },
  { name: 'Code Alchemist', minLevel: 25, maxLevel: 34, color: '#FFCC00' },
  { name: 'Refactor Mage', minLevel: 35, maxLevel: 49, color: '#FF66FF' },
  { name: 'System Architect', minLevel: 50, maxLevel: 69, color: '#FF8800' },
  { name: 'CodeGrind Champ', minLevel: 70, maxLevel: null, color: '#FF4D4D' },
];

function getRoleForLevel(level) {
  return (
    ROLE_TIERS.find((tier) => {
      if (tier.maxLevel === null) return level >= tier.minLevel;
      return level >= tier.minLevel && level <= tier.maxLevel;
    }) || ROLE_TIERS[0]
  );
}

function resolveUserProgress(user) {
  const summary = user?.progress && typeof user.progress === 'object' ? user.progress : null;
  const totalXp = Number.isFinite(Number(summary?.xp))
    ? Math.max(0, Number(summary.xp))
    : Number.isFinite(Number(user?.xp))
      ? Math.max(0, Number(user.xp))
      : 0;
  const levelFromXp = calculateLevelFromXp(totalXp);
  const level = Number.isFinite(Number(summary?.level))
    ? Math.max(1, Number(summary.level))
    : levelFromXp;
  const fallbackProgress = calculateLevelProgress(totalXp, level);
  const xpIntoLevel = Number.isFinite(Number(summary?.xpIntoLevel))
    ? Math.max(0, Number(summary.xpIntoLevel))
    : Math.max(0, fallbackProgress.xpIntoLevel);
  const xpToNextLevel = Number.isFinite(Number(summary?.xpToNextLevel))
    ? Math.max(0, Number(summary.xpToNextLevel))
    : Math.max(0, fallbackProgress.xpToNextLevel);
  return {
    level,
    xpIntoLevel,
    xpToNextLevel,
    roleName: summary?.roleName || null,
  };
}

function resolveRole(userRoleName, level) {
  if (userRoleName) {
    const normalized = String(userRoleName).trim().toLowerCase();
    const roleMatch = ROLE_TIERS.find((tier) => tier.name.toLowerCase() === normalized);
    if (roleMatch) return roleMatch;
  }
  return getRoleForLevel(level);
}

/* ── Avatar image cache ──────────────────────────────────────── */
const avatarCache = { url: null, img: null, loaded: false, failed: false };

function getAvatarImage(url) {
  if (!url) return null;
  if (avatarCache.url === url) {
    return avatarCache.loaded && !avatarCache.failed ? avatarCache.img : null;
  }
  // New URL — start loading
  avatarCache.url = url;
  avatarCache.loaded = false;
  avatarCache.failed = false;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    avatarCache.loaded = true;
    avatarCache.img = img;
  };
  img.onerror = () => {
    avatarCache.failed = true;
  };
  img.src = url;
  return null;
}

/* ── Draw default avatar silhouette ──────────────────────────── */
function drawDefaultAvatar(ctx, x, y, size, color) {
  const [r, g, b] = hexToRgb(color);
  const cx = x + size / 2;
  const cy = y + size / 2;

  // Dark circle bg
  ctx.fillStyle = 'rgba(20, 22, 28, 0.9)';
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = rgbStr(r, g, b, 0.4);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Simple head (circle) + body (arc)
  ctx.fillStyle = rgbStr(r, g, b, 0.5);
  // Head
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.1, size * 0.18, 0, Math.PI * 2);
  ctx.fill();
  // Shoulders
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.35, size * 0.28, Math.PI, 0);
  ctx.fill();
}

/* ── Draw avatar image in circle ─────────────────────────────── */
function drawAvatarImage(ctx, img, x, y, size, borderColor) {
  const [r, g, b] = hexToRgb(borderColor);
  const cx = x + size / 2;
  const cy = y + size / 2;
  const radius = size / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();

  // Border
  ctx.strokeStyle = rgbStr(r, g, b, 0.5);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function fitText(ctx, text, maxWidth) {
  const raw = String(text || '');
  if (!raw) return '';
  if (ctx.measureText(raw).width <= maxWidth) return raw;
  let trimmed = raw;
  while (trimmed.length > 3 && ctx.measureText(`${trimmed}...`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed.trimEnd()}...`;
}

/* ═══════════════════════════════════════════════════════════════
   drawProfileCard — main export
   ═══════════════════════════════════════════════════════════════ */

/**
 * Draw a compact player profile HUD on the canvas.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} canvasW - canvas width
 * @param {number} canvasH - canvas height (unused, reserved)
 * @param {object} user    - { username, avatarUrl, membershipTier, xp, level }
 * @param {number} time    - animation time (seconds)
 * @param {object} options - { isGuest?: boolean, guestLabel?: string, guestCta?: string }
 */
export function drawProfileCard(ctx, canvasW, _canvasH, user, time, options = {}) {
  const isGuest = Boolean(options?.isGuest);
  if (!user && !isGuest) return;

  const profile = user && typeof user === 'object' ? user : {};
  const username = isGuest ? options?.guestLabel || 'Guest' : profile.username || 'Player';
  const progress = resolveUserProgress(profile);
  const { level, xpIntoLevel, xpToNextLevel, roleName } = progress;
  const avatarUrl = isGuest ? null : profile.avatarUrl || null;
  const role = resolveRole(roleName, level);
  const xpFrac = xpToNextLevel > 0 ? Math.min(xpIntoLevel / xpToNextLevel, 1) : 0;

  /* ── Card dimensions ──────────────────────────────────────── */
  const CARD_W = 332;
  const CARD_H = 92;
  const CARD_PAD = 12;
  const cx = canvasW - CARD_W - 18;
  const cy = 12;
  const AVATAR_S = 56;

  const [rr, rg, rb] = hexToRgb(role.color);

  /* ── Card background ──────────────────────────────────────── */
  const cardGradient = ctx.createLinearGradient(cx, cy, cx, cy + CARD_H);
  cardGradient.addColorStop(0, '#f4efe7');
  cardGradient.addColorStop(1, '#d5cec5');
  ctx.fillStyle = cardGradient;
  ctx.fillRect(cx, cy, CARD_W, CARD_H);
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillRect(cx + 1, cy + 1, CARD_W - 2, 1);
  ctx.fillRect(cx + 1, cy + 1, 1, CARD_H - 2);
  ctx.fillStyle = 'rgba(64,64,64,0.9)';
  ctx.fillRect(cx + CARD_W - 2, cy + 1, 1, CARD_H - 2);
  ctx.fillRect(cx + 1, cy + CARD_H - 2, CARD_W - 2, 1);

  const titleGradient = ctx.createLinearGradient(cx, cy, cx + CARD_W, cy);
  titleGradient.addColorStop(0, '#173d84');
  titleGradient.addColorStop(1, '#335fae');
  ctx.fillStyle = titleGradient;
  ctx.fillRect(cx + 2, cy + 2, CARD_W - 4, 14);

  // Border
  ctx.strokeStyle = '#2b2926';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx + 0.5, cy + 0.5, CARD_W - 1, CARD_H - 1);

  // Corner accents
  const cLen = 6;
  ctx.fillStyle = rgbStr(rr, rg, rb, 0.6);
  ctx.fillRect(cx, cy, cLen, 2);
  ctx.fillRect(cx, cy, 2, cLen);
  ctx.fillRect(cx + CARD_W - cLen, cy, cLen, 2);
  ctx.fillRect(cx + CARD_W - 2, cy, 2, cLen);
  ctx.fillRect(cx, cy + CARD_H - 2, cLen, 2);
  ctx.fillRect(cx, cy + CARD_H - cLen, 2, cLen);
  ctx.fillRect(cx + CARD_W - cLen, cy + CARD_H - 2, cLen, 2);
  ctx.fillRect(cx + CARD_W - 2, cy + CARD_H - cLen, 2, cLen);

  /* ── Avatar ───────────────────────────────────────────────── */
  const avX = cx + CARD_PAD;
  const avY = cy + (CARD_H - AVATAR_S) / 2;
  const avImg = getAvatarImage(avatarUrl);
  if (avImg) {
    drawAvatarImage(ctx, avImg, avX, avY, AVATAR_S, role.color);
  } else {
    drawDefaultAvatar(ctx, avX, avY, AVATAR_S, role.color);
  }

  /* ── Text region ──────────────────────────────────────────── */
  const textX = avX + AVATAR_S + 8;
  const textW = CARD_W - CARD_PAD - (AVATAR_S + 8) - CARD_PAD;

  // Username
  ctx.fillStyle = '#f7f7f7';
  ctx.font = 'bold 15px Tahoma, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const displayName = username.length > 14 ? username.slice(0, 13) + '…' : username;
  ctx.fillText(displayName, textX, cy + 5);

  // Role title + level badge
  ctx.fillStyle = role.color;
  ctx.font = '11px Tahoma, sans-serif';
  const roleLabel = `${role.name}  LV.${level}`;
  ctx.fillText(roleLabel, textX, cy + 31);

  /* ── XP progress bar ──────────────────────────────────────── */
  const barX = textX;
  const barY = cy + 57;
  const barW = textW;
  const barH = 10;

  // Track
  ctx.fillStyle = 'rgba(255,255,255,0.34)';
  ctx.fillRect(barX, barY, barW, barH);

  // Fill
  const fillW = xpFrac > 0 ? Math.max(2, Math.round(barW * xpFrac)) : 0;
  ctx.fillStyle = rgbStr(rr, rg, rb, 0.6 + Math.sin(time * 3) * 0.1);
  if (fillW > 0) ctx.fillRect(barX, barY, fillW, barH);

  // Border
  ctx.strokeStyle = rgbStr(rr, rg, rb, 0.3);
  ctx.lineWidth = 1;
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);

  // XP label
  ctx.font = '10px Tahoma, sans-serif';
  if (isGuest) {
    ctx.fillStyle = 'rgba(37,80,141,0.92)';
    ctx.textAlign = 'left';
    const ctaText = fitText(ctx, options?.guestCta || DEFAULT_GUEST_CTA, barW);
    ctx.fillText(ctaText, barX, barY + barH + 12);
  } else {
    ctx.fillStyle = 'rgba(89,89,89,0.88)';
    ctx.textAlign = 'right';
    ctx.fillText(`${xpIntoLevel}/${xpToNextLevel} XP`, barX + barW, barY + barH + 12);
  }
}

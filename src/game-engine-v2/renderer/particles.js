const MAX_PARTICLES = 42;

function pushParticle(renderer, particle) {
  renderer.particles.push(particle);

  if (renderer.particles.length > MAX_PARTICLES) {
    renderer.particles.splice(0, renderer.particles.length - MAX_PARTICLES);
  }
}

export function drawParticles(renderer) {
  if (!renderer.settings.particleEffects) return;

  const particleCount = renderer.particles.length;
  const heavyLoad = particleCount > 20;
  const ultraLoad = particleCount > 32;
  const renderBudget = ultraLoad ? 18 : heavyLoad ? 26 : Number.POSITIVE_INFINITY;
  const decayMultiplier = ultraLoad ? 1.8 : heavyLoad ? 1.35 : 1;
  let renderedParticles = 0;

  for (let i = renderer.particles.length - 1; i >= 0; i--) {
    const particle = renderer.particles[i];
    particle.life -= (particle.decay || 0.02) * decayMultiplier;

    if (particle.life <= 0) {
      renderer.particles.splice(i, 1);
      continue;
    }

    particle.x += particle.vx;
    particle.y += particle.vy;
    if (particle.gravity !== false) {
      particle.vy += particle.gravityStr || 0.1;
    }

    if (renderedParticles >= renderBudget) {
      continue;
    }
    renderedParticles += 1;

    renderer.ctx.globalAlpha = Math.max(0, particle.life);

    if (ultraLoad || (heavyLoad && particle.shape !== 'square')) {
      const s = Math.max(1.5, particle.size * Math.max(0.45, particle.life * 0.7));
      renderer.ctx.fillStyle = particle.color;
      renderer.ctx.fillRect(particle.x - s / 2, particle.y - s / 2, s, s);
      continue;
    }

    if (particle.shape === 'square') {
      const s = particle.size * particle.life;
      renderer.ctx.fillStyle = particle.color;
      renderer.ctx.fillRect(particle.x - s / 2, particle.y - s / 2, s, s);
    } else if (particle.shape === 'line') {
      renderer.ctx.strokeStyle = particle.color;
      renderer.ctx.lineWidth = Math.max(1, particle.size * 0.35 * particle.life);
      renderer.ctx.beginPath();
      const len = particle.size * 2.2 * particle.life;
      const angle = particle.angle || 0;
      renderer.ctx.moveTo(particle.x, particle.y);
      renderer.ctx.lineTo(particle.x + Math.cos(angle) * len, particle.y + Math.sin(angle) * len);
      renderer.ctx.stroke();
    } else if (particle.shape === 'ring') {
      const progress = 1 - particle.life;
      const radius = (particle.radius || particle.size) * progress + particle.size * 0.5;
      renderer.ctx.strokeStyle = particle.color;
      renderer.ctx.lineWidth = Math.max(1, particle.size * particle.life);
      renderer.ctx.beginPath();
      renderer.ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      renderer.ctx.stroke();
    } else {
      renderer.ctx.beginPath();
      renderer.ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
      renderer.ctx.fillStyle = particle.color;
      renderer.ctx.fill();
    }
  }

  renderer.ctx.globalAlpha = 1;
}

export function createExplosion(renderer, x, y, color) {
  if (!renderer.settings.explosionEffects) return;
  if (!renderer.settings.particleEffects) return;
  if (renderer.performanceTier !== 'normal') return;

  const packId = renderer.settings.deathFxPack?.id || 'default';

  switch (packId) {
    case 'pixel-burst':
      createPixelBurstExplosion(renderer, x, y, color);
      break;
    case 'circuit-break':
      createCircuitBreakExplosion(renderer, x, y, color);
      break;
    case 'plasma-nova':
      createPlasmaNova(renderer, x, y, color);
      break;
    case 'ember-drift':
      createEmberDriftExplosion(renderer, x, y, color);
      break;
    case 'void-collapse':
      createVoidCollapseExplosion(renderer, x, y, color);
      break;
    default:
      createDefaultExplosion(renderer, x, y, color);
  }
}

function createDefaultExplosion(renderer, x, y, color) {
  const count = 10;
  for (let i = 0; i < count; i++) {
    const angle = ((Math.PI * 2) / count) * i;
    const speed = 2 + Math.random() * 2;
    pushParticle(renderer, {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 4,
      color,
      life: 1,
    });
  }
}

function createPixelBurstExplosion(renderer, x, y, color) {
  const altColors = [color, '#FFFFFF', '#FFE566'];
  const count = 14;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3.5;
    pushParticle(renderer, {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 6,
      color: altColors[i % altColors.length],
      life: 1,
      shape: 'square',
      decay: 0.022,
    });
  }
}

function createCircuitBreakExplosion(renderer, x, y, color) {
  const count = 10;
  for (let i = 0; i < count; i++) {
    const angle = ((Math.PI * 2) / count) * i + Math.random() * 0.3;
    const speed = 2 + Math.random() * 2.5;
    pushParticle(renderer, {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 6 + Math.random() * 5,
      color: i % 2 === 0 ? color : '#00F7FF',
      life: 1,
      shape: 'line',
      angle,
      gravity: false,
      decay: 0.018,
    });
  }
}

function createPlasmaNova(renderer, x, y, color) {
  // Central white flash
  pushParticle(renderer, {
    x,
    y,
    vx: 0,
    vy: 0,
    size: 7,
    color: '#FFFFFF',
    life: 1,
    shape: 'circle',
    decay: 0.09,
    gravity: false,
  });
  // Expanding rings
  const ringColors = [color, '#FFFFFF', color];
  for (let r = 0; r < ringColors.length; r++) {
    pushParticle(renderer, {
      x,
      y,
      vx: 0,
      vy: 0,
      size: 3 - r * 0.5,
      radius: 10 + r * 8,
      color: ringColors[r],
      life: 1,
      shape: 'ring',
      gravity: false,
      decay: 0.026 + r * 0.008,
    });
  }
  // Outer burst particles
  for (let i = 0; i < 8; i++) {
    const angle = ((Math.PI * 2) / 8) * i;
    pushParticle(renderer, {
      x,
      y,
      vx: Math.cos(angle) * 2.8,
      vy: Math.sin(angle) * 2.8,
      size: 3 + Math.random() * 2,
      color,
      life: 1,
      shape: 'circle',
      gravity: false,
      decay: 0.024,
    });
  }
}

function createEmberDriftExplosion(renderer, x, y, color) {
  const emberColors = ['#FF6B00', '#FF9E00', '#FFDD44', color];
  const count = 14;
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
    const speed = 0.7 + Math.random() * 2;
    pushParticle(renderer, {
      x: x + (Math.random() - 0.5) * 10,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2,
      size: 2 + Math.random() * 3.5,
      color: emberColors[i % emberColors.length],
      life: 1,
      shape: 'circle',
      gravityStr: -0.04,
      decay: 0.011,
    });
  }
}

function createVoidCollapseExplosion(renderer, x, y, _color) {
  // Central white flash
  pushParticle(renderer, {
    x,
    y,
    vx: 0,
    vy: 0,
    size: 12,
    color: '#FFFFFF',
    life: 1,
    shape: 'circle',
    gravity: false,
    decay: 0.14,
  });
  // Dark imploding fragments
  const count = 10;
  const voidColor = '#3B0F6E';
  for (let i = 0; i < count; i++) {
    const angle = ((Math.PI * 2) / count) * i;
    const speed = 2 + Math.random() * 2;
    // Shoot out briefly then they just fade (implode illusion via fast decay)
    pushParticle(renderer, {
      x,
      y,
      vx: Math.cos(angle) * speed * 0.4,
      vy: Math.sin(angle) * speed * 0.4,
      size: 4 + Math.random() * 4,
      color: i % 3 === 0 ? '#FFFFFF' : voidColor,
      life: 1,
      shape: 'circle',
      gravity: false,
      decay: 0.04,
    });
  }
}

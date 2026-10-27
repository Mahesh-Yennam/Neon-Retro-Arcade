/**
 * NEON RETRO ARCADE - Core Game Engine
 * Pure Vanilla JavaScript & HTML5 Canvas with Synthesized Web Audio
 */

(function () {
  'use strict';

  // --- Canvas Setup ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let width = 800;
  let height = 600;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    width = 800;
    height = 600;
    canvas.width = width;
    canvas.height = height;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // --- Synthesized Web Audio Engine (Zero External MP3 Dependencies) ---
  let audioCtx = null;
  let isMuted = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type, duration, startVol = 0.2) {
    if (isMuted || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(startVol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fallback silent
    }
  }

  function playSound(type) {
    if (isMuted) return;
    initAudio();
    if (type === 'catch') {
      playTone(520, 'sine', 0.12, 0.15);
      setTimeout(() => playTone(780, 'sine', 0.15, 0.2), 60);
    } else if (type === 'powerup') {
      playTone(400, 'triangle', 0.1, 0.2);
      setTimeout(() => playTone(600, 'triangle', 0.1, 0.2), 70);
      setTimeout(() => playTone(900, 'triangle', 0.2, 0.25), 140);
    } else if (type === 'hit') {
      playTone(180, 'sawtooth', 0.2, 0.3);
      setTimeout(() => playTone(90, 'sawtooth', 0.3, 0.3), 100);
    } else if (type === 'gameover') {
      playTone(300, 'sawtooth', 0.2, 0.3);
      setTimeout(() => playTone(220, 'sawtooth', 0.3, 0.3), 180);
      setTimeout(() => playTone(140, 'sawtooth', 0.5, 0.35), 380);
    }
  }

  // --- Game State ---
  let isRunning = false;
  let isPaused = false;
  let score = 0;
  let highScore = parseInt(localStorage.getItem('neon_retro_highscore') || '0', 10);
  let lives = 3;
  let combo = 1;
  let comboTimer = 0;

  // Modifiers
  let hasShield = false;
  let slowMoTimer = 0;

  // UI Elements
  const scoreVal = document.getElementById('scoreVal');
  const highVal = document.getElementById('highVal');
  const livesVal = document.getElementById('livesVal');
  const comboVal = document.getElementById('comboVal');

  const startOverlay = document.getElementById('startOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const finalScoreEl = document.getElementById('finalScore');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const muteBtn = document.getElementById('muteBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');

  if (highVal) highVal.textContent = highScore;

  // Initialize Pause Button State (Disabled before game begins)
  if (pauseBtn) {
    pauseBtn.disabled = true;
    pauseBtn.style.opacity = '0.4';
    pauseBtn.style.pointerEvents = 'none';
  }

  // --- Player Object ---
  const player = {
    x: width / 2,
    y: height - 55,
    w: 70,
    h: 18,
    speed: 9,
    color: '#06b6d4',
    moveLeft: false,
    moveRight: false,
  };

  // --- Entities Arrays ---
  let items = [];
  let particles = [];
  let spawnTimer = 0;
  let baseSpeed = 3.2;

  // Synthwave Background Grid
  let gridOffset = 0;

  // --- Controls & Input Listeners ---
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') player.moveLeft = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') player.moveRight = true;
    if (e.code === 'KeyP') togglePause();
    if (e.code === 'KeyR' && !isRunning) startGame();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') player.moveLeft = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') player.moveRight = false;
  });

  // Mouse / Pointer Controls
  canvas.addEventListener('pointermove', (e) => {
    if (!isRunning || isPaused) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const targetX = (e.clientX - rect.left) * scaleX;
    player.x = Math.max(player.w / 2, Math.min(width - player.w / 2, targetX));
  });

  // Mobile On-Screen Touch Buttons
  const touchLeft = document.getElementById('touchLeft');
  const touchRight = document.getElementById('touchRight');

  if (touchLeft && touchRight) {
    const startLeft = (e) => { e.preventDefault(); player.moveLeft = true; };
    const endLeft = (e) => { e.preventDefault(); player.moveLeft = false; };
    const startRight = (e) => { e.preventDefault(); player.moveRight = true; };
    const endRight = (e) => { e.preventDefault(); player.moveRight = false; };

    touchLeft.addEventListener('pointerdown', startLeft);
    touchLeft.addEventListener('pointerup', endLeft);
    touchLeft.addEventListener('pointerleave', endLeft);

    touchRight.addEventListener('pointerdown', startRight);
    touchRight.addEventListener('pointerup', endRight);
    touchRight.addEventListener('pointerleave', endRight);
  }

  // --- Particle FX ---
  function spawnSparks(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1.5,
        color: color,
        life: 1,
        decay: Math.random() * 0.04 + 0.02,
      });
    }
  }

  // --- Item Spawner ---
  function spawnItem() {
    const rand = Math.random();
    let type = 'orb'; // 65% regular orb
    let color = '#06b6d4';
    let radius = 14;

    if (rand < 0.28) {
      type = 'hazard'; // 28% hazard spike
      color = '#f43f5e';
      radius = 16;
    } else if (rand < 0.35) {
      type = 'shield'; // 7% shield
      color = '#a855f7';
      radius = 15;
    } else if (rand < 0.42) {
      type = 'slowmo'; // 7% slow motion
      color = '#10b981';
      radius = 15;
    }

    const currentSpeed = (slowMoTimer > 0) ? (baseSpeed * 0.55) : baseSpeed;

    items.push({
      x: Math.random() * (width - 60) + 30,
      y: -25,
      radius: radius,
      color: color,
      type: type,
      speed: currentSpeed + Math.random() * 1.2,
      pulse: 0,
    });
  }

  // --- Core Game Functions ---
  function startGame() {
    initAudio();
    isRunning = true;
    isPaused = false;
    score = 0;
    lives = 3;
    combo = 1;
    comboTimer = 0;
    hasShield = false;
    slowMoTimer = 0;
    baseSpeed = 3.2;
    items = [];
    particles = [];

    updateHUD();

    // Enable Pause Button during active game
    if (pauseBtn) {
      pauseBtn.disabled = false;
      pauseBtn.innerHTML = '⏸️ Pause';
      pauseBtn.style.opacity = '1';
      pauseBtn.style.pointerEvents = 'auto';
    }

    startOverlay?.classList.add('hidden');
    gameOverOverlay?.classList.add('hidden');
  }

  function gameOver() {
    isRunning = false;
    isPaused = false;
    playSound('gameover');

    // Disable Pause Button on Game Over
    if (pauseBtn) {
      pauseBtn.disabled = true;
      pauseBtn.innerHTML = '⏸️ Pause';
      pauseBtn.style.opacity = '0.4';
      pauseBtn.style.pointerEvents = 'none';
    }
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('neon_retro_highscore', highScore.toString());
      if (highVal) highVal.textContent = highScore;
    }
    if (finalScoreEl) finalScoreEl.textContent = score;
    gameOverOverlay?.classList.remove('hidden');
  }

  function togglePause() {
    if (!isRunning) return;
    isPaused = !isPaused;
    if (pauseBtn) {
      pauseBtn.innerHTML = isPaused ? '▶️ Resume' : '⏸️ Pause';
    }
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (muteBtn) {
      muteBtn.innerHTML = isMuted ? '🔇 Muted' : '🔊 Sound';
    }
  }

  function updateHUD() {
    if (scoreVal) scoreVal.textContent = score;
    if (comboVal) comboVal.textContent = combo + 'x';
    if (livesVal) {
      let hearts = '';
      for (let i = 0; i < lives; i++) hearts += '❤️';
      if (hasShield) hearts += ' 🛡️';
      livesVal.textContent = hearts || '💀';
    }
  }

  // --- Main Update Loop ---
  function update() {
    if (!isRunning || isPaused) return;

    // Background Grid Motion
    gridOffset = (gridOffset + 1.5) % 40;

    // Player Movement
    if (player.moveLeft) {
      player.x -= player.speed;
    }
    if (player.moveRight) {
      player.x += player.speed;
    }
    player.x = Math.max(player.w / 2, Math.min(width - player.w / 2, player.x));

    // SlowMo Timer
    if (slowMoTimer > 0) {
      slowMoTimer--;
    }

    // Combo Timer Decay
    if (comboTimer > 0) {
      comboTimer--;
      if (comboTimer === 0) {
        combo = 1;
        updateHUD();
      }
    }

    // Spawn Logic
    spawnTimer++;
    const spawnRate = Math.max(25, 60 - Math.floor(score / 500));
    if (spawnTimer >= spawnRate) {
      spawnItem();
      spawnTimer = 0;
    }

    // Progressive speed scaling
    baseSpeed = 3.2 + Math.min(5.5, score / 1200);

    // Update Items
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += (slowMoTimer > 0) ? it.speed * 0.55 : it.speed;
      it.pulse += 0.08;

      // Collision Detection with Player
      const px = player.x;
      const py = player.y;
      const dist = Math.hypot(it.x - px, it.y - py);

      if (dist < it.radius + player.w / 2.2 && it.y >= player.y - 12 && it.y <= player.y + player.h + 5) {
        if (it.type === 'orb') {
          score += 100 * combo;
          combo = Math.min(5, combo + 1);
          comboTimer = 180; // 3 seconds to keep combo
          playSound('catch');
          spawnSparks(it.x, it.y, it.color, 16);
        } else if (it.type === 'shield') {
          hasShield = true;
          playSound('powerup');
          spawnSparks(it.x, it.y, '#a855f7', 20);
        } else if (it.type === 'slowmo') {
          slowMoTimer = 360; // 6 seconds of slow motion
          playSound('powerup');
          spawnSparks(it.x, it.y, '#10b981', 20);
        } else if (it.type === 'hazard') {
          if (hasShield) {
            hasShield = false;
            playSound('hit');
            spawnSparks(it.x, it.y, '#a855f7', 22);
          } else {
            lives--;
            combo = 1;
            comboTimer = 0;
            playSound('hit');
            spawnSparks(it.x, it.y, '#f43f5e', 26);
            if (lives <= 0) {
              gameOver();
            }
          }
        }
        updateHUD();
        items.splice(i, 1);
        continue;
      }

      // Missed at bottom
      if (it.y > height + 30) {
        if (it.type === 'orb') {
          // Missed orb breaks combo
          combo = 1;
          updateHUD();
        }
        items.splice(i, 1);
      }
    }

    // Update Particles
    for (let p = particles.length - 1; p >= 0; p--) {
      const pt = particles[p];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= pt.decay;
      if (pt.life <= 0) {
        particles.splice(p, 1);
      }
    }
  }

  // --- Render Loop ---
  function draw() {
    ctx.clearRect(0, 0, width, height);

    // 1. Synthwave Background Horizon Grid
    ctx.save();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 1.5;

    // Vertical Perspective Grid Lines
    const gridCols = 18;
    for (let c = 0; c <= gridCols; c++) {
      const gx = (width / gridCols) * c;
      ctx.beginPath();
      ctx.moveTo(gx, height * 0.45);
      ctx.lineTo((gx - width / 2) * 2 + width / 2, height);
      ctx.stroke();
    }

    // Horizontal Scrolling Horizon Lines
    for (let y = height * 0.45; y <= height; y += 22) {
      const shiftedY = y + gridOffset * 0.55;
      if (shiftedY <= height) {
        ctx.beginPath();
        ctx.moveTo(0, shiftedY);
        ctx.lineTo(width, shiftedY);
        ctx.stroke();
      }
    }

    // Sun / Horizon glow
    const gradSun = ctx.createRadialGradient(width / 2, height * 0.45, 10, width / 2, height * 0.45, 180);
    gradSun.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
    gradSun.addColorStop(0.5, 'rgba(6, 182, 212, 0.1)');
    gradSun.addColorStop(1, 'transparent');
    ctx.fillStyle = gradSun;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // 2. Draw Falling Items
    items.forEach(it => {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = it.color;

      if (it.type === 'hazard') {
        // Red Diamond Spike
        ctx.fillStyle = it.color;
        ctx.beginPath();
        ctx.moveTo(it.x, it.y - it.radius);
        ctx.lineTo(it.x + it.radius, it.y);
        ctx.lineTo(it.x, it.y + it.radius);
        ctx.lineTo(it.x - it.radius, it.y);
        ctx.closePath();
        ctx.fill();

        // Warning core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(it.x, it.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Glowing Orb / Powerup
        ctx.fillStyle = it.color;
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner glowing core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Powerup Icon Indicator
        if (it.type === 'shield') {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🛡️', it.x, it.y);
        } else if (it.type === 'slowmo') {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡', it.x, it.y);
        }
      }
      ctx.restore();
    });

    // 3. Draw Particles
    particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillStyle = pt.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 4. Draw Player Paddle / Ship
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;

    // Glowing base body
    const gradPlayer = ctx.createLinearGradient(player.x - player.w / 2, 0, player.x + player.w / 2, 0);
    gradPlayer.addColorStop(0, '#06b6d4');
    gradPlayer.addColorStop(0.5, '#ffffff');
    gradPlayer.addColorStop(1, '#a855f7');
    ctx.fillStyle = gradPlayer;

    ctx.beginPath();
    ctx.roundRect(player.x - player.w / 2, player.y, player.w, player.h, 8);
    ctx.fill();

    // Pulse core
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(player.x, player.y + player.h / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Shield Aura if active
    if (hasShield) {
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(player.x, player.y + player.h / 2, player.w * 0.75, 26, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Visual Paused State Overlay
    if (isPaused) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#06b6d4';
      ctx.font = '900 32px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#06b6d4';
      ctx.fillText('⏸️ GAME PAUSED', width / 2, height / 2 - 8);

      ctx.font = '600 15px Outfit, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.shadowBlur = 0;
      ctx.fillText('Press P or click Resume to continue playing', width / 2, height / 2 + 28);
    }
  }

  // --- Animation Frame Loop ---
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // --- Event Bindings ---
  startBtn?.addEventListener('click', startGame);
  restartBtn?.addEventListener('click', startGame);
  pauseBtn?.addEventListener('click', togglePause);
  muteBtn?.addEventListener('click', toggleMute);

  fullscreenBtn?.addEventListener('click', () => {
    const container = document.querySelector('.canvas-container');
    if (!document.fullscreenElement) {
      container?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });

  // Start the render loop
  requestAnimationFrame(loop);
})();

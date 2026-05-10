document.documentElement.classList.add("reveal-ready");

const revealItems = [...document.querySelectorAll("[data-reveal]")];

revealItems.forEach((item, index) => {
  item.style.setProperty("--delay", `${Math.min(index * 42, 260)}ms`);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      } else if (!entry.target.classList.contains("topbar")) {
        entry.target.classList.remove("is-visible");
      }
    });
  },
  { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
);

revealItems.forEach((item) => revealObserver.observe(item));

const magneticItems = [...document.querySelectorAll(".magnetic")];

magneticItems.forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    const rect = item.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    item.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
  });

  item.addEventListener("pointerleave", () => {
    item.style.transform = "";
  });
});

const canvas = document.getElementById("flowField");
const context = canvas.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const allowBackgroundFlow = !prefersReducedMotion;
let width = 0;
let height = 0;
let ratio = 1;
let paths = [];
let animationFrame = 0;

function resizeCanvas() {
  ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  seedPaths();
}

function seedPaths() {
  const count = Math.max(16, Math.floor(width / 70));
  paths = Array.from({ length: count }, (_, index) => ({
    x: (index / count) * width + Math.random() * 32,
    y: Math.random() * height,
    length: 70 + Math.random() * 120,
    speed: 0.18 + Math.random() * 0.32,
    phase: Math.random() * Math.PI * 2,
    hue: Math.random() > 0.5 ? "18, 46, 138" : "231, 45, 72"
  }));
}

function drawFlow(time = 0) {
  context.clearRect(0, 0, width, height);
  context.lineWidth = 1;

  paths.forEach((path) => {
    path.y += path.speed;
    if (path.y - path.length > height) {
      path.y = -path.length;
      path.x = Math.random() * width;
    }

    const drift = Math.sin(time * 0.001 + path.phase) * 26;
    const gradient = context.createLinearGradient(path.x, path.y - path.length, path.x + drift, path.y);
    gradient.addColorStop(0, `rgba(${path.hue}, 0)`);
    gradient.addColorStop(0.45, `rgba(${path.hue}, 0.12)`);
    gradient.addColorStop(1, "rgba(145, 207, 213, 0)");

    context.strokeStyle = gradient;
    context.beginPath();
    context.moveTo(path.x, path.y - path.length);
    context.bezierCurveTo(
      path.x + drift,
      path.y - path.length * 0.66,
      path.x - drift * 0.45,
      path.y - path.length * 0.28,
      path.x + drift * 0.72,
      path.y
    );
    context.stroke();
  });

  animationFrame = window.requestAnimationFrame(drawFlow);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

if (allowBackgroundFlow) {
  animationFrame = window.requestAnimationFrame(drawFlow);
}

window.addEventListener("beforeunload", () => {
  window.cancelAnimationFrame(animationFrame);
});

const splitTransition = document.querySelector("[data-video-transition]");
const splitLeftPanel = document.querySelector('[data-split-panel="left"]');
const splitRightPanel = document.querySelector('[data-split-panel="right"]');
const splitVideos = [...document.querySelectorAll(".split-video")];
const gameWall = document.querySelector("[data-game-wall]");
const coverColumns = [...document.querySelectorAll("[data-cover-column]")];
const motionOpening = document.querySelector("[data-motion-opening]");
const motionCards = [...document.querySelectorAll("[data-motion-card]")];
const motionVideos = motionCards.map((card) => card.querySelector("video")).filter(Boolean);
const motionDots = [...document.querySelectorAll("[data-motion-dot]")];
let scrollFrame = 0;
let hasTriedVideoPlayback = false;
let hasTriedMotionPlayback = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function ensureSplitVideoPlayback() {
  if (hasTriedVideoPlayback || splitVideos.length === 0) {
    return;
  }

  hasTriedVideoPlayback = true;
  splitVideos.forEach((video) => {
    video.muted = true;
    video.play().catch(() => {
      hasTriedVideoPlayback = false;
    });
  });
}

function syncSplitVideos() {
  const leadVideo = splitVideos[0];

  if (!leadVideo || leadVideo.readyState < 2) {
    return;
  }

  splitVideos.slice(1).forEach((video) => {
    if (video.readyState >= 2 && Math.abs(video.currentTime - leadVideo.currentTime) > 0.08) {
      video.currentTime = leadVideo.currentTime;
    }
  });
}

function ensureMotionVideoPlayback() {
  if (hasTriedMotionPlayback || motionVideos.length === 0) {
    return;
  }

  hasTriedMotionPlayback = true;
  motionVideos.forEach((video) => {
    video.muted = true;
    video.play().catch(() => {
      hasTriedMotionPlayback = false;
    });
  });
}

function updateMotionOpening(viewportHeight) {
  if (!motionOpening || motionCards.length === 0) {
    return;
  }

  const rect = motionOpening.getBoundingClientRect();
  const travel = Math.max(motionOpening.offsetHeight - viewportHeight, 1);
  const progress = clamp(-rect.top / travel, 0, 1);
  const cardCount = motionCards.length;
  const activeIndex = Math.min(cardCount - 1, Math.floor(progress * cardCount));

  motionOpening.style.setProperty("--motion-progress", progress.toFixed(4));
  motionOpening.style.setProperty("--motion-active", activeIndex);

  motionCards.forEach((card, index) => {
    const position = index - progress * (cardCount - 1);
    const isPast = position < -0.08;
    const distance = Math.abs(position);
    const y = isPast ? -82 - Math.min(100, distance * 80) : Math.min(76, position * 58);
    const x = isPast ? -22 : Math.max(-14, position * 12);
    const rotate = isPast ? -7 - Math.min(10, distance * 4) : position * -3.8;
    const scale = isPast ? 0.92 : 1 - Math.min(0.1, Math.max(0, position) * 0.055);
    const opacity = isPast ? Math.max(0, 1 + position * 1.6) : Math.max(0.48, 1 - Math.max(0, position) * 0.22);
    const zIndex = Math.round(100 - Math.max(0, position) * 8 - (isPast ? distance * 18 : 0));

    card.style.setProperty("--card-x", `${x.toFixed(2)}px`);
    card.style.setProperty("--card-y", `${y.toFixed(2)}px`);
    card.style.setProperty("--card-rotate", `${rotate.toFixed(3)}deg`);
    card.style.setProperty("--card-scale", scale.toFixed(4));
    card.style.setProperty("--card-opacity", opacity.toFixed(4));
    card.style.zIndex = zIndex;
  });

  motionDots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === activeIndex);
  });

  if (progress > 0.01 && progress < 0.99) {
    ensureMotionVideoPlayback();
  }
}

function updateScrollDrivenMotion() {
  scrollFrame = 0;
  const viewportHeight = window.innerHeight || 1;

  updateMotionOpening(viewportHeight);

  if (splitTransition && splitLeftPanel && splitRightPanel) {
    const transitionRect = splitTransition.getBoundingClientRect();
    const transitionTravel = Math.max(splitTransition.offsetHeight - viewportHeight, 1);
    const transitionProgress = clamp(-transitionRect.top / transitionTravel, 0, 1);
    const joinProgress = clamp(transitionProgress / 0.58, 0, 1);
    const easedProgress = 1 - Math.pow(1 - joinProgress, 3);
    const leftOffset = -100 + easedProgress * 100;
    const rightOffset = 100 - easedProgress * 100;

    splitTransition.style.setProperty("--join-progress", easedProgress.toFixed(4));
    splitLeftPanel.style.transform = `translate3d(${leftOffset.toFixed(3)}%, 0, 0)`;
    splitRightPanel.style.transform = `translate3d(${rightOffset.toFixed(3)}%, 0, 0)`;

    if (transitionProgress > 0.02 && transitionProgress < 0.99) {
      ensureSplitVideoPlayback();
    }
  }

  if (gameWall && coverColumns.length > 0) {
    const wallRect = gameWall.getBoundingClientRect();
    const wallProgress = clamp((viewportHeight - wallRect.top) / (viewportHeight + wallRect.height), 0, 1);
    const travel = Math.min(260, viewportHeight * 0.24);
    const offset = (wallProgress - 0.5) * travel;

    coverColumns.forEach((column, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      column.style.transform = `translate3d(0, ${(offset * direction).toFixed(2)}px, 0)`;
    });
  }
}

function requestScrollDrivenMotion() {
  if (scrollFrame) {
    return;
  }

  scrollFrame = window.requestAnimationFrame(updateScrollDrivenMotion);
}

splitVideos.forEach((video) => {
  video.addEventListener("loadedmetadata", syncSplitVideos, { once: true });
});

window.addEventListener("scroll", requestScrollDrivenMotion, { passive: true });
window.addEventListener("resize", requestScrollDrivenMotion);
window.setInterval(syncSplitVideos, 1200);
requestScrollDrivenMotion();

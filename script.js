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
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
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

if (!prefersReducedMotion) {
  animationFrame = window.requestAnimationFrame(drawFlow);
}

window.addEventListener("beforeunload", () => {
  window.cancelAnimationFrame(animationFrame);
});

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ITEMS, PROFILE } from "./content.js";

/* =====================================================================
   Pokój Damiana.
   Geometria i materiały: Blender (blender/build_room.py → assets/models/room.glb).
   Tutaj: światło nocne, teksty na ekranach/tablicy, jedna kamera, interakcje.
   ===================================================================== */

const $ = (s) => document.querySelector(s);
const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const MODEL_URL = "assets/models/room.glb";

document.querySelectorAll(".hud__role").forEach((el) => (el.textContent = PROFILE.tagline));
document.querySelectorAll(".intro__offer").forEach((el) => (el.textContent = PROFILE.intro));

const enterBtn = $("#enter");
const setLoading = (txt) => (enterBtn.textContent = txt);

/* =====================================================================
   Renderer, scene, the one camera
   ===================================================================== */
const canvas = $("#scene");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
} catch (e) {
  noWebGL();
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0c10);

const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 30);
const CAM = {
  base: new THREE.Vector3(0.25, 1.6, 1.3), // same framing as the Blender preview camera
  target: new THREE.Vector3(0.1, 1.2, -2.6),
  pos: new THREE.Vector3(),
  look: new THREE.Vector3(),
  focus: null,
};

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.55, 0.92);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* =====================================================================
   Night lighting: monitor, LED strips, city through the window
   ===================================================================== */
scene.add(new THREE.HemisphereLight(0x8fa3c8, 0x140f0b, 0.35));

function point(color, intensity, distance, pos, shadow = false) {
  const l = new THREE.PointLight(color, intensity, distance, 2);
  l.position.set(...pos);
  if (shadow) { l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -0.002; l.shadow.radius = 4; }
  scene.add(l);
  return l;
}
// monitor wash on the desk
point(0x9db8ff, 1.5, 2.4, [-0.25, 1.22, -2.25], true);
// warm bias LED behind the monitor
point(0xff8a3d, 3.2, 2.2, [-0.25, 1.45, -2.86]);
// shelf LED strips
[0.9, 1.37, 1.84, 2.31].forEach((y) => point(0xffb45e, 0.9, 1.3, [2.0, y - 0.1, -2.88]));
// city glow from the window (left wall)
point(0x7f9dff, 2.2, 4.5, [-2.75, 1.7, -1.25]);
// soft ceiling key for shadows and to read the room
const key = new THREE.SpotLight(0xffd6a0, 9, 6, 0.75, 0.7, 1.6);
key.position.set(0.3, 2.95, -1.4);
key.target.position.set(0.1, 0.6, -2.4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0006;
key.shadow.radius = 5;
scene.add(key, key.target);

/* Additive glow cards (fake light bleeding on the wall) */
function glowTex(kind) {
  return canvasTex(256, 256, (c, w, h) => {
    let g;
    if (kind === "wash") {
      g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.35)"); g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = "destination-in";
      g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.2, "rgba(0,0,0,1)"); g.addColorStop(0.8, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    } else {
      g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.4, "rgba(255,255,255,.4)"); g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
  }, { flip: true });
}
function glowCard(w, h, color, opacity, pos, kind = "radial") {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: glowTex(kind), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  );
  m.position.set(...pos);
  m.renderOrder = 2;
  scene.add(m);
  return m;
}
glowCard(2.2, 1.5, 0xff7a2a, 0.42, [-0.25, 1.35, -2.925]);
[0.9, 1.37, 1.84, 2.31].forEach((y) => glowCard(1.5, 0.45, 0xffa040, 0.32, [2.0, y - 0.27, -2.995], "wash"));

/* =====================================================================
   Canvas textures (text lives here so it is easy to edit)
   ===================================================================== */
function canvasTex(w, h, draw, { flip = false } = {}) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = flip; // glTF UVs expect flipY = false
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };

const TEX = {
  screen: () => canvasTex(2048, 840, (c, w, h) => {
    c.fillStyle = "#0f1115"; c.fillRect(0, 0, w, h);
    // left: terminal with Claude Code session
    const L = w * 0.5;
    c.fillStyle = "#171a20"; c.fillRect(0, 0, L, 54);
    ["#ff5f57", "#febc2e", "#28c840"].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(34 + i * 30, 27, 9, 0, 7); c.fill(); });
    c.fillStyle = "#8a8f98"; c.font = "500 24px 'JetBrains Mono', monospace"; c.fillText("~/portfolio — claude", 140, 35);
    const lines = [
      ["#8a8f98", "damian@pokoj:~/portfolio$ ", "#e8e6e3", "claude"],
      [],
      ["#e0915f", "> ", "#e8e6e3", "Zbuduj w Blenderze pokój z moimi"],
      ["#e8e6e3", "  projektami na półkach."],
      [],
      ["#e0915f", "● ", "#c9c5bf", "Plan: bpy → room.glb → Three.js"],
      ["#6bcf8e", "  ✓ ", "#c9c5bf", "Biurko, monitor, regał z LED"],
      ["#6bcf8e", "  ✓ ", "#c9c5bf", "Kręgosłup, JARVIS, planer, globus"],
      ["#6bcf8e", "  ✓ ", "#c9c5bf", "Test: desktop + telefon"],
      [],
      ["#8a8f98", "$ ", "#e8e6e3", "git push"],
    ];
    c.font = "500 34px 'JetBrains Mono', monospace";
    lines.forEach((parts, i) => {
      let x = 44; const y = 128 + i * 58;
      for (let p = 0; p < parts.length; p += 2) { c.fillStyle = parts[p]; c.fillText(parts[p + 1], x, y); x += c.measureText(parts[p + 1]).width; }
    });
    c.fillStyle = "#e0915f"; c.fillRect(150, 128 + 10 * 58 - 30, 18, 38);
    // divider
    c.fillStyle = "#23262d"; c.fillRect(L, 0, 4, h);
    // right: code editor with the Blender script
    c.fillStyle = "#13151a"; c.fillRect(L + 4, 0, w - L, h);
    c.fillStyle = "#171a20"; c.fillRect(L + 4, 0, w - L, 54);
    c.fillStyle = "#1f232b"; c.fillRect(L + 4, 0, 300, 54);
    c.fillStyle = "#e8e6e3"; c.font = "500 24px 'JetBrains Mono', monospace"; c.fillText("build_room.py", L + 30, 35);
    const code = [
      [["#c678dd", "with "], ["#e5c07b", "item"], ["#abb2bf", "("], ["#98c379", "\"anatomia\""], ["#abb2bf", ", on_shelf(1)):"]],
      [["#abb2bf", "    "], ["#61afef", "cyl"], ["#abb2bf", "("], ["#98c379", "\"sp_base\""], ["#abb2bf", ", "], ["#d19a66", "0.08"], ["#abb2bf", ", ...)"]],
      [["#abb2bf", "    "], ["#c678dd", "for "], ["#abb2bf", "i "], ["#c678dd", "in "], ["#61afef", "range"], ["#abb2bf", "(N):"]],
      [["#abb2bf", "        "], ["#7f848e", "# kręgi + dyski"]],
      [],
      [["#c678dd", "with "], ["#e5c07b", "item"], ["#abb2bf", "("], ["#98c379", "\"jarvis\""], ["#abb2bf", ", on_shelf(2)):"]],
      [["#abb2bf", "    "], ["#61afef", "box"], ["#abb2bf", "("], ["#98c379", "\"rb_head\""], ["#abb2bf", ", "], ["#d19a66", "0.19"], ["#abb2bf", ", ...)"]],
      [],
      [["#e5c07b", "bpy"], ["#abb2bf", ".ops.export_scene."], ["#61afef", "gltf"], ["#abb2bf", "("]],
      [["#abb2bf", "    filepath="], ["#98c379", "\"room.glb\""], ["#abb2bf", ")"]],
    ];
    c.font = "500 30px 'JetBrains Mono', monospace";
    code.forEach((parts, i) => {
      const y = 128 + i * 58;
      c.fillStyle = "#4b5263"; c.fillText(String(i + 1).padStart(2, " "), L + 30, y);
      let x = L + 100;
      parts.forEach(([col, t]) => { c.fillStyle = col; c.fillText(t, x, y); x += c.measureText(t).width; });
    });
  }),

  sky: () => canvasTex(512, 620, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#05070f"); g.addColorStop(0.55, "#101a33"); g.addColorStop(0.85, "#2a2547"); g.addColorStop(1, "#3c2c45");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) { c.fillStyle = `rgba(255,255,240,${Math.random() * 0.7})`; c.fillRect(Math.random() * w, Math.random() * h * 0.45, 1.5, 1.5); }
    c.fillStyle = "rgba(240,240,255,.9)"; c.beginPath(); c.arc(370, 110, 16, 0, 7); c.fill();
    const layer = (base, col, lit, minH, maxH) => {
      let x = -10;
      while (x < w) {
        const bw = 26 + Math.random() * 48, bh = minH + Math.random() * (maxH - minH);
        c.fillStyle = col; c.fillRect(x, h - bh, bw, bh);
        for (let yy = h - bh + 8; yy < h - 6; yy += 12) for (let xx = x + 5; xx < x + bw - 6; xx += 9)
          if (Math.random() < lit) { c.fillStyle = Math.random() < 0.8 ? "#ffcf7a" : "#9fd3ff"; c.fillRect(xx, yy, 4, 6); }
        x += bw + 2;
      }
    };
    layer(0, "#141a2c", 0.12, 160, 330);
    layer(0, "#0c1020", 0.22, 60, 200);
    // Sky Tower-like spire
    c.fillStyle = "#0e1426"; c.fillRect(250, h - 420, 40, 420); c.fillRect(266, h - 470, 8, 60);
    c.fillStyle = "#ff4d4d"; c.beginPath(); c.arc(270, h - 472, 4, 0, 7); c.fill();
  }),

  whiteboard: () => canvasTex(1200, 800, (c, w, h) => {
    c.fillStyle = "#f7f7f3"; c.fillRect(0, 0, w, h);
    c.font = "600 62px Caveat, cursive"; c.fillStyle = "#1e3a8a"; c.fillText("Jak usprawniam proces", 60, 96);
    const steps = [["1. Zgłoszenie", "#1e3a8a"], ["2. Dopytaj, o co", "#1e3a8a"], ["3. Zmierz, jak jest", "#b91c1c"], ["4. Najmniejsza zmiana", "#15803d"], ["5. Test", "#b91c1c"], ["6. Changelog + info", "#15803d"]];
    const pos = [[60, 160], [430, 160], [800, 160], [800, 450], [430, 450], [60, 450]];
    c.lineWidth = 5; c.lineJoin = "round";
    steps.forEach(([t, col], i) => {
      const [x, y] = pos[i];
      c.strokeStyle = col; c.beginPath(); c.moveTo(x + 4, y + 2); c.lineTo(x + 330, y - 3); c.lineTo(x + 334, y + 122); c.lineTo(x - 2, y + 126); c.closePath(); c.stroke();
      c.fillStyle = col; c.font = "600 44px Caveat, cursive"; c.fillText(t, x + 20, y + 76);
    });
    c.strokeStyle = "#333";
    const arrow = (x1, y1, x2, y2) => {
      c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 10, x2, y2); c.stroke();
      const a = Math.atan2(y2 - y1, x2 - x1);
      c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - 20 * Math.cos(a - 0.45), y2 - 20 * Math.sin(a - 0.45)); c.moveTo(x2, y2); c.lineTo(x2 - 20 * Math.cos(a + 0.45), y2 - 20 * Math.sin(a + 0.45)); c.stroke();
    };
    arrow(395, 222, 425, 222); arrow(765, 222, 795, 222); arrow(965, 292, 965, 445); arrow(795, 512, 765, 512); arrow(425, 512, 395, 512);
    c.fillStyle = "#b91c1c"; c.font = "600 46px Caveat, cursive"; c.fillText("cel: mniej kliknięć, szybciej, więcej zysku", 60, 700);
    c.strokeStyle = "#b91c1c"; c.lineWidth = 4; c.beginPath(); c.moveTo(60, 718); c.lineTo(810, 712); c.stroke();
  }),

  poster: () => canvasTex(1100, 625, (c, w, h) => {
    c.fillStyle = "#17222a"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#e9dcc3"; c.font = "500 34px 'JetBrains Mono', monospace"; c.fillText("git log --graph", 60, 80);
    c.fillStyle = "#7d8b93"; c.font = "500 22px 'JetBrains Mono', monospace"; c.fillText("~/damian", 60, 116);
    const Y = 330;
    const br = [
      { from: 170, to: 420, y: 220, col: "#5fc4bd", name: "anatomia-3d" },
      { from: 380, to: 640, y: 450, col: "#b98cff", name: "jarvis" },
      { from: 560, to: 820, y: 220, col: "#ef8f6a", name: "priorytet" },
      { from: 760, to: 1000, y: 450, col: "#8fd17a", name: "pokoj-3d" },
    ];
    c.lineWidth = 8; c.lineCap = "round";
    br.forEach((b) => {
      c.strokeStyle = b.col; c.beginPath(); c.moveTo(b.from, Y); c.bezierCurveTo(b.from + 50, Y, b.from + 20, b.y, b.from + 80, b.y);
      c.lineTo(b.to - 80, b.y); c.bezierCurveTo(b.to - 20, b.y, b.to - 50, Y, b.to, Y); c.stroke();
      for (let x = b.from + 110; x < b.to - 90; x += 70) { c.fillStyle = b.col; c.beginPath(); c.arc(x, b.y, 13, 0, 7); c.fill(); }
      c.fillStyle = b.col; c.font = "500 22px 'JetBrains Mono', monospace"; c.fillText(b.name, b.from + 90, b.y + (b.y < Y ? -28 : 46));
    });
    c.strokeStyle = "#f3c98b"; c.beginPath(); c.moveTo(60, Y); c.lineTo(w - 50, Y); c.stroke();
    for (let x = 90; x < w - 40; x += 85) { c.fillStyle = "#17222a"; c.beginPath(); c.arc(x, Y, 15, 0, 7); c.fill(); c.lineWidth = 6; c.stroke(); c.lineWidth = 8; }
    c.fillStyle = "#f3c98b"; c.font = "500 22px 'JetBrains Mono', monospace"; c.fillText("main", 60, Y - 30);
    c.fillStyle = "#7d8b93"; c.font = "500 20px 'JetBrains Mono', monospace"; c.fillText("każda zmiana: commit · test · changelog", 60, h - 40);
  }),

  planner: () => canvasTex(400, 540, (c, w, h) => {
    c.fillStyle = "#2a1548"; c.fillRect(0, 0, w, h);
    c.font = "italic 600 62px Fraunces, Georgia, serif"; c.fillStyle = "#f3dba0"; c.textAlign = "center";
    c.fillText("Moje", w / 2, 210); c.fillText("sprawy", w / 2, 280);
    c.strokeStyle = "#e7c26b"; c.lineWidth = 3; c.beginPath(); c.moveTo(90, 320); c.lineTo(w - 90, 320); c.stroke();
    c.fillStyle = "#b98cff"; c.beginPath(); c.ellipse(w / 2 - 18, 390, 26, 16, -0.6, 0, 7); c.ellipse(w / 2 + 18, 390, 26, 16, 0.6, 0, 7); c.fill();
    c.fillStyle = "#e7c26b"; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(30 + Math.random() * (w - 60), 30 + Math.random() * 110, 2.2, 0, 7); c.fill(); }
  }),

  sticky: (txt, col) => canvasTex(160, 160, (c, w, h) => {
    c.fillStyle = col; c.fillRect(0, 0, w, h);
    c.fillStyle = "#2b2b2b"; c.font = "600 32px Caveat, cursive"; c.textAlign = "center";
    txt.split("\n").forEach((l, i) => c.fillText(l, w / 2, 62 + i * 38));
  }),

  phone: () => canvasTex(200, 430, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#1f4e55"); g.addColorStop(1, "#0e0d0c");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = "#f6efe6"; c.textAlign = "center"; c.font = "600 50px Inter, sans-serif";
    c.fillText(new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }), w / 2, 110);
    c.fillStyle = "rgba(255,255,255,.14)"; rr(c, 16, 170, w - 32, 86, 16); c.fill();
    c.fillStyle = "#f3c98b"; c.font = "600 19px Inter, sans-serif"; c.fillText("Nowa wiadomość", w / 2, 204);
    c.fillStyle = "#f6efe6"; c.font = "500 17px Inter, sans-serif"; c.fillText("Porozmawiajmy?", w / 2, 232);
  }),

  spine: (title, bg) => canvasTex(72, 360, (c, w, h) => {
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.fillStyle = "rgba(255,255,255,.2)"; c.fillRect(0, 26, w, 4); c.fillRect(0, h - 30, w, 4);
    const light = parseInt(bg.slice(1, 3), 16) + parseInt(bg.slice(3, 5), 16) + parseInt(bg.slice(5, 7), 16) > 520;
    c.save(); c.translate(w / 2 + 9, h / 2); c.rotate(-Math.PI / 2);
    c.fillStyle = light ? "#2a1d0c" : "#f6efe6"; c.font = "600 28px Fraunces, Georgia, serif"; c.textAlign = "center"; c.fillText(title, 0, 0);
    c.restore();
  }),

  dashboard: () => canvasTex(1024, 700, (c, w, h) => {
    const g = c.createRadialGradient(w * 0.5, h * 0.55, 20, w * 0.5, h * 0.55, w * 0.7);
    g.addColorStop(0, "#1a1c2a"); g.addColorStop(1, "#05060a");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) { c.fillStyle = `rgba(220,225,255,${Math.random() * 0.6})`; c.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    // galaxy of notes
    const nodes = Array.from({ length: 26 }, (_, i) => {
      const a = i * 2.4, r = 40 + (i * 37) % 210;
      return [w * 0.55 + Math.cos(a) * r * 1.3, h * 0.55 + Math.sin(a) * r * 0.75];
    });
    c.strokeStyle = "rgba(160,180,255,.18)"; c.lineWidth = 1.5;
    nodes.forEach(([x, y], i) => { const [x2, y2] = nodes[(i * 7 + 3) % nodes.length]; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); });
    nodes.forEach(([x, y], i) => { c.fillStyle = ["#ffd98a", "#9fc3ff", "#7fe0c8", "#ffb3a0"][i % 4]; c.beginPath(); c.arc(x, y, i % 5 ? 3 : 6, 0, 7); c.fill(); });
    c.fillStyle = "#e9ecf5"; c.font = "500 40px Inter, sans-serif"; c.fillText("Dzień dobry, Damian.", 48, 76);
    c.fillStyle = "#8a90a6"; c.font = "500 17px 'JetBrains Mono', monospace"; c.fillText("CENTRUM DOWODZENIA · NEXUS", 50, 108);
    c.fillStyle = "#e9ecf5"; c.font = "500 54px 'JetBrains Mono', monospace"; c.textAlign = "right"; c.fillText("14:49", w - 40, 80); c.textAlign = "left";
    ["01  DZIŚ", "02  ROZKAZY", "03  BRIEF", "04  PROJEKTY", "05  SYSTEMY", "06  J.A.R.V.I.S."].forEach((t, i) => {
      c.fillStyle = "#c9cede"; c.font = "500 22px 'JetBrains Mono', monospace"; c.fillText(t, 50, 220 + i * 52);
    });
    c.fillStyle = "#8a90a6"; c.font = "500 15px 'JetBrains Mono', monospace"; c.fillText("TELEMETRIA", w - 210, 190);
    [["62", "WĘZŁÓW"], ["106", "POŁĄCZEŃ"], ["53", "NOTATEK"]].forEach(([n, l], i) => {
      c.fillStyle = "#e9ecf5"; c.font = "500 38px 'JetBrains Mono', monospace"; c.fillText(n, w - 210, 245 + i * 70);
      c.fillStyle = "#8a90a6"; c.font = "500 13px 'JetBrains Mono', monospace"; c.fillText(l, w - 210, 265 + i * 70);
    });
  }),

  insta: () => canvasTex(220, 460, (c, w, h) => {
    c.fillStyle = "#0f0f10"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#f5f5f5"; c.font = "600 15px Inter, sans-serif"; c.fillText("fizjio_anatomia", 14, 30);
    const g = c.createLinearGradient(14, 48, 70, 104); g.addColorStop(0, "#f9ce34"); g.addColorStop(0.5, "#ee2a7b"); g.addColorStop(1, "#6228d7");
    c.strokeStyle = g; c.lineWidth = 4; c.beginPath(); c.arc(44, 78, 26, 0, 7); c.stroke();
    c.fillStyle = "#2f8f8a"; c.beginPath(); c.arc(44, 78, 21, 0, 7); c.fill();
    c.fillStyle = "#f5f5f5"; c.font = "600 16px Inter, sans-serif"; c.textAlign = "center";
    [["18", "posty", 115], ["50", "obs.", 175]].forEach(([n, l, x]) => { c.fillText(n, x, 76); c.font = "500 11px Inter, sans-serif"; c.fillText(l, x, 93); c.font = "600 16px Inter, sans-serif"; });
    c.textAlign = "left";
    const cols = ["#7a2e2e", "#e7ddca", "#2f6f78", "#c9a14a", "#3d5a3c", "#a9573a", "#2a1548", "#b8623f", "#21424a"];
    for (let i = 0; i < 9; i++) {
      const x = 4 + (i % 3) * 71, y = 130 + Math.floor(i / 3) * 71;
      c.fillStyle = cols[i]; c.fillRect(x, y, 69, 69);
      c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 3; c.beginPath(); // stylised muscle
      c.ellipse(x + 34, y + 36, 10, 24, (i - 4) * 0.25, 0, 7); c.stroke();
    }
    c.fillStyle = "#f5f5f5"; c.font = "500 12px Inter, sans-serif"; c.fillText("● REC · rolka: naramienny", 14, 365);
  }),

  calendar: () => canvasTex(500, 712, (c, w, h) => {
    c.fillStyle = "#f3ede2"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#2f8f8a"; c.fillRect(0, 0, w, 110);
    c.fillStyle = "#f6efe6"; c.font = "600 44px Fraunces, Georgia, serif"; c.textAlign = "center"; c.fillText("Listopad", w / 2, 72);
    c.font = "500 18px Inter, sans-serif"; c.fillText("automatyczna synchronizacja", w / 2, 98);
    c.fillStyle = "#6b6157"; c.font = "600 18px Inter, sans-serif";
    ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].forEach((d, i) => c.fillText(d, 42 + i * 69, 148));
    const events = { 6: "#2f8f8a", 7: "#2f8f8a", 13: "#e0915f", 20: "#2f8f8a", 21: "#2f8f8a", 24: "#b98cff", 27: "#e0915f" };
    for (let d = 0; d < 30; d++) {
      const col = (d + 5) % 7, row = Math.floor((d + 5) / 7);
      const x = 12 + col * 69, y = 168 + row * 82;
      c.fillStyle = "#e7dfd1"; c.fillRect(x, y, 64, 76);
      c.fillStyle = "#3a332c"; c.font = "600 18px Inter, sans-serif"; c.textAlign = "left"; c.fillText(String(d + 1), x + 7, y + 22);
      if (events[d + 1]) { c.fillStyle = events[d + 1]; c.fillRect(x + 6, y + 34, 52, 12); c.fillRect(x + 6, y + 52, 36, 12); }
    }
    c.textAlign = "center"; c.fillStyle = "#b91c1c"; c.font = "600 30px Caveat, cursive";
    c.fillText("plan → kalendarz → zadania ⟳", w / 2, h - 22);
  }),

  invoice: () => canvasTex(420, 594, (c, w, h) => {
    c.fillStyle = "#f4efe4"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#1d1f1e"; c.font = "600 26px Fraunces, Georgia, serif"; c.fillText("Wezwanie do zapłaty", 30, 56);
    c.fillStyle = "#646b67"; c.font = "500 14px 'JetBrains Mono', monospace"; c.fillText("sprawa WIN/2026/0440", 30, 82);
    c.fillStyle = "#cfc8b9";
    for (let i = 0; i < 9; i++) c.fillRect(30, 120 + i * 22, i % 3 === 2 ? 220 : 340, 6);
    c.strokeStyle = "#cfc8b9"; c.lineWidth = 2; c.strokeRect(30, 330, 360, 120);
    [["Należność", "12 300,00 zł"], ["Wpłacono", "6 000,00 zł"], ["Do zapłaty", "6 300,00 zł"]].forEach(([a, b], i) => {
      c.fillStyle = "#3a3f3c"; c.font = "500 16px Inter, sans-serif"; c.fillText(a, 44, 366 + i * 34);
      c.font = "600 16px 'JetBrains Mono', monospace"; c.textAlign = "right"; c.fillText(b, 376, 366 + i * 34); c.textAlign = "left";
    });
    c.save(); c.translate(270, 520); c.rotate(-0.18);
    c.strokeStyle = "rgba(31,122,77,.85)"; c.lineWidth = 5; c.strokeRect(-110, -34, 220, 68);
    c.fillStyle = "rgba(31,122,77,.85)"; c.font = "700 26px Inter, sans-serif"; c.textAlign = "center"; c.fillText("ZAKSIĘGOWANO", 0, 10);
    c.restore();
  }),

  globe: () => canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = "#2c6f78"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#e2cf9e";
    const blob = (pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x * w, y * h) : c.moveTo(x * w, y * h))); c.closePath(); c.fill(); };
    blob([[.47, .18], [.53, .15], [.58, .2], [.55, .3], [.5, .33], [.46, .28]]);
    blob([[.47, .35], [.56, .34], [.6, .45], [.56, .7], [.52, .72], [.47, .5]]);
    blob([[.58, .15], [.8, .12], [.88, .25], [.78, .38], [.66, .4], [.6, .28]]);
    blob([[.12, .15], [.3, .1], [.33, .25], [.24, .36], [.2, .45], [.14, .3]]);
    blob([[.25, .5], [.32, .48], [.34, .6], [.29, .82], [.26, .7]]);
    blob([[.8, .62], [.9, .6], [.92, .72], [.82, .74]]);
    c.fillStyle = "#c0392b"; c.beginPath(); c.arc(0.515 * w, 0.215 * h, 6, 0, 7); c.fill();
    c.strokeStyle = "rgba(255,255,255,.18)";
    for (let i = 1; i < 8; i++) { c.beginPath(); c.moveTo(0, (i * h) / 8); c.lineTo(w, (i * h) / 8); c.stroke(); }
    for (let i = 1; i < 16; i++) { c.beginPath(); c.moveTo((i * w) / 16, 0); c.lineTo((i * w) / 16, h); c.stroke(); }
  }),
};

/* =====================================================================
   Load the Blender scene
   ===================================================================== */
const items = [];   // { id, root, anchor, center, hover, baseY, marker }
const anim = { globe: null, eyes: [] };

async function loadFonts() {
  const want = ["600 40px Caveat", "500 20px 'JetBrains Mono'", "600 40px Fraunces", "italic 600 40px Fraunces", "500 20px Inter", "600 20px Inter"];
  try { await Promise.race([Promise.all(want.map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]); } catch {}
}

function applyTextures(root) {
  const basic = (tex) => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const stickies = [["Anatomia\nlogin ✓", "#ffe48a"], ["JARVIS\ntesty ✓", "#c9b4ff"]];
  root.traverse((o) => {
    if (!o.isMesh) return;
    const n = o.name;
    if (n === "tex_screen") o.material = basic(TEX.screen());
    else if (n === "tex_sky") o.material = basic(TEX.sky());
    else if (n === "tex_phone") o.material = basic(TEX.phone());
    else if (n === "tex_dashboard") o.material = basic(TEX.dashboard());
    else if (n === "tex_invoice") o.material = new THREE.MeshStandardMaterial({ map: TEX.invoice(), roughness: 0.9 });
    else if (n === "tex_insta") o.material = basic(TEX.insta());
    else if (n === "tex_calendar") o.material = new THREE.MeshStandardMaterial({ map: TEX.calendar(), roughness: 0.85 });
    else if (n === "tex_whiteboard") o.material = new THREE.MeshStandardMaterial({ map: TEX.whiteboard(), roughness: 0.35 });
    else if (n === "tex_poster") o.material = new THREE.MeshStandardMaterial({ map: TEX.poster(), roughness: 0.8 });
    else if (n === "tex_planner") o.material = new THREE.MeshStandardMaterial({ map: TEX.planner(), roughness: 0.6 });
    else if (n.startsWith("tex_sticky")) { const [t, c] = stickies[+n.slice(-1)] || stickies[0]; o.material = new THREE.MeshStandardMaterial({ map: TEX.sticky(t, c), roughness: 0.9 }); }
    else if (n.startsWith("tex_spine")) {
      const title = o.userData.title || o.parent?.userData?.title || "";
      const bg = o.userData.bg || o.parent?.userData?.bg || "#444444";
      o.material = new THREE.MeshStandardMaterial({ map: TEX.spine(title, bg), roughness: 0.7 });
    } else if (n === "anim_globe") {
      o.material = new THREE.MeshStandardMaterial({ map: TEX.globe(), roughness: 0.5 });
      anim.globe = o;
    }
    if (n.startsWith("anim_eye")) anim.eyes.push(o);
  });
}

function registerItems(root) {
  const nodes = [];
  root.traverse((o) => { if (o.name.startsWith("item_")) nodes.push(o); });
  nodes.forEach((node) => {
    const id = node.name.replace(/^item_/, "").replace(/_\d+$/, "");
    if (!ITEM[id]) return;
    node.traverse((o) => {
      o.userData.itemId = id;
      if (o.isMesh) {
        const list = Array.isArray(o.material) ? o.material : [o.material];
        const cloned = list.map((m) => { const c = m.clone(); if (c.emissive) c.userData.baseEmissive = c.emissive.clone(); return c; });
        o.material = Array.isArray(o.material) ? cloned : cloned[0];
      }
    });
    node.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(node);
    items.push({
      id, root: node, hover: 0, baseY: node.position.y,
      anchor: new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y + 0.05, (box.min.z + box.max.z) / 2),
      center: box.getCenter(new THREE.Vector3()),
    });
  });
}

async function boot() {
  await loadFonts();
  const gltf = await new GLTFLoader().loadAsync(MODEL_URL, (e) => {
    if (e.total) setLoading(`Ładowanie pokoju… ${Math.round((e.loaded / e.total) * 100)}%`);
  });
  const room = gltf.scene;
  room.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = !o.name.startsWith("floor") && !o.name.startsWith("wall") && !o.name.startsWith("rug");
    o.receiveShadow = true;
    const m = o.material;
    if (m && m.transmission > 0) { m.transparent = true; m.opacity = 0.35; m.transmission = 0; }
  });
  applyTextures(room);
  scene.add(room);
  registerItems(room);
  buildMarkers();
  updateProgress();
  enterBtn.textContent = "Wejdź do pokoju";
  enterBtn.disabled = false;
}

/* =====================================================================
   Interaction: hover, click, markers, panel
   ===================================================================== */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(9, 9);
let hovered = null, openId = null;
const seen = new Set();
const tooltip = $("#tooltip");
const markersEl = $("#markers");
const order = () => ITEMS.map((i) => i.id).filter((id) => items.some((x) => x.id === id));

function buildMarkers() {
  items.forEach((it) => {
    const b = document.createElement("button");
    b.className = "marker";
    b.type = "button";
    b.setAttribute("aria-label", ITEM[it.id].label);
    b.addEventListener("click", (e) => { e.stopPropagation(); openItem(it.id); });
    b.addEventListener("mouseenter", () => { setHover(it); placeTooltip(project(it.anchor)); });
    b.addEventListener("mouseleave", () => setHover(null));
    markersEl.appendChild(b);
    it.marker = b;
  });
}

function setHover(it) {
  if (hovered === it) return;
  hovered = it;
  document.body.classList.toggle("is-hover", !!it);
  items.forEach((x) => x.marker?.classList.toggle("is-hot", x === it));
  if (it) { tooltip.textContent = ITEM[it.id].label; tooltip.classList.add("is-on"); }
  else tooltip.classList.remove("is-on");
}
function placeTooltip(p) { tooltip.style.left = `${p.x}px`; tooltip.style.top = `${p.y - 8}px`; }

const tmpV = new THREE.Vector3();
function project(v) {
  tmpV.copy(v).project(camera);
  return { x: (tmpV.x * 0.5 + 0.5) * innerWidth, y: (-tmpV.y * 0.5 + 0.5) * innerHeight, behind: tmpV.z > 1 };
}

function hitAt(clientX, clientY) {
  pointer.set((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(items.map((i) => i.root), true)[0];
  const id = hit?.object.userData.itemId;
  return id ? items.find((x) => x.id === id) : null;
}

canvas.addEventListener("pointermove", (e) => {
  parallax.tx = (e.clientX / innerWidth) * 2 - 1;
  parallax.ty = -(e.clientY / innerHeight) * 2 + 1;
  if (e.pointerType !== "mouse") return;
  const it = hitAt(e.clientX, e.clientY);
  setHover(it);
  if (it) placeTooltip({ x: e.clientX, y: e.clientY });
});
canvas.addEventListener("pointerleave", () => setHover(null));
let down = null;
canvas.addEventListener("pointerdown", (e) => (down = { x: e.clientX, y: e.clientY, pan: pan.tx }));
canvas.addEventListener("pointermove", (e) => {
  if (!down || !pan.max) return;
  const dx = e.clientX - down.x;
  pan.tx = THREE.MathUtils.clamp(down.pan - dx * 0.008, -pan.max, pan.max);
});
addEventListener("pointerup", () => setTimeout(() => (down = null)));
canvas.addEventListener("pointerup", (e) => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
  const it = hitAt(e.clientX, e.clientY);
  if (it) openItem(it.id);
  else if (openId) closePanel();
});

/* ---------------- panel ---------------- */
const panel = $("#panel");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function openItem(id) {
  const data = ITEM[id];
  if (!data) return;
  openId = id;
  seen.add(id);
  $("#panel-kind").textContent = data.kind || "";
  $("#panel-title").textContent = data.title;
  $("#panel-body").innerHTML = (data.body || []).map((p) => `<p>${esc(p)}</p>`).join("");
  const match = data.match || [];
  $("#panel-match-wrap").hidden = match.length === 0;
  $("#panel-match").innerHTML = match.map((m) => `<li>${esc(m)}</li>`).join("");
  $("#panel-links").innerHTML = (data.links || [])
    .map((l) => `<a href="${esc(l.url)}"${/^https?:/.test(l.url) ? ' target="_blank" rel="noopener"' : ""}>${esc(l.label)} ↗</a>`)
    .join("");
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
  panel.scrollTop = 0;
  document.body.classList.add("panel-open");
  CAM.focus = items.find((x) => x.id === id)?.center || null;
  if (CAM.focus && pan.max) pan.tx = THREE.MathUtils.clamp(CAM.focus.x - CAM.target.x, -pan.max, pan.max);
  setHover(null);
  updateProgress();
  closeList();
}
function closePanel() {
  openId = null;
  panel.classList.remove("is-open");
  panel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("panel-open");
  CAM.focus = null;
}
$(".panel__close").addEventListener("click", closePanel);
$("#prev").addEventListener("click", () => step(-1));
$("#next").addEventListener("click", () => step(1));
function step(d) { const o = order(); const i = o.indexOf(openId); openItem(o[(i + d + o.length) % o.length]); }
addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closePanel(); closeList(); }
  if (openId && e.key === "ArrowRight") step(1);
  if (openId && e.key === "ArrowLeft") step(-1);
});

/* ---------------- list ---------------- */
const listEl = $("#list"), listBtn = $("#list-btn");
function renderList() {
  const ids = items.length ? order() : ITEMS.map((i) => i.id);
  listEl.querySelector("ul").innerHTML = ids
    .map((id) => `<li class="${seen.has(id) ? "is-seen" : ""}"><button type="button" data-id="${id}"><span class="dot"></span>${esc(ITEM[id].label)}<small>${esc(ITEM[id].kind)}</small></button></li>`)
    .join("");
}
function closeList() { listEl.hidden = true; listBtn.setAttribute("aria-expanded", "false"); }
listBtn.addEventListener("click", () => {
  const open = listEl.hidden;
  renderList();
  listEl.hidden = !open;
  listBtn.setAttribute("aria-expanded", String(open));
});
listEl.addEventListener("click", (e) => { const b = e.target.closest("button[data-id]"); if (b) openItem(b.dataset.id); });

function updateProgress() {
  const n = seen.size, total = order().length || ITEMS.length;
  $("#progress-text").textContent = n === 0 ? (pan.max ? "Przesuń palcem i dotknij przedmiotu" : "Kliknij przedmiot, żeby go poznać") : n >= total ? "Wszystko odkryte. Dzięki za wizytę!" : `Odkryte: ${n} z ${total}`;
  $("#progress-bar").style.width = `${Math.min(1, n / total) * 100}%`;
  items.forEach((it) => it.marker?.classList.toggle("is-seen", seen.has(it.id)));
}

/* =====================================================================
   Framing: one camera, keep horizontal FOV, step back on tall screens
   ===================================================================== */
const parallax = { x: 0, y: 0, tx: 0, ty: 0 };
const view = { x: 0, y: 0 };
const pan = { x: 0, tx: 0, max: 0 };
let portrait = false;
let distScale = 1;
function resize() {
  const w = innerWidth, h = innerHeight, aspect = w / h;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloom.setSize(w / 2, h / 2);
  camera.aspect = aspect;
  const hHalf = THREE.MathUtils.degToRad(36); // matches the Blender preview camera (72° horizontal)
  let v = 2 * Math.atan(Math.tan(hHalf) / aspect);
  const maxV = THREE.MathUtils.degToRad(64);
  distScale = 1;
  portrait = aspect < 0.9;
  if (portrait) {
    // tall screens: closer crop, swipe sideways to look around (same single camera)
    v = THREE.MathUtils.degToRad(50);
    distScale = 1.05;
    if (!pan.max) pan.tx = pan.x = -0.3; // start centred on the desk
    pan.max = 2.0;
  } else {
    pan.max = 0; pan.tx = 0;
    if (v > maxV) { distScale = Math.min(1.9, Math.tan(v / 2) / Math.tan(maxV / 2)); v = maxV; }
  }
  camera.fov = THREE.MathUtils.radToDeg(v);
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

/* =====================================================================
   Loop
   ===================================================================== */
const clock = new THREE.Clock();
const desiredPos = new THREE.Vector3(), desiredLook = new THREE.Vector3();
const hoverTint = new THREE.Color(0x5a3c14);
CAM.pos.copy(CAM.base); CAM.look.copy(CAM.target);

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const k = 1 - Math.pow(0.001, dt);

  parallax.x += (parallax.tx - parallax.x) * k * 0.5;
  parallax.y += (parallax.ty - parallax.y) * k * 0.5;
  const dir = CAM.base.clone().sub(CAM.target);
  desiredPos.copy(CAM.target).addScaledVector(dir, distScale);
  desiredLook.copy(CAM.target);
  if (CAM.focus) {
    const f = portrait ? CAM.focus.clone().setX(CAM.focus.x - pan.x) : CAM.focus;
    desiredLook.lerp(f, portrait ? 0.35 : 0.7);
    desiredPos.lerp(f.clone().addScaledVector(dir.normalize(), 2.4 * distScale), portrait ? 0.15 : 0.2);
  }
  pan.x += (pan.tx - pan.x) * k * 0.5;
  desiredPos.x += pan.x; desiredLook.x += pan.x;
  if (!reduceMotion && !portrait) { desiredPos.x += parallax.x * 0.14; desiredPos.y += parallax.y * 0.07; }
  CAM.pos.lerp(desiredPos, k * 0.45);
  CAM.look.lerp(desiredLook, k * 0.45);
  camera.position.copy(CAM.pos);
  camera.lookAt(CAM.look);

  // keep the scene centred in the part of the screen the panel leaves free
  const wide = innerWidth > 700;
  const pr = panel.getBoundingClientRect();
  const tx = openId && wide ? (pr.width + 16) / 2 : 0;
  const ty = openId && !wide ? (pr.height + 8) / 2 : 0;
  view.x += (tx - view.x) * k * 0.6;
  view.y += (ty - view.y) * k * 0.6;
  if (Math.abs(view.x) + Math.abs(view.y) > 0.5) camera.setViewOffset(innerWidth, innerHeight, view.x, view.y, innerWidth, innerHeight);
  else camera.clearViewOffset();

  items.forEach((it) => {
    const target = hovered === it || openId === it.id ? 1 : 0;
    it.hover += (target - it.hover) * k * 0.5;
    it.root.position.y = it.baseY + (reduceMotion ? 0 : it.hover * 0.012);
    it.root.traverse((o) => {
      if (!o.isMesh) return;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
        if (m.userData.baseEmissive) m.emissive.copy(m.userData.baseEmissive).lerp(hoverTint, it.hover * 0.6);
      });
    });
    if (it.marker) {
      const p = project(it.anchor);
      it.marker.style.transform = `translate(${p.x}px, ${Math.max(p.y, 78)}px)`;
      it.marker.style.visibility = p.behind ? "hidden" : "visible";
    }
  });

  if (!reduceMotion) {
    if (anim.globe) anim.globe.rotation.y += dt * 0.25;
    const blink = t % 4.2 < 0.12 ? 0.12 : 1;
    anim.eyes.forEach((e) => { e.userData.sy ??= e.scale.y; e.scale.y = e.userData.sy * blink; });
  }

  composer.render();
  requestAnimationFrame(tick);
}

/* =====================================================================
   Boot
   ===================================================================== */
function noWebGL() {
  enterBtn.textContent = "Pokaż szybki przegląd";
  enterBtn.disabled = false;
  $(".intro__text").textContent = "Twoja przeglądarka nie obsługuje grafiki 3D (WebGL), więc pokażę wersję bez 3D.";
  enterBtn.addEventListener("click", () => window.__openQuick?.());
}

enterBtn.addEventListener("click", () => {
  if (!items.length) return;
  $("#intro").classList.add("is-gone");
  document.body.classList.add("is-ready");
});

boot().catch((err) => {
  console.error(err);
  setLoading("Nie udało się wczytać pokoju");
  $(".intro__text").textContent = "Coś poszło nie tak przy wczytywaniu modelu 3D. Odśwież stronę albo otwórz spis przedmiotów w prawym górnym rogu.";
});
requestAnimationFrame(tick);
window.__room = { openItem, closePanel, items, camera, scene };

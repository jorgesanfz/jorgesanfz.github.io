import * as THREE from "three";

// --- Setup ---

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.015);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(0, 8, 0);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// --- Colores ---

const GRID_COLOR = 0x00ff88;
const GRID_COLOR_DIM = 0x004422;
const AXIS_COLOR = 0x00ffaa;

// --- Malla infinita (se mueve con la camara) ---

function createGrid(size, divisions, color, opacity) {
  const geo = new THREE.BufferGeometry();
  const half = size / 2;
  const step = size / divisions;
  const vertices = [];

  for (let i = 0; i <= divisions; i++) {
    const pos = -half + i * step;
    // lineas en X
    vertices.push(-half, 0, pos, half, 0, pos);
    // lineas en Z
    vertices.push(pos, 0, -half, pos, 0, half);
  }

  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));

  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
  });

  return new THREE.LineSegments(geo, mat);
}

// Grid principal (cercano, mas brillante)
const gridMain = createGrid(200, 200, GRID_COLOR, 0.15);
scene.add(gridMain);

// Grid secundario (mayor escala, mas tenue)
const gridLarge = createGrid(200, 20, GRID_COLOR, 0.3);
scene.add(gridLarge);

// --- Ejes de referencia en el origen ---

function createAxisLine(start, end, color) {
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ]);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.5,
  });
  return new THREE.Line(geo, mat);
}

scene.add(createAxisLine([-100, 0, 0], [100, 0, 0], 0xff4444)); // X rojo
scene.add(createAxisLine([0, -100, 0], [0, 100, 0], 0x44ff44)); // Y verde
scene.add(createAxisLine([0, 0, -100], [0, 0, 100], 0x4488ff)); // Z azul

// --- Particulas flotantes ---

const PARTICLE_COUNT = 800;
const particlesGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
const particleSpeeds = new Float32Array(PARTICLE_COUNT);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  particlePositions[i * 3] = (Math.random() - 0.5) * 200;
  particlePositions[i * 3 + 1] = Math.random() * 30 + 0.5;
  particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
  particleSpeeds[i] = Math.random() * 0.5 + 0.1;
}

particlesGeo.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(particlePositions, 3)
);

const particlesMat = new THREE.PointsMaterial({
  color: GRID_COLOR,
  size: 0.15,
  transparent: true,
  opacity: 0.6,
  sizeAttenuation: true,
});

const particles = new THREE.Points(particlesGeo, particlesMat);
scene.add(particles);

// --- Objetos geometricos dispersos ---

const objectMaterial = new THREE.MeshBasicMaterial({
  color: GRID_COLOR,
  wireframe: true,
  transparent: true,
  opacity: 0.3,
});

const objects = [];
const geometries = [
  new THREE.IcosahedronGeometry(1.5, 0),
  new THREE.OctahedronGeometry(1.2, 0),
  new THREE.TetrahedronGeometry(1.5, 0),
  new THREE.TorusGeometry(1, 0.3, 8, 12),
  new THREE.BoxGeometry(1.5, 1.5, 1.5),
];

for (let i = 0; i < 30; i++) {
  const geo = geometries[Math.floor(Math.random() * geometries.length)];
  const mesh = new THREE.Mesh(geo, objectMaterial.clone());
  mesh.position.set(
    (Math.random() - 0.5) * 160,
    Math.random() * 15 + 1,
    (Math.random() - 0.5) * 160
  );
  mesh.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );
  mesh.userData.rotSpeed = {
    x: (Math.random() - 0.5) * 0.01,
    y: (Math.random() - 0.5) * 0.01,
    z: (Math.random() - 0.5) * 0.005,
  };
  scene.add(mesh);
  objects.push(mesh);
}

// --- Controles de camara ---

const keys = {};
let yaw = 0;
let pitch = -0.3;
let isPointerLocked = false;

document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// Pointer lock
renderer.domElement.addEventListener("click", () => {
  renderer.domElement.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
  isPointerLocked = document.pointerLockElement === renderer.domElement;
});

document.addEventListener("mousemove", (e) => {
  if (!isPointerLocked) return;
  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;
  pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch));
});

// --- Coordenadas HUD ---

const coordsEl = document.getElementById("coords");

// --- Resize ---

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Loop ---

const moveSpeed = 0.15;
const direction = new THREE.Vector3();
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Camara: rotacion
  camera.rotation.set(pitch, yaw, 0);

  // Movimiento relativo a la direccion de la camara
  direction.set(0, 0, 0);

  if (keys["KeyW"] || keys["ArrowUp"]) direction.z -= 1;
  if (keys["KeyS"] || keys["ArrowDown"]) direction.z += 1;
  if (keys["KeyA"] || keys["ArrowLeft"]) direction.x -= 1;
  if (keys["KeyD"] || keys["ArrowRight"]) direction.x += 1;
  if (keys["Space"]) direction.y += 1;
  if (keys["ShiftLeft"] || keys["ShiftRight"]) direction.y -= 1;

  if (direction.length() > 0) {
    direction.normalize().multiplyScalar(moveSpeed);

    // Rotar direccion segun yaw y pitch (sigue la direccion del raton)
    const forward = new THREE.Vector3(0, 0, direction.z);
    const right = new THREE.Vector3(direction.x, 0, 0);
    forward.applyEuler(camera.rotation);
    right.applyEuler(new THREE.Euler(0, yaw, 0, "YXZ"));

    camera.position.addScaledVector(forward, 1);
    camera.position.addScaledVector(right, 1);
    camera.position.y += direction.y * moveSpeed;
  }

  // Malla sigue la camara (efecto infinito)
  gridMain.position.x =
    Math.floor(camera.position.x / 1) * 1;
  gridMain.position.z =
    Math.floor(camera.position.z / 1) * 1;
  gridLarge.position.x =
    Math.floor(camera.position.x / 10) * 10;
  gridLarge.position.z =
    Math.floor(camera.position.z / 10) * 10;

  // Animar particulas
  const positions = particles.geometry.attributes.position.array;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3 + 1] += Math.sin(clock.elapsedTime * particleSpeeds[i] + i) * 0.003;
  }
  particles.geometry.attributes.position.needsUpdate = true;

  // Rotar objetos
  for (const obj of objects) {
    obj.rotation.x += obj.userData.rotSpeed.x;
    obj.rotation.y += obj.userData.rotSpeed.y;
    obj.rotation.z += obj.userData.rotSpeed.z;
  }

  // HUD coordenadas
  coordsEl.textContent = `x: ${camera.position.x.toFixed(1)}  y: ${camera.position.y.toFixed(1)}  z: ${camera.position.z.toFixed(1)}`;

  renderer.render(scene, camera);
}

animate();

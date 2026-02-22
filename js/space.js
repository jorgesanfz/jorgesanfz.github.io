import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

// --- Setup ---

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000510, 0.0002);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  1,
  10000
);
// Posición inicial: vista isométrica sobre la ciudad
camera.position.set(0, 800, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000510, 1);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05; // No permitir pasar debajo del suelo
controls.minDistance = 50;
controls.maxDistance = 2000;

// --- Colores y Materiales ---

const GRID_COLOR = 0x818cf8; // Tailwind Indigo-400
const BUILDING_COLOR = 0x4f46e5; // Tailwind Indigo-600
const BUILDING_GLOW = 0x818cf8;

// Ambient Light
scene.add(new THREE.AmbientLight(0x222233));

// Suelo - Grid Holográfico
const gridHelper = new THREE.GridHelper(5000, 250, 0x4f46e5, 0x1e1b4b);
gridHelper.position.y = -0.1;
scene.add(gridHelper);

// Material para los edificios
const buildingMaterial = new THREE.MeshBasicMaterial({
  color: 0x0f172a,
  transparent: true,
  opacity: 0.9,
});

const buildingLineMaterial = new THREE.LineBasicMaterial({
  color: BUILDING_GLOW,
  transparent: true,
  opacity: 0.3,
});

// --- Carga de Datos (GeoJSON Simplificado) ---

// Centro de referencia (Valencia centro aprox)
const refLon = -0.3763;
const refLat = 39.4699;
// Factor de escala (aprox metros por grado en estas latitudes)
const scaleX = 86000;
const scaleZ = 111000;

const buildingsGroup = new THREE.Group();
scene.add(buildingsGroup);

fetch('data/valencia_buildings.json')
  .then(res => res.json())
  .then(data => {
    console.log(`Cargando ${data.length} edificios...`);

    document.getElementById("coords").textContent = `CARGANDO DATOS 3D...`;

    const geometries = [];
    const edgeGeometries = [];

    data.forEach(coords => {
      if (coords.length < 3) return;

      const shape = new THREE.Shape();
      coords.forEach((point, i) => {
        const x = (point[0] - refLon) * scaleX;
        const z = -(point[1] - refLat) * scaleZ;

        if (i === 0) shape.moveTo(x, z);
        else shape.lineTo(x, z);
      });

      const height = 10 + Math.random() * 40; // Altura aleatoria para skyline
      const extrudeSettings = {
        depth: height,
        bevelEnabled: false,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.rotateX(-Math.PI / 2);

      geometries.push(geometry);

      // Líneas de contorno
      const edges = new THREE.EdgesGeometry(geometry);
      edgeGeometries.push(edges);
    });

    if (geometries.length > 0) {
      // Unir mallas sólidas
      const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
      const mergedMesh = new THREE.Mesh(mergedGeometry, buildingMaterial);
      buildingsGroup.add(mergedMesh);

      // Unir líneas de contorno (EdgesGeometry -> LineSegments)
      const mergedEdgesGeometry = BufferGeometryUtils.mergeGeometries(edgeGeometries);
      const mergedEdges = new THREE.LineSegments(mergedEdgesGeometry, buildingLineMaterial);
      buildingsGroup.add(mergedEdges);
    }

    console.log("Mapa 3D cargado completo y optimizado.");
    document.getElementById("coords").textContent = `DATOS DESPLEGADOS (Lat: ${refLat}, Lon: ${refLon})`;

    // Apuntar camara a la ciudad
    controls.target.set(0, 0, 0);

  })
  .catch(err => console.error("Error cargando el mapa:", err));

// --- Keyboard WASD Movement (Combined with OrbitControls) ---

const keys = { w: false, a: false, s: false, d: false };

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (keys.hasOwnProperty(key)) keys[key] = true;
});

document.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (keys.hasOwnProperty(key)) keys[key] = false;
});

const moveSpeed = 600; // Units per second
const velocity = new THREE.Vector3();

function updateCameraMovement(delta) {
  // Obtener la dirección frontal y lateral de la cámara plana (sin inclinación Y)
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(forward, camera.up).normalize();

  velocity.set(0, 0, 0);

  if (keys.w) velocity.add(forward);
  if (keys.s) velocity.sub(forward);
  if (keys.a) velocity.sub(right);
  if (keys.d) velocity.add(right);

  if (velocity.lengthSq() > 0) {
    velocity.normalize().multiplyScalar(moveSpeed * delta);

    // Mover tanto la cámara como el objetivo del OrbitControls para mantener la relación
    camera.position.add(velocity);
    controls.target.add(velocity);
  }
}

// --- Controles de HUD ---

const coordsEl = document.getElementById("coords");

const overlay = document.getElementById('space-overlay');
overlay.querySelector('h1').textContent = "VALENCIA 3D";
overlay.querySelector('p').textContent = "Exploración urbana generativa / WASD para moverte";
overlay.querySelector('button').textContent = "EXPLORAR DATOS";

// --- Resize ---

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Loop ---

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  updateCameraMovement(delta);
  controls.update();

  // Rotación lenta de la ciudad para un efecto cinemático si no hay interacción de mouse y no se pulsan teclas
  if (!controls.state && !keys.w && !keys.a && !keys.s && !keys.d && buildingsGroup.children.length > 0) {
    // Rotar alrededor del centro
    const angle = delta * 0.05;
    const x = camera.position.x;
    const z = camera.position.z;
    camera.position.x = x * Math.cos(angle) - z * Math.sin(angle);
    camera.position.z = z * Math.cos(angle) + x * Math.sin(angle);
    camera.lookAt(controls.target);
  }

  // Actualizar coordenadas HUD aprox
  if (frames % 10 === 0) {
    coordsEl.textContent = `Lat: ${(controls.target.z / -scaleZ + refLat).toFixed(4)} Lon: ${(controls.target.x / scaleX + refLon).toFixed(4)} Alt: ${Math.round(camera.position.y)}m`;
  }
  frames++;

  renderer.render(scene, camera);
}

let frames = 0;
animate();

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load the texture
//const textureLoader = new THREE.TextureLoader();
//const texture = textureLoader.load('path_to_your_texture.jpg'); // replace with your texture path

// Create the ground
var geo = new THREE.PlaneGeometry(2000, 2000, 8, 8);
var mat = new THREE.MeshBasicMaterial({
  // map: texture, // replace with your texture
  color: 0x007209,
  side: THREE.DoubleSide,
});
var plane = new THREE.Mesh(geo, mat);
plane.rotateX(-Math.PI / 2);
scene.add(plane);

// Create a road
//const roadTexture = textureLoader.load("path_to_road_texture.jpg"); // replace with your road texture path
const roadGeo = new THREE.PlaneGeometry(2000, 50, 8, 8);
const roadMat = new THREE.MeshBasicMaterial({
  //map: roadTexture,
  color: 0xffffff,
  side: THREE.DoubleSide,
});
const road = new THREE.Mesh(roadGeo, roadMat);
road.position.y = 0.1; // Position the road above the ground
road.rotateX(-Math.PI / 2);
road.rotateZ(Math.PI / 2);
scene.add(road);

// Create a cube
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x1100ff });
const cube = new THREE.Mesh(geometry, material);
cube.position.y = 1; // Position the cube above the ground
scene.add(cube);

camera.position.y = 5; // Move the camera up
camera.position.z = 10; // Move the camera back
camera.lookAt(0, 0, 0); // Make the camera look at the origin

const controls = new OrbitControls(camera, renderer.domElement);
// Limit vertical angle
controls.minPolarAngle = 0; // radians
controls.maxPolarAngle = Math.PI / 2; // radians

// Keyboard controls
const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
};

window.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowUp":
    case "w":
      keys.up = true;
      break;
    case "ArrowDown":
    case "s":
      keys.down = true;
      break;
    case "ArrowLeft":
    case "a":
      keys.left = true;
      break;
    case "ArrowRight":
    case "d":
      keys.right = true;
      break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "ArrowUp":
    case "w":
      keys.up = false;
      break;
    case "ArrowDown":
    case "s":
      keys.down = false;
      break;
    case "ArrowLeft":
    case "a":
      keys.left = false;
      break;
    case "ArrowRight":
    case "d":
      keys.right = false;
      break;
  }
});

function animate() {
  requestAnimationFrame(animate);

  //cube.rotation.x += 0.01;
  //cube.rotation.y += 0.01;

  if (keys.up || keys.down || keys.left || keys.right) {
    controls.enabled = false;
  } else {
    controls.enabled = true;
  }

  // Move the camera based on keys pressed
  const speed = 0.1;
  if (keys.up) cube.position.z -= speed;
  if (keys.down) cube.position.z += speed;
  if (keys.left) cube.position.x -= speed;
  if (keys.right) cube.position.x += speed;

  // Update the camera's position with the cube's position
  //camera.position.x = cube.position.x;
  //camera.position.y = cube.position.y + 5; // Offset the camera up by 5 units
  //camera.position.z = cube.position.z + 10; // Offset the camera back by 10 units

  //camera.lookAt(cube.position);

  // Create a point in front of the cube
  /*const lookAtPoint = new THREE.Vector3();
  lookAtPoint.copy(cube.position);
  lookAtPoint.add(cube.getWorldDirection().multiplyScalar(10)); // Adjust the scalar value to move the point further or closer to the cube

  // Make the camera look at the point in front of the cube
  camera.lookAt(lookAtPoint);*/

  controls.update();

  renderer.render(scene, camera);
}

animate();

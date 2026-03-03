import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './style.css';

// ----------------------
// Scene
// ----------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf8fafc); // Match --bg-page

// ----------------------
// Camera
// ----------------------
const getCanvasWidth = () => window.innerWidth;

const camera = new THREE.PerspectiveCamera(
  60,
  getCanvasWidth() / window.innerHeight,
  0.1,
  1000
);

// Better hero angle for 360 view
camera.position.set(6, 2, 6);
camera.lookAt(0, 0, 0);

// ----------------------
// Renderer
// ----------------------
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

renderer.setSize(getCanvasWidth(), window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

document.getElementById('app').appendChild(renderer.domElement);

// ----------------------
// Lighting
// ----------------------
// Lower ambient to create more contrast for the directional lights
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

// Soft top-down fill
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xf8fafc, 0.6);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

// Powerful Front Key Light (Directional)
const keyLight = new THREE.DirectionalLight(0xffffff, 2.5); // Increased intensity
keyLight.position.set(10, 10, 10);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);

// Dramatic SpotLight for that "studio scene" feel
const spotLight = new THREE.SpotLight(0xffffff, 80); // High intensity
// Position it high and slightly to the right to hit the front face
spotLight.position.set(-5, 8, 5);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.5; // Soft edges
spotLight.decay = 2;
spotLight.distance = 50;
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.bias = -0.0001;
scene.add(spotLight);

// The light needs a target to look at. We'll set it to look at the left side of the screen
// where the model is roughly positioned.
const targetObject = new THREE.Object3D();
targetObject.position.set(-8.5, 0, 0);
scene.add(targetObject);
spotLight.target = targetObject;

// Back Light to highlight edges and prevent flat shadowing
const backLight = new THREE.DirectionalLight(0xffffff, 1.5);
backLight.position.set(-10, 5, -5);
scene.add(backLight);

// Soft Side/Fill Light
const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-5, 2, 5);
scene.add(fillLight);

// ----------------------
// Model Loader
// ----------------------
const loader = new GLTFLoader();
let customModel;

loader.load(
  '/cashwater1.glb',
  (gltf) => {
    const model = gltf.scene;

    // Create pivot for rotation
    const pivot = new THREE.Group();
    scene.add(pivot);
    pivot.add(model);

    // Enable shadows
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // Center model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    // Initial Scale
    pivot.scale.set(1.3, 1.3, 1.3);

    customModel = pivot;
    customModel.position.x = targetX; // Start on the right
    customModel.rotation.y = Math.PI; // Start from the front (interface face)

    console.log("Model loaded cleanly.");
  },
  undefined,
  (error) => {
    console.error('Error loading model:', error);
  }
);

// ----------------------
// Resize
// ----------------------
window.addEventListener('resize', () => {
  const width = getCanvasWidth();
  camera.aspect = width / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(width, window.innerHeight);
});

// ----------------------
// Interaction (Raycaster)
// ----------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isShifted = false;
let targetX = 3.5; // Start in hero position (further right)
let targetScale = 1.3; // Smaller for hero state

window.addEventListener('click', (event) => {
  if (!customModel) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(customModel, true);

  if (intersects.length > 0) {
    isShifted = !isShifted;
    // When shifted, move the model further to the left (target: -8.5)
    // so it doesn't fight for space with the description on the right
    // Increase scale for manual view (target: 2.2)
    targetX = isShifted ? -8.5 : 3.5;
    targetScale = isShifted ? 2.2 : 1.3;
    document.body.classList.toggle('shifted', isShifted);
  }
});

// ----------------------
// Animation Loop
// ----------------------
function animate() {
  requestAnimationFrame(animate);

  // Rotate horizontally around Y axis at a slower, premium speed
  if (customModel) {
    customModel.rotation.y += 0.005;

    // Smoothly lerp position towards targetX
    customModel.position.x += (targetX - customModel.position.x) * 0.06;

    // Smoothly lerp scale towards targetScale
    const s = customModel.scale.x + (targetScale - customModel.scale.x) * 0.06;
    customModel.scale.set(s, s, s);
  }

  renderer.render(scene, camera);
}

animate();
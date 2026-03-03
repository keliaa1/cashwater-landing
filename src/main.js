import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './style.css';

// ----------------------
// Scene
// ----------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe6e6e2);

// ----------------------
// Camera
// ----------------------
const getCanvasWidth = () => window.innerWidth > 768 ? window.innerWidth * 0.55 : window.innerWidth;

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
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe6e6e2, 0.8);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
keyLight.position.set(10, 10, 10);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);

const backLight = new THREE.DirectionalLight(0xffffff, 1.2);
backLight.position.set(-10, 5, -5);
scene.add(backLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
fillLight.position.set(-5, 2, 5);
scene.add(fillLight);

// ----------------------
// Model Loader
// ----------------------
const loader = new GLTFLoader();
let customModel;

loader.load(
  '/cashwater.glb',
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

    // Scale
    pivot.scale.set(1.4, 1.4, 1.4);

    customModel = pivot;

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
// Animation Loop
// ----------------------
function animate() {
  requestAnimationFrame(animate);

  // Rotate horizontally around Y axis
  if (customModel) {
    customModel.rotation.y += 0.01; // <-- horizontal rotation
  }

  renderer.render(scene, camera);
}

animate();
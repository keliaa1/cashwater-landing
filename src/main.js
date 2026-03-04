import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "./style.css";

// ----------------------
// Scene
// ----------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080808); // Very dark background

// Optional: add very subtle fog for depth
scene.fog = new THREE.FogExp2(0x080808, 0.035);

// ----------------------
// Camera
// ----------------------
const getCanvasWidth = () => window.innerWidth;

const camera = new THREE.PerspectiveCamera(
  60,
  getCanvasWidth() / window.innerHeight,
  0.1,
  1000,
);

// Better hero angle for 360 view
camera.position.set(6, 2, 6);
camera.lookAt(0, 0, 0);

// ----------------------
// Renderer
// ----------------------
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
});

renderer.setSize(getCanvasWidth(), window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0; // Slightly lower for dramatic contrast

document.getElementById("app").appendChild(renderer.domElement);

// ----------------------
// Lighting — Overhead Torch Spotlight Setup
// ----------------------

// Ambient — enough to see the model shape in the dark
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// PRIMARY SPOTLIGHT — overhead torch shining down onto the model
const spotLight = new THREE.SpotLight(0xffffff, 800);
spotLight.position.set(3.5, 15, 2); // Above the model
spotLight.angle = Math.PI / 5; // Wider cone to cover the whole model
spotLight.penumbra = 0.5; // Soft edges on the light cone
spotLight.decay = 1.2;
spotLight.distance = 80;
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 4096;
spotLight.shadow.mapSize.height = 4096;
spotLight.shadow.bias = -0.0002;
spotLight.shadow.camera.near = 1;
spotLight.shadow.camera.far = 50;
scene.add(spotLight);

// Spotlight target — directly below the spotlight, follows model
const spotTarget = new THREE.Object3D();
spotTarget.position.set(3.5, -2, 0);
scene.add(spotTarget);
spotLight.target = spotTarget;

// FRONT KEY LIGHT — strong directional light to illuminate the model face
const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(5, 8, 10);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);

// Warm rim light — edge definition from behind
const rimLight = new THREE.DirectionalLight(0xffeedd, 1.2);
rimLight.position.set(-6, 4, -6);
scene.add(rimLight);

// Fill light — prevents blackout on the shadow side
const fillLight = new THREE.DirectionalLight(0xaabbcc, 0.8);
fillLight.position.set(-5, 2, 5);
scene.add(fillLight);

// FRONT DISPLAY LIGHT — point light that follows the model to illuminate the digital display
const displayLight = new THREE.PointLight(0xffffff, 15, 15, 1.5);
displayLight.position.set(3.5, 1, 8); // In front of the model
scene.add(displayLight);

// ----------------------
// Ground Plane — catches shadows and shows the spotlight cone on the floor
// ----------------------
const groundGeometry = new THREE.PlaneGeometry(80, 80);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x111111,
  metalness: 0.6,
  roughness: 0.35, // Slightly rough for a natural floor feel
});
const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
groundPlane.rotation.x = -Math.PI / 2;
groundPlane.position.y = -2.2;
groundPlane.receiveShadow = true;
scene.add(groundPlane);

// ----------------------
// Model Loader
// ----------------------
const loader = new GLTFLoader();
let customModel;

loader.load(
  "/cashwater1.glb",
  (gltf) => {
    const model = gltf.scene;

    // Create pivot for rotation
    const pivot = new THREE.Group();
    scene.add(pivot);
    pivot.add(model);

    // Enable shadows on model meshes — keep original materials/colors
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
    console.error("Error loading model:", error);
  },
);

// ----------------------
// Resize
// ----------------------
window.addEventListener("resize", () => {
  const width = getCanvasWidth();
  camera.aspect = width / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(width, window.innerHeight);
});

// ----------------------
// Scroll Hint Element
// ----------------------
const scrollHint = document.createElement("div");
scrollHint.className = "scroll-hint";
scrollHint.innerHTML = `<span>Scroll to explore</span><div class="arrow"></div>`;
document.body.appendChild(scrollHint);

// ----------------------
// Interaction (Raycaster)
// ----------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isShifted = false;
let targetX = 3.5; // Start in hero position (further right)
let targetY = 0; // Vertical position
let targetScale = 1.3; // Smaller for hero state
let scrollProgress = 0; // 0 = top, 1 = fully scrolled

window.addEventListener("click", (event) => {
  if (!customModel) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(customModel, true);

  if (intersects.length > 0) {
    isShifted = !isShifted;
    targetX = isShifted ? -8.5 : 3.5;
    targetY = isShifted ? 1.5 : 0;
    targetScale = isShifted ? 2.2 : 1.3;
    document.body.classList.toggle("shifted", isShifted);

    if (isShifted) {
      // Enable scrolling
      document.body.classList.add("scrollable");
      scrollHint.classList.add("visible");
      // Hide hint after a few seconds
      setTimeout(() => scrollHint.classList.remove("visible"), 4000);
    } else {
      // Disable scrolling, reset to top
      document.body.classList.remove("scrollable");
      scrollHint.classList.remove("visible");
      window.scrollTo({ top: 0, behavior: "smooth" });
      scrollProgress = 0;
    }
  }
});

// ----------------------
// Scroll tracking
// ----------------------
window.addEventListener("scroll", () => {
  if (!isShifted) return;
  const maxScroll = window.innerHeight; // One viewport height of scroll
  scrollProgress = Math.min(window.scrollY / maxScroll, 1);

  // Reveal "Why Choose Us" cards with stagger as user scrolls past halfway
  if (scrollProgress > 0.3) {
    const cards = document.querySelectorAll(".why-card");
    cards.forEach((card, i) => {
      setTimeout(() => card.classList.add("visible"), i * 120);
    });
  }
});

// ----------------------
// Animation Loop
// ----------------------

// Store initial camera Y for lerping
const baseCameraY = camera.position.y; // 2

function animate() {
  requestAnimationFrame(animate);

  if (customModel) {
    // --- Scroll-driven fall animation ---
    // Tilt the model forward (rotation.x) as it falls
    const fallRotationX = scrollProgress * (Math.PI / 2.2); // tip forward ~82°
    // Drop position: from targetY down to ground level
    const groundY = -1.5; // just above ground plane
    const fallY = isShifted
      ? targetY + (groundY - targetY) * scrollProgress
      : targetY;

    // Slow down auto-rotation as model falls
    const rotSpeed = 0.005 * (1 - scrollProgress * 0.9);
    customModel.rotation.y += rotSpeed;

    // Apply tilt (only when shifted/scrolling)
    if (isShifted) {
      customModel.rotation.x += (fallRotationX - customModel.rotation.x) * 0.08;
    } else {
      customModel.rotation.x += (0 - customModel.rotation.x) * 0.08;
    }

    // Smoothly lerp position towards target
    customModel.position.x += (targetX - customModel.position.x) * 0.06;
    customModel.position.y += (fallY - customModel.position.y) * 0.06;

    // Smoothly lerp scale towards targetScale
    const s = customModel.scale.x + (targetScale - customModel.scale.x) * 0.06;
    customModel.scale.set(s, s, s);

    // Update spotlight + target to follow model position
    spotLight.position.x += (targetX - spotLight.position.x) * 0.06;
    spotTarget.position.x += (targetX - spotTarget.position.x) * 0.06;

    // Move front display light and key light to follow the model
    displayLight.position.x = customModel.position.x;
    displayLight.position.y = customModel.position.y + 1;
    keyLight.position.x = customModel.position.x + 2;

    // Camera adjustment — look slightly downward as model falls
    const camY = baseCameraY - scrollProgress * 1.5;
    camera.position.y += (camY - camera.position.y) * 0.05;
    camera.lookAt(
      customModel.position.x * 0.3,
      customModel.position.y * 0.5,
      0,
    );
  }

  renderer.render(scene, camera);
}

animate();

import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

console.log("🚀 Tunnel mit selektivem Bloom läuft");



const baseRadius = 2;
let soundEnabled = true;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioObjects = [];

const audioModules = import.meta.glob('./assets/audio/*.m4a', { eager: true });
const spacingFactor = 0.3;

const audios = Object.entries(audioModules).map(([path, mod]) => {
  const match = path.match(/audio(\d+)\.m4a/);
  const zValue = match ? parseInt(match[1]) : 0;
  return { url: mod.default, z: -zValue * spacingFactor };
});

audios.forEach(({ url, z }) => {
  const audio = new Audio(url);
  audio.loop = true;

  const source = audioContext.createMediaElementSource(audio);
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0; // leise starten

  source.connect(gainNode).connect(audioContext.destination);
  //audio.play();

  audioObjects.push({ audio, gainNode, z }); // ← alle Infos speichern


});



// === UI: Countdown & Runtime ===
const createLabel = ({ 
  top = null, 
  bottom = null, 
  fontSize, 
  strokeColor = '#000',
  gradient = false,
  color = '#ffffff',
  shadow = true // ✨ NEU: Schatten standardmäßig aktiv
}) => {
  const label = document.createElement('div');
  label.style.position = 'absolute';

  if (top !== null) label.style.top = `${top}px`;
  if (bottom !== null) label.style.bottom = `${bottom}px`;

  label.style.left = '50%';
  label.style.transform = 'translateX(-50%) scaleX(1.3)';
  label.style.fontSize = `${fontSize}px`;
  label.style.fontFamily = 'sans-serif';
  label.style.letterSpacing = '-4.5px';
  label.style.fontWeight = '900';
  label.style.zIndex = '1000';
  label.style.webkitTextStroke = `1px ${strokeColor}`;

  // ✨ Nur wenn Schatten aktiv ist
  if (shadow) {
    label.style.textShadow = '0 0 5px rgba(255, 255, 255, 1000)';
  }

  if (gradient) {
    label.style.background = 'linear-gradient(to bottom, #000000, #ffffff, #666666)';
    label.style.backgroundSize = '100% 50%';
    label.style.backgroundPosition = 'center';
    label.style.webkitBackgroundClip = 'text';
    label.style.webkitTextFillColor = 'transparent';
  } else {
    label.style.color = color;
  }

  document.body.appendChild(label);

  const controller = renderer.xr.getController(1); // 0 = linker Controller
  scene.add(controller);


  return label;
};


const loadingOverlay = document.createElement('div');
loadingOverlay.style.cssText = `
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #00ff00;
  font-family: sans-serif;
  font-size: 24px;
  font-weight: bold;
  background: rgba(0,0,0,0.75);
  padding: 20px 40px;
  border-radius: 12px;
  border: 2px solid #00ff00;
  box-shadow: 0 0 20px #00ff00;
  z-index: 9999;
  display: block;
`;
loadingOverlay.innerText = 'Loading Collective Memory…';
document.body.appendChild(loadingOverlay);

const chatBox = document.createElement('div');
chatBox.style.cssText = `
  position: absolute;
  text-align: center;
  bottom: 35%;
  right: 20px;
  font-family: sans-serif;
  font-size: 30px;
  color: #7e7e7e;
  z-index: 1000;
`;

document.body.appendChild(chatBox);

function addChatMessage(text) {
  const message = document.createElement('div');
  message.innerText = text;
  message.style.textAlign = 'center'; // für Mittelachsensatz
message.style.textShadow = `
  -1px -1px 0 #000,
   1px -1px 0 #000,
  -1px  1px 0 #000,
   1px  1px 0 #000,
  -3px -3px 0 #00ff00,
   3px -3px 0 #00ff00,
  -3px  3px 0 #00ff00,
   3px  3px 0 #00ff00
`;
// text-shadow: x-offset y-offset blur-radius color; wie das funktioniert
message.style.fontWeight = 'bold';
message.style.color = '#7e7e7e';

  message.style.marginBottom = '8px';
  chatBox.appendChild(message);

  // Maximal 10 Nachrichten anzeigen
  while (chatBox.children.length > 5) {
    chatBox.removeChild(chatBox.firstChild);
  }

  // Immer ganz nach unten scrollen
  chatBox.scrollTop = chatBox.scrollHeight;
}



const countdownLabel = createLabel({
  top: 10,
  fontSize: 200,
  strokeColor: '#666666',
  gradient: true,
  shadow: false
});

const runtimeLabel = createLabel({
  bottom: 0,
  fontSize: 70,
  textalign: 'center',
  fontWeight: 'extrabold',
  strokeColor: '#ffffff',
  color: '#000000',
  shadow: true
});

// === Start Button mit Bildumschaltung ===
const startContainer = document.createElement('div');
startContainer.style.cssText = `
  position: absolute;
  top: 160px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1100;
  cursor: pointer;
`;

const startOn = new Image();
startOn.src = '/start_on.png';
startOn.style.cssText = 'display: none; width: 400px; height: auto;';

const startOff = new Image();
startOff.src = '/start_off.png';
startOff.style.cssText = 'display: block; width: 400px; height: auto;';

startContainer.append(startOn, startOff);
document.body.appendChild(startContainer);

function startNewJourney() {
  metadataHideChance = Math.min(100, metadataHideChance + 10);
  imagesLoaded = 0;
  totalImagesToLoad = bilder.length;
  loadingOverlay.style.display = 'block';

 metadataHideChance = Math.min(100, metadataHideChance + 10); // erhöht um 10%, max 100%

  imagesLoaded = 0;
  totalImagesToLoad = bilder.length;


  loadingOverlay.style.display = 'block';

  
  loadingOverlay.style.display = 'block';

 // Schwelle um 20 verringern (mind. 0)
 brightnessThreshold = Math.max(0, brightnessThreshold - 30);
 console.log("Neue Brightness-Schwelle:", brightnessThreshold);

 // Alle Bilder aus Szene löschen
 planes.forEach(({ mesh }) => {
  scene.remove(mesh);
 });
 planes.length = 0;


  const duration = 3000;
  const boxDuration = duration / ghostBoxes.length;

  ghostBoxes.forEach((box, i) => {
    setTimeout(() => box.parentNode?.removeChild(box), i * boxDuration);
  });
  ghostBoxes.length = 0;

  const start = Date.now();
  const initialElapsed = Date.now() - startTime;

  const animateReset = () => {
    const now = Date.now();

    // 🔊 Lautstärke der Audios je nach Kameradistanz anpassen
audioObjects.forEach(({ gainNode, z }) => {
  if (!gainNode) return;

  const distance = Math.abs(camera.position.z - z);
  const maxDistance = 40;
  const volume = distance > maxDistance ? 0 : Math.pow(1 - distance / maxDistance, 3);


  // Nur anpassen, wenn Sound erlaubt ist
  gainNode.gain.value = soundEnabled ? volume : 0;
});



    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - t) ** 2;
    startTime = Date.now() - initialElapsed * (1 - eased);
    if (t < 1) requestAnimationFrame(animateReset);
  };

  animateReset();

  // Neue Bilder mit neuer Schwelle laden
 bilder.forEach(({ url, value }) => {
  loadImageWithAlphaMargin(url, 30).then(({ texture, width, height }) => {
    const originalFilename = url.split('/').pop(); // z. B. bild42-waldspaziergang_19-10.png
    const aspect = width / height;
    const planeHeight = 1.5;
    const planeWidth = planeHeight * aspect;

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: texture,
      emissiveIntensity: 1,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.01,
      roughness: 1,
      metalness: 0
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.userData.material = material;
 plane.userData.filename = originalFilename;
 plane.userData.hideMetadata = Math.random() * 100 < metadataHideChance;



    const outlineMaterial = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        outlineColor: { value: new THREE.Color(0x00ff00) },
        thickness: { value: 25.0 / Math.max(width, height) }
      },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform sampler2D map;
        uniform vec3 outlineColor;
        uniform float thickness;
        varying vec2 vUv;

        float getAlpha(vec2 uv) {
          return texture2D(map, uv).a;
        }

        void main() {
          float a = getAlpha(vUv);
          float outline = 0.0;
          for (int x = -1; x <= 1; x++) {
            for (int y = -1; y <= 1; y++) {
              vec2 offset = vec2(float(x), float(y)) * thickness;
              if (getAlpha(vUv + offset) < 0.1) {
                outline = 1.0;
              }
            }
          }
          if (outline > 0.0 && a > 0.1) {
            gl_FragColor = vec4(outlineColor, 1.0);
          } else {
            discard;
          }
        }
      `,
      transparent: true,
      depthWrite: false
    });

    const outlineMesh = new THREE.Mesh(geometry.clone(), outlineMaterial);
    plane.add(outlineMesh);

    const r = baseRadius + Math.random() * baseRadius * 2;
    const angle = Math.random() * Math.PI * 2;
    const z = -value * spacingFactor;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    plane.position.set(x, y, z);
    plane.lookAt(0, 0, z);
    const scale = Math.random() * 4 + 2;
    plane.scale.set(scale, scale, 1);
    planes.push({ mesh: plane, baseZ: z, radius: r });
    scene.add(plane);
    trackImageLoad();
  });
});

};

// Beim Klick wechseln & reset auslösen
startContainer.onclick = () => {
  startOn.style.display = 'block';
  startOff.style.display = 'none';

  // Nach 500ms wieder zurück auf OFF
  setTimeout(() => {
    startOn.style.display = 'none';
    startOff.style.display = 'block';
  }, 500);

startNewJourney();
};


//Audio button
// === AUDIO ON/OFF Button mit Bildumschaltung ===
const audioContainer = document.createElement('div');
audioContainer.style.cssText = `
  position: absolute;
  bottom: 35px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1100;
  cursor: pointer;
`;

const audioOn = new Image();
audioOn.src = '/audio_on.png';
audioOn.style.cssText = 'display: none; width: 400px; height: auto;';

const audioOff = new Image();
audioOff.src = '/audio_off.png';
audioOff.style.cssText = 'display: block; width: 400px; height: auto;';

audioContainer.append(audioOn, audioOff);
document.body.appendChild(audioContainer);

// === Klick-Logik ===
audioContainer.onclick = () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  soundEnabled = !soundEnabled;
  audioOn.style.display = soundEnabled ? 'block' : 'none';
  audioOff.style.display = soundEnabled ? 'none' : 'block';

  audioObjects.forEach(({ audio, gainNode, z }) => {
    if (audio.paused) {
      audio.play().catch(e => console.warn("Audio konnte nicht gestartet werden:", e));
    }

    const virtualCameraZ = scrollOffset + 10;
    const distance = Math.abs(virtualCameraZ - Math.abs(z));
    const maxDistance = 100;
    const volume = distance > maxDistance ? 0 : 1 - distance / maxDistance;
    gainNode.gain.value = soundEnabled ? volume : 0;
  });
};


const volumeBarContainer = document.createElement('div');
volumeBarContainer.style.cssText = `
  width: 200px;
  height: 28px;
  background: rgba(0, 0, 0, 0.1);
  border: 0px solid #ffffff;
  border-radius: 25px;
  box-shadow: 0 0 10px #000000;
  margin-top: 10px;
  position: absolute;
  bottom: 117px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1100;
`;

const volumeBar = document.createElement('div');
volumeBar.style.cssText = `
  height: 100%;
  width: 0%;
  background: linear-gradient(to bottom, #2a2a2a, #f1f1f1, #2a2a2a);
  border-radius: 12px;
  box-shadow: 0 0 0px #000000;
  transition: width 0.5s ease;
`;

volumeBarContainer.appendChild(volumeBar);
document.body.appendChild(volumeBarContainer);



// === Dreaming Mode Buttons ===
const sliderContainer = document.createElement('div');
sliderContainer.style.cssText = `
  position: absolute;
  top: 50%;
  left: -50px;
  transform: translateY(-50%);
  background: transparent;
  padding: 10px;
  color: white;
  font-family: sans-serif;
  z-index: 1000;
`;

const createButtonImage = (src, display) => {
  const img = new Image();
  img.src = src;
  img.style.cssText = `
    display: ${display};
    cursor: pointer;
    width: 400px;
    height: auto;
  `;
  return img;
};

const buttonOn = createButtonImage('/button_dreaming_on.png', 'none');
const buttonOff = createButtonImage('/button_dreaming_off.png', 'block');
sliderContainer.append(buttonOn, buttonOff);
document.body.appendChild(sliderContainer);

let glowActive = false;
buttonOn.onclick = () => { glowActive = false; buttonOn.style.display = 'none'; buttonOff.style.display = 'block'; };
buttonOff.onclick = () => { glowActive = true; buttonOff.style.display = 'none'; buttonOn.style.display = 'block'; };

// === Reset-Animation ===
let startTime = Date.now();
const ghostBoxes = [];

function trackImageLoad() {
  imagesLoaded++;
  if (imagesLoaded === totalImagesToLoad) {
    loadingOverlay.style.display = 'none';
    console.log("Alle Bilder geladen");
  }
}



// === Szene, Kamera, Renderer ===
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x66c0ff, 10, 25);
scene.add(new THREE.AmbientLight(0xffffff, 1.5));

// Himmel
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(1000, 32, 15),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        vec3 topColor = vec3(1.0);
        vec3 bottomColor = vec3(0.4, 0.75, 1.0);
        gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
      }
    `
  })
);
scene.add(sky);


const camera = new THREE.PerspectiveCamera(140, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 10);
camera.layers.enable(1);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

document.body.appendChild(VRButton.createButton(renderer));

// === Postprocessing (Bloom) ===
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  type: THREE.HalfFloatType,
  format: THREE.RGBAFormat,
  encoding: THREE.sRGBEncoding
});

const bloomComposer = new EffectComposer(renderer, renderTarget);
bloomComposer.addPass(new RenderPass(scene, camera));
bloomComposer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 1.0, 0.3));

// === Mausbewegung / Kamera-Rotation ===
let yaw = 0, pitch = 0, isMouseDown = false;
const sensitivity = 0.002;

document.body.addEventListener('mousedown', e => {
  if (!e.target.closest('button, img, .ghost-box')) {
    document.body.requestPointerLock();
    isMouseDown = true;
  }
});
document.addEventListener('mouseup', () => { isMouseDown = false; document.exitPointerLock(); });
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement === document.body && isMouseDown) {
    yaw -= e.movementX * sensitivity;
    pitch = THREE.MathUtils.clamp(pitch - e.movementY * sensitivity, -Math.PI / 2, Math.PI / 2);
    const yawQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const pitchQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
    camera.quaternion.copy(yawQ).multiply(pitchQ);
  }
});

// === Bilder laden & anordnen ===
const imageModules = import.meta.glob('./assets/bilder/*.png', { eager: true });
const bilder = Object.entries(imageModules)
  .map(([path, mod]) => ({ url: mod.default, value: parseInt(path.match(/bild(\d+)/)?.[1] || '0') }))
  .sort((a, b) => a.value - b.value);

const loader = new THREE.TextureLoader();
const planes = [];

let brightnessThreshold = 250; // initialer Wert
let metadataHideChance = 0; // Start bei 0%
let totalImagesToLoad = bilder.length-1;
let imagesLoaded = 0;
let lastChatFilename = '';


const loadImageWithAlphaMargin = (url, margin = 30) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width + margin * 2;
      canvas.height = img.height + margin * 2;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, margin, margin);

      // Weißanteile entfernen
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const brightness = (r + g + b) / 3;
        if (brightness > brightnessThreshold) {
          data[i + 3] = 0; // alpha = 0 (transparent)
        }
      }
      ctx.putImageData(imageData, 0, 0);

      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      texture.colorSpace = THREE.SRGBColorSpace;
      resolve({ texture, width: canvas.width, height: canvas.height });
    };
    img.src = url;
  });
};



bilder.forEach(({ url, value }) => {
  loadImageWithAlphaMargin(url, 30).then(({ texture, width, height }) => {
        const originalFilename = url.split('/').pop(); // z. B. bild42-waldspaziergang_19-10.png

    const aspect = width / height;
    const planeHeight = 1.5;
    const planeWidth = planeHeight * aspect;

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: texture,
      emissiveIntensity: 1,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.01,
      roughness: 1,
      metalness: 0
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.userData.material = material;
    plane.userData.filename = originalFilename;

    // ✳️ Shader-Outline basierend auf Alpha (funktioniert jetzt bei allen Bildern)
    const outlineMaterial = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        outlineColor: { value: new THREE.Color(0x00ff00) },
        thickness: { value: 25.0 / Math.max(width, height) } // abhängig von Auflösung
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform vec3 outlineColor;
        uniform float thickness;
        varying vec2 vUv;

        float getAlpha(vec2 uv) {
          return texture2D(map, uv).a;
        }

        void main() {
          float a = getAlpha(vUv);
          float outline = 0.0;
          for (int x = -1; x <= 1; x++) {
            for (int y = -1; y <= 1; y++) {
              vec2 offset = vec2(float(x), float(y)) * thickness;
              if (getAlpha(vUv + offset) < 0.1) {
                outline = 1.0;
              }
            }
          }
          if (outline > 0.0 && a > 0.1) {
            gl_FragColor = vec4(outlineColor, 1.0);
          } else {
            discard;
          }
        }
      `,
      transparent: true,
      depthWrite: false
    });

    const outlineMesh = new THREE.Mesh(geometry.clone(), outlineMaterial);
    plane.add(outlineMesh);

    // === Platzierung im Tunnel ===
    const r = baseRadius + Math.random() * baseRadius * 2;
    const angle = Math.random() * Math.PI * 2;
    const z = -value * spacingFactor;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;

    plane.position.set(x, y, z);
    plane.lookAt(0, 0, z);
    const scale = Math.random() * 3 + 3;
    plane.scale.set(scale, scale, 1);
    planes.push({ mesh: plane, baseZ: z, radius: r });
    scene.add(plane);
    trackImageLoad();


  });
});


// === Scrollsteuerung ===
let scrollOffset = 0;
window.addEventListener('wheel', e => {
  scrollOffset = THREE.MathUtils.clamp(scrollOffset - e.deltaY * 0.05, 0, 300);
});

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  bloomComposer.setSize(w, h);
});

// === Hover-Detection & Tooltip ===
const pointer = new THREE.Vector2();
window.addEventListener('mousemove', e => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

function animate() {

const session = renderer.xr.getSession();
if (session) {
  const inputSources = session.inputSources;
  for (const source of inputSources) {
    if (source && source.gamepad) {
      const axes = source.gamepad.axes;

      // axes[3] = Y-Achse des linken Sticks (vor/zurück)
      const y = axes[3]; // -1 = vorwärts, +1 = rückwärts

      // Bewegungsschwelle (um Zittern zu vermeiden)
      if (Math.abs(y) > 0.1) {
        scrollOffset = THREE.MathUtils.clamp(scrollOffset + y * 0.8, 0, 300);
      }
    }
  }
}


// === Test: Entfernung + Gain überprüfen ===
if (audioObjects.length > 0) {
  const testAudio = audioObjects[0]; // Nur das erste Audio zum Testen
  const distance = Math.abs(camera.position.z - testAudio.z);
  const maxDistance = 100;
  const volume = distance > maxDistance ? 0 : 1 - distance / maxDistance;

  // Gain aktiv setzen
  testAudio.gainNode.gain.value = soundEnabled ? volume : 0;

}
  const now = Date.now();

audioObjects.forEach(({ gainNode, z }) => {
  const virtualCameraZ = scrollOffset + 10; // Kamera steht fix bei Z=10
  const distance = Math.abs(virtualCameraZ - Math.abs(z));
  const maxDistance = 100;

  const volume = distance > maxDistance ? 0 : 1 - distance / maxDistance;
  gainNode.gain.value = soundEnabled ? volume : 0;

});

// Beispielwert (nimm den höchsten oder durchschnittlichen Wert aller aktiven Sounds)
const currentVolume = Math.max(...audioObjects.map(o => o.gainNode.gain.value));
const visualVolume = Math.pow(currentVolume, 3.5); // 0.5 = Quadratwurzel → verstärkt leise
volumeBar.style.width = `${Math.min(100, visualVolume * 100)}%`;




  const elapsed = now - startTime;
  const min = String(Math.floor(elapsed / 60000)).padStart(2, '0');
  const sec = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
  runtimeLabel.innerText = `YOUR JOURNEY ${min}:${sec}`;
  runtimeLabel.style.transform = `translateX(-50%) scaleX(${Math.min(window.innerWidth / runtimeLabel.offsetWidth, 1.3 + elapsed * 0.00001)})`;

  const scrollValue = Math.floor((scrollOffset / 300) * 90);
  countdownLabel.innerHTML = `
  <div style="text-align: center; line-height: 0.8;">
    <div style="font-size: 180px; margin-bottom: -5px;">${scrollValue}</div>
    <div style="font-size: 65px;">MIN</div>
  </div>
`;



  countdownLabel.style.transform = `translateX(-50%) scaleX(${1.3 + (scrollValue / 90) * 0.7})`;

  const raycaster = new THREE.Raycaster();
raycaster.setFromCamera(pointer, camera);
const intersects = raycaster.intersectObjects(planes.map(p => p.mesh));

if (intersects.length > 0 && document.pointerLockElement !== document.body) {
  const hovered = intersects[0].object;

const filename = hovered.userData?.filename || '';
const hideMeta = hovered.userData?.hideMetadata;

let description = '';
let time = '';

if (!hideMeta) {
  const matchFull = filename.match(/bild\d+-(.*?)_(\d{2}-\d{2})\.png/);
  const matchShort = filename.match(/bild\d+-(.*?)\.png/);

  if (matchFull) {
    description = matchFull[1].replace(/-/g, ' ');
    time = matchFull[2].replace('-', ':');
  } else if (matchShort) {
    description = matchShort[1].replace(/-/g, ' ');
    time = '';
  }
}
if (!hideMeta && (description || time)) {
  if (filename !== lastChatFilename) {
    addChatMessage(`${description}${time ? ` – ${time}` : ''}`);
    lastChatFilename = filename; // neues Bild merken
  }
}



  // DOM-Box anzeigen
const distance = camera.position.distanceTo(hovered.position);
const scale = Math.max(0.1, Math.min(3.0, 3.0 / distance));

const ghostDot = document.createElement('div');
ghostDot.className = 'ghost-box';
ghostDot.style.position = 'absolute';
ghostDot.style.pointerEvents = 'none';
ghostDot.style.left = `${pointer.x * window.innerWidth * 0.5 + window.innerWidth / 2}px`;
ghostDot.style.top = `${-pointer.y * window.innerHeight * 0.5 + window.innerHeight / 2}px`;

const size = 10 * scale;
ghostDot.style.width = `${size}px`;
ghostDot.style.height = `${size}px`;
ghostDot.style.borderRadius = '50%';
ghostDot.style.backgroundColor = '#ff0000';

const blur = 20 * scale;
const spread = 10 * scale;
ghostDot.style.boxShadow = `0 0 ${blur}px ${spread}px rgba(255, 0, 0, 0.6)`;

ghostDot.style.zIndex = '1000';

document.body.appendChild(ghostDot);
ghostBoxes.push(ghostDot);

}

  // Scrollbewegung
  planes.forEach(({ mesh, baseZ, radius }) => {
    mesh.position.z = baseZ + scrollOffset / radius;
    if (mesh.userData.material) {
      mesh.userData.material.emissiveIntensity = glowActive ? 0.5 : 1.0;
    }
  });

  glowActive ? bloomComposer.render() : renderer.render(scene, camera);
  renderer.setAnimationLoop(animate);
}

animate();






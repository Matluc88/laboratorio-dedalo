import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function DaedalusLab3D() {
  const mountRef = useRef(null);
  const [inventory, setInventory] = useState([]);
  const [puzzles, setPuzzles] = useState({
    manuscript: false,
    constellation: false,
    labyrinth: false,
    wings: false,
    compass: false
  });
  const [examining, setExamining] = useState(null);
  const [notification, setNotification] = useState('');
  const [escaped, setEscaped] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [feathersCollected, setFeathersCollected] = useState(0);
  const [loading, setLoading] = useState(true);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  useEffect(() => {
    if (escaped) return;

    // ========== SCENE SETUP ==========
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0a15);
    scene.fog = new THREE.FogExp2(0x1a1520, 0.015);

    // ========== CAMERA ==========
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.7, 10);

    // ========== RENDERER ==========
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance",
      alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
    mountRef.current.appendChild(renderer.domElement);

    // ========== ADVANCED LIGHTING ==========
    
    // Ambient light (simulated HDRI)
    const ambientLight = new THREE.AmbientLight(0x6b5d42, 0.3);
    scene.add(ambientLight);

    // Hemisphere light for realistic ambient
    const hemiLight = new THREE.HemisphereLight(0x8d7a5c, 0x2d1f1a, 0.5);
    scene.add(hemiLight);

    // Main ceiling light (golden sunbeam)
    const mainLight = new THREE.SpotLight(0xffeacc, 15, 40, Math.PI / 6, 0.3, 1.5);
    mainLight.position.set(0, 9, 0);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 4096;
    mainLight.shadow.mapSize.height = 4096;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    // God rays effect (simulated with light)
    const godRayLight = new THREE.DirectionalLight(0xffd699, 2);
    godRayLight.position.set(-5, 10, -5);
    scene.add(godRayLight);

    // ========== PHOTOREALISTIC MATERIALS ==========
    
    // Marble floor with PBR
    const floorGeometry = new THREE.PlaneGeometry(22, 22, 50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8dcc8,
      roughness: 0.4,
      metalness: 0.1,
      envMapIntensity: 1.5
    });
    
    // Add displacement for marble veins
    const vertices = floorGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 2] += Math.sin(vertices[i] * 0.5) * Math.cos(vertices[i + 1] * 0.5) * 0.05;
    }
    floorGeometry.computeVertexNormals();
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3f2f,
      roughness: 0.8,
      metalness: 0.05
    });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 9;
    ceiling.receiveShadow = true;
    scene.add(ceiling);

    // ========== GREEK COLUMNS ==========
    const createColumn = (x, z) => {
      const columnGroup = new THREE.Group();
      
      // Column material - weathered marble
      const columnMaterial = new THREE.MeshStandardMaterial({
        color: 0xddd5c7,
        roughness: 0.6,
        metalness: 0.05,
        normalScale: new THREE.Vector2(0.5, 0.5)
      });

      // Base
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.7, 0.5, 16),
        columnMaterial
      );
      base.position.y = 0.25;
      base.castShadow = true;
      columnGroup.add(base);

      // Shaft with fluting
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 6, 20),
        columnMaterial
      );
      shaft.position.y = 3.5;
      shaft.castShadow = true;
      columnGroup.add(shaft);

      // Capital
      const capital = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.5, 0.8, 16),
        columnMaterial
      );
      capital.position.y = 7;
      capital.castShadow = true;
      columnGroup.add(capital);

      columnGroup.position.set(x, 0, z);
      return columnGroup;
    };

    const columns = [
      createColumn(-8, -8),
      createColumn(8, -8),
      createColumn(-8, 8),
      createColumn(8, 8)
    ];
    columns.forEach(col => scene.add(col));

    // ========== WALLS WITH DETAILS ==========
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a4f3d,
      roughness: 0.85,
      metalness: 0.05
    });

    const createWall = (width, height, position, rotation) => {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.4),
        wallMaterial
      );
      wall.position.copy(position);
      wall.rotation.y = rotation;
      wall.receiveShadow = true;
      wall.castShadow = true;
      return wall;
    };

    scene.add(createWall(22, 9, new THREE.Vector3(0, 4.5, -11), 0));
    scene.add(createWall(22, 9, new THREE.Vector3(-11, 4.5, 0), Math.PI / 2));
    scene.add(createWall(22, 9, new THREE.Vector3(11, 4.5, 0), Math.PI / 2));
    scene.add(createWall(8, 9, new THREE.Vector3(-7, 4.5, 11), Math.PI));
    scene.add(createWall(8, 9, new THREE.Vector3(7, 4.5, 11), Math.PI));

    // ========== ANIMATED TORCHES ==========
    const torches = [];
    const createTorch = (x, z) => {
      const torchGroup = new THREE.Group();
      
      // Wall mount
      const mount = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.6, 0.15),
        new THREE.MeshStandardMaterial({ 
          color: 0x3a2a1a, 
          roughness: 0.8, 
          metalness: 0.3 
        })
      );
      mount.position.y = 3;
      torchGroup.add(mount);

      // Torch holder
      const holder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8),
        new THREE.MeshStandardMaterial({ 
          color: 0x8b4513, 
          roughness: 0.7 
        })
      );
      holder.position.set(0, 3.5, 0.15);
      torchGroup.add(holder);

      // Flame
      const flameGeometry = new THREE.ConeGeometry(0.15, 0.5, 8);
      const flameMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff6600,
        transparent: true,
        opacity: 0.9
      });
      const flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.set(0, 4, 0.15);
      torchGroup.add(flame);

      // Glow
      const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(0, 4, 0.15);
      torchGroup.add(glow);

      // Point light
      const light = new THREE.PointLight(0xff6600, 4, 12, 2);
      light.position.set(0, 4, 0.15);
      light.castShadow = true;
      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 1024;
      torchGroup.add(light);

      torchGroup.position.set(x, 0, z);
      return { group: torchGroup, flame, glow, light };
    };

    torches.push(createTorch(-9, -9));
    torches.push(createTorch(9, -9));
    torches.push(createTorch(-9, 9));
    torches.push(createTorch(9, 9));
    torches.forEach(t => scene.add(t.group));

    // ========== INTERACTIVE OBJECTS ==========
    const interactiveObjects = [];

    // ========== EPIC DOOR WITH GOLDEN LOCK ==========
    const doorGroup = new THREE.Group();
    
    // Door planks
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a2f1a,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const leftDoor = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 6, 0.3),
      doorMaterial
    );
    leftDoor.position.x = -0.95;
    leftDoor.castShadow = true;
    doorGroup.add(leftDoor);

    const rightDoor = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 6, 0.3),
      doorMaterial
    );
    rightDoor.position.x = 0.95;
    rightDoor.castShadow = true;
    doorGroup.add(rightDoor);

    // Door frame
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.6
    });
    
    const frameTop = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.4, 0.3),
      frameMaterial
    );
    frameTop.position.y = 3.2;
    doorGroup.add(frameTop);

    // MASSIVE GOLDEN LOCK
    const lockGeometry = new THREE.BoxGeometry(1.2, 1.5, 0.4);
    const lockMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 1,
      roughness: 0.15,
      emissive: 0xcc9900,
      emissiveIntensity: 0.6
    });
    const lock = new THREE.Mesh(lockGeometry, lockMaterial);
    lock.position.z = 0.35;
    lock.castShadow = true;
    doorGroup.add(lock);

    // Lock glow effect
    const lockGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffee00,
        transparent: true,
        opacity: 0.2
      })
    );
    lockGlow.position.z = 0.35;
    doorGroup.add(lockGlow);

    doorGroup.position.set(0, 4, 10.7);
    doorGroup.userData = { type: 'door', name: 'Porta d\'Uscita' };
    scene.add(doorGroup);
    interactiveObjects.push(doorGroup);

    // Door spotlight
    const doorSpot = new THREE.SpotLight(0xffeeaa, 5, 15, Math.PI / 5, 0.4);
    doorSpot.position.set(0, 8, 9);
    doorSpot.target = doorGroup;
    doorSpot.castShadow = true;
    scene.add(doorSpot);

    // ========== 1. ANIMATED MANUSCRIPT ==========
    const manuscriptGroup = new THREE.Group();
    
    // Pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.6, 1, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0x5a4a3a, 
        roughness: 0.7 
      })
    );
    pedestal.position.y = 0.5;
    pedestal.castShadow = true;
    manuscriptGroup.add(pedestal);

    // Manuscript pages
    const pageMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4e8d0,
      roughness: 0.9,
      side: THREE.DoubleSide,
      emissive: 0xffeecc,
      emissiveIntensity: 0.15
    });

    const pageLeft = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.8),
      pageMaterial
    );
    pageLeft.position.set(-0.3, 1.1, 0);
    pageLeft.rotation.y = -Math.PI / 8;
    manuscriptGroup.add(pageLeft);

    const pageRight = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.8),
      pageMaterial
    );
    pageRight.position.set(0.3, 1.1, 0);
    pageRight.rotation.y = Math.PI / 8;
    manuscriptGroup.add(pageRight);

    manuscriptGroup.position.set(-7.5, 0, -7.5);
    manuscriptGroup.userData = { type: 'manuscript', name: 'Manoscritto di Omero' };
    manuscriptGroup.castShadow = true;
    scene.add(manuscriptGroup);
    interactiveObjects.push(manuscriptGroup);

    // Manuscript spotlight
    const manuscriptLight = new THREE.SpotLight(0xffdd88, 3, 8, Math.PI / 6, 0.5);
    manuscriptLight.position.set(-7.5, 6, -7.5);
    manuscriptLight.target = manuscriptGroup;
    manuscriptLight.castShadow = true;
    scene.add(manuscriptLight);

    // ========== 2. ANIMATED CONSTELLATION ==========
    const constellationGroup = new THREE.Group();
    
    // Star map background
    const starMap = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 3),
      new THREE.MeshStandardMaterial({
        color: 0x0a0a1a,
        emissive: 0x000055,
        emissiveIntensity: 0.4,
        roughness: 0.9
      })
    );
    starMap.position.z = -0.1;
    constellationGroup.add(starMap);

    // Animated stars
    const stars = [];
    const starPositions = [
      [-0.8, 0.6], [-0.4, 0.5], [0, 0.4], [0.4, 0.3], [0.7, 0.1],
      [0.5, -0.2], [0.2, -0.4], [-0.3, -0.5], [-0.7, -0.3],
      [-0.9, 0], [-0.5, 0.2], [0.6, 0.6], [0.3, 0], [-0.2, 0.1]
    ];

    starPositions.forEach((pos, i) => {
      const star = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 12, 12),
        new THREE.MeshBasicMaterial({ 
          color: 0xffffee,
          transparent: true,
          opacity: 0.9
        })
      );
      star.position.set(pos[0], pos[1], 0);
      
      // Star glow
      const starGlow = new THREE.PointLight(0xffffaa, 0.5, 1);
      starGlow.position.copy(star.position);
      constellationGroup.add(starGlow);
      
      constellationGroup.add(star);
      stars.push({ mesh: star, light: starGlow, phase: i * 0.5 });
    });

    constellationGroup.position.set(0, 5, -10.8);
    constellationGroup.userData = { type: 'constellation', name: 'Mappa Stellare' };
    scene.add(constellationGroup);
    interactiveObjects.push(constellationGroup);

    // ========== 3. LABYRINTH WITH MARBLE BALL ==========
    const labyrinthGroup = new THREE.Group();
    
    // Table base
    const tableBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.7, 0.8, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0x4a3a2a, 
        roughness: 0.7 
      })
    );
    tableBase.position.y = 0.4;
    tableBase.castShadow = true;
    labyrinthGroup.add(tableBase);

    // Labyrinth board
    const boardMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.8
    });
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.1, 1.5),
      boardMaterial
    );
    board.position.y = 0.85;
    board.castShadow = true;
    labyrinthGroup.add(board);

    // Maze walls
    const wallMat = new THREE.MeshStandardMaterial({ 
      color: 0x2a2a2a, 
      roughness: 0.6 
    });
    
    const mazeWalls = [
      { x: -0.5, z: 0.5, w: 0.6, d: 0.08 },
      { x: 0.2, z: 0.5, w: 0.08, d: 0.4 },
      { x: -0.3, z: 0, w: 0.08, d: 0.5 },
      { x: 0.4, z: 0, w: 0.5, d: 0.08 },
      { x: 0, z: -0.4, w: 0.6, d: 0.08 },
      { x: -0.5, z: -0.2, w: 0.08, d: 0.3 }
    ];

    mazeWalls.forEach(wall => {
      const mazeWall = new THREE.Mesh(
        new THREE.BoxGeometry(wall.w, 0.15, wall.d),
        wallMat
      );
      mazeWall.position.set(wall.x, 0.95, wall.z);
      mazeWall.castShadow = true;
      labyrinthGroup.add(mazeWall);
    });

    // Marble ball
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.2,
        metalness: 0.8
      })
    );
    ball.position.set(-0.5, 1, 0.5);
    ball.castShadow = true;
    labyrinthGroup.add(ball);

    labyrinthGroup.position.set(7.5, 0, -7.5);
    labyrinthGroup.userData = { type: 'labyrinth', name: 'Labirinto di Cnosso' };
    scene.add(labyrinthGroup);
    interactiveObjects.push(labyrinthGroup);

    // ========== 4. GOLDEN FEATHERS ==========
    const featherObjects = [];
    for (let i = 0; i < 12; i++) {
      const featherGroup = new THREE.Group();
      
      // Feather geometry
      const featherGeometry = new THREE.ConeGeometry(0.08, 0.4, 4);
      const featherMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xaa8800,
        emissiveIntensity: 0.6,
        metalness: 0.7,
        roughness: 0.3
      });
      const feather = new THREE.Mesh(featherGeometry, featherMaterial);
      feather.castShadow = true;
      featherGroup.add(feather);

      // Feather glow
      const featherGlow = new THREE.PointLight(0xffdd00, 1, 2);
      featherGlow.position.y = 0.2;
      featherGroup.add(featherGlow);

      const angle = (i / 12) * Math.PI * 2;
      const radius = 3 + Math.random() * 2.5;
      featherGroup.position.set(
        Math.cos(angle) * radius,
        0.3,
        Math.sin(angle) * radius
      );
      featherGroup.rotation.z = Math.PI / 2;
      featherGroup.userData = { type: 'feather', name: 'Piuma Dorata', index: i };
      
      scene.add(featherGroup);
      interactiveObjects.push(featherGroup);
      featherObjects.push({ group: featherGroup, angle: angle, radius: radius });
    }

    // ========== 5. COMPASS OF ULYSSES ==========
    const compassGroup = new THREE.Group();
    
    // Compass base
    const compassBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32),
      new THREE.MeshStandardMaterial({
        color: 0x8b6914,
        metalness: 0.8,
        roughness: 0.25
      })
    );
    compassBase.castShadow = true;
    compassGroup.add(compassBase);

    // Compass glass
    const compassGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.05, 32),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.1,
        transmission: 0.9,
        thickness: 0.5
      })
    );
    compassGlass.position.y = 0.15;
    compassGroup.add(compassGlass);

    // Needle (red)
    const needle = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.5, 4),
      new THREE.MeshStandardMaterial({
        color: 0xff0000,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x660000,
        emissiveIntensity: 0.7
      })
    );
    needle.position.y = 0.35;
    needle.rotation.x = Math.PI / 2;
    needle.castShadow = true;
    compassGroup.add(needle);

    // Compass glow
    const compassGlow = new THREE.PointLight(0x0088ff, 2, 3);
    compassGlow.position.y = 0.3;
    compassGroup.add(compassGlow);

    compassGroup.position.set(7.5, 1.3, 7.5);
    compassGroup.userData = { type: 'compass', name: 'Bussola di Ulisse' };
    compassGroup.castShadow = true;
    scene.add(compassGroup);
    interactiveObjects.push(compassGroup);

    // ========== ADVANCED PARTICLE SYSTEM ==========
    const createParticleSystem = () => {
      const particleCount = 2000;
      const positions = new Float32Array(particleCount * 3);
      const velocities = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 24;
        positions[i + 1] = Math.random() * 10;
        positions[i + 2] = (Math.random() - 0.5) * 24;
        
        velocities[i] = (Math.random() - 0.5) * 0.01;
        velocities[i + 1] = -Math.random() * 0.008;
        velocities[i + 2] = (Math.random() - 0.5) * 0.01;
      }
      
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const material = new THREE.PointsMaterial({
        color: 0xdddddd,
        size: 0.04,
        transparent: true,
        opacity: 0.5,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
      });
      
      const particles = new THREE.Points(geometry, material);
      return { particles, velocities, positions };
    };

    const dustSystem = createParticleSystem();
    scene.add(dustSystem.particles);

    // ========== RAYCASTER & INTERACTIONS ==========
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let rotationY = 0;
    let rotationX = 0;
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    const mouseSensitivity = 0.003;

    const onMouseDown = (event) => {
      if (event.button === 0 || event.button === 2) {
        isDragging = true;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
        document.body.style.cursor = 'grabbing';
      }
    };

    const onMouseUp = (event) => {
      if (event.button === 0 || event.button === 2) {
        isDragging = false;
        document.body.style.cursor = 'grab';
      }
    };

    const onMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      if (isDragging) {
        const deltaX = event.clientX - previousMouseX;
        const deltaY = event.clientY - previousMouseY;
        
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
        
        rotationY -= deltaX * mouseSensitivity;
        rotationX -= deltaY * mouseSensitivity;
        rotationX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotationX));
      } else {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveObjects, true);
        document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
      }
    };

    const onClick = (event) => {
      if (!isDragging) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveObjects, true);

        if (intersects.length > 0) {
          let object = intersects[0].object;
          while (object && !object.userData.type && object.parent) {
            object = object.parent;
          }
          if (object && object.userData.type) {
            handleObjectClick(object);
          }
        }
      }
    };

    const onContextMenu = (event) => {
      event.preventDefault();
      return false;
    };

    const handleObjectClick = (object) => {
      const type = object.userData.type;
      const name = object.userData.name;

      if (type === 'door') {
        const allSolved = Object.values(puzzles).every(v => v);
        if (allSolved) {
          // Animate door opening
          setEscaped(true);
        } else {
          const remaining = Object.values(puzzles).filter(v => !v).length;
          showNotification(`🔒 La porta è sigillata! Mancano ${remaining} enigmi.`);
        }
      } else if (type === 'feather') {
        if (!puzzles.wings) {
          scene.remove(object);
          setFeathersCollected(prev => {
            const newCount = prev + 1;
            if (newCount >= 12) {
              setPuzzles(p => ({ ...p, wings: true }));
              setInventory(prev => [...prev, '🪶 Ali di Icaro Complete']);
              showNotification('✨ Tutte le piume raccolte! Le Ali di Icaro sono tue!');
            } else {
              showNotification(`🪶 Piuma raccolta! (${newCount}/12)`);
            }
            return newCount;
          });
        }
      } else {
        setExamining(type);
        showNotification(`🔍 Esamini: ${name}`);
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);

    // ========== KEYBOARD CONTROLS ==========
    const keys = {};
    window.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    // ========== ANIMATION LOOP ==========
    let time = 0;
    const clock = new THREE.Clock();
    
    setLoading(false);

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      time += delta;

      // Camera controls
      camera.rotation.order = 'YXZ';
      camera.rotation.y = rotationY;
      camera.rotation.x = rotationX;

      // WASD Movement
      const moveSpeed = 0.15;
      const direction = new THREE.Vector3();
      
      if (keys['w']) direction.z = 1;
      if (keys['s']) direction.z = -1;
      if (keys['a']) direction.x = -1;
      if (keys['d']) direction.x = 1;

      if (direction.length() > 0) {
        direction.normalize();
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
        right.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
        camera.position.addScaledVector(forward, direction.z * moveSpeed);
        camera.position.addScaledVector(right, direction.x * moveSpeed);
      }

      camera.position.x = Math.max(-9.5, Math.min(9.5, camera.position.x));
      camera.position.z = Math.max(-9.5, Math.min(9.5, camera.position.z));

      // Animate torches
      torches.forEach((torch, i) => {
        const flicker = Math.sin(time * 6 + i * 2) * 0.5 + Math.cos(time * 8 + i) * 0.3;
        torch.light.intensity = 4 + flicker;
        torch.flame.scale.y = 1 + flicker * 0.2;
        torch.glow.scale.setScalar(1 + flicker * 0.15);
      });

      // Animate manuscript pages
      pageLeft.rotation.y = -Math.PI / 8 + Math.sin(time * 0.5) * 0.05;
      pageRight.rotation.y = Math.PI / 8 - Math.sin(time * 0.5) * 0.05;
      manuscriptGroup.position.y = Math.sin(time * 0.8) * 0.05;

      // Animate stars
      stars.forEach((star, i) => {
        const pulse = Math.sin(time * 2 + star.phase) * 0.5 + 0.5;
        star.mesh.material.opacity = 0.6 + pulse * 0.4;
        star.light.intensity = 0.3 + pulse * 0.4;
        star.mesh.scale.setScalar(0.8 + pulse * 0.4);
      });

      // Animate labyrinth ball
      ball.position.x = -0.5 + Math.sin(time * 0.7) * 0.2;
      ball.position.z = 0.5 + Math.cos(time * 0.9) * 0.2;
      ball.rotation.x += 0.02;
      ball.rotation.z += 0.015;

      // Animate feathers
      featherObjects.forEach((f, i) => {
        if (f.group.parent) {
          f.group.rotation.y = time + i * 0.5;
          f.group.position.y = 0.3 + Math.sin(time * 2 + i) * 0.1;
          
          const pulse = Math.sin(time * 3 + i) * 0.5 + 0.5;
          f.group.children[0].material.emissiveIntensity = 0.4 + pulse * 0.4;
        }
      });

      // Animate compass needle
      needle.rotation.z = Math.sin(time * 0.5) * 0.3;
      compassGlow.intensity = 2 + Math.sin(time * 2) * 0.5;

      // Animate door lock when all puzzles solved
      if (Object.values(puzzles).every(v => v)) {
        const pulse = Math.sin(time * 5) * 0.5 + 1.5;
        lock.scale.setScalar(pulse);
        lockMaterial.emissiveIntensity = 1 + Math.sin(time * 5) * 0.8;
        lockGlow.scale.setScalar(pulse * 1.2);
        lockGlow.material.opacity = 0.3 + Math.sin(time * 5) * 0.3;
      }

      // Update particles
      const positions = dustSystem.positions;
      const velocities = dustSystem.velocities;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];
        
        if (positions[i + 1] < 0) {
          positions[i + 1] = 10;
          positions[i] = (Math.random() - 0.5) * 24;
          positions[i + 2] = (Math.random() - 0.5) * 24;
        }
      }
      dustSystem.particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // ========== WINDOW RESIZE ==========
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ========== CLEANUP ==========
    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('resize', onResize);
      document.body.style.cursor = 'default';
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [escaped, puzzles]);

  const solvePuzzle = (type) => {
    const value = inputValue.toUpperCase().trim();
    
    const solutions = {
      manuscript: ['NOSTOS'],
      constellation: ['ORSA', 'ORSA MAGGIORE', 'URSA MAJOR'],
      labyrinth: ['NEESENNE'],
      compass: ['OVEST', 'WEST', 'O', 'W']
    };

    if (solutions[type] && solutions[type].includes(value)) {
      setPuzzles(p => ({ ...p, [type]: true }));
      
      const rewards = {
        manuscript: '🗝️ Chiave di Bronzo',
        constellation: '🗺️ Frammento di Mappa',
        labyrinth: '🧵 Filo di Arianna',
        compass: '🔑 Chiave d\'Argento'
      };
      
      setInventory(prev => [...prev, rewards[type]]);
      showNotification(`✅ Corretto! ${rewards[type]} ottenuto!`);
      setExamining(null);
      setInputValue('');
    } else {
      showNotification('❌ Risposta errata! Riprova...');
    }
  };

  if (escaped) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-900 to-yellow-700 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-amber-300 rounded-full"
              style={{
                width: Math.random() * 4 + 2 + 'px',
                height: Math.random() * 4 + 2 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animation: `twinkle ${Math.random() * 3 + 2}s infinite`
              }}
            />
          ))}
        </div>
        <div className="bg-black/80 backdrop-blur-md border-4 border-amber-400 rounded-2xl p-16 max-w-4xl text-center shadow-2xl relative z-10">
          <div className="text-9xl mb-8 animate-bounce">🏛️</div>
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 mb-8 tracking-wider drop-shadow-2xl">
            LIBERTÀ!
          </h1>
          <p className="text-3xl text-amber-100 mb-8 font-semibold">
            🎉 Hai risolto tutti gli enigmi di Dedalo!
          </p>
          <div className="bg-amber-900/40 border-2 border-amber-600 rounded-lg p-8 mb-6">
            <p className="text-xl text-amber-200 italic leading-relaxed">
              Come <span className="text-amber-300 font-bold">Ulisse</span> che ritornò ad Itaca,<br/>
              come <span className="text-amber-300 font-bold">Dedalo</span> che fuggì con le ali,<br/>
              anche tu hai dimostrato <span className="text-yellow-300">saggezza</span> e <span className="text-yellow-300">ingegno</span>.
            </p>
          </div>
          <div className="flex gap-4 justify-center text-5xl mt-8">
            <span className="animate-pulse">⭐</span>
            <span className="animate-pulse" style={{animationDelay: '0.2s'}}>🏆</span>
            <span className="animate-pulse" style={{animationDelay: '0.4s'}}>⭐</span>
          </div>
        </div>
        <style jsx>{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 to-amber-950 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-6xl mb-6 animate-pulse">🏛️</div>
            <div className="text-2xl text-amber-300 font-bold mb-4">Caricamento...</div>
            <div className="w-64 h-2 bg-stone-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 animate-pulse" style={{width: '100%'}}></div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={mountRef} className="w-full h-full" />
      
      {/* HUD - Top Left */}
      <div className="absolute top-6 left-6 bg-gradient-to-br from-black/90 to-stone-900/90 backdrop-blur-md text-white p-6 rounded-2xl max-w-md border-2 border-amber-600/50 shadow-2xl">
        <h2 className="text-3xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">
          🏛️ Il Laboratorio di Dedalo
        </h2>
        <div className="text-sm space-y-3 text-gray-300">
          <div className="flex items-center gap-3 bg-stone-800/50 p-3 rounded-lg">
            <span className="text-2xl">🎮</span>
            <div>
              <strong className="text-amber-400 block">WASD / Frecce</strong>
              <span className="text-xs">Movimento</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-stone-800/50 p-3 rounded-lg">
            <span className="text-2xl">🖱️</span>
            <div>
              <strong className="text-amber-400 block">Trascina Mouse</strong>
              <span className="text-xs">Guarda intorno</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-stone-800/50 p-3 rounded-lg">
            <span className="text-2xl">👆</span>
            <div>
              <strong className="text-amber-400 block">Click Sinistro</strong>
              <span className="text-xs">Interagisci con oggetti</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t-2 border-amber-700/50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-amber-300 font-bold text-lg">Enigmi Risolti</span>
            <span className="text-white font-black text-2xl">
              {Object.values(puzzles).filter(Boolean).length}/5
            </span>
          </div>
          <div className="flex gap-2">
            {Object.entries(puzzles).map(([key, solved]) => (
              <div 
                key={key} 
                className={`flex-1 h-3 rounded-full transition-all duration-500 ${
                  solved 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-lg shadow-green-500/50' 
                    : 'bg-gray-700'
                }`} 
              />
            ))}
          </div>
        </div>
        
        {feathersCollected > 0 && !puzzles.wings && (
          <div className="mt-4 bg-amber-900/40 border border-amber-600/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-bold">🪶 Piume Raccolte</span>
              <span className="text-white font-bold text-xl">{feathersCollected}/12</span>
            </div>
            <div className="mt-2 w-full bg-stone-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-amber-500 h-2 rounded-full transition-all duration-300"
                style={{width: `${(feathersCollected / 12) * 100}%`}}
              />
            </div>
          </div>
        )}
      </div>

      {/* Inventory - Top Right */}
      <div className="absolute top-6 right-6 bg-gradient-to-br from-black/90 to-stone-900/90 backdrop-blur-md text-white p-6 rounded-2xl max-w-xs border-2 border-amber-600/50 shadow-2xl">
        <h3 className="text-2xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">
          📦 Inventario
        </h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {inventory.length === 0 ? (
            <p className="italic text-gray-500 text-sm text-center py-4">
              Nessun oggetto raccolto
            </p>
          ) : (
            inventory.map((item, i) => (
              <div 
                key={i} 
                className="bg-gradient-to-r from-amber-900/60 to-yellow-900/40 border border-amber-700/50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transform hover:scale-105 transition-transform"
              >
                {item}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white px-12 py-6 rounded-2xl text-2xl font-black shadow-2xl border-4 border-amber-300 animate-pulse">
            {notification}
          </div>
        </div>
      )}

      {/* Puzzle Examination Modal */}
      {examining && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-6 z-40">
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 border-4 border-amber-600 rounded-2xl p-10 max-w-3xl shadow-2xl">
            
            {examining === 'manuscript' && (
              <div>
                <h3 className="text-4xl font-black text-amber-300 mb-6 flex items-center gap-3">
                  📜 Manoscritto di Omero
                </h3>
                <div className="bg-amber-950/40 border-2 border-amber-700/50 rounded-lg p-6 mb-6">
                  <p className="text-amber-100 mb-4 italic text-lg leading-relaxed">
                    "Dopo dieci anni di guerra e dieci di mare,<br/>
                    l'eroe sognava il <span className="text-yellow-300 font-bold">ritornare</span>.<br/>
                    Una parola greca rappresenta questo concetto..."
                  </p>
                  <p className="text-amber-400 text-xl mb-2">💡 Indizio:</p>
                  <p className="text-amber-200">Il ritorno di Ulisse in greco: <span className="text-yellow-300 font-bold">_ _ _ _ _ _</span> (6 lettere)</p>
                </div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Inserisci la parola greca..."
                  className="w-full bg-stone-700/80 border-2 border-amber-500 rounded-lg px-6 py-4 mb-6 text-white text-lg font-medium focus:outline-none focus:ring-4 focus:ring-amber-500/50"
                  onKeyPress={(e) => e.key === 'Enter' && solvePuzzle('manuscript')}
                  autoFocus
                />
                <div className="flex gap-4">
                  <button 
                    onClick={() => solvePuzzle('manuscript')} 
                    className="flex-1 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 px-8 py-4 rounded-xl font-black text-lg shadow-lg transform hover:scale-105 transition-all"
                  >
                    ✓ Conferma
                  </button>
                  <button 
                    onClick={() => { setExamining(null); setInputValue(''); }} 
                    className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 px-8 py-4 rounded-xl font-black text-lg shadow-lg transform hover:scale-105 transition-all"
                  >
                    ✕ Chiudi
                  </button>
                </div>
              </div>
            )}

            {examining === 'constellation' && (
              <div>
                <h3 className="text-4xl font-black text-indigo-300 mb-6 flex items-center gap-3">
                  ⭐ Mappa Stellare di Dedalo
                </h3>
                <div className="bg-indigo-950/40 border-2 border-indigo-700/50 rounded-lg p-6 mb-6">
                  <p className="text-indigo-100 mb-4 text-lg">
                    I naviganti antichi usavano questa costellazione per orientarsi.<br/>
                    Ha forma di <span className="text-cyan-300 font-bold">mestolo</span> nel cielo settentrionale.
                  </p>
                  <p className="text-indigo-400 text-xl mb-2">💡 Indizio:</p>
                  <p className="text-indigo-200">La costellazione guida: <span className="text-cyan-300 font-bold">_ _ _ _</span> Maggiore</p>
                </div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Nome della costellazione..."
                  className="w-full bg-stone-700/80 border-2 border-indigo-500 rounded-lg px-6 py-4 mb-6 text-white text-lg font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
                  onKeyPress={(e) => e.key === 'Enter' && solvePuzzle('constellation')}
                  autoFocus
                />
                <div className="flex gap-4">
                  <button 
                    onClick={() => solvePuzzle('constellation')} 
                    className="flex-1 bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 px-8 py-4 rounded-xl font-black text-lg shadow-lg transform hover:scale-105 transition-all"
                  >
                    ✓ Conferma
                  </button>
                  <button 
                    onClick={() => { setExamining(null); setInputValue(''); }} 
                    className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 px-8 py-4 rounded-xl font-black text-lg shadow-lg transform hover:scale-105 transition-all"
                  >
                    ✕ Chiudi
                  </button>
                </div>
              </div>
            )}

            {examining === 'labyrinth' && (
              <div>
                <h3 className="text-4xl font-black text-red-300 mb-6 flex items-center gap-3">
                  🌀 Il Labirinto di Cnosso
                </h3>
                <div className="bg-red-950/40 border-2 border-red-700/50 rounded-lg p-6 mb-6">
                  <p className="text-red-100 mb-4 text-lg">
                    Guida la biglia attraverso il labirinto seguendo questo percorso:
                  </p>
                  <div className="bg-red-900/40 rounded-lg p-4 mb-4">
                    <p className="text-red-200 font-bold text-xl text-center">
                      Nord → Est → Est → Sud → Est → Nord → Nord → Est
                    </p>
                  </div>
                  <p className="text-red-400 text-xl mb-2">💡 Indizio:</p>
                  <p className="text-red-200">Scrivi le <span className="text-yellow-300 font-bold">iniziali</span> del percorso (es: N-E-E-S...)</p>
                </div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                  placeholder="NEESENNE"
                  className="w-full bg-stone-700/80 border-2 border-red-500 rounded-lg px-6 py-4 mb-6 text-white text-lg font-bold tracking-widest uppercase text-center focus:outline-none focus:ring-4 focus:ring-red-500/50"
                  onKeyPress={(e) => e.key === 'Enter' && solvePuzzle('labyrinth')}
                  autoFocus
                />
                <div className="flex gap-4">
                  <button 
                    onClick={() => solvePuzzle('labyrinth')} 
                    className="flex-1 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 px-8 py-4 rounded-xl font-black text-lg shadow-lg transform hover:scale-105 transition-all"
                  >
                    ✓ Conferma
                  </button>
                  <button 
                    onClick={() => { setExamining(null); setInputValue(''); }} 
                    className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 px-8 py-4 rounded-xl font-black text-lg shadow-lg transform hover:scale-105 transition-all"
                  >
                    ✕ Chiudi
                  </button>
                </div>
              </div>
            )}

            {examining === 'compass' && (
              <div>
                <h3 className="text-4xl font-black text-teal-300 mb-6 flex items-center gap-3">
                  🧭 Bussola di Ulisse
                </h3>
                <div className="bg-teal-950/40 border-2 border-teal-700/50 rounded-lg p-6 mb-6">
                  <p className="text-teal-100 mb-4 italic text-lg leading-relaxed">
                    "Dove tramonta il sole, dove il Mare Ionio bagna le coste.<br/>
                    In quale direzione si trova <span className="text-cyan-300 font-bold">Itaca</span>?"
                  </p>
                  <p className="text-teal-400 text-xl mb-2">💡 Indizio:</p>
                  <p className="text-teal-200">Itaca è a <span className="text-cyan-300 font-bold">_ _ _ _ _</span> della Grecia continentale</p>
                </div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Nord, Sud, Est o Ovest..."
                  className="w-full bg-stone-700/80 border-2 border-teal-500 rounded-lg px-6 py-4 mb-6 text-white text-lg font-medium focus:outline-none focus:ring-4 focus:ring-teal-500/50"
                  onKeyPress={(e) => e.key === 'Enter' && solvePuzzle('compass')}
                  autoFocus
                />
                <div className="flex gap-4">
                  <button 
                    onClick={() => solvePuzzle('compass')} 
                    className="flex-1 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 px-8 py-4 rounded-xl font-black text-lg shadow-lg transform hover:scale-105 transition-all"
                  >
                    ✓ Conferma
                  </button>
                  <button 
                    onClick={() => { setExamining(null); setInputValue(''); }} 
                    className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 px-8 py-4 rounded-xl font-black text-lg shadow-lg transform hover:scale-105 transition-all"
                  >
                    ✕ Chiudi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
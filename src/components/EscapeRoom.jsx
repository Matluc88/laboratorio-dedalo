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

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  useEffect(() => {
    if (escaped) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.FogExp2(0x1a1520, 0.02);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.7, 8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x2d2d4d, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.SpotLight(0xffeedd, 3, 30, Math.PI / 5, 0.25, 1.8);
    mainLight.position.set(0, 7.8, 0);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    // Torches
    const createTorch = (x, z) => {
      const light = new THREE.PointLight(0xff7700, 2, 15, 2);
      light.position.set(x, 3, z);
      light.castShadow = true;
      scene.add(light);

      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.8 })
      );
      flame.position.set(x, 3.3, z);
      scene.add(flame);

      return { light, flame };
    };

    const torch1 = createTorch(-7, -7);
    const torch2 = createTorch(7, -7);
    const torch3 = createTorch(-7, 7);
    const torch4 = createTorch(7, 7);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d3d3d,
      roughness: 0.9,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(floorGeometry, floorMaterial.clone());
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 8;
    scene.add(ceiling);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.9
    });

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMaterial.clone());
    backWall.position.set(0, 4, -10);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMaterial.clone());
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-10, 4, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMaterial.clone());
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(10, 4, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    const frontWallLeft = new THREE.Mesh(new THREE.PlaneGeometry(6, 8), wallMaterial.clone());
    frontWallLeft.rotation.y = Math.PI;
    frontWallLeft.position.set(-7, 4, 10);
    scene.add(frontWallLeft);

    const frontWallRight = new THREE.Mesh(new THREE.PlaneGeometry(6, 8), wallMaterial.clone());
    frontWallRight.rotation.y = Math.PI;
    frontWallRight.position.set(7, 4, 10);
    scene.add(frontWallRight);

    // Interactive objects array
    const interactiveObjects = [];

    // DOOR - Large and visible
    const doorGroup = new THREE.Group();
    
    const doorGeometry = new THREE.BoxGeometry(4, 6, 0.4);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c3a24,
      roughness: 0.7
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.castShadow = true;
    doorGroup.add(door);

    // Giant golden lock
    const lockGeometry = new THREE.BoxGeometry(0.8, 1, 0.3);
    const lockMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x886600,
      emissiveIntensity: 0.5
    });
    const lock = new THREE.Mesh(lockGeometry, lockMaterial);
    lock.position.z = 0.3;
    lock.castShadow = true;
    doorGroup.add(lock);

    const lockGlowGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const lockGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      transparent: true,
      opacity: 0.15
    });
    const lockGlow = new THREE.Mesh(lockGlowGeometry, lockGlowMaterial);
    lockGlow.position.z = 0.3;
    doorGroup.add(lockGlow);

    doorGroup.position.set(0, 4, 9.8);
    doorGroup.userData = { type: 'door', name: 'Porta d\'Uscita' };
    scene.add(doorGroup);
    interactiveObjects.push(doorGroup);

    // Door spotlight
    const doorLight = new THREE.SpotLight(0xffeecc, 2, 12, Math.PI / 6, 0.3);
    doorLight.position.set(0, 7, 8);
    doorLight.target = doorGroup;
    scene.add(doorLight);

    // 1. MANUSCRIPT
    const manuscriptGroup = new THREE.Group();
    const manuscriptGeometry = new THREE.BoxGeometry(0.7, 0.12, 0.9);
    const manuscriptMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4e4c1,
      emissive: 0xffeecc,
      emissiveIntensity: 0.2
    });
    const manuscript = new THREE.Mesh(manuscriptGeometry, manuscriptMaterial);
    manuscriptGroup.add(manuscript);
    manuscriptGroup.position.set(-6.5, 1.5, -6);
    manuscriptGroup.castShadow = true;
    manuscriptGroup.userData = { type: 'manuscript', name: 'Manoscritto di Omero' };
    scene.add(manuscriptGroup);
    interactiveObjects.push(manuscriptGroup);

    const manuscriptLight = new THREE.PointLight(0xffdd88, 0.8, 3);
    manuscriptLight.position.set(-6.5, 2, -6);
    scene.add(manuscriptLight);

    // 2. STAR MAP
    const starMap = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 2.4),
      new THREE.MeshStandardMaterial({
        color: 0x0a0a1a,
        emissive: 0x000033,
        emissiveIntensity: 0.5
      })
    );
    starMap.position.set(0, 3.5, -9.8);
    starMap.userData = { type: 'constellation', name: 'Mappa Stellare' };
    scene.add(starMap);
    interactiveObjects.push(starMap);

    // Add stars
    for (let i = 0; i < 15; i++) {
      const star = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffee })
      );
      star.position.set(
        (Math.random() - 0.5) * 2,
        3.5 + (Math.random() - 0.5) * 2,
        -9.7
      );
      scene.add(star);
    }

    // 3. LABYRINTH
    const labyrinthGroup = new THREE.Group();
    const labyrinthBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.3, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x6b3410 })
    );
    labyrinthGroup.add(labyrinthBase);

    for (let i = 0; i < 8; i++) {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.35, Math.random() * 0.4 + 0.3),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
      );
      wall.position.set(
        (Math.random() - 0.5) * 1,
        0.25,
        (Math.random() - 0.5) * 1
      );
      wall.rotation.y = Math.random() * Math.PI;
      labyrinthGroup.add(wall);
    }

    labyrinthGroup.position.set(6.5, 1.25, -6);
    labyrinthGroup.castShadow = true;
    labyrinthGroup.userData = { type: 'labyrinth', name: 'Labirinto di Cnosso' };
    scene.add(labyrinthGroup);
    interactiveObjects.push(labyrinthGroup);

    // 4. FEATHERS
    const featherObjects = [];
    for (let i = 0; i < 12; i++) {
      const featherGroup = new THREE.Group();
      const feather = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.3, 4),
        new THREE.MeshStandardMaterial({
          color: 0xffd700,
          emissive: 0x886600,
          emissiveIntensity: 0.4
        })
      );
      featherGroup.add(feather);

      const angle = (i / 12) * Math.PI * 2;
      const radius = 2.5 + Math.random() * 2;
      featherGroup.position.set(
        Math.cos(angle) * radius,
        0.2,
        Math.sin(angle) * radius
      );
      featherGroup.rotation.z = Math.PI / 2;
      featherGroup.castShadow = true;
      featherGroup.userData = { type: 'feather', name: 'Piuma Dorata', index: i };
      
      scene.add(featherGroup);
      interactiveObjects.push(featherGroup);
      featherObjects.push(featherGroup);
    }

    // 5. COMPASS
    const compassGroup = new THREE.Group();
    const compassBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.15, 32),
      new THREE.MeshStandardMaterial({
        color: 0x8b6914,
        metalness: 0.8,
        roughness: 0.25
      })
    );
    compassGroup.add(compassBase);

    const needle = new THREE.Mesh(
      new THREE.ConeGeometry(0.03, 0.5, 4),
      new THREE.MeshStandardMaterial({
        color: 0xff0000,
        metalness: 0.9,
        emissive: 0x440000,
        emissiveIntensity: 0.5
      })
    );
    needle.position.y = 0.3;
    needle.rotation.x = Math.PI / 2;
    compassGroup.add(needle);

    compassGroup.position.set(6.5, 1.7, 6);
    compassGroup.castShadow = true;
    compassGroup.userData = { type: 'compass', name: 'Bussola di Ulisse' };
    scene.add(compassGroup);
    interactiveObjects.push(compassGroup);

    // Dust particles
    const dustGeometry = new THREE.BufferGeometry();
    const dustCount = 1000;
    const dustPositions = new Float32Array(dustCount * 3);
    
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 22;
      dustPositions[i + 1] = Math.random() * 9;
      dustPositions[i + 2] = (Math.random() - 0.5) * 22;
    }
    
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0xdddddd,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Mouse controls
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
        document.body.style.cursor = 'default';
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
        const intersects = raycaster.intersectObjects(interactiveObjects);
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
          setEscaped(true);
        } else {
          const remaining = Object.values(puzzles).filter(v => !v).length;
          showNotification(`La porta è sigillata! Mancano ${remaining} enigmi.`);
        }
      } else if (type === 'feather') {
        if (!puzzles.wings) {
          scene.remove(object);
          setFeathersCollected(prev => {
            const newCount = prev + 1;
            if (newCount >= 12) {
              setPuzzles(p => ({ ...p, wings: true }));
              setInventory(prev => [...prev, 'Ali di Icaro Complete']);
              showNotification('✨ Tutte le piume raccolte! Le Ali di Icaro sono tue!');
            } else {
              showNotification(`Piuma raccolta! (${newCount}/12)`);
            }
            return newCount;
          });
        }
      } else {
        setExamining(type);
        showNotification(`Esamini: ${name}`);
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);

    // Keyboard controls
    const keys = {};
    window.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
      keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
      keys[e.key] = false;
    });

    // Animation
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.016;

      camera.rotation.order = 'YXZ';
      camera.rotation.y = rotationY;
      camera.rotation.x = rotationX;

      // Movement
      const moveSpeed = 0.12;
      const direction = new THREE.Vector3();
      
      if (keys['w'] || keys['ArrowUp']) direction.z = 1;
      if (keys['s'] || keys['ArrowDown']) direction.z = -1;
      if (keys['a'] || keys['ArrowLeft']) direction.x = -1;
      if (keys['d'] || keys['ArrowRight']) direction.x = 1;

      if (direction.length() > 0) {
        direction.normalize();
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
        right.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
        camera.position.addScaledVector(forward, direction.z * moveSpeed);
        camera.position.addScaledVector(right, direction.x * moveSpeed);
      }

      camera.position.x = Math.max(-9, Math.min(9, camera.position.x));
      camera.position.z = Math.max(-9, Math.min(9, camera.position.z));

      // Animate torches
      [torch1, torch2, torch3, torch4].forEach((torch, i) => {
        torch.light.intensity = 2 + Math.sin(time * 5 + i) * 0.5;
        torch.flame.scale.y = 1 + Math.sin(time * 6 + i) * 0.2;
      });

      // Animate feathers
      featherObjects.forEach((feather, i) => {
        if (feather.parent) {
          feather.rotation.y += 0.01;
          feather.position.y = 0.2 + Math.sin(time * 2 + i) * 0.05;
        }
      });

      // Pulsate lock when solved
      if (Object.values(puzzles).every(v => v)) {
        const pulse = Math.sin(time * 4) * 0.3 + 1;
        lock.scale.setScalar(pulse);
        lockMaterial.emissiveIntensity = 1 + Math.sin(time * 4) * 0.5;
        lockGlowMaterial.opacity = 0.3 + Math.sin(time * 4) * 0.2;
      }

      // Dust
      const dustPos = dust.geometry.attributes.position.array;
      for (let i = 1; i < dustPos.length; i += 3) {
        dustPos[i] -= 0.003;
        if (dustPos[i] < 0) dustPos[i] = 9;
      }
      dust.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('resize', onResize);
      document.body.style.cursor = 'default';
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [escaped, puzzles]);

  const solvePuzzle = (type) => {
    const value = inputValue.toUpperCase();
    
    if (type === 'manuscript' && value === 'NOSTOS') {
      setPuzzles(p => ({ ...p, manuscript: true }));
      setInventory(prev => [...prev, 'Chiave di Bronzo']);
      showNotification('✓ NOSTOS è corretto!');
      setExamining(null);
      setInputValue('');
    } else if (type === 'constellation' && (value === 'ORSA' || value === 'ORSA MAGGIORE')) {
      setPuzzles(p => ({ ...p, constellation: true }));
      setInventory(prev => [...prev, 'Frammento di Mappa']);
      showNotification('✓ Orsa Maggiore corretta!');
      setExamining(null);
      setInputValue('');
    } else if (type === 'labyrinth' && value === 'NEESENNE') {
      setPuzzles(p => ({ ...p, labyrinth: true }));
      setInventory(prev => [...prev, 'Filo di Arianna']);
      showNotification('✓ Percorso corretto!');
      setExamining(null);
      setInputValue('');
    } else if (type === 'compass' && (value === 'OVEST' || value === 'WEST' || value === 'O' || value === 'W')) {
      setPuzzles(p => ({ ...p, compass: true }));
      setInventory(prev => [...prev, 'Chiave d\'Argento']);
      showNotification('✓ Ovest è corretto!');
      setExamining(null);
      setInputValue('');
    } else {
      showNotification('❌ Risposta errata!');
    }
  };

  if (escaped) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-700 to-yellow-600 flex items-center justify-center p-4">
        <div className="bg-black bg-opacity-70 border-4 border-amber-400 rounded-lg p-12 max-w-3xl text-center">
          <div className="text-8xl mb-6">🏛️</div>
          <h1 className="text-6xl font-bold text-amber-300 mb-6">LIBERTÀ!</h1>
          <p className="text-2xl text-amber-100 mb-6">
            Hai risolto tutti gli enigmi di Dedalo!
          </p>
          <p className="text-lg text-amber-200 italic">
            Come Ulisse che ritornò ad Itaca,<br/>
            come Dedalo che fuggì con le ali,<br/>
            anche tu hai dimostrato saggezza e ingegno.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mountRef} className="w-full h-screen" />
      
      <div className="absolute top-4 left-4 bg-black bg-opacity-80 text-white p-5 rounded-lg max-w-sm border-2 border-amber-600">
        <h2 className="text-2xl font-bold mb-3 text-amber-400">🏛️ Il Laboratorio di Dedalo</h2>
        <div className="text-sm space-y-2 text-gray-300">
          <p><strong className="text-amber-400">🎮 WASD / Frecce:</strong> Movimento</p>
          <p><strong className="text-amber-400">🖱️ Trascina:</strong> Guarda intorno</p>
          <p><strong className="text-amber-400">👆 Click:</strong> Interagisci</p>
        </div>
        <div className="mt-4 pt-4 border-t border-amber-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-amber-300 font-bold">Enigmi:</span>
            <span className="text-white font-bold">{Object.values(puzzles).filter(Boolean).length}/5</span>
          </div>
          <div className="flex gap-1">
            {Object.entries(puzzles).map(([key, solved]) => (
              <div key={key} className={`flex-1 h-2 rounded ${solved ? 'bg-green-500' : 'bg-gray-600'}`} />
            ))}
          </div>
        </div>
        {feathersCollected > 0 && !puzzles.wings && (
          <div className="mt-3 text-amber-300">🪶 Piume: {feathersCollected}/12</div>
        )}
      </div>

      <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white p-5 rounded-lg max-w-xs border-2 border-amber-600">
        <h3 className="text-xl font-bold mb-3 text-amber-400">📦 Inventario</h3>
        <div className="space-y-2">
          {inventory.length === 0 ? (
            <p className="italic text-gray-400 text-sm">Vuoto</p>
          ) : (
            inventory.map((item, i) => (
              <div key={i} className="bg-amber-900 bg-opacity-40 border border-amber-700 rounded px-3 py-2 text-sm">
                {item}
              </div>
            ))
          )}
        </div>
      </div>

      {notification && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-600 text-white px-10 py-5 rounded-lg text-xl font-bold animate-pulse">
          {notification}
        </div>
      )}

      {examining && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="bg-stone-900 border-4 border-amber-600 rounded-lg p-8 max-w-2xl">
            
            {examining === 'manuscript' && (
              <div>
                <h3 className="text-3xl font-bold text-amber-300 mb-4">📜 Manoscritto di Omero</h3>
                <p className="text-amber-100 mb-4 italic">
                  "Dopo dieci anni di guerra e dieci di mare,<br/>
                  l'eroe sognava il ritornare.<br/>
                  Una parola greca rappresenta questo concetto..."
                </p>
                <p className="text-amber-400 mb-4">💡 Il ritorno di Ulisse: _______</p>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Parola greca (6 lettere)..."
                  className="w-full bg-stone-700 border-2 border-amber-500 rounded px-4 py-2 mb-4 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && solvePuzzle('manuscript')}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button onClick={() => solvePuzzle('manuscript')} className="flex-1 bg-amber-700 hover:bg-amber-600 px-6 py-3 rounded font-bold">
                    Conferma
                  </button>
                  <button onClick={() => { setExamining(null); setInputValue(''); }} className="flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded font-bold">
                    Chiudi
                  </button>
                </div>
              </div>
            )}

            {examining === 'constellation' && (
              <div>
                <h3 className="text-3xl font-bold text-indigo-300 mb-4">⭐ Mappa Stellare</h3>
                <p className="text-indigo-100 mb-4">
                  I naviganti usavano questa costellazione per orientarsi.
                  Ha forma di mestolo nel cielo settentrionale.
                </p>
                <p className="text-indigo-400 mb-4">💡 _____ Maggiore</p>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Nome della costellazione..."
                  className="w-full bg-stone-700 border-2 border-indigo-500 rounded px-4 py-2 mb-4 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && solvePuzzle('constellation')}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button onClick={() => solvePuzzle('constellation')} className="flex-1 bg-indigo-700 hover:bg-indigo-600 px-6 py-3 rounded font-bold">
                    Conferma
                  </button>
                  <button onClick={() => { setExamining(null); setInputValue(''); }} className="flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded font-bold">
                    Chiudi
                  </button>
                </div>
              </div>
            )}

            {examining === 'labyrinth' && (
              <div>
                <h3 className="text-3xl font-bold text-red-300 mb-4">🌀 Il Labirinto</h3>
                <p className="text-red-100 mb-4">
                  Percorso: Nord → Est → Est → Sud → Est → Nord → Nord → Est
                </p>
                <p className="text-red-400 mb-4">💡 Scrivi le iniziali: NEESENNE</p>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Iniziali del percorso..."
                  className="w-full bg-stone-700 border-2 border-red-500 rounded px-4 py-2 mb-4 text-white uppercase"
                  onKeyPress={(e) => e.key === 'Enter' && solvePuzzle('labyrinth')}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button onClick={() => solvePuzzle('labyrinth')} className="flex-1 bg-red-700 hover:bg-red-600 px-6 py-3 rounded font-bold">
                    Conferma
                  </button>
                  <button onClick={() => { setExamining(null); setInputValue(''); }} className="flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded font-bold">
                    Chiudi
                  </button>
                </div>
              </div>
            )}

            {examining === 'compass' && (
              <div>
                <h3 className="text-3xl font-bold text-teal-300 mb-4">🧭 Bussola di Ulisse</h3>
                <p className="text-teal-100 mb-4">
                  "Dove tramonta il sole, dove il Mare Ionio bagna le coste.<br/>
                  In quale direzione si trova Itaca?"
                </p>
                <p className="text-teal-400 mb-4">💡 Itaca è a _____ della Grecia</p>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Nord, Sud, Est o Ovest..."
                  className="w-full bg-stone-700 border-2 border-teal-500 rounded px-4 py-2 mb-4 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && solvePuzzle('compass')}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button onClick={() => solvePuzzle('compass')} className="flex-1 bg-teal-700 hover:bg-teal-600 px-6 py-3 rounded font-bold">
                    Conferma
                  </button>
                  <button onClick={() => { setExamining(null); setInputValue(''); }} className="flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded font-bold">
                    Chiudi
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
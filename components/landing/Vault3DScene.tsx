'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Vault3DSceneProps {
  interactiveState?: 'idle' | 'encrypt' | 'verify' | 'nominee';
}

export default function Vault3DScene({ interactiveState = 'idle' }: Vault3DSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean up any existing canvas children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    let width = window.innerWidth;
    let height = window.innerHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.045); // Atmospheric depth fog

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Root Group that travels and transforms through space as user scrolls
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    const vaultGroup = new THREE.Group();
    masterGroup.add(vaultGroup);

    // 1. Core Icosahedron (The Vault Core)
    const coreGeo = new THREE.IcosahedronGeometry(1.4, 1);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x6366f1,
      emissive: 0x1e1b4b,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    vaultGroup.add(coreMesh);

    // Inner Glowing Energy Core
    const innerGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.8,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    vaultGroup.add(innerMesh);

    // 2. Concentric Cryptographic Security Rings
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x3730a3,
      metalness: 0.9,
      roughness: 0.1,
    });
    const ring1Geo = new THREE.TorusGeometry(2.1, 0.035, 16, 120);
    const ring1 = new THREE.Mesh(ring1Geo, ringMat1);
    vaultGroup.add(ring1);

    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      metalness: 0.9,
      roughness: 0.1,
    });
    const ring2Geo = new THREE.TorusGeometry(2.5, 0.03, 16, 120);
    const ring2 = new THREE.Mesh(ring2Geo, ringMat2);
    ring2.rotation.x = Math.PI / 3;
    vaultGroup.add(ring2);

    const ringMat3 = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7e22ce,
      metalness: 0.9,
      roughness: 0.1,
    });
    const ring3Geo = new THREE.TorusGeometry(2.9, 0.025, 16, 120);
    const ring3 = new THREE.Mesh(ring3Geo, ringMat3);
    ring3.rotation.y = Math.PI / 4;
    vaultGroup.add(ring3);

    // 3. Orbiting Data Shards
    const shardGeo = new THREE.OctahedronGeometry(0.14);
    const shardMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
    const shards: THREE.Mesh[] = [];
    const shardCount = 16;

    for (let i = 0; i < shardCount; i++) {
      const shard = new THREE.Mesh(shardGeo, shardMat);
      const angle = (i / shardCount) * Math.PI * 2;
      const radius = 2.2;
      shard.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 1.2,
        Math.sin(angle) * radius
      );
      vaultGroup.add(shard);
      shards.push(shard);
    }

    // 4. Warp / Tunnel Starfield Particle Field
    const particleCount = 700;
    const particlesGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const originalZ = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      posArray[i3] = (Math.random() - 0.5) * 18;
      posArray[i3 + 1] = (Math.random() - 0.5) * 18;
      const zPos = (Math.random() - 0.5) * 20;
      posArray[i3 + 2] = zPos;
      originalZ[i] = zPos;
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.045,
      color: 0xa5b4fc,
      transparent: true,
      opacity: 0.7,
    });
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x6366f1, 4.5, 25);
    pointLight1.position.set(5, 6, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 4.5, 25);
    pointLight2.position.set(-5, -5, 4);
    scene.add(pointLight2);

    // Mouse Tracking for Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Scroll Tracking with Physics-based Inertia
    let scrollProgress = 0;
    let targetScrollProgress = 0;

    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        targetScrollProgress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Window Resize Handler
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop with Continuous Screen-Moving Scroll Journey
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth inertia interpolation for mouse & scroll
      targetMouseX += (mouseX - targetMouseX) * 0.06;
      targetMouseY += (mouseY - targetMouseY) * 0.06;
      scrollProgress += (targetScrollProgress - scrollProgress) * 0.07;

      // ==========================================
      // SCREEN-MOVING 3D SCROLL JOURNEY MAPPING
      // ==========================================
      // Stage 0.0 - 0.2: Hero (Centered, rotating front view)
      // Stage 0.2 - 0.5: Simulator (Glides to the right, camera zooms, rings expand)
      // Stage 0.5 - 0.75: Features (Glides to the left, camera tilts, particles fly past)
      // Stage 0.75 - 0.9: Workflow (Portal alignment, rings form gateway)
      // Stage 0.9 - 1.0: CTA & Footer (Camera pulls back, radiant shield aura)

      let targetX = 0;
      let targetY = 0;
      let targetZ = 7;
      let targetRotX = 0;
      let targetRotY = 0;
      let targetRotZ = 0;
      let ringScale = 1;

      if (scrollProgress < 0.22) {
        // Hero Stage
        const p = scrollProgress / 0.22;
        targetX = THREE.MathUtils.lerp(0, 1.8, p);
        targetY = THREE.MathUtils.lerp(0, -0.2, p);
        targetZ = THREE.MathUtils.lerp(7, 6.2, p);
        targetRotY = THREE.MathUtils.lerp(0, 0.4, p);
        ringScale = THREE.MathUtils.lerp(1, 1.08, p);
      } else if (scrollProgress < 0.5) {
        // Simulator Stage: Vault slides right to frame the live simulator UI
        const p = (scrollProgress - 0.22) / 0.28;
        targetX = THREE.MathUtils.lerp(1.8, 2.4, p);
        targetY = THREE.MathUtils.lerp(-0.2, 0.3, p);
        targetZ = THREE.MathUtils.lerp(6.2, 5.6, p);
        targetRotX = THREE.MathUtils.lerp(0.1, 0.35, p);
        targetRotY = THREE.MathUtils.lerp(0.4, 0.85, p);
        ringScale = THREE.MathUtils.lerp(1.08, 1.25, p);
      } else if (scrollProgress < 0.75) {
        // 3D Features Stage: Vault slides to left, camera tilts
        const p = (scrollProgress - 0.5) / 0.25;
        targetX = THREE.MathUtils.lerp(2.4, -2.6, p);
        targetY = THREE.MathUtils.lerp(0.3, -0.4, p);
        targetZ = THREE.MathUtils.lerp(5.6, 5.2, p);
        targetRotX = THREE.MathUtils.lerp(0.35, -0.25, p);
        targetRotY = THREE.MathUtils.lerp(0.85, 1.6, p);
        targetRotZ = THREE.MathUtils.lerp(0, 0.3, p);
        ringScale = THREE.MathUtils.lerp(1.25, 1.15, p);
      } else if (scrollProgress < 0.9) {
        // Workflow Stage: Rings align into a dimensional gateway
        const p = (scrollProgress - 0.75) / 0.15;
        targetX = THREE.MathUtils.lerp(-2.6, 0, p);
        targetY = THREE.MathUtils.lerp(-0.4, 0.2, p);
        targetZ = THREE.MathUtils.lerp(5.2, 6.4, p);
        targetRotX = THREE.MathUtils.lerp(-0.25, 0.5, p);
        targetRotY = THREE.MathUtils.lerp(1.6, 2.4, p);
        ringScale = THREE.MathUtils.lerp(1.15, 1.35, p);
      } else {
        // Final CTA & Footer Stage: Camera pulls back into high orbit
        const p = (scrollProgress - 0.9) / 0.1;
        targetX = THREE.MathUtils.lerp(0, 0, p);
        targetY = THREE.MathUtils.lerp(0.2, -0.1, p);
        targetZ = THREE.MathUtils.lerp(6.4, 8.2, p);
        targetRotY = THREE.MathUtils.lerp(2.4, 3.14, p);
        ringScale = THREE.MathUtils.lerp(1.35, 1.45, p);
      }

      // Smoothly apply transforms to master 3D group and camera
      masterGroup.position.x += (targetX - masterGroup.position.x) * 0.08;
      masterGroup.position.y += (targetY - masterGroup.position.y) * 0.08;
      camera.position.z += (targetZ - camera.position.z) * 0.08;

      // Mouse Parallax Influence
      camera.position.x = targetMouseX * 0.6;
      camera.position.y = targetMouseY * 0.4;
      camera.lookAt(masterGroup.position.x * 0.3, masterGroup.position.y * 0.3, 0);

      // Continual ambient 3D rotations + scroll influence
      vaultGroup.rotation.y = elapsedTime * 0.35 + targetRotY + targetMouseX * 0.3;
      vaultGroup.rotation.x = Math.sin(elapsedTime * 0.25) * 0.12 + targetRotX + targetMouseY * 0.2;
      vaultGroup.rotation.z = targetRotZ + Math.cos(elapsedTime * 0.2) * 0.08;

      // Expand / Contract rings dynamically with scroll
      ring1.scale.set(ringScale, ringScale, ringScale);
      ring2.scale.set(ringScale, ringScale, ringScale);
      ring3.scale.set(ringScale, ringScale, ringScale);

      // Ring counter-rotations
      ring1.rotation.z = elapsedTime * 0.65 + scrollProgress * 4;
      ring2.rotation.y = elapsedTime * 0.5 + scrollProgress * 3;
      ring2.rotation.z = -elapsedTime * 0.35;
      ring3.rotation.x = elapsedTime * 0.55 + scrollProgress * 3.5;

      // Core pulse + dynamic light response
      const pulse = 1 + Math.sin(elapsedTime * 2.5) * 0.07;
      innerMesh.scale.set(pulse, pulse, pulse);

      // Orbiting Shards dynamic expansion
      shards.forEach((shard, idx) => {
        const offset = (idx / shards.length) * Math.PI * 2;
        const speed = 0.55 + scrollProgress * 0.8; // Accelerates as user scrolls!
        const currentAngle = elapsedTime * speed + offset;
        const radius = 2.2 * ringScale;
        shard.position.x = Math.cos(currentAngle) * radius;
        shard.position.z = Math.sin(currentAngle) * radius;
        shard.rotation.x += 0.025;
        shard.rotation.y += 0.035;
      });

      // Warp Tunnel Particles: Move forward as user scrolls
      const positions = particlesGeo.attributes.position.array as Float32Array;
      const scrollSpeed = 0.08 + scrollProgress * 0.4; // Particles zoom faster on scroll

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        // Move towards camera
        positions[i3 + 2] += scrollSpeed;
        if (positions[i3 + 2] > 10) {
          positions[i3 + 2] = -12;
        }
      }
      particlesGeo.attributes.position.needsUpdate = true;
      particlesMesh.rotation.y = elapsedTime * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ring1Geo.dispose();
      ring2Geo.dispose();
      ring3Geo.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      ringMat3.dispose();
      shardGeo.dispose();
      shardMat.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
    };
  }, [interactiveState]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}

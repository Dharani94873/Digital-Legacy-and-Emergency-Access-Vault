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

    // Clean up any existing canvas children first
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group to hold everything
    const vaultGroup = new THREE.Group();
    scene.add(vaultGroup);

    // 1. Core Icosahedron (The Vault Core)
    const coreGeo = new THREE.IcosahedronGeometry(1.35, 1);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x4f46e5,
      emissive: 0x1e1b4b,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    vaultGroup.add(coreMesh);

    // Inner Solid Glow Sphere
    const innerGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0e7490,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.75,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    vaultGroup.add(innerMesh);

    // 2. Concentric Security Rings (Outer Cryptographic Rings)
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x3730a3,
      metalness: 0.9,
      roughness: 0.1,
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.035, 16, 100), ringMat1);
    vaultGroup.add(ring1);

    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0369a1,
      metalness: 0.9,
      roughness: 0.1,
    });
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.025, 16, 100), ringMat2);
    ring2.rotation.x = Math.PI / 3;
    vaultGroup.add(ring2);

    const ringMat3 = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x6b21a8,
      metalness: 0.9,
      roughness: 0.1,
    });
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.02, 16, 100), ringMat3);
    ring3.rotation.y = Math.PI / 4;
    vaultGroup.add(ring3);

    // 3. Orbiting Data Shards / Nodes
    const shardGeo = new THREE.OctahedronGeometry(0.12);
    const shardMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
    const shards: THREE.Mesh[] = [];
    const shardCount = 12;

    for (let i = 0; i < shardCount; i++) {
      const shard = new THREE.Mesh(shardGeo, shardMat);
      const angle = (i / shardCount) * Math.PI * 2;
      const radius = 2.1;
      shard.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 0.8, Math.sin(angle) * radius);
      vaultGroup.add(shard);
      shards.push(shard);
    }

    // 4. Floating Cryptographic Particle Field
    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 450;
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 14;
      posArray[i + 1] = (Math.random() - 0.5) * 14;
      posArray[i + 2] = (Math.random() - 0.5) * 10;
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.035,
      color: 0x818cf8,
      transparent: true,
      opacity: 0.65,
    });
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x6366f1, 3.5, 20);
    pointLight1.position.set(4, 5, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 3.5, 20);
    pointLight2.position.set(-4, -4, 3);
    scene.add(pointLight2);

    // Mouse Tracking for Parallax Effect
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse interpolation
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      // Vault rotation
      vaultGroup.rotation.y = elapsedTime * 0.35 + targetX * 0.4;
      vaultGroup.rotation.x = Math.sin(elapsedTime * 0.25) * 0.15 + targetY * 0.3;

      // Ring counter-rotations
      ring1.rotation.z = elapsedTime * 0.6;
      ring2.rotation.y = elapsedTime * 0.45;
      ring2.rotation.z = -elapsedTime * 0.3;
      ring3.rotation.x = elapsedTime * 0.5;

      // Inner pulse
      const pulse = 1 + Math.sin(elapsedTime * 2.5) * 0.06;
      innerMesh.scale.set(pulse, pulse, pulse);

      // Shard orbiting
      shards.forEach((shard, idx) => {
        const offset = (idx / shards.length) * Math.PI * 2;
        const currentAngle = elapsedTime * 0.5 + offset;
        shard.position.x = Math.cos(currentAngle) * 2.1;
        shard.position.z = Math.sin(currentAngle) * 2.1;
        shard.rotation.x += 0.02;
        shard.rotation.y += 0.03;
      });

      // Background particle drift
      particlesMesh.rotation.y = elapsedTime * 0.04;
      particlesMesh.rotation.x = -elapsedTime * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ring1.geometry.dispose();
      ring2.geometry.dispose();
      ring3.geometry.dispose();
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
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ minHeight: '520px' }}
      aria-hidden="true"
    />
  );
}

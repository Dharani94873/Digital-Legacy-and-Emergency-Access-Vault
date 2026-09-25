'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import * as THREE from 'three';

export default function Global3DAtmosphere() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  // If on the home landing page, Vault3DScene handles the 3D scroll canvas
  const isHomePage = pathname === '/';

  useEffect(() => {
    if (isHomePage) return;

    const container = containerRef.current;
    if (!container) return;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.05);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Floating 3D Geometric Nodes
    const nodeGeometries = [
      new THREE.IcosahedronGeometry(0.5, 0),
      new THREE.OctahedronGeometry(0.4),
      new THREE.TetrahedronGeometry(0.45),
      new THREE.TorusGeometry(0.6, 0.03, 8, 32),
    ];

    const materials = [
      new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.35 }),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.35 }),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.3 }),
    ];

    const nodes: { mesh: THREE.Mesh; rotX: number; rotY: number; floatSpeed: number; floatOffset: number; basePos: THREE.Vector3 }[] = [];
    const nodeCount = 10;

    for (let i = 0; i < nodeCount; i++) {
      const geo = nodeGeometries[i % nodeGeometries.length];
      const mat = materials[i % materials.length];
      const mesh = new THREE.Mesh(geo, mat);

      const basePos = new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6 - 1
      );
      mesh.position.copy(basePos);
      group.add(mesh);

      nodes.push({
        mesh,
        rotX: (Math.random() - 0.5) * 0.02,
        rotY: (Math.random() - 0.5) * 0.02,
        floatSpeed: 0.5 + Math.random() * 0.8,
        floatOffset: Math.random() * Math.PI * 2,
        basePos,
      });
    }

    // Ambient Floating Starfield Particles
    const particleCount = 280;
    const particlesGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 16;
      posArray[i + 1] = (Math.random() - 0.5) * 12;
      posArray[i + 2] = (Math.random() - 0.5) * 10;
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.035,
      color: 0x818cf8,
      transparent: true,
      opacity: 0.45,
    });
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    // Subtle Mouse Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;

      group.rotation.y = elapsed * 0.05 + targetX * 0.2;
      group.rotation.x = Math.sin(elapsed * 0.1) * 0.05 + targetY * 0.15;

      nodes.forEach((node) => {
        node.mesh.rotation.x += node.rotX;
        node.mesh.rotation.y += node.rotY;
        node.mesh.position.y = node.basePos.y + Math.sin(elapsed * node.floatSpeed + node.floatOffset) * 0.35;
      });

      particlesMesh.rotation.y = elapsed * 0.02;

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
      nodeGeometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      particlesGeo.dispose();
      particlesMat.dispose();
    };
  }, [isHomePage]);

  if (isHomePage) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden opacity-40"
      aria-hidden="true"
    />
  );
}

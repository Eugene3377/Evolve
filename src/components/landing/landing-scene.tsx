"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * A quiet, ambient scene for the landing hero: translucent "receipt" panels
 * drifting and slowly orbiting, catching a warm brass rim light. Kept to
 * the marketing page only — every product screen stays plain DOM/Tailwind
 * for speed, per the brief.
 */
export function LandingScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x223355, 1.1);
    scene.add(ambient);

    const key = new THREE.PointLight(0xd9b25c, 12, 20);
    key.position.set(3, 3, 4);
    scene.add(key);

    const rim = new THREE.PointLight(0x4f6bd1, 6, 20);
    rim.position.set(-4, -2, -2);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);

    const panelGeo = new THREE.PlaneGeometry(1.5, 2, 1, 1);
    const panels: THREE.Mesh[] = [];
    const COUNT = 9;

    for (let i = 0; i < COUNT; i++) {
      const material = new THREE.MeshPhysicalMaterial({
        color: i % 3 === 0 ? 0xb8902f : 0xf4f2ec,
        transparent: true,
        opacity: 0.16 + (i % 3) * 0.05,
        roughness: 0.35,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(panelGeo, material);

      const radius = 2.4 + (i % 3) * 0.6;
      const angle = (i / COUNT) * Math.PI * 2;
      mesh.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 1.3) * 1.2,
        Math.sin(angle) * radius - 1
      );
      mesh.rotation.set(
        Math.random() * 0.6 - 0.3,
        angle,
        Math.random() * 0.4 - 0.2
      );

      group.add(mesh);
      panels.push(mesh);
    }

    let raf = 0;
    const clock = new THREE.Clock();

    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        group.rotation.y = t * 0.08;
        panels.forEach((panel, i) => {
          panel.position.y += Math.sin(t * 0.6 + i) * 0.0015;
          panel.rotation.z = Math.sin(t * 0.3 + i) * 0.08;
        });
      }

      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      panelGeo.dispose();
      panels.forEach((p) => (p.material as THREE.Material).dispose());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" aria-hidden="true" />;
}

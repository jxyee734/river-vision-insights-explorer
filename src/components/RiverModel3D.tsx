
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RiverModel3DProps {
  depthProfile: number[];
  flowMagnitude: number;
}

const RiverModel3D: React.FC<RiverModel3DProps> = ({ depthProfile, flowMagnitude }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create river bed geometry
    const geometry = new THREE.PlaneGeometry(10, 5, depthProfile.length - 1, 1);
    const vertices = geometry.attributes.position.array as Float32Array;

    // Modify vertices based on depth profile
    for (let i = 0; i < depthProfile.length; i++) {
      const vertexIndex = i * 3 + 1; // Y component
      vertices[vertexIndex] = -depthProfile[i];
      vertices[vertexIndex + 3] = -depthProfile[i]; // Modify corresponding vertex on next row
    }

    geometry.computeVertexNormals();

    // Create river bed material
    const material = new THREE.MeshPhongMaterial({
      color: 0x2196f3,
      wireframe: false,
      transparent: true,
      opacity: 0.8,
    });

    const riverBed = new THREE.Mesh(geometry, material);
    scene.add(riverBed);

    // Position camera
    camera.position.z = 5;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate model slightly based on flow magnitude
      riverBed.rotation.y += flowMagnitude * 0.001;
      
      renderer.render(scene, camera);
    };

    // Store refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Start animation
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [depthProfile, flowMagnitude]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>3D River Model</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full aspect-video" />
        <div className="mt-4 text-sm text-gray-600">
          <p>3D visualization of river bed profile and water flow</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiverModel3D;

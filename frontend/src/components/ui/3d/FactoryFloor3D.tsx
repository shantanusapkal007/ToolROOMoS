"use client";

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Environment, Plane, Html } from '@react-three/drei';
import * as THREE from 'three';

interface MachineProps {
  position: [number, number, number];
  status: 'Running' | 'Idle' | 'Maintenance' | 'Breakdown';
  name: string;
}

const colorMap = {
  'Running': '#10b981', // emerald-500
  'Idle': '#a1a1aa', // zinc-400
  'Maintenance': '#f59e0b', // amber-500
  'Breakdown': '#ef4444', // red-500
};

const emissiveIntensityMap = {
  'Running': 2,
  'Idle': 0.2,
  'Maintenance': 1.5,
  'Breakdown': 2,
};

function CNCNode({ position, status, name }: MachineProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (status === 'Running' || status === 'Maintenance') {
        const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.8;
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = emissiveIntensityMap[status] * (hovered ? 1.5 : pulse);
      }
      
      // Animate hover scale and position
      const targetScale = hovered ? 1.1 : 1;
      const targetY = hovered ? 1 : 0;
      
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 10);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, delta * 10);
    }
  });

  const baseColor = colorMap[status];

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e: any) => { e.stopPropagation(); setHover(true); }}
        onPointerOut={(e: any) => { setHover(false); }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[2, 2, 3]} />
        <meshStandardMaterial 
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={emissiveIntensityMap[status]}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {/* HTML Label overlay on hover */}
      {hovered && (
        <Html position={[0, 2.5, 0]} center>
          <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-white font-bold text-xs uppercase tracking-widest whitespace-nowrap shadow-xl pointer-events-none">
            {name} · <span style={{ color: baseColor }}>{status}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function FactoryGrid() {
  return (
    <Plane args={[50, 50]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -1, 0]}>
      <meshStandardMaterial 
        color="#050A14" 
        roughness={0.8} 
        metalness={0.2}
      />
      <gridHelper args={[50, 25, '#1e293b', '#0f172a']} position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </Plane>
  );
}

export function FactoryFloor3D() {
  const machines: MachineProps[] = useMemo(() => [
    { position: [-4, 0, -4], status: 'Running', name: 'VMC-01' },
    { position: [0, 0, -4], status: 'Running', name: 'VMC-02' },
    { position: [4, 0, -4], status: 'Maintenance', name: 'VMC-03' },
    
    { position: [-4, 0, 2], status: 'Running', name: 'Lathe-01' },
    { position: [0, 0, 2], status: 'Idle', name: 'Lathe-02' },
    { position: [4, 0, 2], status: 'Breakdown', name: 'WireEDM' },
    
    { position: [-2, 0, 8], status: 'Running', name: 'Grinder-01' },
    { position: [2, 0, 8], status: 'Idle', name: 'Laser-01' },
  ], []);

  return (
    <div className="w-full h-full bg-[#050A14] rounded-3xl overflow-hidden relative cursor-grab active:cursor-grabbing border border-white/5 shadow-inner">
      <Canvas 
        dpr={[1, 1.5]}
        camera={{ position: [12, 10, 15], fov: 35 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      >
        <color attach="background" args={['#050A14']} />
        
        {/* Cinematic Lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize={[2048, 2048]} 
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#3b82f6" />
        <pointLight position={[10, 5, 10]} intensity={0.3} color="#8b5cf6" />
        
        {/* Environment Map for metallic reflections */}
        <Environment preset="city" />
        
        <FactoryGrid />
        
        {machines.map((machine, i) => (
          <CNCNode key={i} {...machine} />
        ))}

        <OrbitControls 
          enablePan={false}
          maxPolarAngle={Math.PI / 2 - 0.05} 
          minDistance={10} 
          maxDistance={30} 
          autoRotate 
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-white text-xs font-bold uppercase tracking-widest">Live Factory Floor</span>
        </div>
        <p className="text-zinc-500 text-[10px] uppercase font-semibold">Interactive Spatial Twin</p>
      </div>
    </div>
  );
}

import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AsciiRenderer, Environment, Image } from '@react-three/drei';
import LightRays from './LightRays';
import logoSirius from '../../assets/svg/logo-sirius.svg';

interface LogoPlaneProps {
  scale: number;
  position: [number, number, number];
}

function LogoPlane({ scale, position }: LogoPlaneProps) {
  const groupRef = useRef<any>();
  const depth = 0.25;
  const layers = 12;
  
  // Initialize rotation to 0 (center) on mount
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = 0;
    }
  }, []);
  
  // Animate rotation with asymmetric oscillation from center
  useFrame((state) => {
    if (groupRef.current) {
      // Asymmetric oscillation: -25° (left) to +45° (right) from center (0°)
      // Math.sin oscillates between -1 and +1, starting at 0
      // We map this to: 0° (center) -> +45° (right) -> 0° (center) -> -25° (left) -> 0° (center)
      // The rotation is applied to the group, so it rotates around its own center (where the 4 circles intersect)
      const sinValue = Math.sin(state.clock.elapsedTime * 0.5);
      // Map sinValue (-1 to +1) to rotation (-25° to +45°)
      // When sinValue = -1: rotation = -25°
      // When sinValue = +1: rotation = +45°
      // When sinValue = 0: rotation = 0° (center)
      const leftAngle = (-10 * Math.PI) / 180; // -25 degrees in radians
      const rightAngle = (10 * Math.PI) / 180; // +45 degrees in radians
      // Linear interpolation: sinValue from -1 to +1 maps to leftAngle to rightAngle
      const rotationValue = leftAngle + (sinValue + 1) / 2 * (rightAngle - leftAngle);
      groupRef.current.rotation.y = rotationValue;
    }
  });
  
  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Create multiple layers of the logo image to give it thickness */}
      {/* The rotation is applied to the group, so it rotates around the group's origin (0,0,0) */}
      {/* Each Image is positioned at [0, 0, zPos], so they're all centered at the group's origin */}
      {/* This means rotation happens around the center of the logo (where the 4 circles intersect) */}
      {Array.from({ length: layers }).map((_, i) => {
        const zPos = (i / (layers - 1) - 0.5) * depth;
        return (
          <Image
            key={i}
            url={logoSirius}
            position={[0, 0, zPos]}
            transparent
            opacity={1}
          />
        );
      })}
    </group>
  );
}

export default function Background3D() {
  const asciiSettings = {
    resolution: 0.6, // Maximum resolution for clarity
    characters: " .:-=+*#%@",
    fgColor: "#ffffff",
    bgColor: "transparent",
    invert: false,
  };

  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
      {/* Animated Background - LightRays */}
      <div className="absolute inset-0 w-full h-full">
        <LightRays 
          raysOrigin="top-center"
          raysColor="#97F0E5"
          raysSpeed={2}
          lightSpread={1.0}
          rayLength={3.0}
          followMouse={true}
          mouseInfluence={0.15}
          noiseAmount={0.05}
          distortion={0}
        />
      </div>
      
      {/* 3D Canvas - Full Screen */}
      <Canvas
        className="absolute inset-0"
        camera={{
          position: [0, 0, 3],
          fov: 50,
        }}
        gl={{ 
          preserveDrawingBuffer: true,
          alpha: true,
          premultipliedAlpha: false
        }}
        onCreated={({ camera }) => {
          // Ensure camera looks at center
          camera.lookAt(0, 0, 0);
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
        />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        <Suspense fallback={null}>
          <LogoPlane
            scale={2}
            position={[2, 0, 0]}
          />
          <Environment preset="studio" />
        </Suspense>

        <Suspense fallback={null}>
          <AsciiRenderer
            resolution={asciiSettings.resolution}
            characters={asciiSettings.characters}
            fgColor={asciiSettings.fgColor}
            bgColor={asciiSettings.bgColor}
            invert={asciiSettings.invert}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

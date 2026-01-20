/**
 * Constraint Field 3D Component
 * WebGL-based 3D visualization of market structure
 */

import React, { useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { StructuralFeatures, UserAttention, InteractionMode } from '../../core/types';

interface ConstraintField3DProps {
  structuralFeatures: StructuralFeatures | null;
  userAttention: UserAttention;
  interactionMode: InteractionMode;
  onInteraction?: (data: { type: string; position: THREE.Vector3 }) => void;
}

// Gamma Surface Mesh
function GammaSurface({ features }: { features: StructuralFeatures }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, colors } = useMemo(() => {
    const { gammaSurface } = features;
    const width = gammaSurface.strikes.length || 10;
    const height = gammaSurface.expiries.length || 10;

    const geo = new THREE.PlaneGeometry(4, 4, width - 1, height - 1);
    const positions = geo.attributes.position.array as Float32Array;
    const colorArray = new Float32Array(positions.length);

    const maxGamma = Math.abs(gammaSurface.maxGamma) || 1;
    const minGamma = Math.abs(gammaSurface.minGamma) || 0;

    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const idx = j * width + i;
        const gamma = gammaSurface.values[j]?.[i] ?? 0;
        const normalizedGamma = gamma / (maxGamma || 1);

        // Set height based on gamma
        positions[idx * 3 + 2] = normalizedGamma * 2;

        // Set color based on positive/negative gamma
        if (gamma >= 0) {
          // Positive gamma - blue tones
          colorArray[idx * 3] = 0.2;
          colorArray[idx * 3 + 1] = 0.5 + normalizedGamma * 0.5;
          colorArray[idx * 3 + 2] = 1;
        } else {
          // Negative gamma - red tones
          colorArray[idx * 3] = 1;
          colorArray[idx * 3 + 1] = 0.3 + Math.abs(normalizedGamma) * 0.2;
          colorArray[idx * 3 + 2] = 0.2;
        }
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    geo.computeVertexNormals();

    return { geometry: geo, colors: colorArray };
  }, [features]);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle animation
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.02;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        transparent
        opacity={0.8}
        metalness={0.3}
        roughness={0.7}
      />
    </mesh>
  );
}

// Price Thread
function PriceThread({ features }: { features: StructuralFeatures }) {
  const lineRef = useRef<THREE.Line>(null);

  const points = useMemo(() => {
    const { priceHistory } = features;
    if (priceHistory.prices.length < 2) return [];

    const minPrice = Math.min(...priceHistory.prices);
    const maxPrice = Math.max(...priceHistory.prices);
    const range = maxPrice - minPrice || 1;

    return priceHistory.prices.map((price, i) => {
      const x = (i / priceHistory.prices.length) * 4 - 2;
      const y = ((price - minPrice) / range) * 2 - 1;
      const z = 2.5; // Elevated above surface
      return new THREE.Vector3(x, z, y);
    });
  }, [features]);

  useFrame((state) => {
    if (lineRef.current) {
      // Pulsing effect based on momentum
      const intensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      (lineRef.current.material as THREE.LineBasicMaterial).opacity = intensity;
    }
  });

  if (points.length < 2) return null;

  return (
    <Line
      ref={lineRef}
      points={points}
      color="#00ff88"
      lineWidth={2}
      transparent
      opacity={0.8}
    />
  );
}

// Liquidity Particles
function LiquidityParticles({ features }: { features: StructuralFeatures }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 500;

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const siz = new Float32Array(particleCount);

    const { liquidityMap } = features;

    for (let i = 0; i < particleCount; i++) {
      // Random positions within the field
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = Math.random() * 2 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;

      // Color based on liquidity imbalance
      const imbalance = liquidityMap.imbalance;
      if (imbalance > 0) {
        // More bids - greenish
        col[i * 3] = 0.2;
        col[i * 3 + 1] = 0.8;
        col[i * 3 + 2] = 0.5;
      } else {
        // More asks - reddish
        col[i * 3] = 0.8;
        col[i * 3 + 1] = 0.3;
        col[i * 3 + 2] = 0.3;
      }

      siz[i] = Math.random() * 3 + 1;
    }

    return { positions: pos, colors: col, sizes: siz };
  }, [features]);

  useFrame((state) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        // Animate particles upward
        positions[i * 3 + 1] += 0.01;

        // Reset when too high
        if (positions[i * 3 + 1] > 3) {
          positions[i * 3 + 1] = 0.5;
          positions[i * 3] = (Math.random() - 0.5) * 4;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
        }
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Gamma Attractors
function GammaAttractors({ features }: { features: StructuralFeatures }) {
  const { gammaPull } = features;

  return (
    <>
      {gammaPull.attractors.slice(0, 5).map((attractor, i) => {
        const normalizedStrength = Math.abs(attractor.strength) / 1000000;
        const size = Math.min(0.5, normalizedStrength * 0.5) + 0.1;

        return (
          <group key={i} position={[attractor.price / 100 - 4, 1, 0]}>
            <mesh>
              <sphereGeometry args={[size, 16, 16]} />
              <meshStandardMaterial
                color={attractor.strength > 0 ? '#4488ff' : '#ff4444'}
                emissive={attractor.strength > 0 ? '#2244aa' : '#aa2222'}
                emissiveIntensity={0.5}
                transparent
                opacity={0.7}
              />
            </mesh>
            {/* Gravitational ring effect */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[size * 1.5, 0.02, 8, 32]} />
              <meshBasicMaterial
                color={attractor.strength > 0 ? '#88aaff' : '#ff8888'}
                transparent
                opacity={0.4}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

// Grid and Axes
function CosmicGrid() {
  return (
    <group>
      {/* Grid */}
      <gridHelper args={[8, 20, '#1a1a3a', '#2a2a4a']} position={[0, 0, 0]} />

      {/* Axes labels */}
      <Text position={[2.5, 0.2, 0]} fontSize={0.15} color="#c9a227">
        Strike
      </Text>
      <Text position={[0, 0.2, 2.5]} fontSize={0.15} color="#c9a227" rotation={[0, Math.PI / 2, 0]}>
        Expiry
      </Text>
      <Text position={[-2.5, 1.5, 0]} fontSize={0.15} color="#c9a227" rotation={[0, 0, Math.PI / 2]}>
        Gamma
      </Text>
    </group>
  );
}

// Scene lighting
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-10, 5, -10]} intensity={0.4} color="#4488ff" />
      <pointLight position={[0, -5, 0]} intensity={0.3} color="#ff4444" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        color="#c9a227"
      />
    </>
  );
}

// Main Scene
function Scene({
  features,
  userAttention,
  interactionMode,
  onInteraction,
}: {
  features: StructuralFeatures;
  userAttention: UserAttention;
  interactionMode: InteractionMode;
  onInteraction?: (data: { type: string; position: THREE.Vector3 }) => void;
}) {
  const { camera } = useThree();

  useEffect(() => {
    // Adjust camera based on user attention
    const targetX = (userAttention.x - 0.5) * 4;
    const targetZ = (userAttention.y - 0.5) * 4;

    camera.position.x += (targetX + 5 - camera.position.x) * 0.05;
    camera.position.z += (targetZ + 5 - camera.position.z) * 0.05;
  }, [camera, userAttention]);

  return (
    <>
      <SceneLighting />
      <CosmicGrid />
      <GammaSurface features={features} />
      <PriceThread features={features} />
      <LiquidityParticles features={features} />
      <GammaAttractors features={features} />
      <OrbitControls
        enablePan={interactionMode === 'explore'}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2}
        minDistance={3}
        maxDistance={15}
      />
    </>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-cosmic-void">
      <div className="text-cosmic-gold animate-pulse">Loading 3D Field...</div>
    </div>
  );
}

// Default features for when none provided
function getDefaultFeatures(): StructuralFeatures {
  return {
    gammaSurface: {
      strikes: Array.from({ length: 10 }, (_, i) => 400 + i * 5),
      expiries: Array.from({ length: 5 }, (_, i) => Date.now() + i * 86400000 * 7),
      values: Array.from({ length: 5 }, () =>
        Array.from({ length: 10 }, () => (Math.random() - 0.5) * 1000000)
      ),
      maxGamma: 500000,
      minGamma: -500000,
      netGamma: 0,
    },
    gammaFlips: [],
    gammaPull: {
      direction: 0,
      magnitude: 0.5,
      attractors: [
        { price: 420, strength: 100000, type: 'gamma_max' },
        { price: 430, strength: -80000, type: 'gamma_max' },
      ],
    },
    liquidityMap: {
      levels: [],
      imbalance: 0.1,
      depth: 1000000,
      absorptionRate: 0.1,
    },
    volatilityRegime: {
      regime: 'normal',
      historicalVol: 20,
      impliedVol: 22,
      volSpread: 2,
      volOfVol: 0.1,
      skew: 5,
      term: -1,
    },
    dealerPositioning: {
      netGammaExposure: 50000,
      netDeltaExposure: 10000,
      hedgingPressure: 0.3,
      flowDirection: 'buying',
      confidence: 0.7,
    },
    constraintField: {
      gamma: {
        strikes: [],
        expiries: [],
        values: [],
        maxGamma: 0,
        minGamma: 0,
        netGamma: 0,
      },
      liquidity: { levels: [], imbalance: 0, depth: 0, absorptionRate: 0 },
      volatility: {
        regime: 'normal',
        historicalVol: 20,
        impliedVol: 22,
        volSpread: 2,
        volOfVol: 0.1,
        skew: 5,
        term: -1,
      },
      dealerPositioning: {
        netGammaExposure: 0,
        netDeltaExposure: 0,
        hedgingPressure: 0,
        flowDirection: 'neutral',
        confidence: 0,
      },
      gravitationalPull: { direction: 0, magnitude: 0, attractors: [] },
    },
    priceHistory: {
      prices: Array.from({ length: 100 }, (_, i) => 420 + Math.sin(i * 0.1) * 5 + Math.random() * 2),
      timestamps: Array.from({ length: 100 }, (_, i) => Date.now() - (100 - i) * 60000),
      momentum: 0.01,
      trend: 'up',
      trendStrength: 0.6,
    },
    timestamp: Date.now(),
  };
}

export const ConstraintField3D: React.FC<ConstraintField3DProps> = ({
  structuralFeatures,
  userAttention,
  interactionMode,
  onInteraction,
}) => {
  const features = structuralFeatures ?? getDefaultFeatures();

  return (
    <div className="w-full h-full bg-cosmic-void rounded-lg overflow-hidden border border-gauge-frame/30">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={60} />
          <color attach="background" args={['#0a0a1a']} />
          <fog attach="fog" args={['#0a0a1a', 10, 30]} />
          <Scene
            features={features}
            userAttention={userAttention}
            interactionMode={interactionMode}
            onInteraction={onInteraction}
          />
        </Canvas>
      </Suspense>

      {/* Overlay labels */}
      <div className="absolute top-4 left-4 text-cosmic-gold text-sm font-cosmic">
        Constraint Field
      </div>
      <div className="absolute bottom-4 right-4 text-cosmic-gold/60 text-xs font-data">
        Mode: {interactionMode}
      </div>
    </div>
  );
};

export default ConstraintField3D;

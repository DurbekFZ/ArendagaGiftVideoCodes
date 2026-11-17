import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import React, {useMemo} from 'react';
import {random} from 'remotion';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {STAR_POINTS} from './starShape';

export const W = 1080;
export const H = 1920;
const CAMERA_Z = 10;
const FOV = 30;
/** World units per pixel at z = 0, so scenes can be laid out in video pixels. */
export const UNIT = (2 * CAMERA_Z * Math.tan((FOV / 2) * Math.PI / 180)) / H;

export type Pose = {x: number; y: number; size: number; rotX?: number; rotY?: number; rotZ?: number};

/** The Telegram Stars icon as a puffy, bevelled gold solid. */
const useStarGeometry = (detail: number) => useMemo(() => {
  const shape = new THREE.Shape();
  STAR_POINTS.forEach(([x, y], i) => (i ? shape.lineTo(x, -y) : shape.moveTo(x, -y)));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {depth: 0.14, bevelEnabled: true, bevelThickness: 0.06,
    bevelSize: 0.026, bevelOffset: 0, bevelSegments: detail, curveSegments: 6});
  geometry.center();
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const low = new THREE.Color('#ffc400');
  const high = new THREE.Color('#e86a00');
  const colour = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const t = THREE.MathUtils.clamp((position.getX(i) + position.getY(i)) * 0.75 + 0.5, 0, 1);
    colour.copy(low).lerp(high, t);
    colors.set([colour.r, colour.g, colour.b], i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}, [detail]);

const Lighting: React.FC = () => {
  const {gl, scene} = useThree();
  const environment = useMemo(() => new THREE.PMREMGenerator(gl).fromScene(new RoomEnvironment(), 0.04).texture, [gl]);
  scene.environment = environment;
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[-4, 6, 8]} intensity={1.15} color="#fff1cc" />
      <directionalLight position={[5, -3, 4]} intensity={0.8} color="#ff8fd0" />
      <pointLight position={[-3, 4, 5]} intensity={6} color="#fff0c0" />
    </>
  );
};

const material = (
  <meshStandardMaterial vertexColors metalness={0.45} roughness={0.24} envMapIntensity={0.62}
    emissive="#b34a00" emissiveIntensity={0.22} />
);

const Hero: React.FC<{pose: Pose}> = ({pose}) => {
  const geometry = useStarGeometry(10);
  return (
    <mesh geometry={geometry} position={[(pose.x - W / 2) * UNIT, -(pose.y - H / 2) * UNIT, 0]}
      scale={pose.size * UNIT} rotation={[pose.rotX ?? 0, pose.rotY ?? 0, pose.rotZ ?? 0]}>
      {material}
    </mesh>
  );
};

/** Small stars streaming toward the camera; `flow` scales their speed, `amount` how many are shown (0..1). */
const Swarm: React.FC<{frame: number; count: number; flow: number; amount: number; seed: string}> =
  ({frame, count, flow, amount, seed}) => {
    const geometry = useStarGeometry(3);
    return (
      <>
        {Array.from({length: count}, (_, i) => {
          if (i / count > amount) return null;
          const r = (key: string) => random(`${seed}-${i}-${key}`);
          const depth = ((r('z') * 22 + frame * 0.07 * flow * (0.6 + r('v'))) % 22) - 16;
          const spread = 1 + (depth + 16) * 0.035;
          const x = (r('x') - 0.5) * 7.4 * spread;
          const y = (r('y') - 0.5) * 12 * spread;
          // Keep the swarm out of the column where the hero and the text sit: only the side margins,
          // the very top and the strip under the content may carry small stars.
          const lens = CAMERA_Z / (CAMERA_Z - depth);
          const [px, py] = [x * lens, y * lens];
          if (Math.abs(px) < 1.08 && py < 2.25 && py > -1.62) return null;
          const fade = Math.min(1, (depth + 16) / 4) * Math.min(1, (6 - depth) / 2);
          return (
            <mesh key={i} geometry={geometry} position={[x, y, depth]} scale={(0.22 + r('s') * 0.34) * Math.max(0, fade)}
              rotation={[r('a') * 6 + frame * 0.02 * (r('ra') - 0.5), r('b') * 6 + frame * 0.05 * (r('rb') + 0.3), r('c') * 6]}>
              {material}
            </mesh>
          );
        })}
      </>
    );
  };

/** A transparent 3D layer: one hero star (optional) and a swarm of small ones. */
export const Stars3D: React.FC<{frame: number; hero?: Pose | null; swarm?: number; flow?: number; seed?: string}> =
  ({frame, hero, swarm = 1, flow = 1, seed = 'swarm'}) => (
    <ThreeCanvas width={W} height={H} linear={false} gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}}
      camera={{fov: FOV, position: [0, 0, CAMERA_Z], near: 0.1, far: 60}}
      style={{position: 'absolute', left: 0, top: 0}}>
      <Lighting />
      <Swarm frame={frame} count={150} flow={flow} amount={swarm} seed={seed} />
      {hero ? <Hero pose={hero} /> : null}
    </ThreeCanvas>
  );

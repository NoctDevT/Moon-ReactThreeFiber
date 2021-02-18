import React, {
  useRef,
  useState,
  Fragment,
  Suspense,
  useMemo,
  useCallback,
  useEffect
} from "react";
import {
  Canvas,
  useFrame,
  IcosahedronGeometry,
  useLoader,
  useThree,
  extend
} from "react-three-fiber";

import { Stars } from "@react-three/drei";

import * as THREE from "three";
import fragment from "./shaders/fragment.glsl";
import vertex from "./shaders/vertex.glsl";
import fragment1 from "./shaders/fragment1.glsl";
import { postProcessing } from "./shaders/postprocessing";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { PixelShader } from "three/examples/jsm/shaders/PixelShader.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

// import landscape from "./img/mac-bg.jpg";
import landscape from "./img/lunarTexture.jpg";

import "./styles.css";

extend({
  EffectComposer,
  ShaderPass,
  RenderPass,
  PixelShader,
  UnrealBloomPass
});

function Moon() {
  const { viewport } = useThree();
  var mouseSpeed = 0;

  const mesh = useRef();
  const [hovered, setHovered] = useState(false);

  const onFrame = useCallback(
    (clock) => {
      const t = clock.getElapsedTime();
      mesh.current.material.uniforms.mouse.value =
        Math.sin(t) * 1.1 * mouseSpeed;
      mesh.current.rotation.x = mesh.current.rotation.y += 0.005;
    },
    [hovered]
  );

  useFrame(({ clock, mouse }) => {
    // Handle Hover
    onFrame(clock);

    // Scale on Hover
    const scale = (mesh.current.scale.x +=
      ((hovered ? 1.3 : 1.5) - mesh.current.scale.x) * 0.1);
    mesh.current.scale.set(scale, scale, scale);

    // Handle Mouse
    const x = (mouse.x * viewport.width) / 2;
    const y = (mouse.y * viewport.height) / 1.5;
    mouseSpeed = x * y * 0.2;
    mesh.current.position.set(x / 20, y / 20, 0);
  });

  const texture = useMemo(() => {
    const newTexture = new THREE.TextureLoader().load(landscape);
    newTexture.wrapS = newTexture.wrapT = THREE.MirroredRepeatWrapping;
    return newTexture;
  }, [landscape]);

  var mX = 0;
  const uniforms = useMemo(
    () => ({
      time: { type: "f", value: 0 },
      mouse: { type: "f", value: mX },
      landscape: { value: texture },
      resolution: { type: "v4", value: new THREE.Vector4() },
      uvRate1: {
        value: new THREE.Vector2(1, 1)
      }
    }),
    []
  );

  return (
    <mesh
      ref={mesh}
      scale={[1.5, 1.5, 1.5]}
      onPointerOver={(e) => setHovered(true)}
      onPointerOut={(e) => setHovered(false)}
    >
      <icosahedronGeometry attach="geometry" args={[1, 1]} />
      <shaderMaterial
        attach="material"
        uniforms={uniforms}
        color={"green"}
        fragmentShader={fragment}
        vertexShader={vertex}
      />
    </mesh>
  );
}

function Effects() {
  const composer = useRef();
  const shaderRef = useRef();
  const { scene, gl, size, camera } = useThree();
  useEffect(() => void composer.current.setSize(size.width, size.height), [
    size
  ]);

  const timeRef = useRef(0);

  useFrame(() => {
    timeRef.current += 0.001;
    shaderRef.current.uniforms.time.value = timeRef.current;
    composer.current.render();
  }, 1);

  return (
    <effectComposer ref={composer} args={[gl]}>
      <renderPass attachArray="passes" scene={scene} camera={camera} />
      <unrealBloomPass attachArray="passes" args={[undefined, 0.8, 1, 0.5]} />
      <shaderPass
        ref={shaderRef}
        attachArray="passes"
        args={[postProcessing]}
        material-uniforms-resolution-value={[1 / size.width, 2 / size.height]}
        material-uniforms-time-value={[timeRef.current]}
      />
    </effectComposer>
  );
}

export default function Viewer3D() {
  return (
    <Fragment>
      <Canvas
        shadowMap
        colorManagement
        camera={{ position: [0, 2, 2], fov: 90 }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x111111);
        }}
      >
        <Suspense fallback={null}>
          <Stars />
          <Moon />
          <Effects />
        </Suspense>
      </Canvas>
    </Fragment>
  );
}

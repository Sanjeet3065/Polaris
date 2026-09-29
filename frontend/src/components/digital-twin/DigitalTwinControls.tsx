import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { DigitalTwinCameraPreset } from "./types";

interface Props {
  preset: DigitalTwinCameraPreset;
  targetFocusPosition: [number, number, number] | null;
  onPresetApplied: () => void;
}

export const DigitalTwinControls: React.FC<Props> = ({
  preset,
  targetFocusPosition,
  onPresetApplied
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const animatingRef = useRef(false);
  const desiredCamPos = useRef(new THREE.Vector3(24, 18, 28));
  const desiredTarget = useRef(new THREE.Vector3(0, 2, 0));

  // Handle Preset Transitions
  useEffect(() => {
    if (preset === "default" || preset === "station") {
      desiredCamPos.current.set(24, 18, 28);
      desiredTarget.current.set(0, 2, 0);
      animatingRef.current = true;
    } else if (preset === "top") {
      desiredCamPos.current.set(0, 48, 0.1);
      desiredTarget.current.set(0, 0, 0);
      animatingRef.current = true;
    } else if (preset === "equipment" && targetFocusPosition) {
      desiredTarget.current.set(...targetFocusPosition);
      desiredCamPos.current.set(
        targetFocusPosition[0] + 5,
        targetFocusPosition[1] + 4,
        targetFocusPosition[2] + 6
      );
      animatingRef.current = true;
    }
  }, [preset, targetFocusPosition]);

  // Smooth camera interpolation frame loop
  useFrame((_, delta) => {
    if (animatingRef.current && controlsRef.current) {
      const step = Math.min(1, delta * 3.5);
      camera.position.lerp(desiredCamPos.current, step);
      controlsRef.current.target.lerp(desiredTarget.current, step);
      controlsRef.current.update();

      if (
        camera.position.distanceTo(desiredCamPos.current) < 0.2 &&
        controlsRef.current.target.distanceTo(desiredTarget.current) < 0.1
      ) {
        animatingRef.current = false;
        onPresetApplied();
      }
    }
  });

  return (
    <DreiOrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={6}
      maxDistance={75}
      maxPolarAngle={Math.PI / 2 - 0.05} // Do not dip below polar ground
      target={[0, 2, 0]}
    />
  );
};

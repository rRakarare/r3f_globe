import { useEffect, useMemo, useRef, useState } from "react";
import { AdditiveBlending, MathUtils, Vector3, Color } from "three";
import { useSpring, animated } from "@react-spring/three";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";

export default function Globe() {
  const { particleCount, dotSize, dotColor, dotOpacity } = useControls("dots", {
    particleCount: {
      value: 500,
      min: 0,
      max: 1000,
      step: 1,
    },
    dotSize: {
      value: 4,
      min: 0,
      max: 10,
      step: 0.1,
    },
    dotColor: "#909090",
    dotOpacity: {
      value: 1,
      min: 0,
      max: 1,
      step: 0.1,
    },
  });

  const { maxConnections, minDistance, lineOpacity } = useControls(
    "lines",
    {
      maxConnections: {
        value: 20,
        min: 0,
        max: 100,
        step: 1,
      },
      minDistance: {
        value: 2.5,
        min: 0,
        max: 10,
        step: 0.1,
      },

      lineOpacity: {
        value: 1,
        min: 0,
        max: 1,
        step: 0.1,
      },
    }
  );

  const { x, y, z } = useControls("camera", {
    x: {
      value: 0,
      min: -40,
      max: 40,
      step: 0.1,
    },
    y: {
      value: 0,
      min: -30,
      max: 30,
      step: 0.1,
    },
    z: {
      value: 200,
      min: 100,
      max: 400,
      step: 0.1,
    },
  });

  const { xAcc, yAcc, rotSpeed } = useControls("Movement multiplier", {
    xAcc: {
      value: 3,
      min: 0,
      max: 7,
      step: 0.1,
    },
    yAcc: {
      value: 3,
      min: 0,
      max: 7,
      step: 0.1,
    },
    rotSpeed: {
      value: 1,
      min: 0,
      max: 5,
      step: 0.1,
    },
  });

  const { mid, left } = useControls("Color moves", {
    left: "#fff759",
    mid: "#e68fef",
  });

  const groupRef = useRef();
  const lineMat = useRef();
  const particlesRef = useRef();
  const linesGeometryRef = useRef();

  const maxParticleCount = 1000;
  const r = 10;
  const rHalf = r / 2;
  let vertexpos = 0;
  let colorpos = 0;
  let numConnected = 0;

  const segments = maxParticleCount * maxParticleCount;
  const positions = useMemo(() => new Float32Array(segments * 3), [segments]);
  const colors = useMemo(() => new Float32Array(segments * 3), [segments]);

  const particlePositions = useMemo(
    () => new Float32Array(maxParticleCount * 3),
    []
  );

  const particlesData = useMemo(() => [], []);

  const v = useMemo(() => new Vector3(), []);

  const [active, setActive] = useState(0);

  const { scale } = useSpring({
    scale: active ? 1 : 0,
    config: { mass: 5, tension: 400, friction: 50, precision: 0.0001 },
  });

  useEffect(() => {
    setActive(1);
  }, []);

  useEffect(() => {
    for (let i = 0; i < maxParticleCount; i++) {
      const x = Math.random() * r - r / 2;
      const y = Math.random() * r - r / 2;
      const z = Math.random() * r - r / 2;

      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;

      const v = new Vector3(
        -1 + Math.random() * 2,
        -1 + Math.random() * 2,
        -1 + Math.random() * 2
      );
      particlesData.push({
        velocity: v.normalize().divideScalar(50),
        numConnections: 0,
      });
    }

    particlesRef.current.setDrawRange(0, particleCount);
  }, []);

  const changeColor = (x) => {

    const xN = x / xAcc

    const linksAnteil = xN >= 0 ? 0 : -xN;
    const mitteAnteil = xN >= 0 ? 1 : 1 + xN;

    const gemischteFarbe = [
      Math.floor(linksAnteil * parseInt(left.slice(1, 3), 16) + mitteAnteil * parseInt(mid.slice(1, 3), 16)),
      Math.floor(linksAnteil * parseInt(left.slice(3, 5), 16) + mitteAnteil * parseInt(mid.slice(3, 5), 16)),
      Math.floor(linksAnteil * parseInt(left.slice(5, 7), 16) + mitteAnteil * parseInt(mid.slice(5, 7), 16))
    ];

    const gemischterHex = "#" + gemischteFarbe.map(value => value.toString(16).padStart(2, '0')).join('');

  return gemischterHex;

  }

  useFrame((state, delta) => {

    const xPos = groupRef.current.position.x

    state.camera.position.lerp({ x, y, z }, 0.1);

    const newHex = changeColor(xPos)

    lineMat.current.color = new Color(newHex)

    groupRef.current.position.y = MathUtils.damp(
      groupRef.current.position.y,
      state.mouse.y * yAcc,
      2.75,
      delta
    );
    groupRef.current.position.x = MathUtils.damp(
      groupRef.current.position.x,
      state.mouse.x * xAcc,
      2.75,
      delta
    );

    vertexpos = 0;
    colorpos = 0;
    numConnected = 0;

    for (let i = 0; i < particleCount; i++) particlesData[i].numConnections = 0;

    for (let i = 0; i < particleCount; i++) {
      const particleData = particlesData[i];

      v.set(
        particlePositions[i * 3],
        particlePositions[i * 3 + 1],
        particlePositions[i * 3 + 2]
      )
        .add(particleData.velocity)
        .setLength(10);
      particlePositions[i * 3] = v.x;
      particlePositions[i * 3 + 1] = v.y;
      particlePositions[i * 3 + 2] = v.z;

      if (
        particlePositions[i * 3 + 1] < -rHalf ||
        particlePositions[i * 3 + 1] > rHalf
      )
        particleData.velocity.y = -particleData.velocity.y;

      if (particlePositions[i * 3] < -rHalf || particlePositions[i * 3] > rHalf)
        particleData.velocity.x = -particleData.velocity.x;

      if (
        particlePositions[i * 3 + 2] < -rHalf ||
        particlePositions[i * 3 + 2] > rHalf
      )
        particleData.velocity.z = -particleData.velocity.z;

      if (particleData.numConnections >= maxConnections) continue;

      for (let j = i + 1; j < particleCount; j++) {
        const particleDataB = particlesData[j];
        if (particleDataB.numConnections >= maxConnections) continue;

        const dx = particlePositions[i * 3] - particlePositions[j * 3];
        const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
        const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < minDistance) {
          particleData.numConnections++;
          particleDataB.numConnections++;

          const alpha = 1.0 - dist / minDistance;

          positions[vertexpos++] = particlePositions[i * 3];
          positions[vertexpos++] = particlePositions[i * 3 + 1];
          positions[vertexpos++] = particlePositions[i * 3 + 2];

          positions[vertexpos++] = particlePositions[j * 3];
          positions[vertexpos++] = particlePositions[j * 3 + 1];
          positions[vertexpos++] = particlePositions[j * 3 + 2];

          colors[colorpos++] = alpha;
          colors[colorpos++] = alpha;
          colors[colorpos++] = alpha;

          colors[colorpos++] = alpha;
          colors[colorpos++] = alpha;
          colors[colorpos++] = alpha;

          numConnected++;
        }
      }
    }

    linesGeometryRef.current.setDrawRange(0, numConnected * 2);
    linesGeometryRef.current.attributes.position.needsUpdate = true;
    linesGeometryRef.current.attributes.color.needsUpdate = true;

    particlesRef.current.attributes.position.needsUpdate = true;

    groupRef.current.rotation.y += (delta / 5) * rotSpeed;
  });

  return (
    <animated.group
      ref={groupRef}
      dispose={null}
      scale={scale}
    >
      <points>
        <bufferGeometry ref={particlesRef}>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={dotColor}
          size={dotSize}
          blending={AdditiveBlending}
          transparent={true}
          opacity={dotOpacity}
          sizeAttenuation={false}
        />
      </points>
      <animated.lineSegments>
        <bufferGeometry ref={linesGeometryRef}>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <animated.lineBasicMaterial
        ref={lineMat}
          opacity={lineOpacity}
          vertexColors={true}
          blending={AdditiveBlending}
          transparent={true}
        />
      </animated.lineSegments>
    </animated.group>
  );
}

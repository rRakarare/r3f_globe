import { Canvas } from "@react-three/fiber";
import Globe from "./Globe";
import { OrbitControls } from "@react-three/drei";

function App() {
  return (
    <>
      <Canvas camera={{ position: [0, 0, 17.5] }}>
        <Globe />
        <OrbitControls />
      </Canvas>
    </>
  );
}

export default App;

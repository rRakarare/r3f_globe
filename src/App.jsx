import { Canvas } from "@react-three/fiber";
import Globe from "./Globe";

function App() {
  return (
    <>
      <Canvas camera={{ position: [0, 0, 17.5], fov: 10 }}>
        <Globe />
      </Canvas>
    </>
  );
}

export default App;

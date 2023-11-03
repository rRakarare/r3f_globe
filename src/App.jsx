import { Canvas } from "@react-three/fiber";
import Globe from "./Globe";

function App() {
  return (
    <>
      <Canvas camera={{ position: [0, 0, 250], fov: 10}}>
        <Globe />
      </Canvas>
      <div style={{height:"2000px"}}></div>
    </>
  );
}

export default App;

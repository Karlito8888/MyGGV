import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Aside from "./components/Aside";
import Signup from "./pages/Signup";

function App() {
  return (
    <>
      <Header />
      <Aside />
      <Signup />
      <main>
        <Outlet />
      </main>
      <footer>{/* Contenu du footer */}</footer>
    </>
  );
}

export default App;

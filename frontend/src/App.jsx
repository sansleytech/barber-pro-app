import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Clientes from "./pages/Clientes";
import ClienteForm from "./pages/ClienteForm";
import Barberos from "./pages/Barberos";
import BarberoForm from "./pages/barberoForm";
import Servicios from "./pages/Servicios";
import ServicioForm from "./pages/ServicioForm";
import Productos from "./pages/Productos";
import ProductoForm from "./pages/ProductoForm";
import Categorias from "./pages/Categorias";
import CategoriaForm from "./pages/CategoriaForm";
import Proveedores from "./pages/Proveedores";
import ProveedorForm from "./pages/ProveedorForm";
import Usuarios from "./pages/Usuarios";
import UsuarioForm from "./pages/UsuarioForm";
import Turnos from "./pages/Turnos";
import TurnoForm from "./pages/TurnoForm";
import VentaNueva from "./pages/VentaNueva";
import Ventas from "./pages/Ventas";
import Horarios from "./pages/Horarios";
import Compras from "./pages/Compras"
import Caja from "./pages/Caja"
import Valoraciones from "./pages/Valoraciones";
import Acontecimientos from "./pages/Acontecimientos";


function RutaProtegida({ children }) {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" replace />;
}

// Placeholder temporal para las vistas que todavía no construimos
function EnConstruccion({ nombre }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">{nombre}</h1>
      <p className="text-gray-400">Esta sección está en construcción.</p>
    </div>
  );
}

function Dashboard() {
  const { usuario } = useAuth();
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-gray-400 mb-6">Resumen general de tu negocio</p>
      <div className="bg-ink-card border border-line rounded-2xl p-8">
        <h2 className="text-xl text-white mb-2">
          ¡Bienvenido, {usuario?.nombre_usuario}!
        </h2>
        <p className="text-gray-400">
          Barbería: {usuario?.barberia} · Rol: {usuario?.rol}
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <RutaProtegida>
              <Layout />
            </RutaProtegida>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/turnos" element={<Turnos />} />
          <Route path="/turnos/nuevo" element={<TurnoForm />} />
          <Route path="/turnos/editar/:id" element={<TurnoForm />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/nuevo" element={<ClienteForm />} />
          <Route path="/clientes/editar/:id" element={<ClienteForm />} />
          <Route path="/barberos" element={<Barberos />} />
          <Route path="/barberos/nuevo" element={<BarberoForm />} />
          <Route path="/barberos/editar/:id" element={<BarberoForm />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/servicios/nuevo" element={<ServicioForm />} />
          <Route path="/servicios/editar/:id" element={<ServicioForm />} />
          <Route path="/horarios" element={<Horarios />}></Route>
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/usuarios/nuevo" element={<UsuarioForm />} />
          <Route path="/usuarios/editar/:id" element={<UsuarioForm />} />
          <Route path="/valoraciones" element={<Valoraciones />} />
          <Route path="/acontecimientos" element={<Acontecimientos />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/productos/nuevo" element={<ProductoForm />} />
          <Route path="/productos/editar/:id" element={<ProductoForm />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/proveedores/nuevo" element={<ProveedorForm />} />
          <Route path="/proveedores/editar/:id" element={<ProveedorForm />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/categorias/nuevo" element={<CategoriaForm />} />
          <Route path="/categorias/editar/:id" element={<CategoriaForm />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/ventas/nueva" element={<VentaNueva />} />
          <Route path="/caja" element={<Caja />} />
          <Route path="/configuracion" element={<EnConstruccion nombre="Configuración" />} />
          <Route path="/qr" element={<EnConstruccion nombre="Códigos QR" />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
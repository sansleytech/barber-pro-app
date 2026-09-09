// rebuild 2
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
import Compras from "./pages/Compras";
import Caja from "./pages/Caja";
import Valoraciones from "./pages/Valoraciones";
import Acontecimientos from "./pages/Acontecimientos";
import Notificaciones from "./pages/Notificaciones";
import Dashboard from "./pages/Dashboard";
import { puedeAcceder } from "./config/permiso";
import Configuracion from "./pages/Configuracion";
import CodigosQR from "./pages/CodigoQR";
import Portal from "./pages/Portal";
import Solicitudes from "./pages/Solicitudes";
import Reportes from "./pages/Reportes";
import Galeria from "./pages/Galeria";
import Registro from "./pages/Registro";
import Planes from "./pages/Planes";
import Directorio from "./pages/Directorio";
import Recordatorios from "./pages/Recordatorios";
import Calendario from "./pages/Calendario";
import PagarPlan from "./pages/PagarPlan";
import PagoResultado from "./pages/PagoResultado";

// Protege una ruta según el rol. Si no tiene permiso, lo manda al dashboard.
function RutaPorRol({ ruta, children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (!puedeAcceder(ruta, usuario.rol)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/portal/:subdominio" element={<Portal />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/register" element={<Registro />} />
        <Route path="/planes" element={<Planes />} />
        <Route path="/directorio" element={<Directorio />} />

        <Route
          element={
            <RutaProtegida>
              <Layout />
            </RutaProtegida>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/solicitudes" element={<RutaPorRol ruta="/solicitudes"><Solicitudes /></RutaPorRol>} />
          <Route path="/reportes" element={<RutaPorRol ruta="/reportes"><Reportes /></RutaPorRol>} />
          <Route path="/galeria" element={<RutaPorRol ruta="/galeria"><Galeria /></RutaPorRol>} />
          <Route
            path="/turnos"
            element={
              <RutaPorRol ruta="/turnos">
                <Turnos />
              </RutaPorRol>
            }
          />
          <Route
            path="/turnos/nuevo"
            element={
              <RutaPorRol ruta="/turnos">
                <TurnoForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/turnos/editar/:id"
            element={
              <RutaPorRol ruta="/turnos">
                <TurnoForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/clientes"
            element={
              <RutaPorRol ruta="/clientes">
                <Clientes />
              </RutaPorRol>
            }
          />
          <Route
            path="/clientes/nuevo"
            element={
              <RutaPorRol ruta="/clientes">
                <ClienteForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/clientes/editar/:id"
            element={
              <RutaPorRol ruta="/clientes">
                <ClienteForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/barberos"
            element={
              <RutaPorRol ruta="/barberos">
                <Barberos />
              </RutaPorRol>
            }
          />
          <Route
            path="/barberos/nuevo"
            element={
              <RutaPorRol ruta="/barberos">
                <BarberoForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/barberos/editar/:id"
            element={
              <RutaPorRol ruta="/barberos">
                <BarberoForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/servicios"
            element={
              <RutaPorRol ruta="/servicios">
                <Servicios />
              </RutaPorRol>
            }
          />
          <Route
            path="/servicios/nuevo"
            element={
              <RutaPorRol ruta="/servicios">
                <ServicioForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/servicios/editar/:id"
            element={
              <RutaPorRol ruta="/servicios">
                <ServicioForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/horarios"
            element={
              <RutaPorRol ruta="/horarios">
                <Horarios />
              </RutaPorRol>
            }
          />
          <Route
            path="/usuarios"
            element={
              <RutaPorRol ruta="/usuarios">
                <Usuarios />
              </RutaPorRol>
            }
          />
          <Route
            path="/usuarios/nuevo"
            element={
              <RutaPorRol ruta="/usuarios">
                <UsuarioForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/usuarios/editar/:id"
            element={
              <RutaPorRol ruta="/usuarios">
                <UsuarioForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/valoraciones"
            element={
              <RutaPorRol ruta="/valoraciones">
                <Valoraciones />
              </RutaPorRol>
            }
          />
          <Route
            path="/acontecimientos"
            element={
              <RutaPorRol ruta="/acontecimientos">
                <Acontecimientos />
              </RutaPorRol>
            }
          />
          <Route
            path="/notificaciones"
            element={
              <RutaPorRol ruta="/notificaciones">
                <Notificaciones />
              </RutaPorRol>
            }
          />
          <Route
            path="/productos"
            element={
              <RutaPorRol ruta="/productos">
                <Productos />
              </RutaPorRol>
            }
          />
          <Route
            path="/productos/nuevo"
            element={
              <RutaPorRol ruta="/productos">
                <ProductoForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/productos/editar/:id"
            element={
              <RutaPorRol ruta="/productos">
                <ProductoForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/proveedores"
            element={
              <RutaPorRol ruta="/proveedores">
                <Proveedores />
              </RutaPorRol>
            }
          />
          <Route
            path="/proveedores/nuevo"
            element={
              <RutaPorRol ruta="/proveedores">
                <ProveedorForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/proveedores/editar/:id"
            element={
              <RutaPorRol ruta="/proveedores">
                <ProveedorForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/categorias"
            element={
              <RutaPorRol ruta="/categorias">
                <Categorias />
              </RutaPorRol>
            }
          />
          <Route
            path="/categorias/nuevo"
            element={
              <RutaPorRol ruta="/categorias">
                <CategoriaForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/categorias/editar/:id"
            element={
              <RutaPorRol ruta="/categorias">
                <CategoriaForm />
              </RutaPorRol>
            }
          />
          <Route
            path="/compras"
            element={
              <RutaPorRol ruta="/compras">
                <Compras />
              </RutaPorRol>
            }
          />
          <Route
            path="/ventas"
            element={
              <RutaPorRol ruta="/ventas">
                <Ventas />
              </RutaPorRol>
            }
          />
          <Route
            path="/ventas/nueva"
            element={
              <RutaPorRol ruta="/ventas">
                <VentaNueva />
              </RutaPorRol>
            }
          />
          <Route
            path="/caja"
            element={
              <RutaPorRol ruta="/caja">
                <Caja />
              </RutaPorRol>
            }
          />
          <Route
            path="/configuracion"
            element={
              <RutaPorRol ruta="/configuracion">
                <Configuracion />
              </RutaPorRol>
            }
          />
          <Route
            path="/qr"
            element={
              <RutaPorRol ruta="/qr">
                <CodigosQR />
              </RutaPorRol>
            }
          />
          <Route
            path="/recordatorios"
            element={
              <RutaPorRol ruta="/recordatorios">
                <Recordatorios />
              </RutaPorRol>
            }
          />
          <Route
            path="/calendario"
            element={
              <RutaPorRol ruta="/calendario">
                <Calendario />
              </RutaPorRol>
            }
          />
        </Route>
        
          <Route path="/pagar" element={<PagarPlan />} />
          <Route path="/pago/resultado" element={<PagoResultado />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
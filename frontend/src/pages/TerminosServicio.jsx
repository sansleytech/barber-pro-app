import { Link } from "react-router-dom";
import logo from "../assets/img/logo1.png";

function Seccion({ numero, titulo, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-white mb-3">
        {numero}. {titulo}
      </h2>
      <div className="text-gray-400 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

function TerminosServicio() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 mb-10">
          <img
            src={logo}
            alt="Barber Pro"
            className="w-8 h-8 rounded-lg object-cover"
          />
          <span className="font-bold">
            Barber <span className="text-yellow-400">Pro</span>
          </span>
        </Link>

        <h1 className="text-3xl font-bold mb-2">
          Términos y Condiciones de Servicio
        </h1>
        <p className="text-gray-500 text-sm mb-10">
          Última actualización:{" "}
          {new Date().toLocaleDateString("es-CO", {
            day: "numeric",
            month: "long",
            year: "numeric"
          })}
        </p>

        <Seccion numero="1" titulo="Aceptación de los términos">
          <p>
            Al registrarte y usar Barber Pro ("la Plataforma"), operada por
            Sansley Tech Solutions, aceptás estos Términos de Servicio en su
            totalidad. Si no estás de acuerdo, no debés usar la Plataforma.
          </p>
        </Seccion>

        <Seccion numero="2" titulo="Descripción del servicio">
          <p>
            Barber Pro es un software como servicio (SaaS) para la gestión de
            barberías: turnos, clientes, inventario, caja, portal público de
            reservas, y funciones asociadas según el plan contratado.
          </p>
        </Seccion>

        <Seccion numero="3" titulo="Cuentas y responsabilidad del usuario">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Sos responsable de mantener la confidencialidad de tu contraseña y
              de toda actividad realizada desde tu cuenta.
            </li>
            <li>Debés proporcionar información veraz al registrarte.</li>
            <li>
              No podés usar la Plataforma para actividades ilegales o que violen
              derechos de terceros.
            </li>
          </ul>
        </Seccion>

        <Seccion numero="4" titulo="Planes, precios y pagos">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Los precios de los planes están publicados en la Plataforma y
              pueden cambiar con aviso previo.
            </li>
            <li>
              Los pagos se procesan a través de Wompi. Barber Pro no almacena
              datos de tarjetas.
            </li>
            <li>
              Si activás el cobro automático, autorizás el cargo recurrente
              mensual a tu método de pago guardado.
            </li>
            <li>
              Los períodos de prueba gratuita tienen la duración indicada al
              momento del registro.
            </li>
          </ul>
        </Seccion>

        <Seccion numero="5" titulo="Cancelación">
          <p>
            Podés cancelar tu cuenta en cualquier momento desde Configuración.
            Al cancelar, tu cuenta queda congelada (sin acceso) pero tus datos
            se conservan de forma segura por si querés reactivarla más adelante,
            contactando a soporte. Barber Pro no realiza reembolsos automáticos
            por cancelaciones a mitad de un período ya pagado, salvo que la ley
            aplicable indique lo contrario.
          </p>
        </Seccion>

        <Seccion numero="6" titulo="Disponibilidad del servicio">
          <p>
            Hacemos nuestro mejor esfuerzo para mantener la Plataforma
            disponible, pero no garantizamos un funcionamiento ininterrumpido o
            libre de errores. Podemos realizar mantenimientos programados con
            aviso previo cuando sea posible.
          </p>
        </Seccion>

        <Seccion numero="7" titulo="Limitación de responsabilidad">
          <p>
            Barber Pro se ofrece "tal cual". En la máxima medida permitida por
            la ley, no somos responsables por daños indirectos, pérdida de
            ingresos, o pérdida de datos derivados del uso de la Plataforma. Los
            documentos generados por la Plataforma (recibos, comprobantes) no
            constituyen factura electrónica válida ante la DIAN salvo que se
            indique expresamente lo contrario.
          </p>
        </Seccion>

        <Seccion numero="8" titulo="Propiedad intelectual">
          <p>
            El software, marca y contenido de Barber Pro son propiedad de
            Sansley Tech Solutions. Los datos que cargués (clientes, turnos,
            imágenes) siguen siendo tuyos; nos autorizás a procesarlos
            únicamente para prestarte el servicio.
          </p>
        </Seccion>

        <Seccion numero="9" titulo="Modificaciones">
          <p>
            Podemos actualizar estos Términos en cualquier momento. Los cambios
            importantes serán notificados a través de la Plataforma o por correo
            electrónico.
          </p>
        </Seccion>

        <Seccion numero="10" titulo="Ley aplicable">
          <p>
            Estos Términos se rigen por las leyes de la República de Colombia.
          </p>
        </Seccion>

        <div className="mt-12 pt-8 border-t border-white/10 text-sm text-gray-500">
          <p>
            Este documento es un modelo general de Términos de Servicio. No
            constituye asesoría legal. Recomendamos que sea revisado por un
            abogado antes de su publicación definitiva. Ver también nuestra{" "}
            <Link
              to="/politicas-de-privacidad"
              className="text-yellow-400 hover:underline"
            >
              Política de Privacidad
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TerminosServicio;

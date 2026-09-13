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

function PoliticaPrivacidad() {
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
          Política de Tratamiento de Datos Personales
        </h1>
        <p className="text-gray-500 text-sm mb-10">
          Última actualización:{" "}
          {new Date().toLocaleDateString("es-CO", {
            day: "numeric",
            month: "long",
            year: "numeric"
          })}
        </p>

        <Seccion numero="1" titulo="Responsable del tratamiento">
          <p>
            Sansley Tech Solutions ("nosotros", "Barber Pro") es responsable del
            tratamiento de los datos personales recolectados a través de la
            plataforma Barber Pro (barberproapp.online), de conformidad con la
            Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas
            concordantes sobre protección de datos personales en Colombia.
          </p>
          <p>Contacto: sansley.tech-sol@outlook.com</p>
        </Seccion>

        <Seccion numero="2" titulo="Datos que recolectamos">
          <p>Dependiendo de cómo uses la plataforma, podemos recolectar:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Datos de contacto: nombre, apellidos, documento de identidad,
              teléfono, correo electrónico.
            </li>
            <li>
              Datos del negocio: nombre de la barbería, NIT, dirección,
              ubicación geográfica.
            </li>
            <li>
              Datos de uso: turnos agendados, historial de servicios,
              preferencias, reseñas.
            </li>
            <li>
              Datos de pago: gestionados directamente por nuestra pasarela de
              pagos (Wompi); Barber Pro no almacena números de tarjeta.
            </li>
          </ul>
        </Seccion>

        <Seccion numero="3" titulo="Finalidad del tratamiento">
          <p>Los datos recolectados se usan para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Permitir el registro y funcionamiento de tu cuenta en la
              plataforma.
            </li>
            <li>
              Gestionar la agenda de turnos entre barberías y sus clientes.
            </li>
            <li>Procesar pagos de suscripción y renovaciones automáticas.</li>
            <li>
              Enviar notificaciones operativas (confirmaciones de turno,
              vencimientos de plan, alertas de pago).
            </li>
            <li>Mejorar la plataforma y brindar soporte técnico.</li>
            <li>Cumplir obligaciones legales y fiscales.</li>
          </ul>
        </Seccion>

        <Seccion
          numero="4"
          titulo="Derechos del titular de los datos (Habeas Data)"
        >
          <p>
            Conforme a la Ley 1581 de 2012, como titular de tus datos personales
            tenés derecho a:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Conocer, actualizar y rectificar tus datos personales.</li>
            <li>
              Solicitar prueba de la autorización otorgada para el tratamiento
              de tus datos.
            </li>
            <li>Ser informado sobre el uso que se le ha dado a tus datos.</li>
            <li>
              Revocar la autorización o solicitar la supresión de tus datos,
              cuando no exista un deber legal o contractual que lo impida.
            </li>
            <li>
              Presentar quejas ante la Superintendencia de Industria y Comercio
              (SIC) por infracciones a la ley.
            </li>
          </ul>
        </Seccion>

        <Seccion numero="5" titulo="Cómo ejercer tus derechos">
          <p>
            Podés ejercer estos derechos enviando una solicitud al correo{" "}
            <span className="text-white">sansley.tech-sol@outlook.com</span>,
            indicando tu nombre completo, el derecho que deseás ejercer y una
            descripción clara de tu solicitud. Responderemos dentro de los
            plazos establecidos por la ley (10 días hábiles para consultas, 15
            días hábiles para reclamos).
          </p>
        </Seccion>

        <Seccion numero="6" titulo="Transferencia y transmisión de datos">
          <p>
            Tus datos pueden ser compartidos con proveedores de servicios
            necesarios para la operación de la plataforma (por ejemplo, la
            pasarela de pagos Wompi para procesar transacciones, o servicios de
            envío de correos electrónicos), quienes están obligados
            contractualmente a proteger tu información y usarla únicamente para
            el fin acordado. No vendemos ni compartimos tus datos con terceros
            para fines comerciales ajenos a la plataforma.
          </p>
        </Seccion>

        <Seccion numero="7" titulo="Seguridad de la información">
          <p>
            Implementamos medidas técnicas y organizativas razonables para
            proteger tus datos contra pérdida, uso indebido, acceso no
            autorizado o alteración, incluyendo el cifrado de contraseñas y
            comunicaciones seguras (HTTPS).
          </p>
        </Seccion>

        <Seccion numero="8" titulo="Menores de edad">
          <p>
            Barber Pro no está dirigido a menores de edad. Si sos administrador
            de una barbería, declarás que sos mayor de edad y que los datos de
            clientes menores de edad registrados en la plataforma cuentan con la
            autorización correspondiente de sus padres o representantes legales.
          </p>
        </Seccion>

        <Seccion numero="9" titulo="Vigencia">
          <p>
            Esta política rige a partir de su fecha de publicación y permanecerá
            vigente mientras existan datos personales objeto de tratamiento.
            Podemos actualizarla en cualquier momento; los cambios importantes
            serán notificados a través de la plataforma.
          </p>
        </Seccion>

        <div className="mt-12 pt-8 border-t border-white/10 text-sm text-gray-500">
          <p>
            Este documento es una guía general basada en la Ley 1581 de 2012 y
            el Decreto 1377 de 2013 de Colombia. No constituye asesoría legal.
            Recomendamos que sea revisado por un abogado antes de su publicación
            definitiva.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PoliticaPrivacidad;

// src/pages/Home.jsx
import { Link } from "react-router-dom";
import {
  Scissors,
  Calendar,
  Package,
  BarChart3,
  Globe,
  MapPin,
  Check
} from "lucide-react";

function Home() {
  return (
    <div className="min-h-screen bg-ink text-white">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-line">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gold flex items-center justify-center">
            <Scissors className="w-5 h-5 text-ink" />
          </div>
          <span className="text-lg font-bold">
            Barber <span className="text-gold">Pro</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/planes"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Precios
          </Link>
          <Link
            to="/directorio"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Encontrá tu barbería
          </Link>
          <Link
            to="/login"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
        <Link
          to="/registro"
          className="bg-gold text-ink font-semibold text-sm rounded-lg px-4 py-2.5 hover:bg-gold-soft transition-colors"
        >
          Registrá tu barbería
        </Link>
      </nav>

      {/* HERO */}
      <header className="relative overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-6 py-24 sm:py-32 text-center">
          <span className="inline-block font-mono text-xs tracking-[0.16em] uppercase text-gold mb-4">
            Software para barberías
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
            Gestioná tu barbería<br />de punta a punta
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
            Turnos, clientes, inventario, caja y un portal público para cada
            barbería. Todo en un solo lugar, con 14 días de prueba gratis.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/registro"
              className="bg-gold text-ink font-semibold rounded-lg px-8 py-4 hover:bg-gold-soft transition-colors"
            >
              Empezar gratis
            </Link>
            <Link
              to="/planes"
              className="border border-line text-white font-semibold rounded-lg px-8 py-4 hover:border-gold/40 transition-colors"
            >
              Ver planes y precios
            </Link>
          </div>
        </div>
      </header>

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
          Todo lo que necesitás, en un solo lugar
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icono: Calendar,
              titulo: "Turnos y clientes",
              desc: "Agenda organizada, recordatorios automáticos por WhatsApp."
            },
            {
              icono: Package,
              titulo: "Inventario y ventas",
              desc: "Controlá stock de productos y registrá cada venta."
            },
            {
              icono: BarChart3,
              titulo: "Reportes",
              desc: "Ingresos, ranking de barberos, servicios más vendidos."
            },
            {
              icono: Globe,
              titulo: "Portal público",
              desc:
                "Cada barbería tiene su propia página para pedir turno online."
            }
          ].map(f =>
            <div
              key={f.titulo}
              className="bg-ink-card border border-line rounded-2xl p-6"
            >
              <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
                <f.icono className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-semibold mb-2">
                {f.titulo}
              </h3>
              <p className="text-gray-400 text-sm">
                {f.desc}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* DIRECTORIO TEASER */}
      <section className="border-y border-line bg-ink-card/40">
        <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                ¿Ya sos cliente de una barbería?
              </h3>
              <p className="text-gray-400 text-sm">
                Encontrala en nuestro directorio y pedí tu turno online.
              </p>
            </div>
          </div>
          <Link
            to="/directorio"
            className="bg-ink border border-line text-white font-semibold rounded-lg px-6 py-3 hover:border-gold/40 transition-colors whitespace-nowrap"
          >
            Buscar barbería
          </Link>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">
          ¿Listo para modernizar tu barbería?
        </h2>
        <p className="text-gray-400 mb-8">
          14 días de prueba gratis, sin tarjeta de crédito.
        </p>
        <Link
          to="/registro"
          className="inline-block bg-gold text-ink font-semibold rounded-lg px-8 py-4 hover:bg-gold-soft transition-colors"
        >
          Registrá tu barbería gratis
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line py-10 px-6 text-center">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} Barber Pro. Plataforma desarrollada por{" "}
          <a
            href="mailto:sansley.tech-sol@outlook.com"
            className="text-gray-400 hover:text-gold transition-colors"
          >
            Sansley Tech Solutions
          </a>
        </p>
      </footer>
    </div>
  );
}

export default Home;

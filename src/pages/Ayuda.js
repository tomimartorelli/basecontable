import React, { useContext } from 'react';
import { FiHelpCircle, FiMessageCircle, FiMail, FiCheckCircle } from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import MarketingLayout from '../layouts/MarketingLayout';

const Ayuda = () => {
  const { modoOscuro } = useContext(ThemeContext);

  const pageBg = modoOscuro ? 'bg-black' : 'bg-[#f5f5f7]';
  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-700';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';

  const faqs = [
    {
      q: '¿Para quién está pensada Contasuite?',
      a: 'Para emprendedores y pequeñas empresas que quieren dejar de usar Excel para seguir sus ventas, cobranzas y gastos, sin meterse con AFIP ni facturación electrónica.'
    },
    {
      q: '¿Necesito saber de contabilidad?',
      a: 'No. Los textos y pantallas están pensados para alguien que solo quiere saber quién le debe, cuánto cobró y cómo viene el mes.'
    },
    {
      q: '¿Puedo probar sin compromisos?',
      a: 'Sí. Podés crear tu cuenta, cargar algunos clientes y ventas, y recién después decidir si querés seguir usando la herramienta.'
    },
    {
      q: '¿Qué pasa si cambio de plan?',
      a: 'Podés subir o bajar de plan cuando lo necesites. Tus datos se mantienen, solo cambia lo que tenés habilitado (por ejemplo equipo de usuarios o auditoría).'
    },
    {
      q: '¿Mis datos están seguros?',
      a: 'Usamos conexión segura (HTTPS) y guardamos los datos en una base de datos en la nube. Solo vos y las personas que invites a tu cuenta pueden ver tu información.'
    }
  ];

  return (
    <MarketingLayout>
      <div className={pageBg}>
        {/* Hero simple */}
        <section className="py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className={`text-[11px] font-semibold tracking-[0.2em] uppercase mb-3 ${textMuted}`}>
              AYUDA RÁPIDA
            </p>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 leading-tight ${textPri}`}>
              Preguntas simples para usar Contasuite sin ser contador
            </h1>
            <p className={`text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed ${textSec}`}>
              Si estás empezando a ordenar tu negocio, acá tenés respuestas cortas a las dudas más comunes.
              Si todavía te queda alguna pregunta, podés escribirnos directo.
            </p>
          </div>
        </section>

        {/* FAQ principal */}
        <section className="pb-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              {faqs.map((item, idx) => (
                <div key={idx} className={`border rounded-2xl p-4 sm:p-5 ${box}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${modoOscuro ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                      <FiHelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className={`text-sm sm:text-base font-semibold mb-1.5 ${textPri}`}>{item.q}</h3>
                      <p className={`text-xs sm:text-sm leading-relaxed ${textSec}`}>{item.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bloque de contacto directo */}
            <aside className={`rounded-2xl border p-5 space-y-4 ${box}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#1F80FF]/10 text-[#1F80FF]">
                  <FiMessageCircle className="w-4 h-4" />
                </div>
                <h2 className={`text-sm sm:text-base font-semibold ${textPri}`}>¿Seguís con dudas?</h2>
              </div>
              <p className={`text-xs sm:text-sm ${textSec}`}>
                No hay preguntas tontas. Si algo no te queda claro, escribinos y te ayudamos a ver si Contasuite te sirve para tu caso.
              </p>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <FiMail className="w-4 h-4 text-[#1F80FF]" />
                  <span className={textSec}>
                    Email: <a href="mailto:soporte@basecontable.com" className="text-[#1F80FF] hover:underline">soporte@basecontable.com</a>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className={textSec}>Respondemos normalmente en menos de 24 horas hábiles.</span>
                </div>
              </div>
              <div className="text-[11px] leading-relaxed rounded-xl px-3 py-2 bg-[#1F80FF]/5 text-[#1F80FF]">
                Consejo: aunque todavía no tengas todo ordenado, podés empezar cargando solo tus clientes y las ventas de este mes. El resto lo podés ir sumando de a poco.
              </div>
            </aside>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};

export default Ayuda;


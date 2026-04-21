import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiArrowRight, FiLinkedin, FiTwitter, FiFacebook, FiGithub } from 'react-icons/fi';

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="bg-black text-white">
      {/* Cinta CTA superior */}
      <div className="bg-[#004AAD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/90 text-sm sm:text-base font-medium text-center sm:text-left">
            ¿Listo para modernizar tu negocio?
          </p>
          <div className="flex gap-3">
            <button onClick={() => navigate('/register')} className="px-4 py-2 rounded-lg bg-white text-[#004AAD] font-semibold hover:bg-[#5CA3FF] hover:text-white transition-colors flex items-center gap-2">
              Empezar gratis
              <FiArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/planes')} className="px-4 py-2 rounded-lg border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">
              Ver planes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-center">
          {/* Marca y descripción */}
          <div className="md:col-span-2">
            <img src="/logo-ingleswhite.png" alt="Contasuite" className="h-5 md:h-6 mb-5 block" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo-espanolwhite.png'; }} />
          <p className="text-gray-400 mb-6 max-w-md">
            Plataforma de administración y registro para emprendimientos y pequeñas empresas. Centralizá clientes, ventas y cobranzas sin tocar AFIP.
          </p>
            <div className="flex items-center gap-3">
              <button aria-label="LinkedIn" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><FiLinkedin className="w-5 h-5" /></button>
              <button aria-label="Twitter" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><FiTwitter className="w-5 h-5" /></button>
              <button aria-label="Facebook" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><FiFacebook className="w-5 h-5" /></button>
              <button aria-label="Github" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"><FiGithub className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Producto */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-white mb-4">Producto</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/funcionalidades')} className="text-gray-400 hover:text-white transition-colors">Funcionalidades</button></li>
              <li><button onClick={() => navigate('/planes')} className="text-gray-400 hover:text-white transition-colors">Planes</button></li>
              <li><button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition-colors">Ingresar</button></li>
              <li><button onClick={() => navigate('/register')} className="text-gray-400 hover:text-white transition-colors">Crear cuenta</button></li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-white mb-4">Empresa</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/quienes-somos')} className="text-gray-400 hover:text-white transition-colors">Quiénes somos</button></li>
              <li><button onClick={() => navigate('/ayuda')} className="text-gray-400 hover:text-white transition-colors">Ayuda / Preguntas frecuentes</button></li>
              <li><button onClick={() => navigate('/contacto')} className="text-gray-400 hover:text-white transition-colors">Contacto</button></li>
              <li><button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors">Blog</button></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-white mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2"><FiMail className="w-4 h-4" /> contacto@basecontable.com</li>
              <li className="flex items-center gap-2"><FiPhone className="w-4 h-4" /> +54 11 1234-5678</li>
              <li className="flex items-center gap-2"><FiMapPin className="w-4 h-4" /> CABA, Argentina</li>
            </ul>
          </div>
        </div>

        {/* Newsletter (opcional futuro) */}
        {/* <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <p className="text-gray-400 md:col-span-1">Suscríbete para recibir novedades y mejoras del producto.</p>
          <div className="md:col-span-2 flex gap-2">
            <input type="email" placeholder="tu@email.com" className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5CA3FF]" />
            <button className="px-4 py-3 rounded-xl bg-[#1F80FF] hover:bg-[#004AAD] font-semibold">Suscribirme</button>
          </div>
        </div> */}

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Contasuite. Todos los derechos reservados.</p>
          <div className="flex gap-4 text-xs text-gray-400">
            <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Términos</button>
            <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Privacidad</button>
            <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Cookies</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



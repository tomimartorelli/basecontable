import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { FiSend, FiCheckCircle } from 'react-icons/fi';
import emailjs from '@emailjs/browser';

const ContactModal = ({ isOpen, onClose, preSelectedPlan = null }) => {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(preSelectedPlan || '');
  const subjectRef = useRef(null);

  const subjectOptions = [
    { value: '', label: 'Seleccioná un asunto' },
    { value: 'Consulta General', label: 'Consulta General' },
    { value: 'Demo Personalizada', label: 'Solicitar Demo' },
    { value: 'Soporte Técnico', label: 'Soporte Técnico' },
    { value: 'Planes y Precios', label: 'Planes y Precios' },
    { value: 'Migración', label: 'Migración desde otro sistema' },
    { value: 'Partnership', label: 'Partnership / Alianzas' },
    { value: 'Otro', label: 'Otro' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (subjectRef.current && !subjectRef.current.contains(event.target)) {
        setSubjectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Guardar el scroll actual
      const scrollY = window.scrollY;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Bloquear scroll del body completamente
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.dataset.scrollY = scrollY.toString();
      
      // Reset states
      setIsSuccess(false);
      setIsSubmitting(false);

      // Animación de apertura
      const tl = gsap.timeline();
      
      // Overlay fade in
      tl.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );
      
      // Modal slide in from right
      tl.fromTo(modalRef.current,
        { x: '100%' },
        { x: '0%', duration: 0.5, ease: "power3.out" },
        "-=0.1"
      );
      
      // Content fade in
      tl.fromTo(contentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
        "-=0.2"
      );
    } else {
      // Restaurar scroll del body
      const scrollY = document.body.dataset.scrollY || '0';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      window.scrollTo(0, parseInt(scrollY));
      document.body.removeAttribute('data-scroll-y');
      
      // Animación de cierre (solo si hay refs)
      if (overlayRef.current && modalRef.current) {
        const tl = gsap.timeline();
        
        tl.to(modalRef.current, {
          x: '100%',
          duration: 0.4,
          ease: "power3.in"
        });
        
        tl.to(overlayRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.in"
        }, "-=0.2");
      }
    }
    
    // Cleanup cuando el componente se desmonta
    return () => {
      const scrollY = document.body.dataset.scrollY;
      if (scrollY) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, parseInt(scrollY));
        document.body.removeAttribute('data-scroll-y');
      }
    };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Enviar con EmailJS
      const result = await emailjs.sendForm(
        'service_jy30k4w', // Service ID
        'template_ep9zoqc', // Template ID
        e.currentTarget,
        'qh9gEflQcEoNQntav' // Public Key
      );

      console.log('Email enviado:', result.text);
      
      setIsSubmitting(false);
      setIsSuccess(true);

      // Auto-cerrar después de 3 segundos
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      setIsSubmitting(false);
      alert('Error al enviar el mensaje. Por favor, intentá nuevamente o escribinos directamente a soporte@basecontable.com');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999]"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }}
    >
      {/* Overlay oscuro - cubre toda la pantalla */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99998]"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh'
        }}
        onClick={onClose}
      />
      
      {/* Modal panel - scroll interno */}
      <div
        ref={modalRef}
        className="fixed top-0 right-0 h-full w-full lg:w-[40%] bg-gray-900 shadow-2xl overflow-hidden z-[99999]"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          maxHeight: '100vh'
        }}
      >
        {/* Header con Logo y botón cerrar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          {/* Logo */}
          <Link to="/" className="transition-all duration-500 hover:opacity-80">
            <img 
              src="/logo-ingleswhite.png" 
              alt="BaseContable" 
              className="h-6 w-auto"
            />
          </Link>
          
          {/* Botón cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 group"
            aria-label="Cerrar modal"
          >
            <span className="text-white text-xl font-light leading-none flex items-center justify-center rotate-45 transition-transform duration-300 group-hover:rotate-90">+</span>
          </button>
        </div>

        {/* Contenido scrollable */}
        <div
          ref={contentRef}
          className="relative overflow-y-auto overflow-x-hidden p-8 lg:p-12"
          style={{ 
            height: 'calc(100vh - 148px)',
            maxHeight: 'calc(100vh - 148px)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {!isSuccess ? (
            <>
              {/* Hidden from_email field for EmailJS */}
              <input type="hidden" name="from_email" value="soporte@basecontable.com" />
              
              {/* Header */}
              <div className="mb-8">
                <div className="text-[#1F80FF] text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                  CONTACTO
                </div>
                <h2 className="text-3xl lg:text-4xl font-semibold text-white leading-tight mb-4">
                  Hablemos de tu negocio
                </h2>
                <p className="text-gray-400 text-base leading-relaxed">
                  Contanos qué necesitás y te respondemos por mail lo antes posible. Sin llamados comerciales agresivos ni promesas vacías.
                </p>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nombre */}
                <div>
                  <label htmlFor="name" className="block text-stone-400 text-sm font-semibold mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 bg-black/30 border border-stone-700 rounded-lg text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="Juan Pérez"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-stone-400 text-sm font-semibold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 bg-black/30 border border-stone-700 rounded-lg text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="tu@email.com"
                  />
                </div>

                {/* Empresa */}
                <div>
                  <label htmlFor="company" className="block text-stone-400 text-sm font-semibold mb-2">
                    Empresa
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    className="w-full px-4 py-3 bg-black/30 border border-stone-700 rounded-lg text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="Nombre de tu empresa"
                  />
                </div>

                {/* Asunto */}
                <div className="relative" ref={subjectRef}>
                  <label className="block text-stone-400 text-sm font-semibold mb-2">
                    Asunto *
                  </label>
                  <input type="hidden" name="subject" value={selectedSubject} required />
                  <button
                    type="button"
                    onClick={() => setSubjectOpen(!subjectOpen)}
                    className="w-full px-4 py-3 bg-black/30 border border-stone-700 rounded-lg text-stone-200 focus:outline-none focus:border-blue-400 transition-colors cursor-pointer hover:bg-black/40 text-left flex items-center justify-between"
                  >
                    <span>{subjectOptions.find(o => o.value === selectedSubject)?.label || 'Seleccioná un asunto'}</span>
                    <svg className={`w-4 h-4 transition-transform ${subjectOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {subjectOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-stone-900 border border-stone-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {subjectOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSelectedSubject(option.value);
                            setSubjectOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-stone-200 hover:bg-stone-800 transition-colors ${selectedSubject === option.value ? 'bg-stone-800' : ''}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mensaje */}
                <div>
                  <label htmlFor="message" className="block text-stone-400 text-sm font-semibold mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-black/30 border border-stone-700 rounded-lg text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                    placeholder="Cuéntanos en detalle tu consulta o solicitud..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1F80FF] hover:bg-[#004AAD] text-white py-4 px-6 rounded-xl font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-5 h-5" />
                      Enviar Mensaje
                    </>
                  )}
                </button>

                {/* Info adicional */}
                <p className="text-gray-500 text-sm text-center">
                  También podés escribirnos directamente a{' '}
                  <a href="mailto:soporte@basecontable.com" className="text-[#1F80FF] hover:text-[#004AAD] transition-colors">
                    soporte@basecontable.com
                  </a>
                </p>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <FiCheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-3xl lg:text-4xl font-medium text-white mb-4">
                ¡Mensaje enviado!
              </h3>
              <p className="text-stone-300 text-lg max-w-md">
                Recibimos tu solicitud. Nos pondremos en contacto muy pronto.
              </p>
              <div className="mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
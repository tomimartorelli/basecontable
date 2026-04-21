import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';

const PageTransition = ({ children }) => {
  const location = useLocation();
  const containerRef = useRef(null);
  const previousPath = useRef(location.pathname);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Animación de entrada cuando cambia la ruta
    if (previousPath.current !== location.pathname) {
      // Animación elegante de entrada - más lenta y con stagger
      const tl = gsap.timeline();
      
      // Animación del contenedor principal
      tl.fromTo(
        container,
        { 
          opacity: 0, 
          y: 40,
          scale: 0.96,
          filter: 'blur(2px)'
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.5,
          ease: 'power4.out'
        }
      )
      // Stagger en elementos internos principales
      .fromTo(
        container.querySelectorAll('section, .container, .max-w-5xl, .max-w-6xl, main > div'),
        {
          opacity: 0,
          y: 30,
          scale: 0.98
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out'
        },
        '-=1'
      );
      
      previousPath.current = location.pathname;
    }
  }, [location]);

  return (
    <div ref={containerRef} className="w-full min-h-screen">
      {children}
    </div>
  );
};

export default PageTransition;

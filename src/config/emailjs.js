// Configuración de EmailJS
// Para configurar EmailJS:
// 1. Ve a https://www.emailjs.com/ y crea una cuenta
// 2. Crea un nuevo servicio de email (Gmail, Outlook, etc.)
// 3. Crea una nueva plantilla de email
// 4. Reemplaza las credenciales abajo con las tuyas

export const EMAILJS_CONFIG = {
  SERVICE_ID: 'YOUR_SERVICE_ID', // Ejemplo: 'service_abc123'
  TEMPLATE_ID: 'YOUR_TEMPLATE_ID', // Ejemplo: 'template_xyz789'
  PUBLIC_KEY: 'YOUR_PUBLIC_KEY' // Ejemplo: 'user_def456'
};

// Ejemplo de plantilla de EmailJS:
/*
Hola,

Has recibido un nuevo mensaje de contacto desde Contasuite:

Nombre: {{name}}
Email: {{email}}
Empresa: {{company}}
Teléfono: {{phone}}
Asunto: {{subject}}

Mensaje:
{{message}}

---
Este mensaje fue enviado desde el formulario de contacto de Contasuite.
*/

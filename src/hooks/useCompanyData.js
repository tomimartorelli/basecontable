import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useApi } from './useApi';
import { 
  LOGO_CONFIG, 
  isValidImageType, 
  isValidFileSize, 
  isValidBase64Size, 
  formatSizeInMB 
} from '../config/logoConfig';

// Datos por defecto de la empresa
const DEFAULT_COMPANY_DATA = {
  name: '',
  address: '',
  city: '',
  postalCode: '',
  phone: '',
  email: '',
  website: '',
  logo: ''
};

// Datos por defecto bancarios
const DEFAULT_BANK_DATA = {
  cbu: ''
};

export const useCompanyData = () => {
  const { user } = useContext(AuthContext);
  const { secureFetch } = useApi();
  
  const [companyData, setCompanyData] = useState(DEFAULT_COMPANY_DATA);
  const [bankData, setBankData] = useState(DEFAULT_BANK_DATA);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar datos de empresa y bancarios del usuario
  const loadCompanyData = useCallback(async () => {
    try {
      console.log('🔄 Iniciando carga de datos de empresa...');
      setLoading(true);
      const response = await secureFetch('/api/company-data');
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Datos de empresa cargados desde API:', data);
        console.log('🏦 Datos bancarios recibidos:', data.bank);
        console.log('🏦 Campo cbu recibido:', data.bank?.cbu);
        console.log('🏦 Tipo de cbu:', typeof data.bank?.cbu);
        console.log('🏦 Longitud de cbu:', data.bank?.cbu?.length);
        
        if (data.company) {
          console.log('🏢 Datos de empresa establecidos:', data.company);
          setCompanyData(data.company);
        }
        if (data.bank) {
          console.log('🏦 Datos bancarios establecidos:', data.bank);
          console.log('🏦 Estableciendo bankData.cbu como:', data.bank.cbu);
          setBankData(data.bank);
        }
      } else {
        console.log('⚠️ No se encontraron datos de empresa, usando valores por defecto');
        console.log('📝 Valores por defecto bancarios:', DEFAULT_BANK_DATA);
      }
    } catch (error) {
      console.error('❌ Error al cargar datos de empresa:', error);
    } finally {
      setLoading(false);
      console.log('✅ Carga de datos completada');
    }
  }, [secureFetch]);

  // Función para guardar datos de empresa y bancarios en la API
  const saveCompanyData = async () => {
    try {
      setSaving(true);
      
      // Validar que el logo no sea demasiado grande antes de enviar
      if (companyData.logo && !isValidBase64Size(companyData.logo.length)) {
        console.error('❌ Logo demasiado grande para enviar:', companyData.logo.length, 'bytes');
        alert('El logo es demasiado grande. Por favor selecciona una imagen más pequeña o comprime la imagen actual.');
        return false;
      }
      
      const dataToSave = {
        company: companyData,
        bank: bankData
      };
      
      console.log('💾 Guardando datos de empresa:', dataToSave);
      console.log('🏦 Datos bancarios a guardar:', dataToSave.bank);
      console.log('🏦 Campo cbu a guardar:', dataToSave.bank.cbu);
      console.log('🏦 Tipo de cbu a guardar:', typeof dataToSave.bank.cbu);
      console.log('🏦 Longitud de cbu a guardar:', dataToSave.bank.cbu?.length);
      console.log('🖼️ Logo a guardar:', {
        presente: !!dataToSave.company.logo,
        tamaño: dataToSave.company.logo ? dataToSave.company.logo.length : 0,
        tipo: dataToSave.company.logo ? typeof dataToSave.company.logo : 'undefined'
      });
      
      const response = await secureFetch('/api/company-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave)
      });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Datos de empresa guardados correctamente');
        console.log('📊 Respuesta del servidor:', responseData);
        console.log('🏦 Datos bancarios en respuesta:', responseData.bank);
        console.log('🏦 Campo cbu en respuesta:', responseData.bank?.cbu);
        console.log('🖼️ Logo en respuesta:', {
          presente: !!responseData.company?.logo,
          tamaño: responseData.company?.logo ? responseData.company.logo.length : 0
        });
        
        // Recargar los datos después de guardar para asegurar sincronización
        console.log('🔄 Recargando datos después del guardado...');
        await loadCompanyData();
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Error al guardar datos de empresa. Status:', response.status);
        console.error('❌ Respuesta del servidor:', errorText);
        
        // Intentar parsear como JSON si es posible
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            alert(`Error al guardar: ${errorData.message}`);
          } else {
            alert('Error al guardar los datos de empresa. Por favor intenta nuevamente.');
          }
        } catch (parseError) {
          alert('Error al guardar los datos de empresa. Por favor intenta nuevamente.');
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Error al guardar datos de empresa:', error);
      alert(`Error inesperado: ${error.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Función para manejar cambios en datos de empresa
  const handleCompanyDataChange = (field, value) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  // Función para manejar cambios en datos bancarios
  const handleBankDataChange = (field, value) => {
    console.log('🔄 Cambiando campo bancario:', field, 'valor:', value);
    setBankData(prev => {
      const newBankData = { ...prev, [field]: value };
      console.log('🏦 Nuevo estado de bankData:', newBankData);
      return newBankData;
    });
  };

  // Función para comprimir imagen
  const compressImage = (file, maxWidth = LOGO_CONFIG.COMPRESSION.MAX_WIDTH, quality = LOGO_CONFIG.COMPRESSION.QUALITY) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo proporción
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a base64 con calidad reducida
        const compressedDataUrl = canvas.toDataURL(LOGO_CONFIG.COMPRESSION.FORMAT, quality);
        resolve(compressedDataUrl);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Función para manejar logo
  const handleLogoChange = async (file) => {
    if (file) {
      console.log('🖼️ Archivo seleccionado:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Validar tipo de archivo
      if (!isValidImageType(file.type)) {
        console.error('❌ Tipo de archivo no válido:', file.type);
        alert(LOGO_CONFIG.MESSAGES.INVALID_TYPE);
        return;
      }
      
      // Validar tamaño del archivo
      if (!isValidFileSize(file.size)) {
        console.error('❌ Archivo demasiado grande:', file.size, 'bytes');
        alert(LOGO_CONFIG.MESSAGES.FILE_TOO_LARGE);
        return;
      }
      
      console.log('✅ Archivo válido, procesando...');
      
      try {
        // Comprimir imagen si es muy grande
        let processedImage;
        if (file.size > LOGO_CONFIG.COMPRESSION_THRESHOLD) {
          console.log('🔄 Comprimiendo imagen...');
          processedImage = await compressImage(file);
          console.log('✅ Imagen comprimida, nuevo tamaño:', processedImage.length);
        } else {
          // Usar FileReader para archivos pequeños
          processedImage = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }
        
        console.log('📖 Archivo procesado correctamente, tamaño final:', processedImage.length);
        setCompanyData(prev => ({ ...prev, logo: processedImage }));
        console.log('✅ Logo actualizado en companyData');
        
        // Mostrar información sobre el tamaño
        const sizeInMB = formatSizeInMB(processedImage.length);
        console.log(`📊 Tamaño del logo: ${sizeInMB} MB`);
        
        if (processedImage.length > 20 * 1024 * 1024) { // 20MB
          console.warn('⚠️ Logo muy grande, podría causar problemas de rendimiento');
        }
        
      } catch (error) {
        console.error('❌ Error al procesar el archivo:', error);
        alert(LOGO_CONFIG.MESSAGES.COMPRESSION_ERROR);
      }
    } else {
      console.log('❌ No se seleccionó ningún archivo');
    }
  };

  // Cargar datos al inicializar
  useEffect(() => {
    console.log('🔄 useEffect ejecutado, user:', user ? user.userId : 'null');
    if (user) {
      console.log('👤 Usuario autenticado, cargando datos de empresa...');
      loadCompanyData();
    } else {
      console.log('❌ No hay usuario autenticado');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // loadCompanyData está envuelto en useCallback con secureFetch como dependencia

  return {
    companyData,
    bankData,
    loading,
    saving,
    loadCompanyData,
    saveCompanyData,
    handleCompanyDataChange,
    handleBankDataChange,
    handleLogoChange
  };
};

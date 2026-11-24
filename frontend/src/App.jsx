import React, { useEffect, useState } from 'react';
import {
  Search, Car, FilterX, Filter, ChevronDown, ChevronLeft, ChevronRight, Check,
  AlertCircle, RefreshCw, X, ArrowLeft, MessageCircle, ZoomIn, ZoomOut
} from 'lucide-react';
import logoGomher from './assets/logo-gomher.svg';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '');
const ITEMS_PER_PAGE = 24;

function buildWhatsAppUrl(item) {
  const desc = item.piezas?.descripcion_corta || 'esta pieza';
  const primerVehiculo = item.piezas?.compatibilidades?.[0]?.vehiculos;
  const vehiculoTexto = primerVehiculo
    ? ` para ${primerVehiculo.marca} ${primerVehiculo.submarca} (${primerVehiculo.anio_inicio}-${primerVehiculo.anio_fin})`
    : '';
  const skuTexto = item.sku_interno ? ` (SKU: ${item.sku_interno})` : '';
  const precioTexto = item.precio_venta_sugerido ? ` por $${item.precio_venta_sugerido}` : '';
  const mensaje = `Hola, vi en su catálogo: ${desc}${vehiculoTexto}${skuTexto}${precioTexto}. ¿Sigue disponible?`;
  const baseUrl = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : 'https://wa.me/';
  return `${baseUrl}?text=${encodeURIComponent(mensaje)}`;
}

// --- COMPONENTE MODAL / PANTALLA COMPLETA DE DETALLE ---
function PiezaDetalleModal({ item, onClose }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = React.useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const rafId = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose]);

  const pieza = item.piezas || {};
  const compatibilidades = pieza.compatibilidades || [];

  const specs = [
    { label: 'Categoría', value: pieza.categoria },
    { label: 'Lado', value: pieza.lado },
    { label: 'Posición', value: pieza.posicion },
    { label: 'Tecnología', value: pieza.tipo_tecnologia },
    { label: 'Acabado / Color', value: pieza.acabado_color },
    { label: 'Equipamiento', value: pieza.variante_equipamiento },
    { label: 'Tipo de repuesto', value: pieza.tipo_repuesto },
  ].filter((spec) => spec.value && spec.value !== 'N/A');

  return (
    <div
      className={`fixed inset-0 z-50 md:p-6 flex items-center justify-center transition-colors duration-300 ${
        isVisible ? 'bg-gray-900/75 md:backdrop-blur-sm' : 'bg-gray-900/0'
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detalle-pieza-titulo"
    >
      <div
        className={`w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl bg-white md:border-2 md:border-gray-900 md:shadow-[8px_8px_0px_rgba(17,24,39,1)] flex flex-col overflow-hidden transition-all duration-300 ease-out ${
          isVisible
            ? 'translate-x-0 md:opacity-100 md:scale-100'
            : 'translate-x-full md:translate-x-0 md:opacity-0 md:scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior fija */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b-2 border-gray-900 bg-white shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-800 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="md:hidden">Volver al catálogo</span>
            <span className="hidden md:inline">Detalle de pieza</span>
          </button>

          <div className="flex items-center gap-3">
            {item.sku_interno && (
              <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-2.5 py-1 border border-gray-300">
                SKU: {item.sku_interno}
              </span>
            )}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar detalle"
              className="p-1.5 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cuerpo responsivo: 1 columna scroll en móvil, 2 columnas en escritorio */}
        <div className="flex-1 overflow-y-auto md:overflow-hidden md:grid md:grid-cols-2">
          {/* Columna Imagen */}
          <div className="bg-gray-50 border-b-2 md:border-b-0 md:border-r-2 border-gray-200 relative flex items-center justify-center min-h-[280px] sm:min-h-[340px] md:min-h-[440px] overflow-hidden">
            {item.foto_url ? (
              <>
                <img
                  src={item.foto_url}
                  alt={pieza.descripcion_corta}
                  onClick={() => setIsZoomed(!isZoomed)}
                  className={`w-full h-full max-h-[420px] md:max-h-[540px] object-contain p-4 transition-transform duration-300 cursor-zoom-in ${
                    isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setIsZoomed(!isZoomed)}
                  aria-label={isZoomed ? 'Alejar imagen' : 'Acercar imagen'}
                  className="absolute bottom-3 right-3 bg-white/95 hover:bg-gray-900 hover:text-white text-gray-900 border-2 border-gray-900 px-3 py-1.5 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
                >
                  {isZoomed ? <ZoomOut size={15} /> : <ZoomIn size={15} />}
                  {isZoomed ? 'Alejar' : 'Zoom'}
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 py-16">
                <Car size={64} className="mb-3 opacity-25" />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Sin foto disponible</span>
              </div>
            )}

            <div className="absolute top-3 left-3 bg-white text-gray-900 text-[11px] uppercase font-black px-2.5 py-1 border-2 border-gray-900">
              DISPONIBLE
            </div>
          </div>

          {/* Columna Información extendida */}
          <div className="p-5 md:p-6 md:overflow-y-auto flex flex-col gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {pieza.categoria && (
                  <span className="text-xs text-blue-600 font-black uppercase tracking-widest">
                    {pieza.categoria}
                  </span>
                )}
                {item.condicion && (
                  <span className="text-[11px] text-gray-700 bg-gray-100 px-2.5 py-0.5 font-bold uppercase tracking-wider border border-gray-200">
                    {item.condicion}
                  </span>
                )}
                {item.sku_interno && (
                  <span className="sm:hidden text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-0.5 border border-gray-200">
                    SKU: {item.sku_interno}
                  </span>
                )}
              </div>

              <h2 id="detalle-pieza-titulo" className="text-2xl font-black text-gray-900 uppercase leading-tight">
                {pieza.descripcion_corta}
              </h2>
            </div>

            {item.detalle_observacion && (
              <div className="bg-blue-50/60 border-l-4 border-blue-600 p-3.5">
                <span className="block text-[11px] font-black uppercase tracking-wider text-blue-800 mb-1">
                  Estado y observaciones
                </span>
                <p className="text-sm text-gray-800 font-medium leading-relaxed">
                  {item.detalle_observacion}
                </p>
              </div>
            )}

            {specs.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2.5">
                  Especificaciones técnicas
                </h3>
                <dl className="grid grid-cols-2 gap-2.5">
                  {specs.map((spec) => (
                    <div key={spec.label} className="bg-gray-50 border border-gray-200 p-2.5">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {spec.label}
                      </dt>
                      <dd className="text-sm font-bold text-gray-900 mt-0.5">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {compatibilidades.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2.5">
                  Vehículos compatibles
                </h3>
                <ul className="space-y-2">
                  {compatibilidades.map((comp) => {
                    const v = comp.vehiculos;
                    if (!v) return null;
                    return (
                      <li key={comp.id} className="border border-gray-200 bg-white p-3 flex flex-col gap-0.5">
                        <span className="text-sm font-black text-gray-900 uppercase">
                          {v.marca} {v.submarca} ({v.anio_inicio} - {v.anio_fin})
                        </span>
                        {v.generacion && (
                          <span className="text-xs font-semibold text-gray-500">
                            {v.generacion}
                          </span>
                        )}
                        {comp.observacion_compatibilidad && (
                          <span className="text-xs text-blue-700 font-medium mt-0.5">
                            {comp.observacion_compatibilidad}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Barra inferior fija con precio y botón WhatsApp */}
        <div className="border-t-2 border-gray-900 bg-white px-4 md:px-6 py-4 flex items-center justify-between gap-4 shrink-0">
          <div>
            <span className="text-[11px] text-gray-500 block font-bold uppercase tracking-wider">
              Precio de Venta
            </span>
            <span className="text-2xl md:text-3xl font-black text-gray-900">
              ${item.precio_venta_sugerido}
            </span>
          </div>

          <a
            href={buildWhatsAppUrl(item)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-gray-900 text-white border-2 border-transparent hover:border-gray-900 py-3 px-4 md:px-6 font-black uppercase tracking-wider text-xs md:text-sm inline-flex items-center justify-center gap-2 transition-all text-center"
          >
            <MessageCircle size={18} className="shrink-0" /> Contactar con el vendedor
          </a>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE CUSTOM SELECT (Dropdown Industrial) ---
function CustomSelect({ id, label, options, value, onChange, placeholder, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
      <label htmlFor={id} className="text-xs font-bold text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-white border-2 flex items-center justify-between px-4 py-3 text-sm font-bold w-full transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400' : 'cursor-pointer hover:border-gray-900 focus:outline-none focus:border-gray-900'}
          ${isOpen ? 'border-gray-900 shadow-[4px_4px_0px_rgba(17,24,39,1)]' : 'border-gray-300 text-gray-900'}
        `}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 text-gray-900 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <ul className="absolute z-50 w-full top-full mt-2 bg-white border-2 border-gray-900 shadow-[4px_4px_0px_rgba(17,24,39,1)] max-h-60 overflow-y-auto outline-none">
          <li
            onClick={() => { onChange(''); setIsOpen(false); }}
            className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-100 flex items-center justify-between ${!value ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 font-medium'}`}
          >
            {placeholder}
            {!value && <Check size={16} />}
          </li>
          
          {options.map((option) => (
            <li
              key={option}
              onClick={() => { onChange(option); setIsOpen(false); }}
              className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-100 flex items-center justify-between ${value === option ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-900 font-medium'}`}
            >
              {option}
              {value === option && <Check size={16} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function App() {
  const [piezas, setPiezas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Estados de paginación
  const [page, setPage] = useState(1);
  const [totalPiezas, setTotalPiezas] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedSubmarca, setSelectedSubmarca] = useState('');
  const [selectedAnio, setSelectedAnio] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');

  // Debounce del buscador de texto (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cargar catálogos base para filtros (vehículos y categorías)
  useEffect(() => {
    let cancelled = false;

    const safeFetch = async (url) => {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error HTTP ${res.status}`);
      return data;
    };

    Promise.all([
      safeFetch(`${API_URL}/api/catalogo/vehiculos`),
      safeFetch(`${API_URL}/api/catalogo/categorias`)
    ])
      .then(([vehiculosData, categoriasData]) => {
        if (cancelled) return;
        setVehiculos(Array.isArray(vehiculosData) ? vehiculosData : []);
        setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Error cargando filtros:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Cargar piezas paginadas y filtradas desde el servidor
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(ITEMS_PER_PAGE),
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedMarca) params.set('marca', selectedMarca);
    if (selectedSubmarca) params.set('submarca', selectedSubmarca);
    if (selectedAnio) params.set('anio', selectedAnio);
    if (selectedCategoria) params.set('categoria', selectedCategoria);

    fetch(`${API_URL}/api/catalogo/piezas?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Error HTTP ${res.status}`);
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setPiezas(Array.isArray(data.items) ? data.items : []);
        setTotalPiezas(typeof data.total === 'number' ? data.total : 0);
        setTotalPages(typeof data.totalPages === 'number' && data.totalPages > 0 ? data.totalPages : 1);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Error cargando datos:', err);
        setError(err.message || 'Error de conexión con el backend o la base de datos');
        setPiezas([]);
        setTotalPiezas(0);
        setTotalPages(1);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, selectedMarca, selectedSubmarca, selectedAnio, selectedCategoria, reloadKey]);

  // --- LÓGICA DE FILTROS EN CASCADA ---
  const marcas = Array.isArray(vehiculos) ? [...new Set(vehiculos.map(v => v.marca))] : [];
  const submarcas = Array.isArray(vehiculos) ? [...new Set(vehiculos.filter(v => v.marca === selectedMarca).map(v => v.submarca))] : [];
  const anios = Array.isArray(vehiculos) && selectedMarca && selectedSubmarca
    ? [...new Set(
        vehiculos
          .filter(v => v.marca === selectedMarca && v.submarca === selectedSubmarca)
          .flatMap(v => {
            const years = [];
            for (let y = v.anio_inicio; y <= v.anio_fin; y++) {
              years.push(y);
            }
            return years;
          })
      )]
        .sort((a, b) => b - a)
        .map(String)
    : [];

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Navegación (Header) */}
      <nav className="bg-white border-b-2 border-gray-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            
            {/* Logo */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img
                  src={logoGomher}
                  alt="Logo Autopartes Gomher"
                  className="h-10 w-auto object-contain"
                />
                <h1 className="text-2xl font-bold tracking-tight text-gray-800 uppercase">
                  Autopartes <span className="font-black text-blue-600 tracking-tighter">GOMHER</span>
                </h1>
              </div>
            </div>
            
            {/* Buscador de Texto */}
            <div className="flex items-center relative w-full md:w-96 group">
              <label htmlFor="buscador-global" className="sr-only">Buscar piezas en el catálogo</label>
              <input 
                id="buscador-global"
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar faro, facia, cofre..." 
                className="w-full bg-white border-2 border-gray-300 rounded-none py-2.5 pl-12 pr-4 text-sm font-bold text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-900 focus:ring-0 transition-colors"
              />
              <Search className="absolute left-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" size={18} />
            </div>

          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Título de Catálogo Premium */}
        <div className="mb-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-600/10 text-blue-600 p-2.5 rounded-xl">
                <Car size={24} />
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-blue-600 pb-1 leading-tight">
                Catálogo de Piezas
              </h2>
            </div>
            <p className="text-gray-500 font-medium max-w-xl md:pl-14">
              Explora nuestro inventario de autopartes de colisión. Originales y genéricas, garantizadas para tu vehículo.
            </p>
          </div>

          <div className="relative z-10 bg-gray-50 px-6 py-4 rounded-2xl border border-gray-200 flex flex-col items-center justify-center min-w-[120px]">
            <span className="text-4xl font-black text-blue-600 leading-none mb-1">{totalPiezas}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">En Stock</span>
          </div>
        </div>

        {/* PANEL DE FILTROS (Diseño mejorado UI/UX) */}
        <section aria-labelledby="filtros-heading" className="mb-10 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
            <h3 id="filtros-heading" className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Filter size={20} className="text-blue-600" aria-hidden="true" /> 
              Filtra tu Búsqueda
            </h3>
            
            {/* Botón para limpiar filtros */}
            {(selectedMarca || selectedSubmarca || selectedAnio || selectedCategoria || searchTerm) && (
              <button 
                onClick={() => {
                  setSelectedMarca('');
                  setSelectedSubmarca('');
                  setSelectedAnio('');
                  setSelectedCategoria('');
                  setSearchTerm('');
                  setPage(1);
                }}
                className="text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 outline-none"
                aria-label="Limpiar todos los filtros"
              >
                <FilterX size={16} /> Limpiar todo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Filtro Marca */}
            <CustomSelect 
              id="filtro-marca"
              label="1. Marca del Vehículo"
              options={marcas}
              value={selectedMarca}
              onChange={(val) => {
                setSelectedMarca(val);
                setSelectedSubmarca('');
                setSelectedAnio('');
                setPage(1);
              }}
              placeholder="Todas las Marcas"
            />
            
            {/* Filtro Submarca (Modelo) */}
            <CustomSelect 
              id="filtro-modelo"
              label="2. Modelo"
              options={submarcas}
              value={selectedSubmarca}
              onChange={(val) => {
                setSelectedSubmarca(val);
                setSelectedAnio('');
                setPage(1);
              }}
              placeholder={selectedMarca ? 'Todos los Modelos' : 'Selecciona marca primero'}
              disabled={!selectedMarca}
            />

            {/* Filtro Año */}
            <CustomSelect 
              id="filtro-anio"
              label="3. Año"
              options={anios}
              value={selectedAnio}
              onChange={(val) => {
                setSelectedAnio(val);
                setPage(1);
              }}
              placeholder={selectedSubmarca ? 'Todos los Años' : 'Selecciona modelo primero'}
              disabled={!selectedSubmarca}
            />

            {/* Filtro Categoría de Pieza */}
            <CustomSelect 
              id="filtro-categoria"
              label="4. Tipo de Pieza"
              options={categorias}
              value={selectedCategoria}
              onChange={(val) => {
                setSelectedCategoria(val);
                setPage(1);
              }}
              placeholder="Cualquier Pieza"
            />
            
          </div>
        </section>

        {/* LISTADO DE PIEZAS */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-500 p-8 text-center flex flex-col items-center">
            <AlertCircle size={48} className="text-red-500 mb-3" />
            <h3 className="text-xl font-bold text-red-900 mb-1">No se pudieron cargar los datos</h3>
            <p className="text-sm text-red-700 max-w-lg mb-4">{error}</p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 text-sm uppercase tracking-wider transition-colors"
            >
              <RefreshCw size={16} /> Reintentar
            </button>
          </div>
        ) : piezas.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center flex flex-col items-center">
            <Search size={48} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No se encontraron piezas</h3>
            <p className="text-gray-500">Intenta buscar con otros términos o limpia los filtros.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {piezas.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="gomher-card"
              >
                <div className="gomher-card-wrapper">
                  {/* Imagen */}
                  <div className="gomher-card-image">
                    {item.foto_url ? (
                      <img
                        src={item.foto_url}
                        alt={item.piezas?.descripcion_corta}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                        <Car size={48} className="mb-1 opacity-25" />
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Sin foto</span>
                      </div>
                    )}
                  </div>

                  {/* Contenido: título, categoría/condición y precio */}
                  <div className="gomher-card-content">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-0.5 truncate">
                        {item.piezas?.categoria} • {item.condicion}
                      </p>
                      <p className="gomher-card-title line-clamp-2">
                        {item.piezas?.descripcion_corta}
                      </p>
                    </div>
                    <p className="gomher-card-price">${item.precio_venta_sugerido}</p>
                  </div>

                  {/* Botón WhatsApp */}
                  <a
                    href={buildWhatsAppUrl(item)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="gomher-card-btn"
                    aria-label={`Contactar con el vendedor por ${item.piezas?.descripcion_corta}`}
                  >
                    <MessageCircle size={16} className="shrink-0" /> Contactar con el vendedor
                  </a>
                </div>

                {/* Etiqueta flotante */}
                <p className="gomher-card-tag">DISPONIBLE</p>
              </div>
            ))}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Paginación del catálogo" className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border-2 border-gray-900 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Página {page} de {totalPages} ({totalPiezas} piezas)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-gray-900 text-xs font-black uppercase tracking-wider bg-white text-gray-900 hover:bg-gray-900 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-gray-900 text-xs font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Siguiente <ChevronRight size={16} />
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </main>

      {selectedItem && (
        <PiezaDetalleModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

export default App;

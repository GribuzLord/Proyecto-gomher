import React, { useEffect, useState } from 'react';
import { Search, Wrench, ShoppingCart, Car, FilterX, Filter, ChevronDown, Check } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedSubmarca, setSelectedSubmarca] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');

  useEffect(() => {
    // Cargar piezas y vehículos al mismo tiempo
    Promise.all([
      fetch('http://localhost:3000/api/catalogo/piezas').then(res => res.json()),
      fetch('http://localhost:3000/api/catalogo/vehiculos').then(res => res.json())
    ])
    .then(([piezasData, vehiculosData]) => {
      setPiezas(piezasData);
      setVehiculos(vehiculosData);
      setLoading(false);
    })
    .catch(err => {
      console.error("Error cargando datos:", err);
      setLoading(false);
    });
  }, []);

  // --- LÓGICA DE FILTROS EN CASCADA ---
  
  // 1. Extraer listas únicas para llenar los 'selects'
  const marcas = [...new Set(vehiculos.map(v => v.marca))];
  const submarcas = [...new Set(vehiculos.filter(v => v.marca === selectedMarca).map(v => v.submarca))];
  const categorias = [...new Set(piezas.map(p => p.piezas?.categoria).filter(Boolean))];

  // 2. Filtrar las piezas a mostrar basado en los estados seleccionados
  const filteredPiezas = piezas.filter(item => {
    // Filtro por Búsqueda de texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchDesc = item.piezas?.descripcion_corta?.toLowerCase().includes(term);
      const matchCat = item.piezas?.categoria?.toLowerCase().includes(term);
      const matchSKU = item.sku_interno?.toLowerCase().includes(term);
      if (!matchDesc && !matchCat && !matchSKU) return false;
    }

    // Filtro por Categoría
    if (selectedCategoria && item.piezas?.categoria !== selectedCategoria) {
      return false;
    }

    // Filtro por Marca y Submarca (revisando compatibilidades)
    if (selectedMarca || selectedSubmarca) {
      const compatibilidades = item.piezas?.compatibilidades || [];
      const esCompatible = compatibilidades.some(comp => {
        const v = comp.vehiculos;
        if (!v) return false;
        
        const coincideMarca = selectedMarca ? v.marca === selectedMarca : true;
        const coincideSubmarca = selectedSubmarca ? v.submarca === selectedSubmarca : true;
        
        return coincideMarca && coincideSubmarca;
      });
      
      if (!esCompatible) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Navegación (Header) */}
      <nav className="bg-white border-b-2 border-gray-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            
            {/* Logo */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 text-white p-2 border-2 border-gray-900 shadow-[4px_4px_0px_rgba(17,24,39,1)]">
                  <Wrench size={22} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-800 uppercase ml-2">
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
            <span className="text-4xl font-black text-blue-600 leading-none mb-1">{piezas.length}</span>
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
            {(selectedMarca || selectedCategoria || searchTerm) && (
              <button 
                onClick={() => {
                  setSelectedMarca('');
                  setSelectedSubmarca('');
                  setSelectedCategoria('');
                  setSearchTerm('');
                }}
                className="text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 outline-none"
                aria-label="Limpiar todos los filtros"
              >
                <FilterX size={16} /> Limpiar todo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Filtro Marca */}
            <CustomSelect 
              id="filtro-marca"
              label="1. Marca del Vehículo"
              options={marcas}
              value={selectedMarca}
              onChange={(val) => {
                setSelectedMarca(val);
                setSelectedSubmarca('');
              }}
              placeholder="Todas las Marcas"
            />
            
            {/* Filtro Submarca (Modelo) */}
            <CustomSelect 
              id="filtro-modelo"
              label="2. Modelo"
              options={submarcas}
              value={selectedSubmarca}
              onChange={setSelectedSubmarca}
              placeholder={selectedMarca ? 'Todos los Modelos' : 'Selecciona marca primero'}
              disabled={!selectedMarca}
            />

            {/* Filtro Categoría de Pieza */}
            <CustomSelect 
              id="filtro-categoria"
              label="3. Tipo de Pieza"
              options={categorias}
              value={selectedCategoria}
              onChange={setSelectedCategoria}
              placeholder="Cualquier Pieza"
            />
            
          </div>
        </section>

        {/* LISTADO DE PIEZAS (Usamos filteredPiezas en lugar de piezas) */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPiezas.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center flex flex-col items-center">
            <Search size={48} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No se encontraron piezas</h3>
            <p className="text-gray-500">Intenta buscar con otros términos o limpia los filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPiezas.map((item) => (
              <div key={item.id} className="bg-white border-2 border-gray-200 hover:border-gray-900 transition-colors duration-200 flex flex-col group rounded-none">
                
                {/* Imagen */}
                <div className="h-56 bg-gray-50 relative overflow-hidden border-b-2 border-gray-100 group-hover:border-gray-900 transition-colors">
                  {item.foto_url ? (
                    <img src={item.foto_url} alt={item.piezas?.descripcion_corta} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                      <Car size={48} className="mb-2 opacity-20" />
                      <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Sin foto</span>
                    </div>
                  )}
                  {/* Etiqueta de Disponible */}
                  <div className="absolute top-3 right-3 bg-white text-gray-900 text-[10px] uppercase font-black px-2 py-1 border-2 border-gray-900">
                    DISPONIBLE
                  </div>
                </div>

                {/* Detalles de la pieza */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs text-blue-600 font-black uppercase tracking-widest">
                      {item.piezas?.categoria}
                    </div>
                    {/* Condición discreta */}
                    <div className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 font-bold uppercase tracking-wider">
                      {item.condicion}
                    </div>
                  </div>
                  
                  <h3 className="font-black text-lg leading-tight mb-2 text-gray-900 uppercase">
                    {item.piezas?.descripcion_corta}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-6 line-clamp-2 flex-1 font-medium">
                    {item.detalle_observacion}
                  </p>

                  <div className="mt-auto">
                    <div className="mb-4">
                      <span className="text-xs text-gray-500 block mb-1 font-bold uppercase tracking-wider">Precio de Venta</span>
                      <span className="text-3xl font-black text-gray-900">
                        ${item.precio_venta_sugerido}
                      </span>
                    </div>
                    <button 
                      className="w-full bg-blue-600 hover:bg-gray-900 text-white border-2 border-transparent hover:border-gray-900 py-3 px-4 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all"
                      aria-label={`Comprar ${item.piezas?.descripcion_corta}`}
                    >
                      <ShoppingCart size={18} /> Lo quiero
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

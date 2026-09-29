import React, { useEffect, useState } from 'react';
import { Search, Wrench, ShoppingCart, Car, FilterX, Filter } from 'lucide-react';

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
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            
            {/* Logo */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-600/30">
                  <Wrench size={22} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-800 uppercase">
                  Autopartes <span className="font-black text-blue-600 tracking-tighter">GOMHER</span>
                </h1>
              </div>
            </div>
            
            {/* Buscador de Texto (Visible en móvil también) */}
            <div className="flex items-center relative w-full md:w-96 group">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar faro, facia, cofre..." 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 focus:bg-white transition-all shadow-inner"
              />
              <Search className="absolute left-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
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
            <div className="flex flex-col gap-2">
              <label htmlFor="filtro-marca" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                1. Marca del Vehículo
              </label>
              <select 
                id="filtro-marca"
                value={selectedMarca}
                onChange={(e) => {
                  setSelectedMarca(e.target.value);
                  setSelectedSubmarca(''); // Reiniciar submarca cuando cambia la marca
                }}
                className="bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none w-full appearance-none cursor-pointer transition-colors shadow-inner"
              >
                <option value="">Todas las Marcas</option>
                {marcas.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            
            {/* Filtro Submarca (Modelo) */}
            <div className="flex flex-col gap-2">
              <label htmlFor="filtro-modelo" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                2. Modelo
              </label>
              <select 
                id="filtro-modelo"
                value={selectedSubmarca}
                onChange={(e) => setSelectedSubmarca(e.target.value)}
                disabled={!selectedMarca}
                className="bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none w-full appearance-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 cursor-pointer transition-colors shadow-inner"
              >
                <option value="">{selectedMarca ? 'Todos los Modelos' : 'Selecciona marca primero'}</option>
                {submarcas.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Filtro Categoría de Pieza */}
            <div className="flex flex-col gap-2">
              <label htmlFor="filtro-categoria" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                3. Tipo de Pieza
              </label>
              <select 
                id="filtro-categoria"
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
                className="bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none w-full appearance-none cursor-pointer transition-colors shadow-inner"
              >
                <option value="">Cualquier Pieza</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPiezas.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-600/30 transition-all duration-300 overflow-hidden flex flex-col group">
                
                {/* Imagen */}
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  {item.foto_url ? (
                    <img src={item.foto_url} alt={item.piezas?.descripcion_corta} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <ShoppingCart size={40} className="mb-2 opacity-50" />
                      <span className="text-sm">Sin foto</span>
                    </div>
                  )}
                  {/* Etiqueta de Disponible */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-900 text-[10px] uppercase font-bold px-2 py-1 rounded shadow-sm border border-gray-200">
                    Disponible
                  </div>
                </div>

                {/* Detalles de la pieza */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                      {item.piezas?.categoria}
                    </div>
                    {/* Condición discreta */}
                    <div className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 uppercase tracking-wider">
                      {item.condicion}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg leading-tight mb-2 text-gray-900">
                    {item.piezas?.descripcion_corta}
                  </h3>
                  
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">
                    {item.detalle_observacion}
                  </p>

                  <div className="border-t border-gray-100 pt-4 mt-auto flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Precio sugerido</span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${item.precio_venta_sugerido}
                      </span>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-md hover:shadow-lg hover:shadow-blue-600/30 transition-all">
                      <ShoppingCart size={20} />
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

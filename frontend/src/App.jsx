import React, { useEffect, useState } from 'react';
import { Search, Wrench, ShoppingCart, Car } from 'lucide-react';

function App() {
  const [piezas, setPiezas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Llamada al backend que hicimos en Node.js
    fetch('http://localhost:3000/api/catalogo/piezas')
      .then(res => res.json())
      .then(data => {
        setPiezas(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando piezas:", err);
        setLoading(false);
      });
  }, []);

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
            
            {/* Buscador (Visible en móvil también) */}
            <div className="flex items-center relative w-full md:w-96 group">
              <input 
                type="text" 
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
        <div className="mb-10 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Elemento decorativo de fondo */}
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

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {piezas.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-600/30 transition-all duration-300 overflow-hidden flex flex-col group">
                
                {/* Imagen (Placeholder si no hay foto) */}
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  {item.foto_url ? (
                    <img src={item.foto_url} alt={item.piezas?.descripcion_corta} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <ShoppingCart size={40} className="mb-2 opacity-50" />
                      <span className="text-sm">Sin foto</span>
                    </div>
                  )}
                  {/* Etiqueta de "Disponible" muy discreta */}
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
                    {/* Condición mostrada como un dato técnico más, súper discreto */}
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

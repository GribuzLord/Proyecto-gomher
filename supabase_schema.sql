-- ESQUEMA DE BASE DE DATOS: GESTIÓN DE AUTOPARTES DE COLISIÓN Y CATÁLOGO PÚBLICO

-- 1. Catálogo Base de Vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
  id SERIAL PRIMARY KEY,
  marca VARCHAR(50) NOT NULL,
  submarca VARCHAR(50) NOT NULL,
  generacion VARCHAR(60),
  anio_inicio INT NOT NULL,
  anio_fin INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehiculos_busqueda ON vehiculos(marca, submarca, anio_inicio, anio_fin);

-- 2. Catálogo Técnico de Piezas con Soporte Extensible de Variantes
CREATE TABLE IF NOT EXISTS piezas (
  id SERIAL PRIMARY KEY,
  categoria VARCHAR(50) NOT NULL, -- Faro, Calavera, Facia Delantera, Cofre, etc.
  lado VARCHAR(20) DEFAULT 'N/A', -- Izquierdo (Piloto), Derecho (Copiloto), Bilateral, N/A
  posicion VARCHAR(20) DEFAULT 'N/A', -- Delantera, Trasera, Central, N/A
  tipo_tecnologia VARCHAR(60), -- Halógeno, Lupa/Proyector, Full LED, Eléctrico, Manual
  acabado_color VARCHAR(60), -- Fondo Negro, Cromado, Mica Roja, Ahumada, Primer/Para Pintar
  variante_equipamiento VARCHAR(120), -- Con hoyo para niebla, Con perforación para sensor, Con direccional
  tipo_repuesto VARCHAR(40) DEFAULT 'Original Usado', -- Original Usado, Original Nuevo, Genérico Taiwán
  descripcion_corta VARCHAR(255) NOT NULL, -- Resumen para visualización rápida en UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_piezas_categoria ON piezas(categoria, lado, posicion);

-- 3. Tabla Pivote de Compatibilidad (Muchos a Muchos: Piezas <-> Vehículos)
CREATE TABLE IF NOT EXISTS compatibilidades (
  id SERIAL PRIMARY KEY,
  pieza_id INT NOT NULL REFERENCES piezas(id) ON DELETE CASCADE,
  vehiculo_id INT NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
  observacion_compatibilidad VARCHAR(150), -- Ej: "Aplica únicamente para versiones EX Pack y SX"
  CONSTRAINT uq_pieza_vehiculo UNIQUE (pieza_id, vehiculo_id)
);

CREATE INDEX idx_compatibilidades_vehiculo ON compatibilidades(vehiculo_id);
CREATE INDEX idx_compatibilidades_pieza ON compatibilidades(pieza_id);

-- 4. Inventario Físico Tangible (Ítems en Almacén/Bodega)
CREATE TABLE IF NOT EXISTS inventario_items (
  id SERIAL PRIMARY KEY,
  pieza_id INT NOT NULL REFERENCES piezas(id),
  sku_interno VARCHAR(50) UNIQUE NOT NULL, -- Código de control interno o etiqueta física
  condicion VARCHAR(40) NOT NULL, -- 'Excelente', 'Seminueva', 'Detalle estético', 'Pata reparada'
  detalle_observacion TEXT, -- Ej: "Mica pulida, patita inferior reparada con grapa plástica"
  costo_adquisicion NUMERIC(10, 2) NOT NULL,
  precio_venta_sugerido NUMERIC(10, 2) NOT NULL,
  precio_minimo_regateo NUMERIC(10, 2), -- Límite mínimo para el empleado en mostrador
  ubicacion_estante VARCHAR(60), -- Ej: "Pasillo B - Rack Faros 3"
  foto_url TEXT, -- Imagen principal en Supabase Storage
  estatus VARCHAR(20) DEFAULT 'Disponible', -- 'Disponible', 'Apartado', 'Vendido', 'Baja'
  fecha_ingreso TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventario_estatus ON inventario_items(estatus);
CREATE INDEX idx_inventario_pieza ON inventario_items(pieza_id);

-- 5. Registro de Transacciones / Ventas en Mostrador
CREATE TABLE IF NOT EXISTS ventas (
  id SERIAL PRIMARY KEY,
  item_id INT NOT NULL REFERENCES inventario_items(id),
  precio_final_venta NUMERIC(10, 2) NOT NULL,
  metodo_pago VARCHAR(30) DEFAULT 'Efectivo', -- Efectivo, Transferencia, Tarjeta
  cliente_nombre VARCHAR(100),
  notas VARCHAR(255),
  fecha_venta TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DATOS SEMILLA INICIALES

INSERT INTO vehiculos (marca, submarca, generacion, anio_inicio, anio_fin) VALUES
('Kia', 'Seltos', '1ra Generación', 2020, 2023),
('Nissan', 'Versa', 'Línea V-Drive / 1ra Gen Facelift', 2015, 2019),
('Nissan', 'Versa', '2da Generación', 2020, 2025),
('Volkswagen', 'Vento', 'Línea Estándar', 2014, 2022),
('Chevrolet', 'Aveo', 'Nueva Línea', 2018, 2023);

INSERT INTO piezas (categoria, lado, posicion, tipo_tecnologia, acabado_color, variante_equipamiento, tipo_repuesto, descripcion_corta) VALUES
('Faro', 'Derecho', 'Delantera', 'Halógeno convencional', 'Cromado', 'Sin tira LED', 'Original Usado', 'Faro Der. Seltos 20-23 Halógeno Básico'),
('Faro', 'Derecho', 'Delantera', 'Lupa/Proyector', 'Cromado con ceja LED', 'Con luz diurna DRL', 'Original Usado', 'Faro Der. Seltos 20-23 Con Lupa y DRL'),
('Faro', 'Derecho', 'Delantera', 'Full LED', 'Fondo Ahumado/Negro', 'Firma lumínica GT-Line', 'Original Usado', 'Faro Der. Seltos 20-23 Full LED GT-Line'),
('Calavera', 'Izquierda', 'Trasera', 'Foco convencional', 'Roja estándar', 'Versión Sense/Advance', 'Original Usado', 'Calavera Izq. Versa 20-25 Foco Normal'),
('Calavera', 'Izquierda', 'Trasera', 'Tira LED parcial', 'Mica bitono/ahumada', 'Versión Exclusive/Platinum', 'Original Usado', 'Calavera Izq. Versa 20-25 Con Tira LED'),
('Facia', 'Bilateral', 'Delantera', 'N/A', 'Para Pintar', 'Con hoyo de faros de niebla', 'Genérico Taiwán', 'Facia Del. Vento 14-22 C/Niebla Taiwán');

INSERT INTO compatibilidades (pieza_id, vehiculo_id, observacion_compatibilidad) VALUES
(1, 1, 'Versiones de entrada (Emotion)'),
(2, 1, 'Versiones intermedias (EX, EX Pack)'),
(3, 1, 'Versiones tope (GT-Line / SX)'),
(4, 3, 'Versiones Sense y Advance'),
(5, 3, 'Versiones Exclusive y Platinum'),
(6, 4, 'Compatible con toda la línea con faro de niebla');

INSERT INTO inventario_items (pieza_id, sku_interno, condicion, detalle_observacion, costo_adquisicion, precio_venta_sugerido, precio_minimo_regateo, ubicacion_estante, estatus) VALUES
(2, 'FAR-KIA-SEL-001', 'Seminueva', 'Original, patitas intactas, mica sin rayones profundos', 1800.00, 3800.00, 3300.00, 'Rack-F-12', 'Disponible'),
(3, 'FAR-KIA-SEL-002', 'Detalle estético', 'Original LED, patita inferior reparada sólidamente, LED 100% probado', 2400.00, 5200.00, 4600.00, 'Rack-F-13', 'Disponible'),
(5, 'CAL-NIS-VER-001', 'Excelente', 'Original impecable, arnés completo', 900.00, 2100.00, 1800.00, 'Rack-C-04', 'Disponible');

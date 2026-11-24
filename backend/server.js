require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de Supabase
const rawUrl = process.env.SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middlewares
app.use(cors());
app.use(express.json());

// --- ENDPOINTS PÚBLICOS (Catálogo) ---
app.get('/api/catalogo/piezas', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 24));
        const search = (req.query.search || '').trim();
        const marca = (req.query.marca || '').trim();
        const submarca = (req.query.submarca || '').trim();
        const anio = parseInt(req.query.anio, 10) || null;
        const categoria = (req.query.categoria || '').trim();

        let compatiblePiezaIds = null;

        // 1. Filtrado por vehículo (marca, submarca, año)
        if (marca || submarca || anio) {
            let vehiculosQuery = supabase.from('vehiculos').select('id');
            if (marca) vehiculosQuery = vehiculosQuery.eq('marca', marca);
            if (submarca) vehiculosQuery = vehiculosQuery.eq('submarca', submarca);
            if (anio) {
                vehiculosQuery = vehiculosQuery.lte('anio_inicio', anio).gte('anio_fin', anio);
            }

            const { data: vehiculosMatch, error: vError } = await vehiculosQuery;
            if (vError) throw vError;

            const vehiculoIds = (vehiculosMatch || []).map((v) => v.id);
            if (vehiculoIds.length === 0) {
                return res.json({ items: [], total: 0, page, limit, totalPages: 0 });
            }

            const { data: compMatch, error: cError } = await supabase
                .from('compatibilidades')
                .select('pieza_id')
                .in('vehiculo_id', vehiculoIds);
            if (cError) throw cError;

            compatiblePiezaIds = [...new Set((compMatch || []).map((c) => c.pieza_id))];
            if (compatiblePiezaIds.length === 0) {
                return res.json({ items: [], total: 0, page, limit, totalPages: 0 });
            }
        }

        // 2. Filtrado por búsqueda de texto en catálogo de piezas (descripción o categoría)
        let searchPiezaIds = [];
        if (search) {
            const safeSearch = search.replace(/[%_(),]/g, '');
            if (safeSearch) {
                const { data: piezasMatch, error: pError } = await supabase
                    .from('piezas')
                    .select('id')
                    .or(`descripcion_corta.ilike.%${safeSearch}%,categoria.ilike.%${safeSearch}%`);
                if (pError) throw pError;
                searchPiezaIds = (piezasMatch || []).map((p) => p.id);
            }
        }

        // 3. Consulta paginada de inventario público (sin exponer costos ni precio mínimo de regateo)
        const piezasJoin = categoria ? 'piezas!inner' : 'piezas';
        let query = supabase
            .from('inventario_items')
            .select(`
                id,
                pieza_id,
                sku_interno,
                condicion,
                detalle_observacion,
                precio_venta_sugerido,
                foto_url,
                estatus,
                fecha_ingreso,
                ${piezasJoin} (*, compatibilidades (id, observacion_compatibilidad, vehiculos (*)))
            `, { count: 'exact' })
            .eq('estatus', 'Disponible');

        if (categoria) {
            query = query.eq('piezas.categoria', categoria);
        }

        if (compatiblePiezaIds !== null) {
            query = query.in('pieza_id', compatiblePiezaIds);
        }

        if (search) {
            const safeSearch = search.replace(/[%_(),]/g, '');
            if (safeSearch) {
                if (searchPiezaIds.length > 0) {
                    query = query.or(`sku_interno.ilike.%${safeSearch}%,pieza_id.in.(${searchPiezaIds.join(',')})`);
                } else {
                    query = query.ilike('sku_interno', `%${safeSearch}%`);
                }
            }
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, count, error } = await query
            .order('fecha_ingreso', { ascending: false })
            .range(from, to);

        if (error) throw error;

        const total = count || 0;
        res.json({
            items: data || [],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint ligero de categorías disponibles para el filtro
app.get('/api/catalogo/categorias', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('piezas')
            .select('categoria')
            .order('categoria', { ascending: true });

        if (error) throw error;
        const categorias = [...new Set((data || []).map((p) => p.categoria).filter(Boolean))];
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para filtros en cascada (Marcas, Submarcas, Años)
app.get('/api/catalogo/vehiculos', async (req, res) => {
    try {
        // Obtenemos todos los vehículos para que el frontend arme los filtros
        const { data, error } = await supabase
            .from('vehiculos')
            .select('*')
            .order('marca', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ENDPOINTS PRIVADOS (Admin) ---
// TODO: Agregar autenticación con JWT (tokens) en el futuro

// 1. LEER (GET): Obtener todo el inventario (incluyendo costos y estatus)
app.get('/api/admin/inventario', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inventario_items')
            .select('*, piezas (categoria, descripcion_corta)')
            .order('fecha_ingreso', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. ESCRIBIR (POST): Dar de alta una nueva pieza en inventario
app.post('/api/admin/inventario', async (req, res) => {
    try {
        const nuevoItem = req.body; 
        // req.body contiene los datos que enviamos (pieza_id, sku_interno, costo, etc.)

        const { data, error } = await supabase
            .from('inventario_items')
            .insert([nuevoItem])
            .select(); // Le pedimos que nos devuelva el registro creado

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. ACTUALIZAR (PUT): Cambiar estatus a 'Vendido', cambiar precio, etc.
app.put('/api/admin/inventario/:id', async (req, res) => {
    try {
        const { id } = req.params; // Sacamos el ID de la URL
        const datosAActualizar = req.body;

        const { data, error } = await supabase
            .from('inventario_items')
            .update(datosAActualizar)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. BORRAR (DELETE): Eliminar un registro (ej. si fue un error de captura)
app.delete('/api/admin/inventario/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('inventario_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Registro eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Inicializar servidor
app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
});

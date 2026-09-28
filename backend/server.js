require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middlewares
app.use(cors());
app.use(express.json());

// --- ENDPOINTS PÚBLICOS (Catálogo) ---
app.get('/api/catalogo/piezas', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inventario_items')
            .select(`
                *,
                piezas (*, compatibilidades (vehiculos (*)))
            `)
            .eq('estatus', 'Disponible');

        if (error) throw error;
        res.json(data);
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

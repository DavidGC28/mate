// ==========================================
// 1. BASE DE DATOS Y ESTADO DE LA APP
// ==========================================
const menu = [
    { id: 1, nombre: "Hamburguesa Clásica", precio: 5.50, categoria: "comida", disponible: true },
    { id: 2, nombre: "Papas Fritas", precio: 2.50, categoria: "comida", disponible: true },
    { id: 3, nombre: "Alitas BBQ (x6)", precio: 6.00, categoria: "comida", disponible: true },
    { id: 4, nombre: "GASEOSA", precio: 1.50, categoria: "bebida", disponible: true },
    { id: 5, nombre: "Agua Mineral", precio: 1.00, categoria: "bebida", disponible: true },
    { id: 6, nombre: "Jugo Natural", precio: 2.00, categoria: "bebida", disponible: true },
    { id: 7, nombre: "Ensalada César", precio: 4.50, categoria: "comida", disponible: true },
    { id: 8, nombre: "Pizza Pepperoni", precio: 8.00, categoria: "comida", disponible: true },
    { id: 9, nombre: "Limonada", precio: 1.75, categoria: "bebida", disponible: true },
    { id: 10, nombre: "Café Americano", precio: 1.25, categoria: "bebida", disponible: true }
];

// Captura del nuevo formulario (añadir al inicio junto a tus otros document.getElementById)
const formNuevoProducto = document.getElementById('form-nuevo-producto');

let carrito = [];
let historialVentas = []; 
let porcentajeIva = 0.15; 
let categoriaActual = "todos";

// Elementos capturados del DOM
const contenedorMenu = document.getElementById('contenedor-menu');
const tablaCarrito = document.getElementById('tablaCarrito');
const tablaHistorial = document.getElementById('tablaHistorial');
const txtSubtotal = document.getElementById('subtotal');
const txtIva = document.getElementById('iva');
const txtTotal = document.getElementById('total');
const labelIva = document.getElementById('labelIva');

// ==========================================
// 2. SISTEMA DE NAVEGACIÓN INTERNA (SPA)
// ==========================================
function mostrarSeccion(idSeccion, boton) {
    // Busca todas las secciones y les quita la clase 'activa'
    const secciones = document.querySelectorAll('section');
    const botonesNavegacion = document.querySelectorAll('button.btn-nav');
    secciones.forEach(sec => sec.classList.remove('activa'));
    botonesNavegacion.forEach(sec => sec.classList.remove('activo'));

    // Agrega la clase activa únicamente a la sección seleccionada
    document.getElementById(idSeccion).classList.add('activa');
    document.getElementById(boton.id).classList.add('activo');
}

// ==========================================
// 3. SECCIÓN: CONFIGURACIÓN (PARAMETROS)
// ==========================================
function guardarIva() {
    const inputIva = document.getElementById('tasaIva').value;
    if(inputIva === "" || inputIva < 0) {
        alert("Por favor introduce una tasa válida.");
        return;
    }
    
    // Convertimos el porcentaje (Ej: 15) en factor matemático (0.15)
    porcentajeIva = parseFloat(inputIva) / 100;
    
    // Actualizamos las etiquetas de la interfaz
    labelIva.innerText = `IVA (${inputIva}%):`;
    
    const mensaje = document.getElementById('mensajeIva');
    mensaje.innerText = `¡Tasa de IVA actualizada con éxito a ${inputIva}%!`;
    
    // Limpiar mensaje tras 3 segundos
    setTimeout(() => { mensaje.innerText = ""; }, 3000);
    
    actualizarInterfaz();
}

// Listener para procesar el formulario de nuevos platos
if (formNuevoProducto) {
    formNuevoProducto.addEventListener('submit', function(e) {
        e.preventDefault(); // Evita que la página se recargue

        const nombreInput = document.getElementById('nuevo-nombre');
        const precioInput = document.getElementById('nuevo-precio');
        const categoriaSelect = document.getElementById('nueva-categoria');

        const nuevoPlato = {
            id: Date.now(), // ID único basado en milisegundos
            nombre: nombreInput.value,
            precio: parseFloat(precioInput.value),
            categoria: categoriaSelect.value,
            disponible: true // Activo por defecto
        };

        menu.push(nuevoPlato);
        cargarMenu(); // Refresca la interfaz del menú

        // Limpia los campos del formulario
        nombreInput.value = '';
        precioInput.value = '';
    });
}

// ==========================================
// 4. SECCIÓN: MENÚ Y FILTRADO
// ==========================================
function cargarMenu() {
    contenedorMenu.innerHTML = '';

    const menuFiltrado = menu.filter(plato => 
        categoriaActual === "todos" || plato.categoria === categoriaActual
    );

    menuFiltrado.forEach(plato => {
        const item = document.createElement('div');
        // Si el plato no está disponible, se le añade la clase 'desactivado'
        item.className = `item-menu ${plato.disponible ? '' : 'desactivado'}`;
        
        item.innerHTML = `
            <div>
                <strong>${plato.nombre}</strong><br>
                <span style="color: #666;">$${plato.precio.toFixed(2)}</span>
            </div>
        `;

        const accionesDiv = document.createElement('div');
        accionesDiv.style.display = 'flex';
        accionesDiv.style.gap = '8px';

        // Botón de Agregar / Comanda
        const botonAgregar = document.createElement('button');
        botonAgregar.className = 'btn btn-primario';
        botonAgregar.textContent = plato.disponible ? 'Agregar' : 'Agotado';
        // Deshabilitar visualmente si está bloqueado
        if (!plato.disponible) {
            botonAgregar.style.backgroundColor = '#868e96';
            botonAgregar.style.cursor = 'not-allowed';
        }
        botonAgregar.addEventListener('click', () => agregarAlCarrito(plato.id));
        
        // Botón para Bloquear / Activar
        const botonToggle = document.createElement('button');
        botonToggle.className = 'btn';
        botonToggle.style.backgroundColor = plato.disponible ? '#fab005' : '#12b886';
        botonToggle.style.color = plato.disponible ? '#212529' : 'white';
        botonToggle.textContent = plato.disponible ? 'Bloquear' : 'Activar';
        botonToggle.addEventListener('click', () => toggleDisponibilidad(plato.id));

        accionesDiv.appendChild(botonAgregar);
        accionesDiv.appendChild(botonToggle);
        
        item.appendChild(accionesDiv);
        contenedorMenu.appendChild(item);
    });
}

// Función nueva para cambiar el estado del producto
function toggleDisponibilidad(id) {
    const plato = menu.find(p => p.id === id);
    if (plato) {
        plato.disponible = !plato.disponible;
        cargarMenu(); // Redibuja el menú al instante
    }
}

function filtrarCategoria(categoria, botonPresionado) {
    // Mover la clase activa en los botones estéticos de categorías
    document.querySelector('.tab-btn.active').classList.remove('active');
    botonPresionado.classList.add('active');
    
    categoriaActual = categoria;
    cargarMenu();
}

// ==========================================
// 5. SECCIÓN: PEDIDO (CAJA) Y OPERACIONES
// ==========================================
function agregarAlCarrito(id) {
    const productoMenu = menu.find(p => p.id === id);
    const productoEnCarrito = carrito.find(p => p.producto.id === id);

    if (productoEnCarrito) {
        productoEnCarrito.cantidad++;
    } else {
        carrito.push({ producto: productoMenu, cantidad: 1 });
    }
    actualizarInterfaz();
}

function cambiarCantidad(id, cambio) {
    const productoEnCarrito = carrito.find(p => p.producto.id === id);
    if (productoEnCarrito) {
        productoEnCarrito.cantidad += cambio;
        if (productoEnCarrito.cantidad <= 0) {
            eliminarDelCarrito(id);
            return;
        }
    }
    actualizarInterfaz();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(p => p.productop.id !== id);
    actualizarInterfaz();
}

function actualizarInterfaz() {
    tablaCarrito.innerHTML = '';

    if (carrito.length === 0) {
        tablaCarrito.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999;">Ningún producto en comandas.</td></tr>';
    }

    let subtotal = 0;

    carrito.forEach(itemCarrito => {
        const item = itemCarrito.producto;
        const totalItem = item.precio * itemCarrito.cantidad;
        subtotal += totalItem;

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${item.nombre}</strong></td>
            <td>
                <div class="cart-controls">
                    <button class="btn btn-qty" id="btn-menos-${item.id}">-</button>
                    <span>${itemCarrito.cantidad}</span>
                    <button class="btn btn-qty" id="btn-mas-${item.id}">+</button>
                </div>
            </td>
            <td>$${item.precio.toFixed(2)}</td>
            <td>$${totalItem.toFixed(2)}</td>
            <td><button class="btn btn-delete" id="btn-del-${item.id}">X</button></td>
        `;
        tablaCarrito.appendChild(fila);

        // Activadores dinámicos de eventos
        document.getElementById(`btn-menos-${item.id}`).addEventListener('click', () => cambiarCantidad(item.id, -1));
        document.getElementById(`btn-mas-${item.id}`).addEventListener('click', () => cambiarCantidad(item.id, 1));
        document.getElementById(`btn-del-${item.id}`).addEventListener('click', () => eliminarDelCarrito(item.id));
    });

    // Cálculos dependientes del parámetro configurable
    const totalIva = subtotal * porcentajeIva;
    const totalFinal = subtotal + totalIva;

    txtSubtotal.innerText = `$${subtotal.toFixed(2)}`;
    txtIva.innerText = `$${totalIva.toFixed(2)}`;
    txtTotal.innerText = `$${totalFinal.toFixed(2)}`;
}

// ===========================
// 6. SECCIÓN: PROCESAR PAGO 
// ===========================
function procesarPago() {
    if (carrito.length === 0) {
        alert("Caja vacía. Agregue platos al pedido antes de facturar.");
        return;
    }

    const nuevaFactura = {
        numero: historialVentas.length + 1,
        subtotal: 0,
        iva: 0,
        total: 0,
        pedido: carrito
    };

    // Cálculos numéricos para la transacción histórica
    let subtotal =  nuevaFactura.pedido.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
    let totalIva = subtotal * porcentajeIva;
    let totalFinal = subtotal + totalIva;

    // Guardar el ticket u objeto factura en el historial (Arreglo global)
    nuevaFactura.subtotal = subtotal.toFixed(2);
    nuevaFactura.iva = totalIva.toFixed(2);
    nuevaFactura.total = totalFinal.toFixed(2);

    historialVentas.push(nuevaFactura);

    alert(`🎉 Venta #${nuevaFactura.numero} completada con éxito. ${nuevaFactura.pedido.map(item => `${item.producto.nombre} x${item.cantidad}`).join(', ')}` );
    
    // Resetear Caja y refrescar interfaces
    carrito = [];
    actualizarInterfaz();
    pintarHistorial();
}

function pintarHistorial() {
    tablaHistorial.innerHTML = '';

    if (historialVentas.length === 0) {
        tablaHistorial.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999;">No hay registros de facturas el día de hoy.</td></tr>';
        return;
    }

    historialVentas.forEach(factura => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>#000${factura.numero}</td>
            <td>$${factura.subtotal}</td>
            <td>$${factura.iva}</td>
            <td style="color:#2b8a3e; font-weight:bold;">$${factura.total}</td>
        `;
        tablaHistorial.appendChild(fila);
    });
}

// ==========================================
// 7. INICIALIZACIÓN COMPLETA
// ==========================================
cargarMenu();
actualizarInterfaz();
pintarHistorial();
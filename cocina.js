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

// Captura de formularios
const formNuevoProducto = document.getElementById('form-nuevo-producto');
const formNuevoCliente = document.getElementById('form-nuevo-cliente');

let carrito = [];
let historialVentas = []; 
let clientes = []; // Base de datos de clientes
let clienteActivo = null; // Cliente asignado al pedido actual

let porcentajeIva = 0.12; 
let categoriaActual = "todos";

// Elementos capturados del DOM
const contenedorMenu = document.getElementById('contenedor-menu');
const tablaCarrito = document.getElementById('tablaCarrito');
const tablaHistorial = document.getElementById('tablaHistorial');
const txtSubtotal = document.getElementById('subtotal');
const txtIva = document.getElementById('iva');
const txtTotal = document.getElementById('total');
const labelIva = document.getElementById('labelIva');
const selectClientePedido = document.getElementById('select-cliente-pedido'); // NUEVO

// ==========================================
// 2. SISTEMA DE NAVEGACIÓN INTERNA (SPA)
// ==========================================
function mostrarSeccion(idSeccion) {
    const secciones = document.querySelectorAll('section');
    secciones.forEach(sec => sec.classList.remove('activa'));

    const botones = document.querySelectorAll('.btn-nav');
    botones.forEach(btn => btn.classList.remove('activo'));

    document.getElementById(idSeccion).classList.add('activa');
    
    const botonActivo = document.getElementById(`btn-nav-${idSeccion}`);
    if (botonActivo) botonActivo.classList.add('activo');
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
    
    porcentajeIva = parseFloat(inputIva) / 100;
    labelIva.innerText = `IVA (${inputIva}%):`;
    
    const mensaje = document.getElementById('mensajeIva');
    mensaje.innerText = `¡Tasa de IVA actualizada con éxito a ${inputIva}%!`;
    
    setTimeout(() => { mensaje.innerText = ""; }, 3000);
    actualizarInterfaz();
}

// Listener para procesar nuevos productos
if (formNuevoProducto) {
    formNuevoProducto.addEventListener('submit', function(e) {
        e.preventDefault();

        const nombreInput = document.getElementById('nuevo-nombre');
        const precioInput = document.getElementById('nuevo-precio');
        const categoriaSelect = document.getElementById('nueva-categoria');

        const nuevoPlato = {
            id: Date.now(),
            nombre: nombreInput.value,
            precio: parseFloat(precioInput.value),
            categoria: categoriaSelect.value,
            disponible: true
        };

        menu.push(nuevoPlato);
        cargarMenu();

        nombreInput.value = '';
        precioInput.value = '';
    });
}

// ==========================================
// CONTROLADOR DE CLIENTES
// ==========================================
if (formNuevoCliente) {
    formNuevoCliente.addEventListener('submit', function(e) {
        e.preventDefault();

        const nombre = document.getElementById('cliente-nombre').value;
        const apellido = document.getElementById('cliente-apellido').value;
        const cedula = document.getElementById('cliente-cedula').value;
        const correo = document.getElementById('cliente-correo').value;
        const direccion = document.getElementById('cliente-direccion').value;

        const nuevoCliente = {
            id: Date.now().toString(), // Convertido a string para consistencia con el select
            nombre,
            apellido,
            cedula,
            correo,
            direccion
        };

        clientes.push(nuevoCliente);
        clienteActivo = nuevoCliente; // Se asigna automáticamente como activo

        // NUEVO: Re-renderiza el selector de clientes de la caja para incluir al nuevo
        actualizarSelectClientes();

        alert(`👤 Cliente "${nombre} ${apellido}" registrado con éxito.`);
        
        formNuevoCliente.reset();
        actualizarInterfaz();
        mostrarSeccion('seccionPedidos');
    });
}

// NUEVO: Llena y refresca el elemento <select> de la caja con los clientes del arreglo
function actualizarSelectClientes() {
    if (!selectClientePedido) return;

    // Reiniciamos conservando la opción por defecto
    selectClientePedido.innerHTML = '<option value="cf">Consumidor Final (Sin Descuento)</option>';

    clientes.forEach(cliente => {
        const opcion = document.createElement('option');
        opcion.value = cliente.id;
        opcion.textContent = `${cliente.nombre} ${cliente.apellido} (${cliente.cedula})`;
        
        // Si es el cliente activo, lo dejamos seleccionado visualmente
        if (clienteActivo && clienteActivo.id === cliente.id) {
            opcion.selected = true;
        }
        selectClientePedido.appendChild(opcion);
    });
}

// NUEVO: Escucha los cambios del selector manual en la sección de pedidos
function seleccionarClienteCaja(valorSelect) {
    if (valorSelect === 'cf') {
        clienteActivo = null;
    } else {
        clienteActivo = clientes.find(c => c.id === valorSelect) || null;
    }
    actualizarInterfaz();
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

        const botonAgregar = document.createElement('button');
        botonAgregar.className = 'btn-accion btn-primario';
        botonAgregar.textContent = plato.disponible ? 'Agregar' : 'Agotado';
        
        if (!plato.disponible) {
            botonAgregar.style.backgroundColor = '#868e96';
            botonAgregar.style.cursor = 'not-allowed';
        } else {
            botonAgregar.addEventListener('click', () => agregarAlCarrito(plato.id));
        }
        
        const botonToggle = document.createElement('button');
        botonToggle.className = 'btn-accion';
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

function toggleDisponibilidad(id) {
    const plato = menu.find(p => p.id === id);
    if (plato) {
        plato.disponible = !plato.disponible;
        cargarMenu();
    }
}

function filtrarCategoria(categoria, botonPresionado) {
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
    const productoEnCarrito = carrito.find(p => p.id === id);

    if (productoEnCarrito) {
        productoEnCarrito.cantidad++;
    } else {
        carrito.push({ ...productoMenu, dynamicPrice: productoMenu.precio, cantidad: 1 });
    }
    actualizarInterfaz();
}

function cambiarCantidad(id, cambio) {
    const productoEnCarrito = carrito.find(p => p.id === id);
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
    carrito = carrito.filter(p => p.id !== id);
    actualizarInterfaz();
}

function actualizarInterfaz() {
    tablaCarrito.innerHTML = '';

    if (carrito.length === 0) {
        tablaCarrito.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999;">Ningún producto en comandas.</td></tr>';
    }

    let subtotal = 0;

    carrito.forEach(item => {
        const totalItem = item.precio * item.cantidad;
        subtotal += totalItem;

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${item.nombre}</strong></td>
            <td>
                <div class="cart-controls">
                    <button class="btn-qty" id="btn-menos-${item.id}">-</button>
                    <span>${item.cantidad}</span>
                    <button class="btn-qty" id="btn-mas-${item.id}">+</button>
                </div>
            </td>
            <td>$${item.precio.toFixed(2)}</td>
            <td>$${totalItem.toFixed(2)}</td>
            <td><button class="btn-delete" id="btn-del-${item.id}">X</button></td>
        `;
        tablaCarrito.appendChild(fila);

        document.getElementById(`btn-menos-${item.id}`).addEventListener('click', () => cambiarCantidad(item.id, -1));
        document.getElementById(`btn-mas-${item.id}`).addEventListener('click', () => cambiarCantidad(item.id, 1));
        document.getElementById(`btn-del-${item.id}`).addEventListener('click', () => eliminarDelCarrito(item.id));
    });

    // Limpieza de filas de descuento anteriores
    const filaDescuentoPrevio = document.getElementById('fila-dinamica-descuento');
    if (filaDescuentoPrevio) filaDescuentoPrevio.remove();

    let descuento = 0;
    if (clienteActivo && subtotal > 0) {
        descuento = subtotal * 0.05;
        subtotal = subtotal - descuento; 

        const filaDesc = document.createElement('div');
        filaDesc.id = 'fila-dinamica-descuento';
        filaDesc.className = 'fila-total';
        filaDesc.style.color = '#12b886';
        filaDesc.style.fontWeight = 'bold';
        filaDesc.innerHTML = `
            <span>Desc. Cliente Frecuente (5%):</span>
            <span>-$${descuento.toFixed(2)}</span>
        `;
        txtSubtotal.parentElement.parentElement.insertBefore(filaDesc, txtSubtotal.parentElement.nextSibling);
    }

    const totalIva = subtotal * porcentajeIva;
    const totalFinal = subtotal + totalIva;

    txtSubtotal.innerText = `$${(subtotal + descuento).toFixed(2)}`; 
    txtIva.innerText = `$${totalIva.toFixed(2)}`;
    txtTotal.innerText = `$${totalFinal.toFixed(2)}`;
    
    // Asegura que el selector refleje el estado real (por si se cambió de sección)
    if (selectClientePedido) {
        selectClientePedido.value = clienteActivo ? clienteActivo.id : 'cf';
    }
}

// ===========================
// 6. SECCIÓN: PROCESAR PAGO 
// ===========================
function procesarPago() {
    if (carrito.length === 0) {
        alert("Caja vacía. Agregue platos al pedido antes de facturar.");
        return;
    }

    let subtotalInicial = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    let descuento = clienteActivo ? (subtotalInicial * 0.05) : 0;
    let subtotalConDescuento = subtotalInicial - descuento;
    
    let totalIva = subtotalConDescuento * porcentajeIva;
    let totalFinal = subtotalConDescuento + totalIva;

    const nuevaFactura = {
        numero: historialVentas.length + 1,
        subtotal: subtotalConDescuento.toFixed(2),
        iva: totalIva.toFixed(2),
        total: totalFinal.toFixed(2),
        cliente: clienteActivo ? `${clienteActivo.nombre} ${clienteActivo.apellido}` : "Consumidor Final"
    };
    historialVentas.push(nuevaFactura);

    alert(`🎉 Venta #${nuevaFactura.numero} completada con éxito.\nCliente: ${nuevaFactura.cliente}\nTotal pagado: $${nuevaFactura.total}`);
    
    // Resetear Caja, limpiar cliente activo y actualizar el select visualmente
    carrito = [];
    clienteActivo = null; 
    if (selectClientePedido) selectClientePedido.value = 'cf';
    
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
            <td>#000${factura.numero}<br><small style="color:#777;">${factura.cliente}</small></td>
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
actualizarSelectClientes();
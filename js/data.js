document.addEventListener('DOMContentLoaded', () => {
  const dataForm = document.getElementById('data-form');
  const itemNameInput = document.getElementById('item-name');
  const itemValueInput = document.getElementById('item-value');
  const itemGasto= document.getElementById('item-precio');
  const tableBody = document.getElementById('table-body');
  const addItemBtn = document.getElementById('add-item-btn');
  const updateItemBtn = document.getElementById('update-item-btn');
  const loadingIndicator = document.getElementById('loading-indicator');
  const statusMessage = document.getElementById('status-message');

  // Modal de confirmación
  const confirmationModal = document.getElementById('confirmation-modal');
  const confirmDeleteBtn = confirmationModal.querySelector('.confirm-btn');
  const cancelDeleteBtn = confirmationModal.querySelector('.cancel-btn');
  let itemToDeleteId = null;
    // Para almacenar el ID del elemento a eliminar

  let editingItemId = null;
    // Para almacenar el ID del elemento que se está editando

  // Base de Mock API
  const API_BASE_URL =
    'https://6916a106a7a34288a27ddfbe.mockapi.io/api/v1/datosDinamicos' ;

  // Función para mostrar mensajes de estado (error/éxito)
  function showMessage(element, message, type = 'error') {
    element.textContent = message;
    element.classList.remove('hidden', 'error', 'success');
    element.classList.add(type); // Añadir la clase de tipo
    setTimeout(() => {
      element.classList.add('hidden');
    }, 5000); // Ocultar mensaje después de 5 segundos
  }

  // Función para manejar errores de la API con reintentos (exponential backoff)
  async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          // Intenta leer el mensaje de error del cuerpo de la respuesta si
          // está disponible
          const errorText = await response.text();
          throw new Error( 'HTTP error! status: ' + response.status + ' - ' +
            ( errorText || response.statusText ) ) ;
        }
        return response;
      } catch( error ) {
        if( i < retries - 1 ) {
          console.warn( 'Intento ' + (i + 1) + ' fallido. Reintentando en ' +
            ( delay / 1000 )  + ' segundos...', error ) ;
          await new Promise(res => setTimeout(res, delay));
          delay *= 2; // Duplicar el retraso para el siguiente intento
        } else {
          throw error; // Lanzar el error si se agotaron los reintentos
        }
      }
    }
  }

  function setEditingItem( id ) {
    itemToDeleteId = null;
    editingItemId = id;
    addItemBtn.style.display = 'none';
    updateItemBtn.style.display = 'inline-block';
  }

  function resetEditingItem() {
    editingItemId = null;
    addItemBtn.style.display = 'inline-block';
    updateItemBtn.style.display = 'none';
  }

  // Función para renderizar la tabla con los datos
  function renderTable(data) {
    tableBody.innerHTML = ''; // Limpiar tabla
    if (data.length === 0) {
      const row = document.createElement( 'tr' ) ;
      const empty = document.createElement( 'td' ) ;
      empty.setAttribute( 'colspan' , 5 ) ;
      empty.classList.add( 'empty' ) ;
      empty.textContent = 'No hay elementos para mostrar.' ;
      row.appendChild( empty ) ;
      tableBody.appendChild( row ) ;
      return;
    }
    data.forEach(item => {
      const row = document.createElement('tr') ;
      [ 'id', 'name', 'value', 'precio' ].forEach( attr => {
        const td = document.createElement('td') ;
        td.textContent=item[attr] ;
        row.appendChild( td ) ;
      } ) ;

      const actions = document.createElement('td') ;
      actions.classList.add( 'table-actions' ) ;
      const edit = document.createElement('button') ;
      edit.classList.add( 'edit-btn' ) ;
      edit.textContent = 'Editar' ;
      edit.addEventListener( 'click' , (e) => {
        setEditingItem( item.id ) ;
        itemNameInput.value = item.name;
        itemValueInput.value = item.value;
        itemGasto.value=item.precio;
      } ) ;
      actions.appendChild( edit ) ;

      const del = document.createElement('button') ;
      del.classList.add( 'delete-btn' ) ;
      del.textContent = 'Eliminar' ;
      del.addEventListener( 'click' , (e) => {
        itemToDeleteId = item.id;
        resetEditingItem();
        dataForm.reset();
        confirmationModal.style.display = 'flex'; // Muestra el modal
      } ) ;
      actions.appendChild( del ) ;
      row.appendChild( actions ) ;
      tableBody.appendChild(row);
    });
  }

  // Función para cargar datos desde la API
  async function loadData() {
    loadingIndicator.classList.remove('hidden');
    try {
      const response = await fetchWithRetry(API_BASE_URL);
      const data = await response.json();
      renderTable(data);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      showMessage(statusMessage, `Error al cargar los datos: ${error.message}`);
    } finally {
      loadingIndicator.classList.add('hidden');
    }
  }

  // Manejar el envío del formulario (Agregar/Actualizar)
  dataForm.addEventListener( 'submit', async (event) => {
    event.preventDefault() ;
    const name = itemNameInput.value.trim() ;
    const value = parseFloat( itemValueInput.value ) ;
    const precio= parseFloat( itemGasto.value);

    if( !name || isNaN( value ) ) {
      showMessage( statusMessage,
        'Por favor, introduce un nombre y un valor válidos.', 'error' ) ;
      return;
    }

    const itemData = { name, value, precio } ;

    loadingIndicator.classList.remove('hidden');

    try {
      let response;
      if( editingItemId ) {
        // Actualizar elemento existente (PUT)
        response = await fetchWithRetry(`${API_BASE_URL}/${editingItemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        });
        showMessage( statusMessage,
          'Elemento actualizado con éxito.', 'success' ) ;
      } else {
        // Agregar nuevo elemento (POST)
        response = await fetchWithRetry( API_BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        } ) ;
        showMessage( statusMessage,
          'Elemento agregado con éxito.', 'success' ) ;
      }
      await response.json() ; // Consumir la respuesta
      resetEditingItem() ;
      dataForm.reset() ;
      loadData() ; // Recargar datos después de la operación
    } catch( error ) {
      console.error( 'Error al guardar el elemento:', error ) ;
      showMessage( statusMessage,
        "Error al guardar el elemento: " + error.message ) ;
    } finally {
      loadingIndicator.classList.add( 'hidden' ) ;
    }
  } ) ;

  dataForm.addEventListener( 'reset' , resetEditingItem ) ;

  // Lógica del modal de confirmación
  confirmDeleteBtn.addEventListener('click', async () => {
    confirmationModal.style.display = 'none'; // Oculta el modal

    if(itemToDeleteId) {
      loadingIndicator.classList.remove('hidden');
      try {
        const response =
          await fetchWithRetry(`${API_BASE_URL}/${itemToDeleteId}`, {
            method: 'DELETE'
          } ) ;
        if( response.ok ) {
          showMessage( statusMessage,
            'Elemento eliminado con éxito.', 'success' ) ;
          loadData() ; // Recargar datos después de eliminar
        } else {
          throw new Error( 'No se pudo eliminar el elemento.' ) ;
        }
      } catch (error) {
        console.error( 'Error al eliminar el elemento:', error ) ;
        showMessage( statusMessage,
          'Error al eliminar el elemento: ' + error.message ) ;
      } finally {
        loadingIndicator.classList.add( 'hidden' ) ;
        itemToDeleteId = null; // Limpiar el ID después de la operación
      }
    }
  } ) ;

  cancelDeleteBtn.addEventListener('click', () => {
    confirmationModal.style.display = 'none'; // Oculta el modal
    itemToDeleteId = null; // Limpiar el ID
  } ) ;

  // Cargar los datos iniciales al cargar la página
  loadData() ;
} ) ;

document.addEventListener('DOMContentLoaded', ()=>{
    const contactoForm= document.getElementById('contacto-form');
    const itemNombre=document.getElementById('item-name');
    const itemApell=document.getElementById('item-surname');
    const itemNum= document.getElementById('item-number');
    const itemMensj= document.getElementById('item-message');
    const tabla= document.getElementById('tabla-body');
    const addItemBoton= document.getElementById('agregar-items');
    const actualizarItem = document.getElementById('update-item-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const statusMessage= document.getElementById('status-message');

    //modal de confirmacion 
    const confModal= document.getElementById('confirmar-modal');
    const confElimBoton=confModal.querySelector('.si-boton');
    const noElimBoton= confModal.querySelector('.no-boton');
    let itemElim=null; //almacenar id elem a eliminar
    let itemEdit=null; //en edicion

    const API_BASE_URL =
    'https://6916a106a7a34288a27ddfbe.mockapi.io/api/v1/Users' ;


    //funcion mostrar msj estado
    function showMessage(element, message, type='error') {
        element.textContent=message;
        element.classList.remove('hidden', 'error', 'success');
        element.classList.add(type);
        setTimeout(()=>{
            element.classList.add('hidden');
        }, 5000);//segundos
    }

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

    function setItemEdit(id) {
        itemElim=null;
        itemEdit=id;
        addItemBoton.style.display='none';
        actualizarItem.style.display='inline-block';
    }

    function resetItemEdit () {
        itemEdit=null;
        addItemBoton.style.display='inline-block';
        actualizarItem.style.display='none';
    }

        //funcion renderizar tabla con datos
        function renderTabla (data) {
            tabla.innerHTML='';
            if(data.length===0) {
                const row= document.createElement('tr');
                const empty= document.createElement('td');
                empty.setAttribute('colspan', 5);
                empty.classList.add('empty');
                empty.textContent = 'No hay elementos para mostrar.' ;
                row.appendChild( empty ) ;
                tabla.appendChild( row ) ;
                return;
            }
            data.forEach((item, index)=> {
                const row= document.createElement('tr');
                ['id', 'name', 'surname', 'number', 'message'].forEach( attr => {
                    const td=document.createElement('td');
                    td.textContent=item[attr];
                    row.appendChild(td);
                });

                const actions=document.createElement('td');
                actions.classList.add('tabla-acciones');
                const edit=document.createElement('button');
                edit.classList.add('edit-btn');
                edit.textContent='Editar';
                edit.addEventListener('click', (e)=> {
                    setItemEdit(item.id);
                    itemNombre.value=item.name;
                    itemApell.value=item.surname;
                    itemNum.value=item.number;
                    itemMensj.value=item.message;
                });
                actions.appendChild(edit);

                const del=document.createElement('button');
                del.classList.add('delete-btn');
                del.textContent='Eliminar';
                del.addEventListener('click', (e)=> {
                    itemElim=item.id;
                    resetItemEdit();
                    contactoForm.reset();
                    confModal.style.display='flex';
                });

                actions.appendChild(del);
                row.appendChild(actions);
                tabla.appendChild(row);
            });
        }

        async function loadData() {
    loadingIndicator.classList.remove('hidden');
    try {
      const response = await fetchWithRetry(API_BASE_URL);
      const data = await response.json();
      renderTabla(data);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      showMessage(statusMessage, `Error al cargar los datos: ${error.message}`);
    } finally {
      loadingIndicator.classList.add('hidden');
    }
  }


        contactoForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name= itemNombre.value.trim();
            const surname=itemApell.value.trim();
            const number=parseFloat(itemNum.value);
            const message=itemMensj.value.trim();

            if(!name||!surname|| !message||isNaN(number)) {
                showMessage( statusMessage, 'Introducir datos validos');
                return;
            }

            const itemData= {name,surname,number,message};

             loadingIndicator.classList.remove('hidden');

    try {
      let response;
      if( itemEdit ) {
        // Actualizar elemento existente (PUT)
        response = await fetchWithRetry(`${API_BASE_URL}/${itemEdit}`, {
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
      resetItemEdit() ;
      contactoForm.reset() ;
      loadData() ; // Recargar datos después de la operación
    } catch( error ) {
      console.error( 'Error al guardar el elemento:', error ) ;
      showMessage( statusMessage,
        "Error al guardar el elemento: " + error.message ) ;
    } finally {
      loadingIndicator.classList.add( 'hidden' ) ;
    }
  } ) ;

  contactoForm.addEventListener( 'reset' , resetItemEdit ) ;

  // Lógica del modal de confirmación
  confElimBoton.addEventListener('click', async () => {
    confModal.style.display = 'none'; // Oculta el modal

    if(itemElim) {
      loadingIndicator.classList.remove('hidden');
      try {
        const response =
          await fetchWithRetry(`${API_BASE_URL}/${itemElim}`, {
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
        itemElim = null; // Limpiar el ID después de la operación
      }
    }
  } ) ;

  noElimBoton.addEventListener('click', () => {
    confModal.style.display = 'none'; // Oculta el modal
    itemElim = null; // Limpiar el ID
  } ) ;

  // Cargar los datos iniciales al cargar la página
  loadData() ;
} ) ;

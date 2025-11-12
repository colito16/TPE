document.addEventListener('DOMContentLoaded', ()=>{
    const contactoForm= document.getElementById('contacto-form');
    const itemNombre=document.getElementById('item-name');
    const itemApell=document.getElementById('item-surname');
    const itemNum= document.getElementById('item-number');
    const itemMensj= document.getElementById('item-message');
    const tabla= document.getElementById('tabla-body');
    const addItemBoton= document.getElementById('agregar-items');
    const actualizarItem = document.getElementById('update-item-btn');
    const statusMessage= document.getElementById('status-message');

    //modal de confirmacion 
    const confModal= document.getElementById('confirmar-modal');
    const confElimBoton=confModal.querySelector('.si-boton');
    const noElimBoton= confModal.querySelector('.no-boton');
    let itemElim=null; //almacenar id elem a eliminar
    let itemEdit=null; //en edicion

    const items=[];

    //funcion mostrar msj estado
    function showMessage(element, message, type='error') {
        element.textContent=message;
        element.classList.remove('hidden', 'error', 'success');
        element.classList.add(type);
        setTimeout(()=>{
            element.classList.add('hidden');
        }, 5000);//segundos
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
                item.id=index +1;
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

        function loadData() {
            renderTabla(items);
        }

        contactoForm.addEventListener('submit', (event) => {
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

            if(itemEdit) {
                items[itemEdit-1]=itemData;
                showMessage( statusMessage,
                'Elemento actualizado con éxito.', 'success' ) ;
            } else {
            items.push( itemData ) ;
            showMessage( statusMessage, 'Elemento agregado con éxito.', 'success' ) ;
            }
            resetItemEdit();
            contactoForm.reset();
            loadData();
            
        });

        contactoForm.addEventListener('reset', resetItemEdit);

        confElimBoton.addEventListener('click', () => {
            confModal.style.display='none';

            if(itemElim) {
                items.splice(itemElim-1, 1);
                showMessage( statusMessage,
                'Elemento eliminado con éxito.', 'success' ) ;
                loadData() ;
                itemElim=null;
            }

        });

        noElimBoton.addEventListener('click', ()=> {
            confModal.style.display='none';
            itemElim=null;
        });
        loadData();
    

});
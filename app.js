// Solucionador de Mapas de Karnaugh - Interfaz Mejorada
// Flujo paso a paso: Variables → Minterms → Expresión → Mapa

class KarnaughSolverMejorado {
    constructor() {
        this.numVariables = 4; // Por defecto
        this.mintermsSeleccionados = new Set();
        this.expresionActual = '';
        this.pasoActual = 1;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.inicializarSidebar();
        this.mostrarPaso(1);
        console.log('Solucionador de Mapas de Karnaugh mejorado inicializado');
    }
    
    setupEventListeners() {
        // Paso 1: Selección de variables
        document.querySelectorAll('.variable-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.seleccionarVariables(parseInt(e.currentTarget.dataset.vars));
            });
        });
        
        document.getElementById('btnContinuarPaso1').addEventListener('click', () => {
            this.continuarPaso1();
        });
        
        // Paso 2: Selección de minterms
        document.getElementById('btnSeleccionarTodos').addEventListener('click', () => {
            this.seleccionarTodosMinterms();
        });
        
        document.getElementById('btnDeseleccionarTodos').addEventListener('click', () => {
            this.deseleccionarTodosMinterms();
        });
        
        document.getElementById('btnIncrementar').addEventListener('click', () => {
            this.incrementarMinterms();
        });
        
        document.getElementById('btnDecrementar').addEventListener('click', () => {
            this.decrementarMinterms();
        });
        
        // Event listener para continuar paso 2
        document.getElementById('btnContinuarPaso2').addEventListener('click', () => {
            this.continuarPaso2();
        });
        
        // Paso 3: Constructor de expresiones
        document.getElementById('btnLimpiarExpresion').addEventListener('click', () => {
            this.limpiarExpresion();
        });
        
        document.getElementById('btnAleatorio').addEventListener('click', () => {
            this.seleccionarAleatorio();
        });
        
        
        document.getElementById('btnGenerarMapa').addEventListener('click', () => {
            // Validar que todos los slots estén completos
            if (!this.validarSlotsCompletos()) {
                this.mostrarError('Debes completar todos los slots antes de generar el mapa.');
                return;
            }
            
            if (this.expresionActual && this.expresionActual.trim()) {
                this.generarMapaDesdeExpresion();
            } else {
                this.generarMapaDesdeMinterms();
            }
        });
        
        // Botón de retroceder en sidebar
        document.getElementById('btnRetroceder').addEventListener('click', () => {
            this.retrocederPaso();
        });
        
        // Toggle del sidebar
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });
    }
    
    // Paso 1: Selección de variables
    seleccionarVariables(numVars) {
        // Remover selección anterior
        document.querySelectorAll('.variable-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Seleccionar nueva opción
        document.querySelector(`[data-vars="${numVars}"]`).classList.add('selected');
        
        this.numVariables = numVars;
        document.getElementById('btnContinuarPaso1').disabled = false;
    }
    
    continuarPaso1() {
        this.generarMinterms();
        this.mostrarPaso(2);
    }
    
    // Paso 2: Generación y selección de minterms
    generarMinterms() {
        const mintermGrid = document.getElementById('mintermGrid');
        mintermGrid.innerHTML = '';
        
        const totalMinterms = Math.pow(2, this.numVariables);
        
        for (let i = 0; i < totalMinterms; i++) {
            const mintermItem = document.createElement('div');
            mintermItem.className = 'minterm-item';
            mintermItem.dataset.minterm = i;
            mintermItem.textContent = `m${i}`;
            
            mintermItem.addEventListener('click', () => {
                this.seleccionarHastaMinterm(i);
            });
            
            mintermGrid.appendChild(mintermItem);
        }
        
        // Inicializar contador
        this.actualizarContador();
    }
    
    seleccionarHastaMinterm(indiceObjetivo) {
        const totalMinterms = Math.pow(2, this.numVariables);
        this.mintermsSeleccionados.clear();
        for (let i = 0; i <= indiceObjetivo && i < totalMinterms; i++) {
            this.mintermsSeleccionados.add(i);
        }
        this.actualizarVistaMinterms();
        this.actualizarContador();
    }
    
    seleccionarTodosMinterms() {
        const totalMinterms = Math.pow(2, this.numVariables);
        this.mintermsSeleccionados.clear();
        
        for (let i = 0; i < totalMinterms; i++) {
            this.mintermsSeleccionados.add(i);
        }
        
        this.actualizarVistaMinterms();
        this.actualizarContador();
    }
    
    deseleccionarTodosMinterms() {
        this.mintermsSeleccionados.clear();
        this.actualizarVistaMinterms();
        this.actualizarContador();
    }
    
    incrementarMinterms() {
        const totalMinterms = Math.pow(2, this.numVariables);
        if (this.mintermsSeleccionados.size < totalMinterms) {
            // Encontrar el primer minterm no seleccionado
            for (let i = 0; i < totalMinterms; i++) {
                if (!this.mintermsSeleccionados.has(i)) {
                    this.mintermsSeleccionados.add(i);
                    break;
                }
            }
            this.actualizarVistaMinterms();
            this.actualizarContador();
        }
    }
    
    decrementarMinterms() {
        if (this.mintermsSeleccionados.size > 0) {
            // Remover el último minterm seleccionado
            const mintermsArray = Array.from(this.mintermsSeleccionados);
            const ultimoMinterm = mintermsArray[mintermsArray.length - 1];
            this.mintermsSeleccionados.delete(ultimoMinterm);
            this.actualizarVistaMinterms();
            this.actualizarContador();
        }
    }
    
    actualizarContador() {
        const contador = document.getElementById('contadorMinterms');
        const btnIncrementar = document.getElementById('btnIncrementar');
        const btnDecrementar = document.getElementById('btnDecrementar');
        const totalMinterms = Math.pow(2, this.numVariables);
        
        contador.textContent = this.mintermsSeleccionados.size;
        
        // Habilitar/deshabilitar botones según el estado
        btnIncrementar.disabled = this.mintermsSeleccionados.size >= totalMinterms;
        btnDecrementar.disabled = this.mintermsSeleccionados.size <= 0;
    }
    
    seleccionarAleatorio() {
        // En Paso 3: completar expresión aleatoriamente respetando orden y cantidad de slots
        if (this.pasoActual === 3) {
            if (this.mintermsSeleccionados.size === 0) {
                this.mostrarError('Primero selecciona minterms en el Paso 2.');
                return;
            }
            this.limpiarErrores();
            const variables = this.obtenerVariablesPermitidas(this.numVariables);
            const cantidadSlots = this.mintermsSeleccionados.size;
            const grupos = [];
            // Resetear expresión antes de generar
            this.expresionActual = '';
            for (let i = 0; i < cantidadSlots; i++) {
                // Construir grupo en orden A..D con negaciones aleatorias
                const grupo = variables.map(v => Math.random() < 0.5 ? v : `${v}'`).join('');
                grupos.push(grupo);
            }
            this.expresionActual = grupos.join('+');
            this.actualizarDisplayExpresion();
            this.limpiarMapa();
            // Asegurar que el display refleje la última expresión tras limpiar el mapa
            this.actualizarDisplayExpresion();
            return;
        }

        // En Paso 2 (u otros): seleccionar minterms aleatoriamente
        const totalMinterms = Math.pow(2, this.numVariables);
        this.mintermsSeleccionados.clear();
        
        const minSeleccionar = Math.max(1, Math.floor(totalMinterms * 0.25));
        const maxSeleccionar = Math.floor(totalMinterms * 0.75);
        const cantidadSeleccionar = Math.floor(Math.random() * (maxSeleccionar - minSeleccionar + 1)) + minSeleccionar;
        
        const mintermsDisponibles = Array.from({length: totalMinterms}, (_, i) => i);
        
        for (let i = 0; i < cantidadSeleccionar; i++) {
            const randomIndex = Math.floor(Math.random() * mintermsDisponibles.length);
            const minterm = mintermsDisponibles.splice(randomIndex, 1)[0];
            this.mintermsSeleccionados.add(minterm);
        }
        
        this.actualizarVistaMinterms();
        this.actualizarContador();
        this.limpiarMapa();
    }
    
    actualizarVistaMinterms() {
        document.querySelectorAll('.minterm-item').forEach(item => {
            const minterm = parseInt(item.dataset.minterm);
            if (this.mintermsSeleccionados.has(minterm)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    continuarPaso2() {
        if (this.mintermsSeleccionados.size === 0) {
            this.mostrarError('Por favor, selecciona al menos un minterm.');
            return;
        }
        
        this.generarBotonesVariables();
        this.generarSlots();
        this.mostrarPaso(3);
        this.generarMapaVacioConEstructura();
        this.actualizarDisplayExpresion(); // ← Agregar esta línea
    }
    
    /**
     * Genera un mapa de Karnaugh vacío con estructura completa
     */
    generarMapaVacioConEstructura() {
        const contenedorMapa = document.getElementById('contenedorMapaK');
        contenedorMapa.innerHTML = '';
        contenedorMapa.className = 'mapa-container';
        
        // Usar la misma función que genera el mapa real pero sin datos
        this.generarMapaVacioSimple(contenedorMapa, this.numVariables);
    }
    
    /**
     * Genera el mapa vacío usando la misma estructura que el mapa real
     */
    generarMapaVacioSimple(contenedor, numVariables) {
        const grid = document.createElement('div');
        grid.className = 'karnaugh-grid';
        
        if (numVariables === 2) {
            grid.classList.add('grid-2x2');
            this.dibujarMapaVacio2Variables(grid);
        } else if (numVariables === 3) {
            grid.classList.add('grid-2x4');
            this.dibujarMapaVacio3Variables(grid);
        } else if (numVariables === 4) {
            grid.classList.add('grid-4x4');
            this.dibujarMapaVacio4Variables(grid);
        }
        
        contenedor.appendChild(grid);
    }
    
    /**
     * Dibuja el mapa vacío para 2 variables
     */
    dibujarMapaVacio2Variables(grid) {
        const mapeo = [
            [null, '0', '1'],
            ['0', null, null],
            ['1', null, null]
        ];
        this.dibujarGrillaVacia(grid, mapeo);
    }
    
    /**
     * Dibuja el mapa vacío para 3 variables
     */
    dibujarMapaVacio3Variables(grid) {
        const mapeo = [
            [null, '00', '01', '11', '10'],
            ['0', null, null, null, null],
            ['1', null, null, null, null]
        ];
        this.dibujarGrillaVacia(grid, mapeo);
    }
    
    /**
     * Dibuja el mapa vacío para 4 variables
     */
    dibujarMapaVacio4Variables(grid) {
        const mapeo = [
            [null, '00', '01', '11', '10'],
            ['00', null, null, null, null],
            ['01', null, null, null, null],
            ['11', null, null, null, null],
            ['10', null, null, null, null]
        ];
        this.dibujarGrillaVacia(grid, mapeo);
    }
    
    /**
     * Dibuja la grilla vacía usando la misma lógica que dibujarGrilla
     */
    dibujarGrillaVacia(grid, mapeo) {
        mapeo.forEach((fila, filaIndex) => {
            fila.forEach((celda, colIndex) => {
                const div = document.createElement('div');
                
                if (celda === null) {
                    div.className = 'celda header';
                    div.textContent = '';
                } else if (typeof celda === 'string') {
                    div.className = 'celda header';
                    div.textContent = celda;
                } else {
                    // Celdas vacías sin datos
                    div.className = 'celda cero';
                    div.textContent = '';
                }
                
                grid.appendChild(div);
            });
        });
    }
    
    /**
     * Genera los botones de variables según el principio fundamental:
     * - Solo muestra botones para las variables activas (predefinidas)
     * - Muestra en orden lógico: A, Ā, B, B̄, C, C̄, D, D̄
     * - Limita la entrada según la cantidad de variables seleccionadas
     * - Los botones simplemente insertan texto en la expresión
     */
    generarBotonesVariables() {
        const variableButtons = document.getElementById('variableButtons');
        variableButtons.innerHTML = '';
        
        const variables = this.obtenerVariablesPermitidas(this.numVariables);
        
        // Crear etiqueta descriptiva
        const labelContainer = document.createElement('div');
        labelContainer.className = 'variable-buttons-label';
        labelContainer.innerHTML = `
            <h4>Variables Disponibles (${this.numVariables} variables)</h4>
            <p>Haz clic en las variables para construir tu expresión:</p>
        `;
        variableButtons.appendChild(labelContainer);
        
        // Crear contenedor para agrupar variables por par
        const variableGroupsContainer = document.createElement('div');
        variableGroupsContainer.className = 'variable-groups-container';
        variableButtons.appendChild(variableGroupsContainer);
        
        variables.forEach(variable => {
            // Crear grupo para cada variable (A + Ā, B + B̄, etc.)
            const variableGroup = document.createElement('div');
            variableGroup.className = 'variable-group';
            variableGroup.setAttribute('data-variable', variable);
            
            // Botón para variable normal
            const btnNormal = document.createElement('button');
            btnNormal.className = 'variable-btn';
            btnNormal.textContent = variable;
            btnNormal.title = `Agregar variable ${variable}`;
            btnNormal.addEventListener('click', () => {
                this.agregarAVariable(variable);
            });
            variableGroup.appendChild(btnNormal);
            
            // Botón para variable negada
            const btnNegada = document.createElement('button');
            btnNegada.className = 'variable-btn negated';
            btnNegada.innerHTML = `${variable}<span style="text-decoration: overline;">̄</span>`;
            btnNegada.title = `Agregar variable ${variable} negada`;
            btnNegada.addEventListener('click', () => {
                this.agregarAVariable(`${variable}'`);
            });
            variableGroup.appendChild(btnNegada);
            
            variableGroupsContainer.appendChild(variableGroup);
        });
        
        // Actualizar estado de botones
        this.actualizarEstadoBotones();
        
        // Los botones de operadores fueron removidos del HTML
    }
    
    // Generar slots basados en minterms seleccionados
    generarSlots() {
        const slotsContainer = document.getElementById('slotsContainer');
        slotsContainer.innerHTML = '';
        
        const cantidadSlots = this.mintermsSeleccionados.size;
        
        for (let i = 0; i < cantidadSlots; i++) {
            // Contenedor por grupo: slot + separador
            const group = document.createElement('div');
            group.className = 'slot-group';

            // Crear slot vacío
            const slot = document.createElement('div');
            slot.className = 'slot-item';
            slot.textContent = `m${i}`;
            slot.dataset.slotIndex = i;
            group.appendChild(slot);
            
            // Agregar separador + si no es el último
            if (i < cantidadSlots - 1) {
                const separator = document.createElement('span');
                separator.className = 'slot-separator';
                separator.textContent = '+';
                group.appendChild(separator);
            }

            slotsContainer.appendChild(group);
        }
        
        // Inicializar slots vacíos
        this.actualizarSlots();
    }
    
    // Actualizar el estado de los slots basado en la expresión actual
    actualizarSlots() {
        const slots = document.querySelectorAll('.slot-item');
        
        // Dividir la expresión en grupos basados en el límite de variables
        const grupos = this.dividirEnGrupos(this.expresionActual);
        
        slots.forEach((slot, index) => {
            if (index < grupos.length && grupos[index].trim()) {
                slot.classList.add('filled');
                // Convertir variables negadas a notación con barra superior
                const contenido = this.convertirNegadosEnSlots(grupos[index].trim());
                slot.innerHTML = contenido;
            } else {
                slot.classList.remove('filled');
                slot.textContent = `m${index}`;
            }
        });
    }
    
    // Convertir variables negadas en los slots para mostrar con barra superior
    convertirNegadosEnSlots(contenido) {
        // Dividir el contenido en términos individuales
        const terminos = contenido.match(/[A-Z]'?/g) || [];
        
        return terminos.map(termino => {
            if (termino.endsWith("'")) {
                const variable = termino[0];
                // Variable negada con misma notación visual (techito) que en Exp
                return `<span class="slot-termino slot-negado"><span class="neg-overline">${variable}</span></span>`;
            } else {
                // Variable normal
                return `<span class="slot-termino slot-normal">${termino}</span>`;
            }
        }).join('');
    }
    
    // Dividir la expresión en grupos basados en el límite de variables
    dividirEnGrupos(expresion) {
        if (!expresion.trim()) return [];
        
        // Primero dividir por + para obtener los grupos básicos
        const gruposBasicos = expresion.split('+').filter(grupo => grupo.trim());
        const grupos = [];
        
        for (const grupoBasico of gruposBasicos) {
            // Contar variables en este grupo (A, A', B, B', etc.)
            const variables = grupoBasico.match(/[A-Z]'?/g) || [];
            
            if (variables.length <= this.numVariables) {
                // Si el grupo tiene menos o igual al límite, agregarlo completo
                grupos.push(grupoBasico.trim());
            } else {
                // Si el grupo excede el límite, dividirlo en subgrupos
                let subgrupo = '';
                let variablesEnSubgrupo = 0;
                
                for (let i = 0; i < grupoBasico.length; i++) {
                    const char = grupoBasico[i];
                    
                    if (/[A-Z]/.test(char)) {
                        // Verificar si es una variable negada (siguiente char es ')
                        const esNegada = i + 1 < grupoBasico.length && grupoBasico[i + 1] === '\'';
                        const variableCompleta = esNegada ? char + '\'' : char;
                        
                        subgrupo += variableCompleta;
                        variablesEnSubgrupo++;
                        
                        // Si alcanzamos el límite, agregar subgrupo y reiniciar
                        if (variablesEnSubgrupo >= this.numVariables) {
                            grupos.push(subgrupo.trim());
                            subgrupo = '';
                            variablesEnSubgrupo = 0;
                        }
                        
                        // Si era negada, saltar el siguiente carácter (')
                        if (esNegada) {
                            i++;
                        }
                    } else {
                        subgrupo += char;
                    }
                }
                
                // Agregar el último subgrupo si no está vacío
                if (subgrupo.trim()) {
                    grupos.push(subgrupo.trim());
                }
            }
        }
        
        return grupos;
    }
    
    /**
     * Agrega una variable a la expresión según el principio fundamental:
     * - Valida que las variables se agreguen en orden lógico (A, B, C, D)
     * - Impide agregar B antes que A, C antes que B, etc.
     * - El parser interno es robusto y maneja cualquier orden
     * @param {string} variable - Variable a agregar (ej: 'A', 'B'', etc.)
     */
    agregarAVariable(variable) {
        // Validar orden de variables
        if (!this.validarOrdenVariable(variable)) {
            return; // No agregar si no es válido
        }
        
        // Agregar la variable (solo inserción de texto)
        this.expresionActual += variable;
        
        // Contar variables en el grupo actual (desde el último + o desde el inicio)
        const ultimoMas = this.expresionActual.lastIndexOf('+');
        const grupoActual = ultimoMas === -1 ? this.expresionActual : this.expresionActual.substring(ultimoMas + 1);
        const variablesEnGrupo = (grupoActual.match(/[A-Z]'?/g) || []).length;
        
        // Solo agregar + si hemos alcanzado el límite Y no es el último grupo posible
        const totalSlots = this.mintermsSeleccionados.size;
        const gruposActuales = this.expresionActual.split('+').length;
        
        if (variablesEnGrupo >= this.numVariables && gruposActuales < totalSlots) {
            this.expresionActual += '+';
        }
        
        this.actualizarDisplayExpresion();
    }
    
    /**
     * Valida que las variables se agreguen en orden lógico
     * @param {string} variable - Variable a validar (ej: 'A', 'B'', etc.)
     * @returns {boolean} - true si es válido agregar esta variable
     */
    validarOrdenVariable(variable) {
        // Obtener la variable base (sin la negación)
        const variableBase = variable.replace("'", "");
        
        // Obtener las variables permitidas en orden
        const variablesPermitidas = this.obtenerVariablesPermitidas(this.numVariables);
        
        // Obtener el grupo actual (desde el último + o desde el inicio)
        const ultimoMas = this.expresionActual.lastIndexOf('+');
        const grupoActual = ultimoMas === -1 ? this.expresionActual : this.expresionActual.substring(ultimoMas + 1);
        
        // Extraer las variables ya agregadas en el grupo actual
        const variablesEnGrupo = (grupoActual.match(/[A-Z]'?/g) || []).map(v => v.replace("'", ""));
        
        // Si el grupo está vacío, solo permitir A
        if (variablesEnGrupo.length === 0) {
            if (variableBase === 'A') {
                return true;
            } else {
                this.mostrarError(`Debes empezar con la variable A. No puedes agregar ${variableBase} antes que A.`);
                return false;
            }
        }
        
        // Obtener la última variable agregada
        const ultimaVariable = variablesEnGrupo[variablesEnGrupo.length - 1];
        const indiceUltima = variablesPermitidas.indexOf(ultimaVariable);
        const indiceNueva = variablesPermitidas.indexOf(variableBase);
        
        // Validar que la nueva variable sea la siguiente en orden
        if (indiceNueva === indiceUltima + 1) {
            return true;
        } else if (indiceNueva <= indiceUltima) {
            this.mostrarError(`Ya agregaste ${variableBase} en este grupo. Las variables deben estar en orden: ${variablesPermitidas.join(', ')}`);
            return false;
        } else {
            this.mostrarError(`Debes agregar ${variablesPermitidas[indiceUltima + 1]} antes que ${variableBase}. Orden requerido: ${variablesPermitidas.join(', ')}`);
            return false;
        }
    }
    
    /**
     * Actualiza el estado visual de los botones de variables
     * - Habilita solo las variables que se pueden agregar según el orden
     * - Deshabilita las variables que no se pueden usar aún
     */
    actualizarEstadoBotones() {
        const variablesPermitidas = this.obtenerVariablesPermitidas(this.numVariables);
        
        // Obtener el grupo actual (desde el último + o desde el inicio)
        const ultimoMas = this.expresionActual.lastIndexOf('+');
        const grupoActual = ultimoMas === -1 ? this.expresionActual : this.expresionActual.substring(ultimoMas + 1);
        
        // Extraer las variables ya agregadas en el grupo actual
        const variablesEnGrupo = (grupoActual.match(/[A-Z]'?/g) || []).map(v => v.replace("'", ""));
        
        // Determinar la próxima variable válida
        let proximaVariableValida = null;
        if (variablesEnGrupo.length === 0) {
            proximaVariableValida = 'A';
        } else {
            const ultimaVariable = variablesEnGrupo[variablesEnGrupo.length - 1];
            const indiceUltima = variablesPermitidas.indexOf(ultimaVariable);
            if (indiceUltima < variablesPermitidas.length - 1) {
                proximaVariableValida = variablesPermitidas[indiceUltima + 1];
            }
        }
        
        // Actualizar estado de cada botón
        variablesPermitidas.forEach(variable => {
            const variableGroup = document.querySelector(`[data-variable="${variable}"]`);
            if (variableGroup) {
                const btnNormal = variableGroup.querySelector('.variable-btn:not(.negated)');
                const btnNegada = variableGroup.querySelector('.variable-btn.negated');
                
                const esValida = variable === proximaVariableValida;
                
                // Actualizar botón normal
                if (btnNormal) {
                    btnNormal.disabled = !esValida;
                    btnNormal.classList.toggle('disabled', !esValida);
                    if (esValida) {
                        btnNormal.title = `Agregar variable ${variable}`;
                    } else {
                        btnNormal.title = `Debes agregar ${proximaVariableValida || 'A'} primero`;
                    }
                }
                
                // Actualizar botón negado
                if (btnNegada) {
                    btnNegada.disabled = !esValida;
                    btnNegada.classList.toggle('disabled', !esValida);
                    if (esValida) {
                        btnNegada.title = `Agregar variable ${variable} negada`;
                    } else {
                        btnNegada.title = `Debes agregar ${proximaVariableValida || 'A'} primero`;
                    }
                }
            }
        });
    }
    
    agregarOperador(operador) {
        if (operador === '+' || operador === '*') {
            // Solo agregar si no termina ya con ese operador
            if (this.expresionActual && !this.expresionActual.endsWith(operador)) {
                this.expresionActual += operador;
            }
        } else {
            // Para paréntesis, agregar directamente
            this.expresionActual += operador;
        }
        this.actualizarDisplayExpresion();
    }
    
    limpiarExpresion() {
        this.expresionActual = '';
        this.actualizarDisplayExpresion();
        this.limpiarMapa();
    }
    
    /**
     * Limpia el mapa de Karnaugh
     */
    limpiarMapa() {
        // Usar la función que genera el mapa vacío con estructura
        this.generarMapaVacioConEstructura();
    }
    
    actualizarDisplayExpresion() {
        // Generar guiones según la cantidad de variables y minterms
        const guionesExpresion = this.generarGuionesExpresion();
        const guionesBinario = this.generarGuionesBinario();

        const variables = this.obtenerVariablesPermitidas(this.numVariables);

        // Determinar texto fuente para grupos
        const fuenteExpresion = (this.expresionActual && this.expresionActual.trim() !== '')
            ? this.expresionActual
            : guionesExpresion;

        // Construir HTML alineado para Exp y Bin
        const { expHTML, binHTML } = this.construirHTMLAlineado(fuenteExpresion, variables, guionesBinario);

        document.getElementById('expressionDisplay').innerHTML = `
            <div class="expression-label">Exp:</div>
            <div class="expression-text">${expHTML}</div>
            <div class="binary-label">Bin:</div>
            <div class="expression-binary">${binHTML}</div>
        `;
        
        // Actualizar slots y estado de botones
        this.actualizarSlots();
        this.actualizarEstadoBotones();

        // Si todos los slots están completos, usar grilla en slots; Exp/Bin ya tienen grilla por defecto
        const slotsContainer = document.getElementById('slotsContainer');
        if (slotsContainer) {
            const completos = this.validarSlotsCompletos();
            slotsContainer.classList.toggle('slots-grid', completos);
        }
    }

    construirHTMLAlineado(fuenteExpresion, variables, fallbackBinario) {
        // Separar grupos por + (limpiar espacios)
        const grupos = fuenteExpresion.split('+').map(g => g.trim()).filter(g => g.length > 0);
        const expPartes = [];
        const binPartes = [];

        // Si solo hay guiones (sin variables), construir grupos de guiones acorde a cantidad de variables
        const soloGuiones = grupos.length > 0 && grupos.every(g => /^-+$/.test(g));

        if (soloGuiones) {
            grupos.forEach((g, idx) => {
                const expCeldas = variables.map(() => this._cell('-'));
                const binCeldas = variables.map(() => this._cell('-'));
                expPartes.push(`<div class="expr-group">${expCeldas.join('')}</div>`);
                binPartes.push(`<div class="bin-group">${binCeldas.join('')}</div>`);
            });
        } else {
            // Construir por grupos reales
            grupos.forEach(grupo => {
                // Extraer variables del grupo
                const tokens = grupo.match(/[A-Z]'?/g) || [];
                const expCeldas = variables.map(v => {
                    const neg = tokens.includes(`${v}'`);
                    const pos = tokens.includes(v);
                    if (neg) return this._cell(`<span class="neg">${v}</span>`);
                    if (pos) return this._cell(v);
                    return this._cell('-');
                });
                const binStr = this.convertirGrupoABinario(grupo);
                const binCeldas = binStr.split('').map(ch => this._cell(ch));
                expPartes.push(`<div class="expr-group">${expCeldas.join('')}</div>`);
                binPartes.push(`<div class="bin-group">${binCeldas.join('')}</div>`);
            });
        }

        // Añadir '+' dentro de cada grupo excepto el último
        const withPlus = (arr) => arr.map((html, idx) => {
            const isLast = idx === arr.length - 1;
            return isLast ? html : html.replace('</div>', '<span class="group-plus">+</span></div>');
        });
        const expHTML = withPlus(expPartes).join('');
        const binHTML = withPlus(binPartes).join('');
        return { expHTML, binHTML };
    }

    _cell(contenido) {
        return `<span class="cell">${contenido}</span>`;
    }
    
    /**
     * Genera guiones para la expresión según la cantidad de variables y minterms
     */
    generarGuionesExpresion() {
        const cantidadMinterms = this.mintermsSeleccionados.size;
        const cantidadVariables = this.numVariables;
        
        if (cantidadMinterms === 0 || cantidadVariables === 0) {
            return '-----';
        }
        
        const grupos = [];
        for (let i = 0; i < cantidadMinterms; i++) {
            const guionesGrupo = '-'.repeat(cantidadVariables);
            grupos.push(guionesGrupo);
        }
        
        return grupos.join(' + ');
    }
    
    /**
     * Genera guiones para el binario según la cantidad de variables y minterms
     */
    generarGuionesBinario() {
        const cantidadMinterms = this.mintermsSeleccionados.size;
        const cantidadVariables = this.numVariables;
        
        if (cantidadMinterms === 0 || cantidadVariables === 0) {
            return '-----';
        }
        
        const grupos = [];
        for (let i = 0; i < cantidadMinterms; i++) {
            const guionesGrupo = '-'.repeat(cantidadVariables);
            grupos.push(guionesGrupo);
        }
        
        return grupos.join(' + ');
    }
    
    /**
     * Alinea caracteres usando CSS letter-spacing para alineación perfecta
     */
    alinearCaracteres(texto) {
        // Remover HTML tags para contar caracteres
        const textoLimpio = texto.replace(/<[^>]*>/g, '');
        
        // Dividir en grupos separados por +
        const grupos = textoLimpio.split('+');
        const gruposAlineados = grupos.map(grupo => {
            // Limpiar espacios y mantener solo los caracteres
            return grupo.trim().replace(/\s+/g, '');
        });
        
        return gruposAlineados.join(' + ');
    }
    
    /**
     * Genera el formato binario de la expresión
     * @param {string} expresion - Expresión con notación de usuario
     * @returns {string} - Formato binario de la expresión
     */
    generarFormatoBinario(expresion) {
        if (!expresion || expresion.trim() === '') {
            return '-----';
        }
        
        // Dividir la expresión en grupos (separados por +)
        const grupos = expresion.split('+').filter(grupo => grupo.trim());
        
        // Convertir cada grupo a binario
        const gruposBinarios = grupos.map(grupo => {
            return this.convertirGrupoABinario(grupo.trim());
        });
        
        // Unir los grupos con +
        return gruposBinarios.join(' + ');
    }
    
    /**
     * Convierte un grupo de variables a formato binario (Sum of Products)
     * @param {string} grupo - Grupo de variables (ej: "AB'C")
     * @returns {string} - Formato binario del grupo
     */
    convertirGrupoABinario(grupo) {
        const variablesPermitidas = this.obtenerVariablesPermitidas(this.numVariables);
        let binario = '';
        
        // Extraer todas las variables del grupo (normales y negadas)
        const variablesEnGrupo = grupo.match(/[A-Z]'?/g) || [];
        
        // Para cada variable permitida, verificar si está en el grupo
        variablesPermitidas.forEach(variable => {
            const variableNormal = variablesEnGrupo.includes(variable);
            const variableNegada = variablesEnGrupo.includes(variable + "'");
            
            if (variableNormal) {
                binario += '1'; // X = 1
            } else if (variableNegada) {
                binario += '0'; // X' = 0
            } else {
                binario += '-'; // Variable no presente (don't care)
            }
        });
        
        return binario;
    }
    
    /**
     * Parsea las negaciones de la expresión del usuario
     * Convierte A' en !A, B' en !B, etc.
     * @param {string} expresion - Expresión con notación de usuario (A', B', etc.)
     * @returns {string} - Expresión con notación JavaScript (!A, !B, etc.)
     */
    parsearNegaciones(expresion) {
        // Busca [UNA LETRA] seguida de [']
        // 'gi' significa: g (global, todas las veces) e i (insensitive, ignora mayúsculas/minúsculas)
        // '$1' se refiere a la letra que encontró dentro del paréntesis ([A-Z])
        let expresionParseada = expresion.replace(/([A-Z])'/gi, '!$1');
        
        return expresionParseada;
    }
    
    /**
     * Normaliza la expresión booleana para evaluación según el principio fundamental:
     * - Parser robusto que maneja cualquier orden de variables
     * - BA es lo mismo que AB (conmutatividad del AND)
     * - Solo valida formato, no orden de variables
     * @param {string} expresion - Expresión con notación de usuario
     * @returns {string} - Expresión normalizada para JavaScript
     */
    normalizarExpresion(expresion) {
        let normalizada = expresion;
        console.log('Expresión original:', normalizada);
        
        // Parsear negaciones: A' -> !A, B' -> !B, etc.
        normalizada = this.parsearNegaciones(normalizada);
        console.log('Después de parsear negaciones:', normalizada);
        
        // Reemplazar operadores
        normalizada = normalizada.replace(/\*/g, '&&');  // AND explícito (si el usuario lo pone manualmente)
        normalizada = normalizada.replace(/\+/g, '||');  // OR
        console.log('Después de reemplazar operadores:', normalizada);
        
        // Manejar AND implícito múltiples veces hasta que no haya más cambios
        let anterior = '';
        while (anterior !== normalizada) {
            anterior = normalizada;
            // AND implícito entre variables consecutivas
            // Patrón 1: Variable seguida de variable (AB -> A && B)
            normalizada = normalizada.replace(/([A-Z])([A-Z])/g, '$1 && $2');
            // Patrón 2: Variable negada seguida de variable (!AB -> !A && B)
            normalizada = normalizada.replace(/(![A-Z])([A-Z])/g, '$1 && $2');
            // Patrón 3: Variable seguida de variable negada (A!B -> A && !B)
            normalizada = normalizada.replace(/([A-Z])(![A-Z])/g, '$1 && $2');
            // Patrón 4: Variable negada seguida de variable negada (!A!B -> !A && !B)
            normalizada = normalizada.replace(/(![A-Z])(![A-Z])/g, '$1 && $2');
        }
        console.log('Después de manejar AND implícito:', normalizada);
        
        // Limpiar espacios extra
        normalizada = normalizada.replace(/\s+/g, ' ').trim();
        console.log('Expresión final normalizada:', normalizada);
        
        return normalizada;
    }
    
    // Generación del mapa desde minterms seleccionados
    generarMapaDesdeMinterms() {
        try {
            this.limpiarErrores();
            
            // Crear tabla de verdad basada en minterms seleccionados
            const tablaVerdad = this.crearTablaVerdadDesdeMinterms();
            
            // Generar el mapa
            this.visualizarMapaKarnaugh(tablaVerdad, this.numVariables);
            
        } catch (error) {
            console.error('Error al generar mapa:', error);
            this.mostrarError('Error interno: ' + error.message);
        }
    }
    
    crearTablaVerdadDesdeMinterms() {
        const totalMinterms = Math.pow(2, this.numVariables);
        const tablaVerdad = new Array(totalMinterms).fill(0);
        
        this.mintermsSeleccionados.forEach(minterm => {
            if (minterm < totalMinterms) {
                tablaVerdad[minterm] = 1;
            }
        });
        
        return tablaVerdad;
    }
    
    // Generación del mapa desde expresión booleana
    generarMapaDesdeExpresion() {
        try {
            this.limpiarErrores();
            
            if (!this.expresionActual || !this.expresionActual.trim()) {
                this.mostrarError('Por favor, ingresa una expresión booleana.');
                return;
            }
            
            // Normalizar la expresión
            const expresionNormalizada = this.normalizarExpresion(this.expresionActual);
            console.log('Expresión normalizada:', expresionNormalizada);
            
            // Generar tabla de verdad
            const tablaVerdad = this.generarTablaVerdadDesdeExpresion(expresionNormalizada);
            console.log('Tabla de verdad:', tablaVerdad);
            
            // Generar el mapa
            this.visualizarMapaKarnaugh(tablaVerdad, this.numVariables);
            
        } catch (error) {
            console.error('Error al generar mapa desde expresión:', error);
            this.mostrarError('Error al procesar la expresión: ' + error.message);
        }
    }
    
    generarTablaVerdadDesdeExpresion(expresionNormalizada) {
        const tablaVerdad = [];
        const variablesPermitidas = this.obtenerVariablesPermitidas(this.numVariables);
        
        // Generar todas las combinaciones posibles (2^N)
        for (let i = 0; i < Math.pow(2, this.numVariables); i++) {
            // Convertir número a binario y asignar a variables
            const valoresBinarios = this.numeroABinario(i, this.numVariables);
            const contexto = this.crearContextoVariables(variablesPermitidas, valoresBinarios);
            
            // Evaluar la expresión con estos valores
            try {
                const resultado = this.evaluarExpresion(expresionNormalizada, contexto);
                tablaVerdad.push(resultado ? 1 : 0);
            } catch (error) {
                console.error('Error evaluando expresión:', error);
                tablaVerdad.push(0);
            }
        }
        
        return tablaVerdad;
    }
    
    // Convertir número a representación binaria con padding
    numeroABinario(numero, numBits) {
        return numero.toString(2).padStart(numBits, '0').split('').map(bit => bit === '1');
    }
    
    // Crear contexto de variables para evaluación
    crearContextoVariables(variables, valores) {
        const contexto = {};
        variables.forEach((variable, index) => {
            contexto[variable] = valores[index];
        });
        return contexto;
    }
    
    // Evaluar expresión de forma segura
    evaluarExpresion(expresion, contexto) {
        // Crear función segura para evaluar la expresión
        const variables = Object.keys(contexto);
        const valores = variables.map(v => contexto[v]);
        
        console.log('Evaluando expresión:', expresion);
        console.log('Variables:', variables);
        console.log('Valores:', valores);
        console.log('Contexto:', contexto);
        
        // Crear función que recibe las variables como parámetros
        const funcionEvaluacion = new Function(...variables, `return (${expresion})`);
        
        const resultado = funcionEvaluacion(...valores);
        console.log('Resultado:', resultado);
        
        return resultado;
    }
    
    // Visualización del mapa (reutilizar lógica anterior)
    visualizarMapaKarnaugh(tablaVerdad, numVariables) {
        const contenedor = document.getElementById('contenedorMapaK');
        contenedor.innerHTML = '';
        contenedor.className = 'mapa-container'; // Quitar clase vacio
        
        if (numVariables <= 4) {
            this.generarMapaSimple(contenedor, tablaVerdad, numVariables);
        } else {
            this.generarMapaComplejo(contenedor, numVariables);
        }
    }
    
    generarMapaSimple(contenedor, tablaVerdad, numVariables) {
        const grid = document.createElement('div');
        grid.className = 'karnaugh-grid';
        
        if (numVariables === 2) {
            grid.classList.add('grid-2x2');
            this.dibujarMapa2Variables(grid, tablaVerdad);
        } else if (numVariables === 3) {
            grid.classList.add('grid-2x4');
            this.dibujarMapa3Variables(grid, tablaVerdad);
        } else if (numVariables === 4) {
            grid.classList.add('grid-4x4');
            this.dibujarMapa4Variables(grid, tablaVerdad);
        }
        
        contenedor.appendChild(grid);
    }
    
    generarMapaComplejo(contenedor, numVariables) {
        const mensaje = document.createElement('div');
        mensaje.className = 'map-info';
        mensaje.innerHTML = `
            <h3>Mapas de Karnaugh para ${numVariables} variables</h3>
            <p>Los mapas para más de 4 variables requieren múltiples mapas de 4 variables. Esta funcionalidad estará disponible en una versión futura.</p>
        `;
        contenedor.appendChild(mensaje);
    }
    
    dibujarMapa2Variables(grid, tablaVerdad) {
        const mapeo = [
            [null, '0', '1'],
            ['0', 0, 1],
            ['1', 2, 3]
        ];
        this.dibujarGrilla(grid, mapeo, tablaVerdad);
    }
    
    dibujarMapa3Variables(grid, tablaVerdad) {
        const mapeo = [
            [null, '00', '01', '11', '10'],
            ['0', 0, 1, 3, 2],
            ['1', 4, 5, 7, 6]
        ];
        this.dibujarGrilla(grid, mapeo, tablaVerdad);
    }
    
    dibujarMapa4Variables(grid, tablaVerdad) {
        const mapeo = [
            [null, '00', '01', '11', '10'],
            ['00', 0, 4, 12, 8],
            ['01', 1, 5, 13, 9],
            ['11', 3, 7, 15, 11],
            ['10', 2, 6, 14, 10]
        ];
        this.dibujarGrilla(grid, mapeo, tablaVerdad);
    }
    
    dibujarGrilla(grid, mapeo, tablaVerdad) {
        mapeo.forEach((fila, filaIndex) => {
            fila.forEach((celda, colIndex) => {
                const div = document.createElement('div');
                
                if (celda === null) {
                    div.className = 'celda header';
                    div.textContent = '';
                } else if (typeof celda === 'string') {
                    div.className = 'celda header';
                    div.textContent = celda;
                } else {
                    const valor = tablaVerdad[celda];
                    div.className = `celda ${valor === 1 ? 'uno' : 'cero'}`;
                    div.textContent = valor;
                }
                
                grid.appendChild(div);
            });
        });
    }
    
    // Utilidades
    mostrarPaso(paso) {
        // Ocultar todos los pasos
        document.querySelectorAll('.step-container').forEach(step => {
            step.classList.add('hidden');
        });
        
        // Mostrar paso actual
        document.getElementById(`paso${paso}`).classList.remove('hidden');
        this.pasoActual = paso;
        
        // Actualizar sidebar
        this.actualizarSidebar();

        // Actualizar título del paso en sidebar
        const sidebarTitle = document.getElementById('sidebarStepTitle');
        if (sidebarTitle) {
            if (paso === 1) sidebarTitle.textContent = 'Paso 1: Selecciona la cantidad de variables';
            if (paso === 2) sidebarTitle.textContent = 'Paso 2: Selecciona los minterms (valores 1)';
            if (paso === 3) sidebarTitle.textContent = 'Paso 3: Genera el mapa de Karnaugh';
        }
    }
    
    /**
     * Actualiza el estado del sidebar
     */
    actualizarSidebar() {
        // Actualizar indicadores de pasos
        for (let i = 1; i <= 3; i++) {
            const indicator = document.getElementById(`stepIndicator${i}`);
            const stepNumber = indicator.querySelector('.step-number');
            const stepStatus = indicator.querySelector('.step-status');
            const stepTitleEl = indicator.querySelector('.step-title');
            
            // Remover clases anteriores
            indicator.classList.remove('active', 'completed');
            
            if (i < this.pasoActual) {
                // Paso completado
                indicator.classList.add('completed');
                stepStatus.textContent = 'Completado';
                if (stepTitleEl) stepTitleEl.textContent = '';
            } else if (i === this.pasoActual) {
                // Paso activo
                indicator.classList.add('active');
                stepStatus.textContent = 'Activo';
                if (stepTitleEl) {
                    if (i === 1) stepTitleEl.textContent = 'Paso 1: Selecciona la cantidad de variables';
                    if (i === 2) stepTitleEl.textContent = 'Paso 2: Selecciona los minterms (valores 1)';
                    if (i === 3) stepTitleEl.textContent = 'Paso 3: Genera el mapa de Karnaugh';
                }
            } else {
                // Paso pendiente
                stepStatus.textContent = 'Pendiente';
                if (stepTitleEl) stepTitleEl.textContent = '';
            }
        }
        
        // Actualizar botón de retroceder
        const btnRetroceder = document.getElementById('btnRetroceder');
        if (this.pasoActual > 1) {
            btnRetroceder.disabled = false;
        } else {
            btnRetroceder.disabled = true;
        }
        
        // Botones de anterior en títulos removidos del layout
    }
    
    /**
     * Retrocede al paso anterior
     */
    retrocederPaso() {
        if (this.pasoActual > 1) {
            // Si volvemos desde el Paso 3, limpiar expresión, slots y mapa
            if (this.pasoActual === 3) {
                this.expresionActual = '';
                const slotsContainer = document.getElementById('slotsContainer');
                if (slotsContainer) {
                    slotsContainer.innerHTML = '';
                }
                this.actualizarDisplayExpresion();
                this.limpiarMapa();
            }
            this.mostrarPaso(this.pasoActual - 1);
        }
    }
    
    /**
     * Alterna la visibilidad del sidebar
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
        
        // Guardar estado en localStorage
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }
    
    /**
     * Inicializa el estado del sidebar desde localStorage
     */
    inicializarSidebar() {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        const sidebar = document.getElementById('sidebar');
        
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
        }
    }
    
    /**
     * Valida que todos los slots estén completos
     * @returns {boolean} true si todos los slots están completos, false en caso contrario
     */
    validarSlotsCompletos() {
        const slotsContainer = document.getElementById('slotsContainer');
        if (!slotsContainer) {
            return false;
        }
        
        const slots = slotsContainer.querySelectorAll('.slot-item');
        const totalSlots = slots.length;
        
        if (totalSlots === 0) {
            return false;
        }
        
        let slotsCompletos = 0;
        slots.forEach(slot => {
            if (slot.classList.contains('filled')) {
                slotsCompletos++;
            }
        });
        
        console.log(`Slots completos: ${slotsCompletos}/${totalSlots}`);
        return slotsCompletos === totalSlots;
    }
    
    /**
     * Obtiene las variables permitidas según el principio fundamental:
     * - Las variables están predefinidas en orden inmutable
     * - 4 variables SIEMPRE son A, B, C, D
     * - 3 variables SIEMPRE son A, B, C
     * - etc.
     * @param {number} numVariables - Número de variables seleccionadas
     * @returns {string[]} - Array de variables permitidas
     */
    obtenerVariablesPermitidas(numVariables) {
        const variables = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        return variables.slice(0, numVariables);
    }
    
    mostrarError(mensaje) {
        const zonaErrores = document.getElementById('zonaErrores');
        zonaErrores.textContent = mensaje;
        zonaErrores.classList.add('show');
    }
    
    limpiarErrores() {
        const zonaErrores = document.getElementById('zonaErrores');
        zonaErrores.textContent = '';
        zonaErrores.classList.remove('show');
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new KarnaughSolverMejorado();
});

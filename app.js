// Solucionador de Mapas de Karnaugh (MAPASK)
// Flujo paso a paso: 1. Variables → 2. Minterms → 3. Expresión → Mapa → Agrupar → Simplificar

const PALETA_GRUPOS = [
    { id: 1, nombre: 'G1', flat: '#0066ff', light: '#e0eeff', text: '#ffffff' },
    { id: 2, nombre: 'G2', flat: '#00a843', light: '#dcfce7', text: '#ffffff' },
    { id: 3, nombre: 'G3', flat: '#ff7700', light: '#ffedd5', text: '#ffffff' },
    { id: 4, nombre: 'G4', flat: '#8c1aff', light: '#f3e8ff', text: '#ffffff' },
    { id: 5, nombre: 'G5', flat: '#0097a7', light: '#cffafe', text: '#ffffff' },
    { id: 6, nombre: 'G6', flat: '#d81b60', light: '#fce7f3', text: '#ffffff' },
    { id: 7, nombre: 'G7', flat: '#b48200', light: '#fef9c3', text: '#ffffff' },
    { id: 8, nombre: 'G8', flat: '#3949ab', light: '#e0e7ff', text: '#ffffff' }
];

class KarnaughSolverMejorado {
    constructor() {
        this.numVariables = 4;
        this.mintermsSeleccionados = new Set();
        this.expresionActual = '';
        this.pasoActual = 1;
        this.invertirEjes4Var = false;
        this.errorTimeout = null;

        // Estado de las etapas posteriores a Generar Mapa
        this.modoMapaGenerado = false;
        this.agrupacionActiva = false;
        this.simplificacionActiva = false;
        this.tablaVerdadActual = [];
        this.gruposActuales = [];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.inicializarSidebar();
        this.mostrarPaso(1);
    }

    setupEventListeners() {
        // Paso 1: Selección de variables
        document.querySelectorAll('.variable-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const vars = parseInt(e.currentTarget.dataset.vars, 10);
                this.seleccionarVariables(vars);
            });
            option.addEventListener('dblclick', (e) => {
                const vars = parseInt(e.currentTarget.dataset.vars, 10);
                this.seleccionarVariables(vars);
                this.continuarPaso1();
            });
            option.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const vars = parseInt(e.currentTarget.dataset.vars, 10);
                    this.seleccionarVariables(vars);
                }
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

        const btnAleatorioPaso2 = document.getElementById('btnAleatorioPaso2');
        if (btnAleatorioPaso2) {
            btnAleatorioPaso2.addEventListener('click', () => {
                this.seleccionarAleatorio();
            });
        }

        document.getElementById('btnIncrementar').addEventListener('click', () => {
            this.incrementarMinterms();
        });

        document.getElementById('btnDecrementar').addEventListener('click', () => {
            this.decrementarMinterms();
        });

        document.getElementById('btnContinuarPaso2').addEventListener('click', () => {
            this.continuarPaso2();
        });

        // Paso 3: Constructor de expresiones
        const btnBorrarUltimo = document.getElementById('btnBorrarUltimo');
        if (btnBorrarUltimo) {
            btnBorrarUltimo.addEventListener('click', () => {
                this.borrarUltimaVariable();
            });
        }

        document.getElementById('btnLimpiarExpresion').addEventListener('click', () => {
            this.limpiarExpresion();
        });

        document.getElementById('btnAleatorio').addEventListener('click', () => {
            this.seleccionarAleatorio();
        });

        document.getElementById('btnGenerarMapa').addEventListener('click', () => {
            this.intentarGenerarMapa();
        });

        // Navegación del sidebar
        document.getElementById('btnRetroceder').addEventListener('click', () => {
            this.retrocederPaso();
        });

        document.querySelectorAll('.step-indicator').forEach(indicator => {
            indicator.addEventListener('click', () => {
                const targetStep = parseInt(indicator.dataset.step, 10);
                if (targetStep < this.pasoActual) {
                    while (this.pasoActual > targetStep) {
                        this.retrocederPaso();
                    }
                }
            });
        });

        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Soporte de teclado en Paso 3 (solo en modo constructor)
        document.addEventListener('keydown', (e) => {
            if (this.pasoActual !== 3 || this.modoMapaGenerado) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Backspace') {
                e.preventDefault();
                this.borrarUltimaVariable();
                return;
            }

            if (e.key === 'Enter' && !e.repeat) {
                if (document.activeElement && document.activeElement.tagName === 'BUTTON') return;
                e.preventDefault();
                this.intentarGenerarMapa();
                return;
            }

            const keyUpper = e.key.toUpperCase();
            const permitidas = this.obtenerVariablesPermitidas(this.numVariables);
            if (permitidas.includes(keyUpper) && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                const token = e.shiftKey ? `${keyUpper}'` : keyUpper;
                this.agregarAVariable(token);
            }
        });
    }

    // ==========================================
    // PASO 1: SELECCIÓN DE VARIABLES
    // ==========================================
    seleccionarVariables(numVars) {
        this.limpiarErrores();
        document.querySelectorAll('.variable-option').forEach(option => {
            option.classList.remove('selected');
        });

        const selectedEl = document.querySelector(`[data-vars="${numVars}"]`);
        if (selectedEl) {
            selectedEl.classList.add('selected');
        }

        if (this.numVariables !== numVars) {
            this.mintermsSeleccionados.clear();
            this.expresionActual = '';
        }

        this.numVariables = numVars;
        document.getElementById('btnContinuarPaso1').disabled = false;
    }

    continuarPaso1() {
        this.limpiarErrores();
        this.generarMinterms();
        this.mostrarPaso(2);
    }

    // ==========================================
    // PASO 2: SELECCIÓN DE MINTERMS
    // ==========================================
    generarMinterms() {
        const mintermGrid = document.getElementById('mintermGrid');
        mintermGrid.innerHTML = '';

        const totalMinterms = Math.pow(2, this.numVariables);
        mintermGrid.dataset.vars = this.numVariables;

        for (const m of Array.from(this.mintermsSeleccionados)) {
            if (m >= totalMinterms) {
                this.mintermsSeleccionados.delete(m);
            }
        }

        for (let i = 0; i < totalMinterms; i++) {
            const mintermItem = document.createElement('button');
            mintermItem.type = 'button';
            mintermItem.className = 'minterm-item';
            mintermItem.dataset.minterm = i;
            mintermItem.textContent = `m${i}`;

            mintermItem.addEventListener('click', () => {
                this.seleccionarHastaMinterm(i);
            });

            mintermGrid.appendChild(mintermItem);
        }

        this.actualizarVistaMinterms();
        this.actualizarContador();
    }

    seleccionarHastaMinterm(indiceObjetivo) {
        this.limpiarErrores();
        const totalMinterms = Math.pow(2, this.numVariables);

        if (indiceObjetivo === 0 && this.mintermsSeleccionados.size === 1 && this.mintermsSeleccionados.has(0)) {
            this.mintermsSeleccionados.clear();
        } else {
            this.mintermsSeleccionados.clear();
            for (let i = 0; i <= indiceObjetivo && i < totalMinterms; i++) {
                this.mintermsSeleccionados.add(i);
            }
        }

        this.actualizarVistaMinterms();
        this.actualizarContador();
    }

    seleccionarTodosMinterms() {
        this.limpiarErrores();
        const totalMinterms = Math.pow(2, this.numVariables);
        this.mintermsSeleccionados.clear();

        for (let i = 0; i < totalMinterms; i++) {
            this.mintermsSeleccionados.add(i);
        }

        this.actualizarVistaMinterms();
        this.actualizarContador();
    }

    deseleccionarTodosMinterms() {
        this.limpiarErrores();
        this.mintermsSeleccionados.clear();
        this.actualizarVistaMinterms();
        this.actualizarContador();
    }

    incrementarMinterms() {
        this.limpiarErrores();
        const totalMinterms = Math.pow(2, this.numVariables);
        if (this.mintermsSeleccionados.size < totalMinterms) {
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
        this.limpiarErrores();
        if (this.mintermsSeleccionados.size > 0) {
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
        const btnContinuar2 = document.getElementById('btnContinuarPaso2');
        const totalMinterms = Math.pow(2, this.numVariables);
        const seleccionados = this.mintermsSeleccionados.size;

        contador.textContent = `${seleccionados} / ${totalMinterms}`;

        btnIncrementar.disabled = seleccionados >= totalMinterms;
        btnDecrementar.disabled = seleccionados <= 0;
        if (btnContinuar2) {
            btnContinuar2.disabled = seleccionados <= 0;
        }
    }

    actualizarVistaMinterms() {
        document.querySelectorAll('.minterm-item').forEach(item => {
            const minterm = parseInt(item.dataset.minterm, 10);
            item.classList.toggle('selected', this.mintermsSeleccionados.has(minterm));
        });
    }

    continuarPaso2() {
        if (this.mintermsSeleccionados.size === 0) {
            this.mostrarError('Por favor, seleccioná al menos un término para continuar.');
            return;
        }

        this.limpiarErrores();
        this.expresionActual = '';
        this.salirModoMapaGenerado();
        this.generarBotonesVariables();
        this.generarSlots();
        this.mostrarPaso(3);
        this.generarMapaVacioConEstructura();
        this.actualizarDisplayExpresion();
    }

    // ==========================================
    // PASO 3: CONSTRUCTOR DE EXPRESIÓN
    // ==========================================
    seleccionarAleatorio() {
        this.limpiarErrores();

        if (this.pasoActual === 3) {
            const cantidadSlots = this.mintermsSeleccionados.size;
            if (cantidadSlots === 0) {
                this.mostrarError('Primero seleccioná la cantidad de términos en el Paso 2.');
                return;
            }

            const variables = this.obtenerVariablesPermitidas(this.numVariables);
            const totalPosibles = Math.pow(2, this.numVariables);

            // Generar índices de minterms únicos (Fisher-Yates sin reemplazo)
            const indicesDisponibles = Array.from({ length: totalPosibles }, (_, i) => i);
            for (let i = indicesDisponibles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indicesDisponibles[i], indicesDisponibles[j]] = [indicesDisponibles[j], indicesDisponibles[i]];
            }

            const limite = Math.min(cantidadSlots, totalPosibles);
            const gruposUnicos = new Set();

            for (const idx of indicesDisponibles) {
                if (gruposUnicos.size >= limite) break;
                const bits = idx.toString(2).padStart(this.numVariables, '0');
                const grupo = variables.map((v, pos) => (bits[pos] === '1' ? v : `${v}'`)).join('');
                gruposUnicos.add(grupo);
            }

            this.expresionActual = Array.from(gruposUnicos).join('+');
            this.salirModoMapaGenerado();
            this.limpiarMapa();
            this.actualizarDisplayExpresion();
            return;
        }

        // En Paso 2: seleccionar cantidad aleatoria
        const totalMinterms = Math.pow(2, this.numVariables);
        const minSeleccionar = Math.max(1, Math.floor(totalMinterms * 0.25));
        const maxSeleccionar = Math.max(minSeleccionar, Math.floor(totalMinterms * 0.75));
        const cantidad = Math.floor(Math.random() * (maxSeleccionar - minSeleccionar + 1)) + minSeleccionar;

        this.seleccionarHastaMinterm(cantidad - 1);
    }

    generarBotonesVariables() {
        const variableButtons = document.getElementById('variableButtons');
        variableButtons.innerHTML = '';

        const variables = this.obtenerVariablesPermitidas(this.numVariables);

        const labelContainer = document.createElement('div');
        labelContainer.className = 'variable-buttons-label';
        labelContainer.innerHTML = `
            <h4>Variables disponibles (${this.numVariables})</h4>
            <p>Clic o teclado (<kbd>A</kbd>–<kbd>${variables[variables.length - 1]}</kbd>, <kbd>Shift</kbd> para negada, <kbd>⌫</kbd> borrar):</p>
        `;
        variableButtons.appendChild(labelContainer);

        const variableGroupsContainer = document.createElement('div');
        variableGroupsContainer.className = 'variable-groups-container';
        variableButtons.appendChild(variableGroupsContainer);

        variables.forEach(variable => {
            const variableGroup = document.createElement('div');
            variableGroup.className = 'variable-group';
            variableGroup.setAttribute('data-variable', variable);

            const btnNormal = document.createElement('button');
            btnNormal.type = 'button';
            btnNormal.className = 'variable-btn';
            btnNormal.textContent = variable;
            btnNormal.title = `Agregar variable ${variable} (Tecla ${variable})`;
            btnNormal.addEventListener('click', () => {
                this.agregarAVariable(variable);
            });
            variableGroup.appendChild(btnNormal);

            const btnNegada = document.createElement('button');
            btnNegada.type = 'button';
            btnNegada.className = 'variable-btn negated';
            btnNegada.innerHTML = `<span class="neg-overline">${variable}</span>`;
            btnNegada.title = `Agregar variable ${variable} negada (Shift + ${variable})`;
            btnNegada.addEventListener('click', () => {
                this.agregarAVariable(`${variable}'`);
            });
            variableGroup.appendChild(btnNegada);

            variableGroupsContainer.appendChild(variableGroup);
        });

        this.actualizarEstadoBotones();
    }

    generarSlots() {
        const slotsContainer = document.getElementById('slotsContainer');
        slotsContainer.innerHTML = '';

        const cantidadSlots = this.mintermsSeleccionados.size;

        for (let i = 0; i < cantidadSlots; i++) {
            const group = document.createElement('div');
            group.className = 'slot-group';

            const slot = document.createElement('div');
            slot.className = 'slot-item';
            slot.textContent = `m${i}`;
            slot.dataset.slotIndex = i;
            group.appendChild(slot);

            if (i < cantidadSlots - 1) {
                const separator = document.createElement('span');
                separator.className = 'slot-separator';
                separator.textContent = '+';
                group.appendChild(separator);
            }

            slotsContainer.appendChild(group);
        }

        this.actualizarSlots();
    }

    obtenerGruposCrudos() {
        if (!this.expresionActual) return [];
        return this.expresionActual.split('+');
    }

    obtenerIndiceSlotActivo() {
        if (this.modoMapaGenerado) return null;
        const totalSlots = this.mintermsSeleccionados.size;
        if (totalSlots === 0) return null;

        const grupos = this.obtenerGruposCrudos();
        if (grupos.length === 0) return 0;

        const ultimoIdx = grupos.length - 1;
        const tokensUltimo = grupos[ultimoIdx].match(/[A-Z]'?/g) || [];

        if (tokensUltimo.length < this.numVariables) {
            return ultimoIdx;
        }
        if (grupos.length < totalSlots) {
            return grupos.length;
        }
        return null;
    }

    actualizarSlots() {
        const slots = document.querySelectorAll('.slot-item');
        const grupos = this.obtenerGruposCrudos().filter(g => g.trim().length > 0);
        const slotActivoIdx = this.obtenerIndiceSlotActivo();

        slots.forEach((slot, index) => {
            const grupoTexto = index < grupos.length ? grupos[index].trim() : '';
            const tokens = grupoTexto.match(/[A-Z]'?/g) || [];
            const estaCompleto = tokens.length === this.numVariables;
            const esParcial = tokens.length > 0 && tokens.length < this.numVariables;

            slot.classList.toggle('filled', estaCompleto);
            slot.classList.toggle('partial', esParcial);
            slot.classList.toggle('active-slot', index === slotActivoIdx);

            if (tokens.length > 0) {
                slot.innerHTML = this.convertirNegadosEnSlots(tokens);
            } else {
                slot.textContent = `m${index}`;
            }
        });
    }

    convertirNegadosEnSlots(tokens) {
        return tokens.map(termino => {
            if (termino.endsWith("'")) {
                const variable = termino[0];
                return `<span class="slot-termino slot-negado"><span class="neg-overline">${variable}</span></span>`;
            }
            return `<span class="slot-termino slot-normal">${termino}</span>`;
        }).join('');
    }

    agregarAVariable(variable) {
        if (!this.validarOrdenVariable(variable)) {
            return;
        }

        this.limpiarErrores();
        this.expresionActual += variable;

        const ultimoMas = this.expresionActual.lastIndexOf('+');
        const grupoActual = ultimoMas === -1 ? this.expresionActual : this.expresionActual.substring(ultimoMas + 1);
        const variablesEnGrupo = (grupoActual.match(/[A-Z]'?/g) || []).length;

        const totalSlots = this.mintermsSeleccionados.size;
        const gruposActuales = this.expresionActual.split('+').length;

        if (variablesEnGrupo >= this.numVariables && gruposActuales < totalSlots) {
            this.expresionActual += '+';
        }

        this.actualizarDisplayExpresion();
    }

    borrarUltimaVariable() {
        this.limpiarErrores();
        if (!this.expresionActual) return;

        if (this.expresionActual.endsWith('+')) {
            this.expresionActual = this.expresionActual.slice(0, -1);
        }

        this.expresionActual = this.expresionActual.replace(/[A-Z]'?$/, '');

        this.limpiarMapa();
        this.actualizarDisplayExpresion();
    }

    obtenerGruposCompletadosBinarios() {
        const usados = new Set();
        if (!this.expresionActual) return usados;

        const grupos = this.expresionActual.split('+');
        grupos.forEach(g => {
            const tokens = g.trim().match(/[A-Z]'?/g) || [];
            if (tokens.length === this.numVariables) {
                const bin = tokens.map(t => (t.endsWith("'") ? '0' : '1')).join('');
                usados.add(bin);
            }
        });
        return usados;
    }

    tieneCombinacionDisponible(tokensActuales, candidata, usadosSet = null) {
        const usados = usadosSet || this.obtenerGruposCompletadosBinarios();
        const nuevosTokens = [...tokensActuales, candidata];
        const prefijoBin = nuevosTokens.map(t => (t.endsWith("'") ? '0' : '1')).join('');
        const restantes = this.numVariables - nuevosTokens.length;
        const maxCombinacionesEnRama = Math.pow(2, restantes);

        let usadosConPrefijo = 0;
        for (const bin of usados) {
            if (bin.startsWith(prefijoBin)) {
                usadosConPrefijo++;
            }
        }

        return usadosConPrefijo < maxCombinacionesEnRama;
    }

    validarOrdenVariable(variable) {
        const totalSlots = this.mintermsSeleccionados.size;
        if (this.validarSlotsCompletos()) {
            this.mostrarError(`Ya completaste los ${totalSlots} términos. Pulsá "Generar Mapa" o borrá para editar.`);
            return false;
        }

        const variableBase = variable.replace("'", "");
        const variablesPermitidas = this.obtenerVariablesPermitidas(this.numVariables);

        const ultimoMas = this.expresionActual.lastIndexOf('+');
        const grupoActual = ultimoMas === -1 ? this.expresionActual : this.expresionActual.substring(ultimoMas + 1);
        const tokensEnGrupo = grupoActual.match(/[A-Z]'?/g) || [];
        const variablesEnGrupo = tokensEnGrupo.map(v => v.replace("'", ""));

        if (variablesEnGrupo.length === 0) {
            if (variableBase !== 'A') {
                this.mostrarError(`Cada término debe comenzar con la variable A.`);
                return false;
            }
        } else {
            const ultimaVariable = variablesEnGrupo[variablesEnGrupo.length - 1];
            const indiceUltima = variablesPermitidas.indexOf(ultimaVariable);
            const indiceNueva = variablesPermitidas.indexOf(variableBase);

            if (indiceNueva <= indiceUltima) {
                this.mostrarError(`La variable ${variableBase} ya fue ingresada en este término. Orden requerido: ${variablesPermitidas.join(' → ')}.`);
                return false;
            } else if (indiceNueva > indiceUltima + 1) {
                this.mostrarError(`Falta ingresar ${variablesPermitidas[indiceUltima + 1]} antes de ${variableBase}.`);
                return false;
            }
        }

        if (!this.tieneCombinacionDisponible(tokensEnGrupo, variable)) {
            const candidatoTexto = [...tokensEnGrupo, variable].join('');
            if (tokensEnGrupo.length + 1 === this.numVariables) {
                this.mostrarError(`El término ${candidatoTexto} ya fue ingresado. No se permiten conjuntos repetidos.`);
            } else {
                this.mostrarError(`Todas las combinaciones que empiezan con ${candidatoTexto} ya fueron utilizadas.`);
            }
            return false;
        }

        return true;
    }

    actualizarEstadoBotones() {
        const variablesPermitidas = this.obtenerVariablesPermitidas(this.numVariables);
        const todosCompletos = this.validarSlotsCompletos();
        const usados = this.obtenerGruposCompletadosBinarios();

        let proximaVariableValida = null;
        let tokensEnGrupo = [];

        if (!todosCompletos) {
            const ultimoMas = this.expresionActual.lastIndexOf('+');
            const grupoActual = ultimoMas === -1 ? this.expresionActual : this.expresionActual.substring(ultimoMas + 1);
            tokensEnGrupo = grupoActual.match(/[A-Z]'?/g) || [];
            const variablesEnGrupo = tokensEnGrupo.map(v => v.replace("'", ""));

            if (variablesEnGrupo.length === 0) {
                proximaVariableValida = 'A';
            } else {
                const ultimaVariable = variablesEnGrupo[variablesEnGrupo.length - 1];
                const indiceUltima = variablesPermitidas.indexOf(ultimaVariable);
                if (indiceUltima < variablesPermitidas.length - 1) {
                    proximaVariableValida = variablesPermitidas[indiceUltima + 1];
                }
            }
        }

        variablesPermitidas.forEach(variable => {
            const variableGroup = document.querySelector(`[data-variable="${variable}"]`);
            if (variableGroup) {
                const btnNormal = variableGroup.querySelector('.variable-btn:not(.negated)');
                const btnNegada = variableGroup.querySelector('.variable-btn.negated');
                const esTurnoVariable = variable === proximaVariableValida;

                const normalDisponible = esTurnoVariable && this.tieneCombinacionDisponible(tokensEnGrupo, variable, usados);
                const negadaDisponible = esTurnoVariable && this.tieneCombinacionDisponible(tokensEnGrupo, `${variable}'`, usados);

                variableGroup.classList.toggle('active-var-group', esTurnoVariable);

                if (btnNormal) {
                    btnNormal.disabled = !normalDisponible;
                    btnNormal.classList.toggle('disabled', !normalDisponible);
                    btnNormal.title = normalDisponible
                        ? `Agregar variable ${variable} (Tecla ${variable})`
                        : (esTurnoVariable ? `Combinación con ${variable} ya utilizada` : (todosCompletos ? 'Todos los términos están completos' : `Ingresá ${proximaVariableValida} primero`));
                }

                if (btnNegada) {
                    btnNegada.disabled = !negadaDisponible;
                    btnNegada.classList.toggle('disabled', !negadaDisponible);
                    btnNegada.title = negadaDisponible
                        ? `Agregar variable ${variable} negada (Shift + ${variable})`
                        : (esTurnoVariable ? `Combinación con ${variable}' ya utilizada` : (todosCompletos ? 'Todos los términos están completos' : `Ingresá ${proximaVariableValida} primero`));
                }
            }
        });

        const btnBorrar = document.getElementById('btnBorrarUltimo');
        if (btnBorrar) {
            btnBorrar.disabled = !this.expresionActual || this.expresionActual.length === 0;
        }
    }

    limpiarExpresion() {
        this.limpiarErrores();
        this.expresionActual = '';
        this.salirModoMapaGenerado();
        this.limpiarMapa();
        this.actualizarDisplayExpresion();
    }

    limpiarMapa() {
        this.generarMapaVacioConEstructura();
    }

    actualizarDisplayExpresion() {
        const variables = this.obtenerVariablesPermitidas(this.numVariables);
        const { expHTML, binHTML } = this.construirHTMLAlineado(variables);

        const display = document.getElementById('expressionDisplay');
        if (display) {
            display.innerHTML = `
                <div class="expression-label">Exp:</div>
                <div class="expression-text">${expHTML}</div>
                <div class="binary-label">Bin:</div>
                <div class="expression-binary">${binHTML}</div>
            `;
        }

        this.actualizarSlots();
        this.actualizarEstadoBotones();

        const slotsContainer = document.getElementById('slotsContainer');
        if (slotsContainer) {
            slotsContainer.classList.toggle('slots-grid', this.mintermsSeleccionados.size > 6);
        }
    }

    construirHTMLAlineado(variables) {
        const totalSlots = Math.max(1, this.mintermsSeleccionados.size);
        const gruposIngresados = this.expresionActual
            ? this.expresionActual.split('+').map(g => g.trim()).filter(g => g.length > 0)
            : [];
        const slotActivoIdx = this.obtenerIndiceSlotActivo();

        const expPartes = [];
        const binPartes = [];

        for (let i = 0; i < totalSlots; i++) {
            const grupo = i < gruposIngresados.length ? gruposIngresados[i] : '';
            const tokens = grupo.match(/[A-Z]'?/g) || [];
            const activeClass = i === slotActivoIdx ? ' active-group' : '';

            const expCeldas = [];
            const binCeldas = [];

            variables.forEach(v => {
                const neg = tokens.includes(`${v}'`);
                const pos = tokens.includes(v);
                if (neg) {
                    expCeldas.push(this._cell(`<span class="neg">${v}</span>`));
                    binCeldas.push(this._cell('0'));
                } else if (pos) {
                    expCeldas.push(this._cell(v));
                    binCeldas.push(this._cell('1'));
                } else {
                    expCeldas.push(this._cell('<span class="placeholder-dash">-</span>'));
                    binCeldas.push(this._cell('<span class="placeholder-dash">-</span>'));
                }
            });

            const plusSpan = i < totalSlots - 1 ? '<span class="group-plus">+</span>' : '';
            expPartes.push(`<div class="expr-group${activeClass}">${expCeldas.join('')}${plusSpan}</div>`);
            binPartes.push(`<div class="bin-group${activeClass}">${binCeldas.join('')}${plusSpan}</div>`);
        }

        return {
            expHTML: expPartes.join(''),
            binHTML: binPartes.join('')
        };
    }

    _cell(contenido) {
        return `<span class="cell">${contenido}</span>`;
    }

    validarSlotsCompletos() {
        const totalSlots = this.mintermsSeleccionados.size;
        if (totalSlots === 0 || !this.expresionActual.trim()) {
            return false;
        }

        const grupos = this.expresionActual.split('+').map(g => g.trim()).filter(Boolean);
        if (grupos.length !== totalSlots) {
            return false;
        }

        return grupos.every(grupo => {
            const tokens = grupo.match(/[A-Z]'?/g) || [];
            return tokens.length === this.numVariables;
        });
    }

    intentarGenerarMapa() {
        if (!this.validarSlotsCompletos()) {
            this.mostrarError('Debés completar todas las variables de cada término antes de generar el mapa.');
            return;
        }

        this.limpiarErrores();
        this.generarMapaDesdeExpresion();
    }

    // ==========================================
    // FLUJO APILADO: GENERAR MAPA → AGRUPAR → SIMPLIFICAR
    // ==========================================
    activarModoMapaGenerado() {
        this.modoMapaGenerado = true;
        this.agrupacionActiva = false;
        this.simplificacionActiva = false;

        const paso3Content = document.getElementById('paso3Content');
        if (paso3Content) {
            paso3Content.classList.add('modo-generado');
            paso3Content.classList.remove('con-etapas-abajo');
        }

        const zonaScroll = document.getElementById('zonaEtapasScroll');
        const etapaAgrupacion = document.getElementById('etapaAgrupacion');
        const etapaSimplificacion = document.getElementById('etapaSimplificacion');
        if (zonaScroll) {
            zonaScroll.classList.add('hidden');
            zonaScroll.scrollTop = 0;
        }
        if (etapaAgrupacion) {
            etapaAgrupacion.innerHTML = '';
            etapaAgrupacion.classList.add('hidden');
        }
        if (etapaSimplificacion) {
            etapaSimplificacion.innerHTML = '';
            etapaSimplificacion.classList.add('hidden');
        }

        this.actualizarDisplayExpresion();
    }

    salirModoMapaGenerado() {
        this.modoMapaGenerado = false;
        this.agrupacionActiva = false;
        this.simplificacionActiva = false;
        this.gruposActuales = [];

        const paso3Content = document.getElementById('paso3Content');
        if (paso3Content) {
            paso3Content.classList.remove('modo-generado', 'con-etapas-abajo');
        }

        const zonaScroll = document.getElementById('zonaEtapasScroll');
        const etapaAgrupacion = document.getElementById('etapaAgrupacion');
        const etapaSimplificacion = document.getElementById('etapaSimplificacion');
        if (zonaScroll) {
            zonaScroll.classList.add('hidden');
            zonaScroll.scrollTop = 0;
        }
        if (etapaAgrupacion) {
            etapaAgrupacion.innerHTML = '';
            etapaAgrupacion.classList.add('hidden');
        }
        if (etapaSimplificacion) {
            etapaSimplificacion.innerHTML = '';
            etapaSimplificacion.classList.add('hidden');
        }
    }

    generarMapaDesdeExpresion() {
        try {
            this.tablaVerdadActual = this.generarTablaVerdadDesdeExpresion(this.expresionActual);
            this.gruposActuales = this.calcularGruposOptimos(this.tablaVerdadActual, this.numVariables);
            this.activarModoMapaGenerado();
            this.visualizarMapaKarnaugh(this.tablaVerdadActual, this.numVariables, false);
        } catch (error) {
            console.error('Error al generar mapa desde expresión:', error);
            this.mostrarError('Error al procesar la expresión: ' + error.message);
        }
    }

    generarTablaVerdadDesdeExpresion(expresion) {
        const totalFilas = Math.pow(2, this.numVariables);
        const tablaVerdad = new Array(totalFilas).fill(0);
        const variablesPermitidas = this.obtenerVariablesPermitidas(this.numVariables);

        const grupos = expresion.split('+').map(g => g.trim()).filter(Boolean);

        const terminosParseados = grupos.map(grupo => {
            const tokens = grupo.match(/[A-Z]'?/gi) || [];
            return tokens.map(token => {
                const esNegada = token.endsWith("'");
                const letra = token[0].toUpperCase();
                const varIndex = variablesPermitidas.indexOf(letra);
                return { varIndex, valorEsperado: esNegada ? 0 : 1 };
            }).filter(r => r.varIndex !== -1);
        });

        for (let i = 0; i < totalFilas; i++) {
            const bits = i.toString(2).padStart(this.numVariables, '0').split('').map(Number);

            const cumpleAlgunTermino = terminosParseados.some(restricciones => {
                if (restricciones.length === 0) return false;
                return restricciones.every(({ varIndex, valorEsperado }) => bits[varIndex] === valorEsperado);
            });

            tablaVerdad[i] = cumpleAlgunTermino ? 1 : 0;
        }

        return tablaVerdad;
    }

    // ==========================================
    // ALGORITMO EXACTO DE AGRUPACIÓN K-MAP (IMPLICANTES PRIMOS + COBERTURA MÍNIMA)
    // ==========================================
    calcularGruposOptimos(tablaVerdad, numVariables) {
        const mintermsUno = [];
        tablaVerdad.forEach((val, idx) => {
            if (val === 1) mintermsUno.push(idx);
        });

        if (mintermsUno.length === 0) return [];

        const variables = this.obtenerVariablesPermitidas(numVariables);

        // Generar todas las máscaras ternarias posibles {0, 1, -}^N
        const todasLasMascaras = [];
        const generarMascaras = (prefijo) => {
            if (prefijo.length === numVariables) {
                todasLasMascaras.push(prefijo);
                return;
            }
            generarMascaras(prefijo + '0');
            generarMascaras(prefijo + '1');
            generarMascaras(prefijo + '-');
        };
        generarMascaras('');

        const mintermsDeMascara = (mascara) => {
            const lista = [];
            const total = Math.pow(2, numVariables);
            for (let m = 0; m < total; m++) {
                const bin = m.toString(2).padStart(numVariables, '0');
                let coincide = true;
                for (let k = 0; k < numVariables; k++) {
                    if (mascara[k] !== '-' && mascara[k] !== bin[k]) {
                        coincide = false;
                        break;
                    }
                }
                if (coincide) lista.push(m);
            }
            return lista;
        };

        // Filtrar implicantes válidos (todos sus minterms valen 1)
        const implicantesValidos = new Map();
        for (const mascara of todasLasMascaras) {
            const cubiertos = mintermsDeMascara(mascara);
            if (cubiertos.length > 0 && cubiertos.every(m => tablaVerdad[m] === 1)) {
                implicantesValidos.set(mascara, cubiertos);
            }
        }

        // Filtrar Implicantes Primos (aquellos que no pueden expandirse cambiando un 0/1 por '-')
        const implicantesPrimos = [];
        for (const [mascara, cubiertos] of implicantesValidos.entries()) {
            let esPrimo = true;
            for (let k = 0; k < numVariables; k++) {
                if (mascara[k] !== '-') {
                    const expandida = mascara.slice(0, k) + '-' + mascara.slice(k + 1);
                    if (implicantesValidos.has(expandida)) {
                        esPrimo = false;
                        break;
                    }
                }
            }
            if (esPrimo) {
                const LiteralesFijos = mascara.split('').filter(c => c !== '-').length;
                implicantesPrimos.push({
                    mascara,
                    minterms: cubiertos,
                    tamano: cubiertos.length,
                    literales: LiteralesFijos
                });
            }
        }

        // Ordenar implicantes primos: primero los de mayor tamaño (menos literales)
        implicantesPrimos.sort((a, b) => b.tamano - a.tamano || a.mascara.localeCompare(b.mascara));

        // 1. Seleccionar Implicantes Primos Esenciales
        const seleccionados = [];
        const indicesSeleccionados = new Set();
        const mintermsCubiertos = new Set();

        for (const m of mintermsUno) {
            const candidatos = [];
            implicantesPrimos.forEach((pi, idx) => {
                if (pi.minterms.includes(m)) candidatos.push(idx);
            });
            if (candidatos.length === 1) {
                const unicoIdx = candidatos[0];
                if (!indicesSeleccionados.has(unicoIdx)) {
                    indicesSeleccionados.add(unicoIdx);
                    seleccionados.push(implicantesPrimos[unicoIdx]);
                    implicantesPrimos[unicoIdx].minterms.forEach(x => mintermsCubiertos.add(x));
                }
            }
        }

        // 2. Cubrir minterms restantes con la menor cantidad de implicantes (y mayor tamaño)
        let faltantes = mintermsUno.filter(m => !mintermsCubiertos.has(m));
        if (faltantes.length > 0) {
            const restantesPI = implicantesPrimos
                .map((pi, idx) => ({ pi, idx }))
                .filter(item => !indicesSeleccionados.has(item.idx) && item.pi.minterms.some(m => faltantes.includes(m)));

            let mejorCombo = null;

            const buscarCobertura = (pos, actual, cubiertosSet) => {
                const todosCubiertos = faltantes.every(m => cubiertosSet.has(m));
                if (todosCubiertos) {
                    const costoLit = actual.reduce((acc, it) => acc + it.pi.literales, 0);
                    if (
                        !mejorCombo ||
                        actual.length < mejorCombo.items.length ||
                        (actual.length === mejorCombo.items.length && costoLit < mejorCombo.costoLit)
                    ) {
                        mejorCombo = { items: [...actual], costoLit };
                    }
                    return;
                }
                if (mejorCombo && actual.length >= mejorCombo.items.length) return;
                if (pos >= restantesPI.length) return;

                // Rama 1: incluir restantesPI[pos]
                const nuevoSet = new Set(cubiertosSet);
                restantesPI[pos].pi.minterms.forEach(m => nuevoSet.add(m));
                if (nuevoSet.size > cubiertosSet.size) {
                    actual.push(restantesPI[pos]);
                    buscarCobertura(pos + 1, actual, nuevoSet);
                    actual.pop();
                }

                // Rama 2: no incluir
                buscarCobertura(pos + 1, actual, cubiertosSet);
            };

            buscarCobertura(0, [], new Set());

            if (mejorCombo) {
                mejorCombo.items.forEach(it => seleccionados.push(it.pi));
            }
        }

        // Enriquecer cada grupo seleccionado con metadatos pedagógicos
        return seleccionados.map((grupo, idx) => {
            const color = PALETA_GRUPOS[idx % PALETA_GRUPOS.length];
            const varsFijas = [];
            const varsEliminadas = [];
            const tokensTermino = [];

            for (let k = 0; k < numVariables; k++) {
                const v = variables[k];
                if (grupo.mascara[k] === '1') {
                    varsFijas.push({ variable: v, bit: '1', token: v });
                    tokensTermino.push(v);
                } else if (grupo.mascara[k] === '0') {
                    varsFijas.push({ variable: v, bit: '0', token: `${v}'` });
                    tokensTermino.push(`${v}'`);
                } else {
                    varsEliminadas.push(v);
                }
            }

            return {
                id: idx + 1,
                nombre: `G${idx + 1}`,
                color,
                mascara: grupo.mascara,
                minterms: grupo.minterms,
                tamano: grupo.tamano,
                varsFijas,
                varsEliminadas,
                tokensTermino,
                esConstanteUno: tokensTermino.length === 0
            };
        });
    }

    /**
     * Paso apilado 1: Contrae el sidebar, fija el mapa arriba y despliega la Agrupación en el área scrolleable inferior
     */
    ejecutarAgrupacion() {
        this.agrupacionActiva = true;

        // Contraer sidebar automáticamente para maximizar el espacio
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.classList.contains('collapsed')) {
            sidebar.classList.add('collapsed');
        }

        const paso3Content = document.getElementById('paso3Content');
        if (paso3Content) {
            paso3Content.classList.add('con-etapas-abajo');
        }

        this.visualizarMapaKarnaugh(this.tablaVerdadActual, this.numVariables, false);
        this.renderizarEtapaAgrupacion();

        const zonaScroll = document.getElementById('zonaEtapasScroll');
        const etapaAgrupacion = document.getElementById('etapaAgrupacion');
        if (zonaScroll) {
            zonaScroll.classList.remove('hidden');
        }
        if (etapaAgrupacion) {
            etapaAgrupacion.classList.remove('hidden');
            if (zonaScroll) {
                zonaScroll.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    }

    /**
     * Paso apilado 2: Despliega hacia abajo la Simplificación dentro del contenedor scrolleable inferior
     */
    ejecutarSimplificacion() {
        this.simplificacionActiva = true;
        this.renderizarEtapaAgrupacion();
        this.renderizarEtapaSimplificacion();

        const zonaScroll = document.getElementById('zonaEtapasScroll');
        const etapaSimplificacion = document.getElementById('etapaSimplificacion');
        if (etapaSimplificacion) {
            etapaSimplificacion.classList.remove('hidden');
            setTimeout(() => {
                if (zonaScroll) {
                    zonaScroll.scrollTo({
                        top: etapaSimplificacion.offsetTop - zonaScroll.offsetTop,
                        behavior: 'smooth'
                    });
                }
            }, 60);
        }
    }

    renderizarEtapaAgrupacion() {
        const contenedor = document.getElementById('etapaAgrupacion');
        if (!contenedor) return;

        const variables = this.obtenerVariablesPermitidas(this.numVariables);

        const filasGruposHTML = this.gruposActuales.map((g, idx) => {
            const mintermsBadges = g.minterms.map(m => {
                const bin = m.toString(2).padStart(this.numVariables, '0');
                const otrosGrupos = this.gruposActuales.filter(otro => otro.id !== g.id && otro.minterms.includes(m));
                const sharedTags = otrosGrupos.map(otro =>
                    `<span class="shared-with-chip" style="background:${otro.color.flat}" title="Celda m${m} compartida con ${otro.nombre}">⚡ ${otro.nombre}</span>`
                ).join('');
                const isSharedClass = otrosGrupos.length > 0 ? ' minterm-pill-shared' : '';

                return `<span class="minterm-pill${isSharedClass}"><strong>m${m}</strong> <span class="pill-bin">(${bin})</span>${sharedTags}</span>`;
            }).join('');

            const mascaraCeldas = g.mascara.split('').map((ch, pos) => {
                const varName = variables[pos];
                if (ch === '-') {
                    return `<span class="mask-bit mask-changed" title="${varName} cambia entre 0 y 1">${varName}:–</span>`;
                }
                return `<span class="mask-bit mask-fixed" title="${varName} se mantiene fijo en ${ch}">${varName}:${ch}</span>`;
            }).join('');

            return `
                <div class="group-stack-row" data-group-index="${idx}" style="--group-flat: ${g.color.flat}; --group-light: ${g.color.light};">
                    <div class="group-row-left">
                        <span class="group-badge" style="background: ${g.color.flat}">${g.nombre}</span>
                        <span class="group-size-tag">${g.tamano} ${g.tamano === 1 ? 'celda' : 'celdas'}</span>
                    </div>
                    <div class="group-row-center">
                        <div class="group-minterms-list">${mintermsBadges}</div>
                    </div>
                    <div class="group-row-right">
                        <span class="mask-label">Patrón común:</span>
                        <div class="mask-bits-box">${mascaraCeldas}</div>
                    </div>
                </div>
            `;
        }).join('');

        const btnSimplificarHTML = !this.simplificacionActiva
            ? `<button type="button" id="btnSimplificarEtapa" class="btn-primary btn-stage-action">✨ Simplificar ↓</button>`
            : `<span class="stage-done-pill">✓ Simplificación desplegada abajo</span>`;

        contenedor.innerHTML = `
            <div class="stage-card">
                <div class="stage-header">
                    <div>
                        <h4>1 · Agrupamiento de unos (${this.gruposActuales.length} ${this.gruposActuales.length === 1 ? 'grupo' : 'grupos'})</h4>
                        <p>Las celdas con colores divididos en el mapa se <strong>comparten entre varios grupos</strong> (indicado con ⚡). Pasá el mouse sobre una fila para aislar el grupo en el mapa fijo de arriba.</p>
                    </div>
                </div>
                <div class="groups-stack-list">
                    ${filasGruposHTML}
                </div>
                <div class="stage-footer">
                    ${btnSimplificarHTML}
                </div>
            </div>
        `;

        contenedor.querySelectorAll('.group-stack-row').forEach(row => {
            const gIdx = parseInt(row.dataset.groupIndex, 10);
            const grupo = this.gruposActuales[gIdx];
            if (!grupo) return;

            row.addEventListener('mouseenter', () => {
                this.resaltarGrupoEnMapa(grupo.minterms, true);
            });
            row.addEventListener('mouseleave', () => {
                this.resaltarGrupoEnMapa(grupo.minterms, false);
            });
        });

        const btnSimplificar = document.getElementById('btnSimplificarEtapa');
        if (btnSimplificar) {
            btnSimplificar.addEventListener('click', () => {
                this.ejecutarSimplificacion();
            });
        }
    }

    resaltarGrupoEnMapa(mintermsGrupo, activo) {
        const celdas = document.querySelectorAll('#contenedorMapaK .celda[data-minterm]');
        celdas.forEach(celda => {
            const m = parseInt(celda.dataset.minterm, 10);
            if ( activo ) {
                celda.classList.toggle('group-hovered', mintermsGrupo.includes(m));
                celda.classList.toggle('group-dimmed', !mintermsGrupo.includes(m));
            } else {
                celda.classList.remove('group-hovered', 'group-dimmed');
            }
        });
    }

    formatearTokensHTML(tokens) {
        if (!tokens || tokens.length === 0) {
            return `<span class="slot-termino slot-normal">1</span>`;
        }
        return tokens.map(t => {
            if (t.endsWith("'")) {
                return `<span class="slot-termino slot-negado"><span class="neg-overline">${t[0]}</span></span>`;
            }
            return `<span class="slot-termino slot-normal">${t}</span>`;
        }).join('');
    }

    renderizarEtapaSimplificacion() {
        const contenedor = document.getElementById('etapaSimplificacion');
        if (!contenedor) return;

        const variables = this.obtenerVariablesPermitidas(this.numVariables);

        // Construir filas apiladas por cada grupo mostrando qué variables se cancelan y cuáles quedan
        const filasReduccionHTML = this.gruposActuales.map(g => {
            const fijasTexto = g.varsFijas.length > 0
                ? g.varsFijas.map(f => `<span class="var-keep">${f.variable}=${f.bit}</span>`).join(' · ')
                : 'Ninguna (todas cambian)';

            const eliminadasTexto = g.varsEliminadas.length > 0
                ? g.varsEliminadas.map(v => `<span class="var-cancel">${v}</span>`).join(', ')
                : 'Ninguna (minterm aislado)';

            const terminoHTML = this.formatearTokensHTML(g.tokensTermino);

            return `
                <div class="simpl-stack-row" style="--group-flat: ${g.color.flat}; --group-light: ${g.color.light};">
                    <div class="simpl-col-badge">
                        <span class="group-badge" style="background: ${g.color.flat}">${g.nombre}</span>
                        <span class="simpl-minterms-ref">(${g.minterms.map(m => `m${m}`).join(', ')})</span>
                    </div>
                    <div class="simpl-col-detail">
                        <div class="simpl-detail-line">
                            <span class="detail-label">Se mantienen fijas:</span> ${fijasTexto}
                        </div>
                        <div class="simpl-detail-line">
                            <span class="detail-label">Cambian y se cancelan:</span> ${eliminadasTexto}
                        </div>
                    </div>
                    <div class="simpl-col-arrow">→</div>
                    <div class="simpl-col-result">
                        <span class="result-term-box" style="border-color: ${g.color.flat}">${terminoHTML}</span>
                        <span class="result-bin-tag">Bin: ${g.mascara}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Expresión final simplificada (unión de los términos de cada grupo)
        const expresionSimplificadaHTML = this.gruposActuales.map(g => {
            return `<span class="final-expr-term">${this.formatearTokensHTML(g.tokensTermino)}</span>`;
        }).join('<span class="final-expr-plus"> + </span>');

        const binarioSimplificadoHTML = this.gruposActuales.map(g => {
            return `<span class="final-bin-term">${g.mascara}</span>`;
        }).join('<span class="final-expr-plus"> + </span>');

        contenedor.innerHTML = `
            <div class="stage-card stage-card-final">
                <div class="stage-header">
                    <div>
                        <h4>2 · Simplificación de cada grupo y Expresión Mínima</h4>
                        <p>En cada grupo se eliminan las variables que cambian de estado (0 y 1) y se conservan únicamente las variables constantes.</p>
                    </div>
                </div>

                <div class="simpl-stack-list">
                    ${filasReduccionHTML}
                </div>

                <div class="final-result-banner">
                    <div class="final-result-title">Expresión Booleana Simplificada (${variables.join(', ')}):</div>
                    <div class="final-result-row">
                        <span class="final-label">F =</span>
                        <div class="final-expression-value">${expresionSimplificadaHTML}</div>
                    </div>
                    <div class="final-result-row final-bin-row">
                        <span class="final-label">Bin:</span>
                        <div class="final-binary-value">${binarioSimplificadoHTML}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==========================================
    // RENDERIZADO DEL MAPA DE KARNAUGH (2 a 5 VARIABLES)
    // ==========================================
    generarMapaVacioConEstructura() {
        const totalFilas = Math.pow(2, this.numVariables);
        const tablaVacia = new Array(totalFilas).fill(null);
        this.visualizarMapaKarnaugh(tablaVacia, this.numVariables, true);
    }

    visualizarMapaKarnaugh(tablaVerdad, numVariables, esVacio = false) {
        const contenedor = document.getElementById('contenedorMapaK');
        if (!contenedor) return;
        contenedor.innerHTML = '';
        contenedor.className = 'mapa-container';

        const headerBar = document.createElement('div');
        headerBar.className = 'kmap-toolbar';

        const unosCount = esVacio ? 0 : tablaVerdad.filter(v => v === 1).length;
        const estadoBadge = document.createElement('span');
        estadoBadge.className = `kmap-status-badge ${esVacio ? 'status-empty' : 'status-ready'}`;
        estadoBadge.textContent = esVacio
            ? `Estructura (${Math.pow(2, numVariables)} celdas)`
            : `Mapa de Karnaugh · ${unosCount} ${unosCount === 1 ? 'celda en 1' : 'celdas en 1'}`;
        headerBar.appendChild(estadoBadge);

        const rightControls = document.createElement('div');
        rightControls.className = 'kmap-toolbar-actions';

        if (numVariables === 4) {
            const btnToggleAxes = document.createElement('button');
            btnToggleAxes.type = 'button';
            btnToggleAxes.className = 'btn-axis-toggle';
            btnToggleAxes.textContent = this.invertirEjes4Var ? 'Ejes: CD \\ AB ⇄' : 'Ejes: AB \\ CD ⇄';
            btnToggleAxes.title = 'Alternar disposición de variables en filas y columnas';
            btnToggleAxes.addEventListener('click', () => {
                this.invertirEjes4Var = !this.invertirEjes4Var;
                this.visualizarMapaKarnaugh(tablaVerdad, numVariables, esVacio);
            });
            rightControls.appendChild(btnToggleAxes);
        }

        if (this.modoMapaGenerado && !esVacio) {
            const btnEditar = document.createElement('button');
            btnEditar.type = 'button';
            btnEditar.className = 'btn-axis-toggle';
            btnEditar.textContent = '✎ Editar expresión';
            btnEditar.addEventListener('click', () => {
                this.salirModoMapaGenerado();
                this.actualizarDisplayExpresion();
                this.generarMapaVacioConEstructura();
            });
            rightControls.appendChild(btnEditar);
        }

        headerBar.appendChild(rightControls);
        contenedor.appendChild(headerBar);

        if (numVariables <= 4) {
            const grid = this.crearGrillaMapa(tablaVerdad, numVariables, esVacio, 0);
            contenedor.appendChild(grid);
        } else if (numVariables === 5) {
            const dualWrapper = document.createElement('div');
            dualWrapper.className = 'kmap-dual-wrapper';

            [0, 1].forEach(valorA => {
                const subCard = document.createElement('div');
                subCard.className = 'kmap-subcard';

                const subTitle = document.createElement('div');
                subTitle.className = 'kmap-subtitle';
                subTitle.innerHTML = valorA === 0
                    ? `Mapa <strong>A = 0</strong> <span class="sub-range">(m0 – m15)</span>`
                    : `Mapa <strong>A = 1</strong> <span class="sub-range">(m16 – m31)</span>`;
                subCard.appendChild(subTitle);

                const grid = this.crearGrillaMapa(tablaVerdad, 4, esVacio, valorA * 16, 'BC\\DE');
                subCard.appendChild(grid);
                dualWrapper.appendChild(subCard);
            });

            contenedor.appendChild(dualWrapper);
        }

        // En Modo Mapa Generado, agregar pie con botón "Agrupar"
        if (this.modoMapaGenerado && !esVacio) {
            const footerMapa = document.createElement('div');
            footerMapa.className = 'kmap-stage-footer';

            if (!this.agrupacionActiva) {
                const btnAgrupar = document.createElement('button');
                btnAgrupar.type = 'button';
                btnAgrupar.id = 'btnAgruparMapa';
                btnAgrupar.className = 'btn-primary btn-stage-action';
                btnAgrupar.textContent = '🔗 Agrupar ↓';
                btnAgrupar.addEventListener('click', () => {
                    this.ejecutarAgrupacion();
                });
                footerMapa.appendChild(btnAgrupar);
            } else {
                const pill = document.createElement('span');
                pill.className = 'stage-done-pill';
                pill.textContent = `✓ ${this.gruposActuales.length} ${this.gruposActuales.length === 1 ? 'grupo identificado' : 'grupos identificados'} en el mapa`;
                footerMapa.appendChild(pill);
            }

            contenedor.appendChild(footerMapa);
        }
    }

    crearGrillaMapa(tablaVerdad, numVariablesGrilla, esVacio, offsetMinterm = 0, customCornerLabel = null) {
        const grid = document.createElement('div');
        grid.className = 'karnaugh-grid';

        let mapeo = [];
        let cornerLabel = customCornerLabel;

        if (numVariablesGrilla === 2) {
            grid.classList.add('grid-2x2');
            cornerLabel = cornerLabel || 'A\\B';
            mapeo = [
                [null, '0', '1'],
                ['0', 0, 1],
                ['1', 2, 3]
            ];
        } else if (numVariablesGrilla === 3) {
            grid.classList.add('grid-2x4');
            cornerLabel = cornerLabel || 'A\\BC';
            mapeo = [
                [null, '00', '01', '11', '10'],
                ['0', 0, 1, 3, 2],
                ['1', 4, 5, 7, 6]
            ];
        } else if (numVariablesGrilla === 4) {
            grid.classList.add('grid-4x4');
            if (!customCornerLabel && this.invertirEjes4Var) {
                cornerLabel = 'CD\\AB';
                mapeo = [
                    [null, '00', '01', '11', '10'],
                    ['00', 0, 4, 12, 8],
                    ['01', 1, 5, 13, 9],
                    ['11', 3, 7, 15, 11],
                    ['10', 2, 6, 14, 10]
                ];
            } else {
                cornerLabel = cornerLabel || 'AB\\CD';
                mapeo = [
                    [null, '00', '01', '11', '10'],
                    ['00', 0, 1, 3, 2],
                    ['01', 4, 5, 7, 6],
                    ['11', 12, 13, 15, 14],
                    ['10', 8, 9, 11, 10]
                ];
            }
        }

        mapeo.forEach(fila => {
            fila.forEach(celda => {
                const div = document.createElement('div');

                if (celda === null) {
                    div.className = 'celda header corner-header';
                    const [rowVars, colVars] = cornerLabel.split('\\');
                    div.innerHTML = `<span class="corner-row">${rowVars}</span><span class="corner-sep">\\</span><span class="corner-col">${colVars}</span>`;
                } else if (typeof celda === 'string') {
                    div.className = 'celda header';
                    div.textContent = celda;
                } else {
                    const mintermIdx = celda + offsetMinterm;
                    const valor = tablaVerdad[mintermIdx];
                    div.dataset.minterm = mintermIdx;

                    if (esVacio || valor === null || valor === undefined) {
                        div.className = 'celda vacia';
                        div.innerHTML = `<span class="celda-minterm-tag">m${mintermIdx}</span>`;
                    } else {
                        div.className = `celda ${valor === 1 ? 'uno' : 'cero'}`;

                        let badgesGruposHTML = '';
                        if (this.agrupacionActiva && valor === 1) {
                            const gruposDeCelda = this.gruposActuales.filter(g => g.minterms.includes(mintermIdx));
                            if (gruposDeCelda.length === 1) {
                                const g = gruposDeCelda[0];
                                div.classList.add('celda-agrupada');
                                div.style.background = g.color.flat;
                                div.style.borderColor = '#ffffff';
                                div.style.color = '#ffffff';
                            } else if (gruposDeCelda.length > 1) {
                                // Celda compartida por varios grupos: dividir el fondo con colores planos netos (sin difuminar)
                                div.classList.add('celda-agrupada', 'celda-compartida');
                                const n = gruposDeCelda.length;
                                const stops = gruposDeCelda.map((g, idx) => {
                                    const p1 = ((idx / n) * 100).toFixed(1);
                                    const p2 = (((idx + 1) / n) * 100).toFixed(1);
                                    return `${g.color.flat} ${p1}% ${p2}%`;
                                }).join(', ');
                                div.style.background = `linear-gradient(135deg, ${stops})`;
                                div.style.borderColor = '#ffffff';
                                div.style.color = '#ffffff';
                            }

                            if (gruposDeCelda.length > 0) {
                                const pills = gruposDeCelda.map(g =>
                                    `<span class="cell-group-dot" style="background:${g.color.flat}">${g.nombre}</span>`
                                ).join('');
                                badgesGruposHTML = `<div class="cell-groups-bar">${pills}</div>`;
                            }
                        }

                        div.innerHTML = `
                            ${badgesGruposHTML}
                            <span class="celda-valor">${valor}</span>
                            <span class="celda-minterm-tag">m${mintermIdx}</span>
                        `;
                    }
                    div.title = `Minterm m${mintermIdx} (${mintermIdx.toString(2).padStart(this.numVariables, '0')})`;
                }

                grid.appendChild(div);
            });
        });

        return grid;
    }

    // ==========================================
    // NAVEGACIÓN Y UTILIDADES
    // ==========================================
    mostrarPaso(paso) {
        this.limpiarErrores();
        document.querySelectorAll('.step-container').forEach(step => {
            step.classList.add('hidden');
        });

        const pasoEl = document.getElementById(`paso${paso}`);
        if (pasoEl) {
            pasoEl.classList.remove('hidden');
        }
        this.pasoActual = paso;

        this.actualizarSidebar();
    }

    actualizarSidebar() {
        const titulosCortos = {
            1: 'Paso 1: Cantidad de variables',
            2: 'Paso 2: Cantidad de términos',
            3: 'Paso 3: Expresión y Mapa K'
        };

        const sidebarTitle = document.getElementById('sidebarStepTitle');
        if (sidebarTitle) {
            sidebarTitle.textContent = titulosCortos[this.pasoActual] || '';
        }

        for (let i = 1; i <= 3; i++) {
            const indicator = document.getElementById(`stepIndicator${i}`);
            if (!indicator) continue;

            const stepStatus = indicator.querySelector('.step-status');
            indicator.classList.remove('active', 'completed');

            if (i < this.pasoActual) {
                indicator.classList.add('completed');
                if (stepStatus) stepStatus.textContent = 'Completado ✓';
            } else if (i === this.pasoActual) {
                indicator.classList.add('active');
                if (stepStatus) stepStatus.textContent = 'En curso';
            } else {
                if (stepStatus) stepStatus.textContent = 'Pendiente';
            }
        }

        const btnRetroceder = document.getElementById('btnRetroceder');
        if (btnRetroceder) {
            btnRetroceder.disabled = this.pasoActual <= 1;
        }
    }

    retrocederPaso() {
        if (this.pasoActual > 1) {
            if (this.pasoActual === 3) {
                // Si está en vista de mapa generado, el botón retroceder vuelve primero al constructor del Paso 3
                if (this.modoMapaGenerado) {
                    this.salirModoMapaGenerado();
                    this.actualizarDisplayExpresion();
                    this.generarMapaVacioConEstructura();
                    return;
                }
                this.expresionActual = '';
                const slotsContainer = document.getElementById('slotsContainer');
                if (slotsContainer) {
                    slotsContainer.innerHTML = '';
                }
                this.limpiarMapa();
            }
            this.mostrarPaso(this.pasoActual - 1);
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');

        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }

    inicializarSidebar() {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        const sidebar = document.getElementById('sidebar');

        if (isCollapsed && sidebar) {
            sidebar.classList.add('collapsed');
        }
    }

    obtenerVariablesPermitidas(numVariables) {
        const variables = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        return variables.slice(0, numVariables);
    }

    mostrarError(mensaje) {
        const zonaErrores = document.getElementById('zonaErrores');
        if (!zonaErrores) return;

        zonaErrores.textContent = mensaje;
        zonaErrores.classList.add('show');

        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
        }
        this.errorTimeout = setTimeout(() => {
            this.limpiarErrores();
        }, 4000);
    }

    limpiarErrores() {
        const zonaErrores = document.getElementById('zonaErrores');
        if (!zonaErrores) return;

        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
            this.errorTimeout = null;
        }
        zonaErrores.textContent = '';
        zonaErrores.classList.remove('show');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new KarnaughSolverMejorado();
});

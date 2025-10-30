Solucionador de Mapas de Karnaugh (MAPASK)
=================================================

Aplicación web paso a paso para construir y visualizar Mapas de Karnaugh desde minterms o expresiones booleanas. Foco en UX: flujo en 3 pasos, estado visual claro, y diseño que aprovecha toda la pantalla (100vh) sin scroll vertical.

Características
---------------
- Paso 1: Selección de variables (2–5; visualización de mapa implementada hasta 4 variables).
- Paso 2: Selección de minterms con “barra de progreso” (clic en mX selecciona m0..mX).
- Paso 3: Constructor de expresión (A..D y negadas), Exp y Bin alineados carácter a carácter, y generación de mapa.
- Aleatorio: completa Exp o minterms al azar y limpia inmediatamente el mapa.
- Layout: Exp y Bin arriba a ancho completo; debajo dos columnas (izquierda: controles, derecha: mapa K).
- Alineación Exp/Bin: hasta 9 grupos por fila; cada variable/bit ocupa una celda homogénea; el “+” pertenece al grupo.
- Minterms superiores coherentes con Exp/Bin (negadas con “techito”).

Arquitectura y archivos
-----------------------
- index.html: estructura del flujo y contenedores.
- style.css: estilos (sidebar, layout de pasos, grillas, slots, Exp/Bin, mapa K, responsive, 100vh sin scroll vertical).
- app.js: lógica de UI (estado, eventos, generación de minterms/expresión, validaciones, render del mapa K).

Requisitos y ejecución
----------------------
No requiere build ni servidor. Funciona abriendo el HTML.

1) Clona o descarga el repositorio.
2) Abre index.html en tu navegador (doble clic o arrastrar).

Se recomienda un navegador moderno (Chromium/Firefox/Edge).

Uso rápido
---------
1. Variables (Paso 1)
   - Selecciona 2/3/4/5 variables y pulsa “Continuar”.

2. Minterms (Paso 2)
   - Clic en mX selecciona m0..mX (power bar).
   - “Seleccionar/Deseleccionar Todos” y “+/-” para ajustes rápidos.
   - “Continuar” para ir al Paso 3.

3. Expresión y Mapa (Paso 3)
   - Usa los botones A..D y sus negadas para completar los slots.
   - Exp y Bin se actualizan alineados; máximo 9 grupos por fila.
   - “Aleatorio” genera grupos válidos y limpia el mapa.
   - “Limpiar” borra la expresión y muestra un mapa vacío estructural.
   - “Generar Mapa” valida que los slots estén completos y renderiza el mapa.

Navegación
---------
- Sidebar: muestra el paso activo y su título. “← Retroceder” vuelve al paso anterior.
- Al volver desde Paso 3 a 2, se limpian Exp, slots y mapa para evitar estados colgados.

Decisiones de diseño relevantes
-------------------------------
- Alineación Exp/Bin por celdas con ancho fijo; el “+” vive dentro de cada grupo.
- Minterms superiores: sin cajas innecesarias, colores por tipo (normal/negado) y negación con techito.
- 100vh sin scroll: html/body al 100%, contenedores internos con height: 100%.
- Acciones “Aleatorio/Limpiar” siempre dejan el mapa limpio para evitar lecturas ambiguas.

Limitaciones actuales
---------------------
- Visualización del mapa implementada hasta 4 variables. Para 5 variables, se requiere composición de múltiples mapas 4×4.
- No hay persistencia de estado entre recargas.

Personalización
---------------
- Colores/espaciados: edita style.css (clases .expression-*, .slot-*, .karnaugh-grid).
- Reglas de aleatoriedad: función seleccionarAleatorio() en app.js.
- Orden/validación de variables: obtenerVariablesPermitidas() y validarOrdenVariable() en app.js.

Desarrollo
----------
- Sin dependencias externas, stack estático (HTML/CSS/JS puro).
- Mantén la coherencia visual entre Exp/Bin y minterms superiores al tocar estilos.
- Verifica que sigan entrando 9 grupos por fila tras cambios de tipografía/gaps.

Licencia
--------
Uso libre con atribución. Adapta según tus necesidades educativas o de demostración.

Cambios recientes (changelog breve)
-----------------------------------
- Power bar en minterms (clic en mX → selecciona m0..mX).
- Aleatorio limpia siempre el mapa y respeta cantidad de slots.
- Exp/Bin alineados por celdas; hasta 9 grupos por fila.
- Minterms superiores sin cajas, colores por tipo y negación con techito.
- Layout del Paso 3: Exp/Bin a ancho completo; controles izquierda, mapa derecha.
- Títulos de pasos y botón “← Retroceder” en sidebar; título visible sólo en paso activo.
- Vista 100vh sin scroll vertical.

Compatibilidad y accesibilidad
------------------------------
- Probado en Chrome/Edge/Firefox recientes.
- Tipografías monoespaciadas para Exp/Bin; alto contraste en colores de términos.
- Elementos clicables con tamaños y espacios adecuados; sin dependencias externas.

Sugerencias de mejora (futuro)
------------------------------
- Mapas de 5 variables (composición de varios 4×4).
- Exportar imagen/CSV del mapa y de la expresión simplificada.
- Tests unitarios de parsing/normalización.


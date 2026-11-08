# Evidencia de verificación — 7 de noviembre de 2026

## Alcance

Expedientes en `/desarrollo/expedientes`, con identidades ficticias y adaptador IndexedDB.
Esta evidencia no verifica Auth, RLS, Storage de Supabase, portal familiar real ni pilotaje.

## Resultados ejecutados

- `npm run verify:ers`: correcto. 40 identificadores únicos, métodos T/I/D/A y criterios
  de aceptación conservados. Es un control de integridad documental, no 40 pruebas aprobadas.
- `npm run build`: correcto, Vite 8.3.6.
- `PLAYWRIGHT_CHANNEL=msedge npm run test:e2e`: **8 pruebas aprobadas**, 41.4 segundos.
  Navegador Edge de escritorio, dos workers, contextos nuevos y datos ficticios.
- Las pruebas incluyen creación de dos expedientes para el mismo paciente, asociación
  a profesional, validación de obligatorios y numeración local distinta (RF06/RF07).
- Se probaron los cinco estados y conservación del motivo (RF08).
- Se probó nota reservada por defecto, confirmación familiar y denegación de nota privada
  a administración (RF9/RF03). No equivale a probar el portal que exige RF9.
- Se conservaron tipo, fecha y resumen de evaluación al recargar (RF10).
- Se probó archivo interno, descarga, cancelación del cambio de visibilidad y autorización
  explícita (RF11). No equivale a verificación de bucket privado o portal real.
- Se probó búsqueda por nombre/número, aislamiento de profesionales y denegación directa
  en el adaptador de demostración (RF12/RF03).
- Se verificaron actor, acción y fecha en historial local (RF05).
- Se revisaron 360 px, uso de teclado y ausencia de llamadas a Supabase en la demo.
- `npm audit --omit=dev`: **0 vulnerabilidades reportadas** tras correcciones compatibles.
  El audit completo conserva 4 avisos moderados en la cadena de herramientas de lint
  (ESLint/config-array/minimatch); npm propone cambios mayores. No se aplicó `--force`.

## Cómo repetir

```powershell
npm ci
npx playwright install chromium
npm run verify
```

En Windows con Edge instalado también puede ejecutarse:

```powershell
$env:PLAYWRIGHT_CHANNEL="msedge"
npm run verify
```

Las pruebas inician y cierran un servidor local en el puerto 5180. Los informes HTML y
trazas quedan en `playwright-report/` y `test-results/`, excluidos de Git.

## Pendiente antes del cierre integral

- Definir con el centro los campos de identificación mínimos y permisos de coordinación.
- Ejecutar escenarios de aceptación sobre PostgreSQL/Auth/RLS/Storage reales, incluyendo
  concurrencia, intento entre expedientes y contenido familiar autorizado/restringido.
- Inspección de seguridad, bitácora del servidor y demostraciones según método del ERS.
- Verificación Chrome además de Edge y recorrido del portal a 360 px (RNF06).
- Medición RNF01 en entorno de piloto, no extrapolada desde esta demo.
- SUS con participantes (RNF04, meta >=70/100), Likert complementario y evaluación WCAG
  con criterios previamente formalizados. No se garantiza ni inventa el resultado.

La entrega inicial dejó Agenda y citas (RF13–RF15) como siguiente implementación.
La actualización de esa entrega y sus verificaciones se registra a continuación.

## Entrega Agenda — misma revisión documental, 7 de noviembre de 2026

- ERS completo: 40 registros revisados otra vez; SHA de la fuente coincide con la matriz.
  Se revisaron también protocolo, arquitectura, diagnóstico y comunicación. No se alteraron Word.
- Build de Agenda y navegación compartida: correcto.
- Edge: 20 pruebas aprobadas en 30.5 s (12 Agenda + 8 Expedientes). Después se añadieron
  dos escenarios de interfaz; se verificaron ambos y la adaptación ampliada a cinco anchos
  en una ejecución focalizada de 3 pruebas aprobadas en 7.1 s.
- Chrome: 22 pruebas aprobadas en 32.3 s (14 Agenda + 8 Expedientes).
- Cobertura nueva: registro completo, fechas imposibles, semana/lista, filtros, cruces exactos
  y parciales, contigüidad, distintas profesionales, reprogramación, cancelación con conservación
  y liberación del horario, pendientes, doble alta simultánea en la misma instancia, denegación
  entre perfiles, integración con pacientes nuevos, teclado y ausencia de llamadas a Supabase.
- La revisión visual incluyó escritorio y móvil. El control de ancho se amplió a
  360, 390, 768, 1024 y 1440 px; calendario semanal con desplazamiento interno.
- No se midió RNF01 en entorno de piloto ni se aplicaron SUS, Likert o WCAG al producto final.
  No se consideran aprobadas RLS, Storage, Auth, disponibilidad transaccional multiusuario
  ni alerta de próxima cita del portal (RF21).

Ver `modulo-agenda.md` para decisiones provisionales y límites. El siguiente módulo previsto
es Seguimiento; este avance no convierte los requerimientos pendientes en aprobados.

Control final de adaptación ampliada en Chrome: 1 prueba focalizada aprobada en 4.0 s
con los cinco anchos (360, 390, 768, 1024, 1440), teclado y demo sin llamadas a Supabase.

## Entrega Seguimiento — noche del 7 al 8 de noviembre de 2026

- ERS: 40 registros conservados; SHA256 del Word coincide con la fuente original.
  Protocolo, diagnóstico, comunicación y arquitectura revisados; originales sin modificar.
- `npm run verify:ers`, `npm run test:unit` y `npm run build`: correctos.
- Pruebas de lógica: **8 aprobadas**. Incluyen el escenario 4 vigentes/3 vencidas,
  falta de actividades, plantillas no diagnósticas, límite de borradores y corpus reproducible.
- Edge: **39 pruebas de navegador aprobadas, 2.2 min**.
- Chrome: **39 pruebas de navegador aprobadas, 2.2 min**.
  Cada ejecución cubre 14 Agenda, 8 Expedientes, 16 Seguimiento y 1 inspección automática
  de accesibilidad. No son 78 requerimientos: son dos ejecuciones de la misma suite.
- Seguimiento: creación/edición de actividad, campos obligatorios y fechas imposibles,
  cuatro estados, persistencia, nota del mismo expediente, perfiles aislados, autorización
  familiar, rechazo de referencias ajenas y ausencia de llamadas a Supabase.
- Apoyo: sin actividades no inventa borradores; contexto reciente seleccionado en pantalla;
  revisión/editado/descarte; confirmaciones obligatorias; borradores pendientes privados;
  cambio de datos invalida publicación; desactivación por expediente; máximo tres activos;
  valoración válida después de revisión y exportación sintética independiente de los expedientes.
- Axe-core: sin incidencias detectadas con reglas WCAG 2 A/AA en el área principal de
  actividades, resumen, vista familiar y apoyo vacío/con borrador, formulario de actividad
  y revisión. Se espera la terminación de las transiciones para inspeccionar el estado estable.
  No cubre todas las pantallas, condiciones o criterios; no certifica conformidad WCAG.
- Revisión visual: escritorio y 390 px; controles de ancho a 360, 390, 768, 1024 y 1440 px,
  navegación de pestañas por teclado. Sin errores de página en el recorrido visual.
- Comprobación adicional del enlace Expedientes → Seguimiento y URL directa con expediente:
  selección conservada y navegación correcta en Edge.
- `npm audit --omit=dev`: **0 vulnerabilidades reportadas**.

El kNN experimental usa 96 referencias sintéticas y 24 casos artificiales separados.
Acertar las etiquetas construidas por código solo verifica el funcionamiento del selector;
no acredita generalización, utilidad profesional, entrenamiento de LLM ni eficacia clínica.
No se han enviado datos a Google ni a proveedores externos.

La vista familiar es una proyección profesional local, no el portal autenticado por código.
Auth, RLS, bitácora protegida, restricciones transaccionales, concurrencia entre clientes y
pruebas institucionales siguen pendientes. SUS, Likert y métricas de pilotaje no se aplicaron.
Los métodos A/I/D del ERS requieren además análisis, inspección o demostración formal,
sin sustituirlos por la suite automatizada.

La previsualización solicitada permanece activa en el puerto 5180. Si ya existe ese servidor,
Playwright lo reutiliza; si las pruebas lo inician, gestionan su propio servidor.

## Beta entrenada y guía de uso — 8 de noviembre de 2026

- Se revisaron de nuevo los 40 requerimientos y las fuentes originales; hashes de ERS,
  protocolo y arquitectura conservados. Estados integrales y pendientes de pilotaje no se cerraron.
- `npm run train:support`: ejecutado. Aprende 54 pesos y seis sesgos mediante softmax,
  entropía cruzada, regularización L2 y descenso de gradiente sobre los 96 casos train originales.
  El navegador usa el artefacto guardado; no entrena con expedientes.
- Test reservado: 24/24 etiquetas sintéticas. Pérdida regularizada de entrenamiento
  1.7917594692 → 0.0951625078; log-loss de test 0.0307554949.
  Casos de una etiqueta, construidos por código: no son evidencia de eficacia, calidad
  clínica ni generalización a usuarios reales. No se entrenó un LLM.
- `training-report.json` conserva matriz de confusión, curva de pérdida, parámetros y hashes.
  Las pruebas reproducen los parámetros aprendidos, recalculan las métricas y comprueban
  que no se compartan IDs ni vectores entre entrenamiento y test.
- `npm run verify` en Edge: integridad ERS, **13 pruebas unitarias**, build correcto y
  **42 pruebas de navegador aprobadas (1.5 min)**.
- Chrome: **42 pruebas de navegador aprobadas (1.3 min)**.
- Ampliación posterior de verificaciones: **2 pruebas focalizadas aprobadas en Edge (14.2 s)**
  y **2 en Chrome (10.0 s)**. Cubren guía beta a 360–1440 px, caso sintético modificable,
  ausencia de escrituras en expediente, contraste/estructura de contexto, ejemplo interactivo
  y datos de evaluación del modelo expandidos.
- El recorrido completo conserva aprobación, edición, descarte, aislamiento por expediente,
  máximo tres, desactivación, proyección familiar y rechazo de texto diagnóstico.
- Se comprobó que cambiar la versión del modelo invalida textos autorizados hasta actualizar
  y revisar. El ejemplo no persiste ni publica; sin actividades no genera propuestas.
- Revisión visual de la nueva guía: escritorio; capturas y recorrido sin errores de página.
  No se añadieron proveedores externos, credenciales ni dependencias de entrenamiento.

SUS, Likert, inspección formal de accesibilidad y análisis profesional de utilidad siguen
pendientes del piloto. Los escaneos automáticos no certifican conformidad WCAG completa.
Auth/RLS, portal por código y restricciones de servidor conservan los pendientes previos.

## Portal familiar y documentación de beta — 8 de noviembre de 2026

- Se revisaron los 40 requerimientos y las fuentes de protocolo, arquitectura, diagnóstico
  y comunicación. Se actualizaron evidencias/pendientes sin modificar el ERS ni los Word.
- Documentación de beta: `beta-apoyo.pdf`, **3 páginas revisadas visualmente**, con origen
  de los casos, entrenamiento, evaluación, uso, controles, límites y anexo reproducible.
  Versiones editables en `beta-apoyo.md` y `anexo-beta-apoyo.md`. Las cifras de 13/42 en
  ese documento corresponden a la entrega previa de la beta entrenada; esta entrega amplía
  la suite con el portal.
- `npm run verify:ers`, build y **19 pruebas unitarias**: correctos.
- Edge: **55 pruebas de navegador aprobadas, 1.1 min**.
- Chrome: **55 pruebas de navegador aprobadas, 58.5 s**.
- Después del ajuste final de bordes de controles y bitácora de consultas, los **13 escenarios
  del portal pasaron de nuevo en Edge, 38.4 s**; Chrome ya verificó el ajuste en la suite completa.
- Cobertura del portal: código ficticio sin cuenta, error genérico, alcance de un expediente,
  notas/actividades/archivos internos omitidos, archivo autorizado y descarga denegada después
  de revocar, enlaces HTTPS y confirmación profesional, borradores pendientes privados,
  texto del apoyo editado/aceptado y retiro al cambiar contexto, próxima cita discreta,
  cierre de sesión y rutas públicas cerradas sin consumir Supabase.
- Comentario familiar probado de extremo a extremo: envío desde actividad visible,
  recepción en resumen profesional, rechazo de actividad interna/ajena y conservación
  del estado profesional de cumplimiento.
- Accesibilidad: tres tamaños, cuatro temas, letra, espaciado, vista sencilla, preferencias
  al recargar, datos corruptos y almacenamiento bloqueado, teclado y reflujo 320–1440 px.
  Inspección axe de acceso/ajustes, actividades con formulario de comentario, cuatro temas,
  orientaciones y recursos sin incidencias detectadas. Ensayo adicional de espaciado
  personalizado y texto muy grande sin desbordamiento horizontal.
- Voz: API ausente, voz local ausente, segmentación de texto largo, pausa/continuación,
  cancelación y salida comprobados con dobles controlados. Se verifica que el texto leído
  proviene de la actividad autorizada. No equivale a comprobar audio o voces reales del equipo.
- Revisión visual: acceso y actividades en escritorio; 360 px, alto contraste, texto muy
  grande y espaciado. Sin errores de página en el recorrido inicial.

La demo utiliza IndexedDB y códigos conocidos para datos ficticios; no es una frontera de
seguridad. `/expediente` y `/portal` permanecen cerrados para expedientes reales hasta integrar
autorización en servidor, sesión segura, revocación/caducidad, límites de intentos y Storage/RLS.
La selección de criterios WCAG propuesta en `modulo-portal.md` debe formalizarse antes del
piloto. No se certifica conformidad completa ni se inventan resultados SUS, Likert, voz real,
lector de pantalla o comprensión con familias/niños. Los métodos D/I/A requieren además
demostraciones, inspección y análisis formales según el ERS.

Control final del portal: después de ordenar los botones de navegación a 360 px y evitar
que la búsqueda oculta filtre la vista sencilla, se repitieron los 13 escenarios en Edge
(41.2 s) y Chrome (33.1 s), todos aprobados. La compilación final también fue correcta.

## Fundación privada de Supabase — 8 de noviembre de 2026

Migración inicial ejecutada en el proyecto nuevo `krrurcjowhgrkenkgtpf`. Consulta remota de metadatos: 15 tablas, 15 con RLS, acceso al esquema anon=false/authenticated=false y 0 políticas abiertas. `node --test scripts/test-db-foundation.mjs`: 19 pruebas aprobadas (18 casos y contenedor), PostgreSQL local PGlite 0.5.15 con Auth mínimo simulado. No acredita Auth real, autorización operativa por rol, Storage, concurrencia remota ni frontend conectado. Ver `backend-fase1.md` y la consulta reproducible en `supabase/checks/verify_foundation.sql`.

## Autenticación y perfil de personal — 8 de noviembre de 2026

Resultado final: 40 registros del ERS íntegros; 22 pruebas de lógica, 27 comprobaciones SQL (incluidos contenedores) y compilación aprobados. Suite completa: 64 escenarios aprobados en Edge y 64 en Chrome. Nueve escenarios nuevos cubren acceso individual, contrato exacto de campos/roles, denegación de perfil ausente/inactivo/antiguo, metadatos falsificados, restauración, cierre, rutas antiguas, recuperación, cambio de contraseña, teclado, móvil y revisión automática axe.

Las pruebas de navegador de Auth usan respuestas controladas sin correos reales. La función SQL se comprueba contra ambas migraciones en PGlite con Auth mínimo simulado. En el Supabase real se observó la migración exitosa, perfil Administración activo, ejecución propia authenticated=true/anon=false y acceso al esquema privado=false. Registro público cerrado y enlace local de recuperación guardado. La titular confirmó el inicio real con su propia contraseña y se observó «Hola, Guadalupe» / Administración en el preview; la contraseña no se leyó ni se guardó.

No se acredita todavía entrega real de recuperación por correo, configuración de producción en Vercel, matriz operativa completa de permisos clínicos, Storage, concurrencia remota, SUS, Likert ni conformidad WCAG integral. Ver `modulo-autenticacion.md` para correspondencia de campos, permisos y pendientes.

Producción de autenticación: Vercel Ready (`HmxxomAxtxYK6qvKGeNjviiGNhzz`), landing/login observados sin error de variables. Titular confirmó ingreso en `https://psicoluz.vercel.app`. Variables públicas guardadas en Production y retornos exactos de recuperación local/publicado configurados. Entrega real de correo, módulos clínicos y validación institucional pendientes.

## Registro de pacientes y apertura de expedientes — 8 de noviembre de 2026

Permisos autorizados por la titular. Migración `20261108000300` aplicada en Supabase; índice vacío y primera profesional activa observados desde sesión real de Administración en el preview. No se insertaron pacientes ficticios en producción. La prueba de inicio de la cuenta profesional y la escritura remota quedan pendientes.

Suite final de navegador: 73 aprobados en Edge y 73 en Chrome. Lógica: 25 aprobados. Compilación y matriz de 40 IDs correctas. Pruebas SQL: migraciones completas en PGlite con Auth mínimo simulado, permisos, separación por responsable, transacción, campos, cinco estados, versiones, bitácora y paginación. Ver `conexion-registro-expedientes.md`. No se declara cierre integral, concurrencia remota, Storage, SUS, Likert o conformidad WCAG por estos ensayos.
Resultado final SQL: 41 comprobaciones aprobadas, incluidos tres contenedores; también se verifican los cinco estados del ERS con lectura posterior. No equivale a concurrencia o escritura remota.

## Agenda conectada — 8 de noviembre de 2026
+
+Migración 20261108000400 aplicada con éxito observado en Supabase. Permisos: ejecución authenticated=true, anon=false; uso del esquema privado=false y borrado de bitácora=false. Lectura semanal real observada con la sesión de Administración, sin citas registradas en la semana. No se insertaron citas ficticias en producción ni se leyó una contraseña. Acceso profesional restringido a las citas de sus expedientes; Administración coordina la agenda del centro.
+
+Resultado final: 78 escenarios aprobados en Edge y 78 en Chrome, 27 pruebas de lógica y 53 comprobaciones SQL (incluidos contenedores), compilación correcta y matriz íntegra de 40 requerimientos. La suite de Agenda aporta 11 casos SQL y su contenedor, además de cinco recorridos de navegador sobre respuestas controladas. Verifica registro, contrato, fechas, cruces exactos/parciales, intervalos contiguos, diferentes profesionales, reprogramación, versiones, cancelación sin borrar, aislamiento, historial, contraste del formulario y 360 px. No acredita todavía concurrencia/escritura remota de citas, SUS, Likert, WCAG integral ni resultados operacionales de pilotaje. La titular sí confirmó creación y edición remotas del registro básico de Expedientes en esta sesión.
+
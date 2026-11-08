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

# Trabajo en PsicoLuz

- Antes de modificar o cerrar un módulo, leer el ERS vigente completo y revisar protocolo,
  arquitectura, diagnóstico y plan de comunicación. Si una fuente no está accesible, informarlo.
- Fuente local: `C:/Users/guada/Desktop/CMMI v3/`. Conservar identificadores originales,
  incluidos `RF9` y `RF-AP7`. Nunca inventar criterios ni resultados.
- Mantener `docs/verificacion-ers.json` y `docs/verificacion-ers.md`: los 40 requerimientos,
  su aceptación, método T/I/D/A, dependencias, evidencia y pendientes.
- Revisar todos los requerimientos; implementar y comprobar los aplicables al módulo.
  Los de otros módulos conservan estado pendiente: no convertirlos en aprobados.
- No afirmar cumplimiento integral por aprobar un mock, una inspección parcial o un build.
  Separar frontend probado, backend/RLS/Storage pendiente y validación con participantes.
- Ejecutar build y pruebas positivas/negativas pertinentes. Conservar pruebas reproducibles
  y el resultado real, sin sustituir inspecciones o demostraciones formales por un conteo de tests.
- SUS mide usabilidad percibida global; RNF04 fija >=70/100 para la interfaz profesional.
  No garantizar resultados SUS ni transferir esa meta automáticamente al portal familiar.
- Likert complementará SUS. No inventar respuestas, instrumentos aprobados ni muestras.
- Relacionar accesibilidad con RF23–RF26 y RNF05. Formalizar los Success Criteria WCAG
  aplicables antes del piloto; no declarar conformidad completa por pruebas automáticas.
- Comparar métricas del piloto con línea base y condiciones/denominadores equivalentes.
  No confundir RNF01 (<3 s del software) con tiempo completo de búsqueda de expediente.
- Auth y autorización reales se comprobarán en servidor; un selector de rol es solo demo.
- Mantener la identidad visual de la landing. No alterar fuentes Word salvo petición expresa.
- Nunca publicar archivos `.env`, tokens privados, credenciales o datos clínicos reales.

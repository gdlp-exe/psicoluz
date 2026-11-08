# Portal familiar — frontend de desarrollo

Revisión: 8 de noviembre de 2026. Se revisaron los 40 requerimientos del ERS y el protocolo, arquitectura, diagnóstico y comunicación. Se conservan los identificadores y métodos originales; fuentes Word sin modificar.

## Recorrido

`/desarrollo/portal` permite probar con datos ficticios: código **PL-DEMO-101** para Lucía, **PL-DEMO-202** para Mateo y **PL-DEMO-404** para Daniel. No se usa número de expediente como código ni se requiere una cuenta. Las claves de ejemplo son conocidas y no constituyen seguridad real.

Las rutas públicas `/expediente` y `/portal`, incluidas rutas antiguas subordinadas, muestran el acceso pero permanecen cerradas hasta contar con autorización en servidor. No consumen Supabase ni habilitan los códigos de demostración. La landing conserva su enlace al portal.

Después de entrar, se muestran actividades autorizadas, instrucciones, orientaciones, recursos y una alerta discreta de la próxima cita confirmada, con fecha y hora de Nicaragua. No se entrega motivo de consulta, resumen de evaluación, teléfono del tutor, notas internas, autoría clínica ni listados de expedientes. El DTO incluye solo los campos necesarios de cada contenido.

La vista sencilla mantiene únicamente las actividades. Los estados pertenecen al registro profesional. La familia puede enviar un reporte de actividad realizada, intentada o con necesidad de ayuda, y un comentario opcional; se recibe en el resumen del seguimiento profesional y no modifica automáticamente el estado clínico. Este flujo deriva de la continuidad familiar descrita en diagnóstico/protocolo; no se presenta como resultado operacional ya alcanzado.

## Trazabilidad

- RF20/RF22: acceso local por código, alcance de un expediente y mensaje genérico ante códigos inválidos. El número de expediente y los tokens inventados se rechazan. Al salir se invalida la sesión local, se borra la vista y se detiene la voz. Integración segura pendiente.
- RF04/RF9/RF18/RF21: proyección de notas expresamente visibles, actividades y archivos autorizados, enlaces HTTPS revisados y texto del apoyo aceptado/autorizado/vigente. No se publican borradores ni su fundamento interno.
- RF11/RF21: descarga después de comprobar expediente y visibilidad en el adaptador; revocar visibilidad impide una nueva descarga. Falta Storage privado y autorización real en servidor.
- RF21: próxima cita confirmada y futura, solo fecha/hora. Si no existe, no se inventa.
- RF23: tres tamaños de texto, aplicables al contenido y controles.
- RF24: tema institucional y alto contraste; adicionales oscuro y cálido.
- RF25: preferencias en sessionStorage, sin cuenta ni datos clínicos. Persisten al recargar esta pestaña; si el navegador bloquea el almacenamiento, los ajustes funcionan durante la vista y se informa la limitación.
- RF26: lectura de título, descripción e instrucciones de actividades visibles. Inicio explícito, pausa, continuación y detención. Se detiene al salir o cambiar de sección. La ausencia de API o voz local no impide el resto del portal.

## Accesibilidad y personalización

Disponible antes de introducir el código y durante todo el recorrido: tamaño normal/grande/muy grande, cuatro temas, tres familias de fuente, más espaciado, reducción de movimiento activada inicialmente, vista sencilla y velocidad de voz. No se atribuyen efectos clínicos ni tratamiento de dislexia a una fuente o paleta.

Controles con etiquetas, encabezados y regiones, navegación de pestañas por teclado, enlace para saltar al contenido, foco visible y mensajes de estado. Sin audio automático, destellos, premios ni animaciones obligatorias. Diseño de lectura con instrucciones completas y sin alturas que recorten texto. Enlaces externos identifican la apertura de otra pestaña.

La voz usa solo voces locales de español que el navegador declare disponibles. Si Windows no dispone de una, se informa cómo habilitarla y permanece el texto. El audio real y la calidad de voces requieren revisión manual en los dispositivos del piloto; los tests automáticos ensayan el contrato de voz y sus fallos mediante dobles controlados.

## Propuesta de criterios para formalizar antes del piloto

Esta selección se propone durante la implementación; no se afirma que ya estuviera aprobada en el protocolo. Relacionar RF23–RF26/RNF05 con WCAG 2.2: estructura 1.3.1; color/contraste 1.4.1, 1.4.3 y 1.4.11; texto/reflujo/espaciado 1.4.4, 1.4.10 y 1.4.12; teclado 2.1.1 y 2.1.2; navegación y foco 2.4.1, 2.4.3, 2.4.6, 2.4.7 y 2.4.11; tamaño de controles 2.5.8; idioma 3.1.1; errores/instrucciones 3.3.1 y 3.3.2; nombres/estados 4.1.2 y 4.1.3. Formalizar aplicabilidad y procedimiento de inspección, no solo un listado.

Se prueban cuatro temas, 320–1440 px con texto grande, espaciado, teclado, mensajes, falta de voz/API y almacenamiento bloqueado. Un escaneo axe no verifica todos los criterios ni certifica conformidad completa. Faltan lector de pantalla real, zoom 200/400 %, comprensión con familias y niños acompañados, dispositivos táctiles y voz del equipo real.

Fuentes técnicas: [referencia WCAG del W3C](https://www.w3.org/WAI/WCAG22/quickref/) y [SpeechSynthesis, MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis).

## Límites de seguridad e integración

El adaptador usa IndexedDB y sesiones en memoria exclusivamente para datos ficticios. No autentica personas ni impide que un usuario técnico inspeccione/modifique su navegador. Recargar exige introducir otra vez el código; solo se conservan las preferencias de lectura. No se guarda el código en URL, localStorage o sessionStorage.

Antes de usar expedientes reales: validación del código en servidor, revocación/caducidad y protección frente a intentos repetidos; sesión opaca segura; consulta segregada/RLS; descargas privadas autorizadas; bitácora protegida y mecanismo de actualización de permisos. Nunca entregar al navegador el expediente completo para filtrarlo allí. Los contratos `view`, `report` y `file` están separados para reemplazar el adaptador, sin afirmar que el backend esté hecho.

Los enlaces se crean/revisan desde Seguimiento → Enlaces, internos por defecto, con confirmación explícita al compartir. Se rechazan esquemas ejecutables, HTTP y credenciales dentro de la dirección; la profesional debe revisar la pertinencia y privacidad del sitio externo.

SUS, Likert complementario, observación e inspección formal siguen previstos para el piloto. La meta profesional RNF04 >=70/100 no se traslada automáticamente al portal familiar. Para la medida de reporte familiar del 35 %, acordar período y denominador antes de comparar; los reportes ficticios no acreditan una mejora ni un impacto causal.

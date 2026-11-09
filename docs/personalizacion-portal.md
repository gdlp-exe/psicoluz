# Personalización visual y lectura del portal — 9 de noviembre de 2026

## Decisión de implementación

Se incorporaron dos presentaciones opcionales sobre el mismo portal: Para familias y Para niños. Se trata de un refinamiento de la interfaz y de las preferencias existentes, relacionado con RF23–RF26, RNF05 y RNF06; no se añadió un módulo de juegos ni un nuevo identificador de requerimiento. La identidad institucional turquesa, naranja y blanco se conserva, con superficies suaves adicionales en la presentación infantil.

La vista infantil utiliza ilustraciones SVG, iconos según palabras del título, tarjetas grandes, botón de escucha destacado, explicación de uso que se puede escuchar y una vuelta directa a la presentación familiar. Los iconos son orientación visual, no una interpretación clínica ni una adaptación automática de las instrucciones. No se agregaron puntuaciones, recompensas, niveles, resultados de aprendizaje ni actividades nuevas. Los textos originales de las actividades permanecen íntegros; el niño puede requerir acompañamiento adulto.

Las preferencias de presentación y voz se conservan en la misma sesión, junto con los tres tamaños de texto, tipografías, espaciado, reducción de movimiento y temas. Cambiar la presentación no altera autorizaciones, estados profesionales, reportes ni acceso a recursos. No se modificaron base de datos, roles, códigos, función de archivos ni permisos.

## Lectura en voz alta

Se incorporó una lista de voces locales en español, actualizada al recibir voiceschanged, selección manual y muestra estática iniciada por el usuario. La selección automática prioriza voces identificadas por el sistema como mejoradas/naturales cuando existen y después afinidad regional. La preferencia manual tiene prioridad. El nombre de una voz no acredita objetivamente su naturalidad.

Se mantuvo speechSynthesis y el control de pausa, continuación y detención. La velocidad normal predeterminada pasó de 0.9 a 1; las preferencias previas se respetan. Los textos largos se dividen preferentemente en límites de frase, sin perder caracteres ni palabras, en lugar de hacer cortes arbitrarios. No se cambia el contenido para simular una interpretación de las actividades.

Se siguen excluyendo voces que el navegador identifique como remotas. No se añadió proveedor TTS, suscripción, grabación ni envío de texto clínico a un nuevo servicio. La disponibilidad y la calidad dependen del dispositivo/navegador; esta entrega no garantiza una voz neural ni una voz humana. Referencias: [localService](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService), [getVoices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices), [voiceschanged](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/voiceschanged_event).

## Verificación y material para la monografía

Pruebas específicas en tests/portal-personalization.spec.js y tests-unit/portal-personalization.test.mjs: cambio reversible, persistencia de sesión, mismo contenido autorizado, 360/768/1440 px, texto grande y cuatro temas, revisión automática axe, teclado, voces que llegan después de cargar, ausencia de lectura automática, respeto de la voz elegida y rechazo de voces remotas. Resultados finales en resultados-verificacion.md.

Para el capítulo de desarrollo puede documentarse como una iteración de diseño y accesibilidad: necesidad de facilitar la interacción con niños que aún no leen → presentación visual y escucha explícita → implementación en componentes/preferencias → verificación técnica → evaluación con participantes pendiente. No afirmar que los iconos garantizan comprensión autónoma ni que SUS, Likert o WCAG integral ya fueron aprobados. La naturalidad debe evaluarse escuchando en los equipos del piloto.

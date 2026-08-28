# Hallazgos frecuentes y cómo se cierran de verdad

Ordenados por frecuencia en visita real. Para cada uno: cómo se detecta, cuál suele ser la causa
de fondo, y qué cierra el hallazgo (no qué lo tapa).

---

## 1. REPS desalineado con la realidad

**El más frecuente y el de peor consecuencia.** Cuatro variantes:

| Variante | Gravedad |
|---|---|
| Servicio habilitado que ya no se presta | Media — se resuelve reportando novedad. |
| **Servicio que se presta sin estar habilitado** | **Crítica** — es prestación irregular. |
| Capacidad instalada declarada distinta a la real (camas, sillas, consultorios) | Alta |
| Sede, dirección, representante legal o horario desactualizado | Media |

**Cómo se detecta:** imprime el REPS y camina la sede contra ese papel. No al revés.

**Causa de fondo casi siempre:** no hay un responsable nombrado del REPS. La novedad depende de
que alguien "se acuerde" cuando abre o cierra un servicio.

**Qué cierra el hallazgo:** reporte de las novedades en el REPS **y** un procedimiento que ate el
reporte a un disparador — apertura, cierre, traslado, cambio de capacidad — con responsable
nombrado. Sin el procedimiento, el hallazgo vuelve el año entrante.

**Advertencia:** si aparece un servicio prestándose sin habilitar, eso no se "arregla" con papeles
retroactivos. La ruta es suspender la prestación o tramitar la habilitación, y decirlo así.

---

## 2. Talento humano sin soporte vigente o insuficiente en el turno real

**Cómo se detecta:** cruza la programación de turnos de las últimas 4–8 semanas contra la planta
declarada y contra la verificación en ReTHUS. Mira noche, fin de semana y festivo.

**Causa de fondo:** la planta se dimensionó sobre el horario hábil y se cubre el resto con
disponibilidad, rotación o sobrecarga que no está formalizada.

**Qué cierra:** verificación en ReTHUS documentada con fecha para todo el personal asistencial,
certificados vigentes archivados con control de vencimiento, y **ajuste real de la programación**
o formalización del esquema de cobertura. Un cuadro de turnos corregido en el papel sin cambio en
la operación es exactamente lo que el verificador detecta cuando entrevista al turno.

---

## 3. Dotación sin trazabilidad

**Cómo se detecta:** toma 15–20 equipos del inventario, no de una lista que te entreguen, e
incluye deliberadamente los de reposición reciente y los de sedes secundarias.

Sub-hallazgos típicos:

- Hoja de vida inexistente o incompleta, sobre todo en equipos ingresados por reposición.
- Preventivo del cronograma sin soporte de ejecución.
- Soporte de ejecución sin firma, sin fecha, o sin decir qué se hizo.
- Calibración o verificación metrológica vencida en equipos que la requieren.
- Equipo en uso sin respaldo de registro sanitario del dispositivo.
- Equipo dado de baja físicamente presente en el área asistencial.

**Causa de fondo:** el procedimiento de recepción de tecnología no incluye la apertura de hoja de
vida como control de entrada. Todo lo demás se deriva de ahí.

**Qué cierra:** ver `dotacion-e-ingenieria-clinica.md`.

---

## 4. Procesos prioritarios que solo existen firmados

**Cómo se detecta:** escoge tres procedimientos del servicio y pregúntale al auxiliar o al
profesional que está de turno, sin el jefe presente. Pregunta qué hace, no si conoce el
documento.

**Causa de fondo:** el procedimiento se escribió para la carpeta, no con la gente que lo ejecuta.
Se socializó con un acta de asistencia y nunca se verificó adherencia.

**Qué cierra:** medición de adherencia con método definido, resultados, y acciones sobre las
brechas. Un acta de socialización **no cierra** este hallazgo, y si se presenta como cierre, el
hallazgo se reabre.

---

## 5. Interdependencia con contrato vencido o cobertura insuficiente

**Cómo se detecta:** lista todos los servicios de soporte exigidos por criterio, y para cada uno
verifica tres cosas: contrato vigente hoy, servicio habilitado en el REPS del tercero, y
cobertura horaria que corresponda a la operación real.

**Causa de fondo:** los contratos los renueva un área administrativa sin conexión con la matriz
de interdependencia de habilitación.

**Qué cierra:** matriz de interdependencia por servicio con fecha de vencimiento de cada contrato
y alerta anticipada, más verificación REPS del tercero documentada con fecha.

**Caso grave:** contratar el soporte con un prestador que no tiene ese servicio habilitado. Eso
no es un hallazgo de contrato, es prestación irregular en cadena.

---

## 6. Historia clínica: consentimiento informado y trazabilidad

**Cómo se detecta:** muestra tomada del listado de atenciones, incluyendo noches y festivos.

Sub-hallazgos típicos:

- Consentimiento genérico que no identifica el procedimiento específico ni sus riesgos.
- Firmado en el mismo acto del procedimiento o después.
- Sin identificación de quién informó.
- Registros sin atribución clara de autor u hora.
- Contenido mínimo incompleto en el turno de noche.

**Causa de fondo:** el formato de consentimiento es único para todos los procedimientos, y el
flujo asistencial lo trata como firma de admisión.

**Qué cierra:** formatos específicos por procedimiento, momento definido en el flujo (antes,
con tiempo para preguntar), y auditoría interna periódica de historias con muestra propia.

---

## 7. Autoevaluación declarada sin haberse hecho

**Cómo se detecta:** pide los soportes de la autoevaluación declarada. Si no hay listas de
chequeo diligenciadas, evidencia recolectada y plan derivado, la autoevaluación no existió.

**Causa de fondo:** se trata como un trámite del REPS con fecha límite, no como un ejercicio de
verificación.

**Qué cierra:** hacer la autoevaluación real, con soportes por estándar y plan de mejoramiento
derivado. Y advertir explícitamente al representante legal el alcance de lo que se declara en el
REPS bajo su responsabilidad.

---

## 8. Medicamentos y cadena de frío

**Cómo se detecta:** pide el registro continuo de temperatura de un periodo, no del día.

Señales de alarma:
- Huecos en el registro (fines de semana, festivos).
- Registro completo pero con letra y tinta idénticas en todo el periodo.
- Valores sin ninguna variación.
- Desviaciones registradas sin ninguna acción documentada.

**Por qué importa más de lo que parece:** cuando el verificador concluye que un registro se
diligenció después, deja de auditar la nevera y empieza a dudar de **todos** los registros de la
institución. El costo del hallazgo se multiplica.

**Qué cierra:** registro automatizado con alarma cuando sea viable, o registro manual con control
de turno, más procedimiento de respuesta a desviación con evidencia de al menos una aplicación
real.

---

## 9. Infraestructura reasignada sin novedad

Ambientes que cambiaron de uso con el tiempo: el consultorio que se volvió depósito, la sala
dividida, el área de aislamiento que se ocupó. El REPS sigue reflejando el diseño original.

**Qué cierra:** reporte de novedad **y** verificación de que el ambiente resultante sigue
cumpliendo el criterio del servicio. A veces la respuesta honesta es que el servicio ya no cumple
y hay que decirlo.

---

## 10. Residuos, seguridad y soporte

Menos frecuentes pero de cierre lento: plan de gestión integral de residuos sin ejecución
verificable, extintores o sistema contra incendio vencidos, señalización de evacuación
incompleta, protección radiológica sin dosimetría vigente donde aplica.

Se detectan en el recorrido, no en la carpeta. Camina siempre.

---

## Patrón detrás de casi todos

Nueve de cada diez hallazgos comparten una de tres causas de fondo:

1. **No hay responsable nombrado** de mantener la condición (REPS, contratos, hojas de vida).
2. **El control no está en el flujo**, sino en la memoria de alguien.
3. **Se verificó la existencia del documento, nunca la adherencia** al proceso.

Cuando redactes la causa de un hallazgo, prueba estas tres antes de escribir "falta de
capacitación". Casi nunca es falta de capacitación.

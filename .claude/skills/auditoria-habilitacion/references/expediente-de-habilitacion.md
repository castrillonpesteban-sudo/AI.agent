# Expediente maestro de habilitación

La mayoría de las instituciones que fallan una visita **tienen** la evidencia. No la
**encuentran**. Este es el activo que más rinde por hora invertida en todo el alistamiento.

> Objetivo medible: **cualquier evidencia, ubicada y en mano, en menos de dos minutos**, por una
> persona que no sea quien la archivó.

## Principio de organización

Se organiza **por servicio y por estándar**, que es como pregunta el verificador. No por área
administrativa, que es como está hoy en la mayoría de las instituciones.

```
Expediente de habilitación/
├── 00_Institucional/            Lo transversal: se pregunta una vez, sirve para todo
├── 01_REPS/                     Lo declarado: inscripción, novedades, distintivo
├── 02_Sedes/
│   └── [Sede]/
│       └── [Servicio]/
│           ├── 1_Talento_humano/
│           ├── 2_Infraestructura/
│           ├── 3_Dotacion/
│           ├── 4_Medicamentos_dispositivos/
│           ├── 5_Procesos_prioritarios/
│           ├── 6_Historia_clinica/
│           └── 7_Interdependencia/
├── 03_Autoevaluaciones/         Por año, con soportes y plan derivado
└── 04_Visitas/                  Actas, hallazgos, respuestas, cierres
```

Regla: un documento vive **en un solo lugar** y se referencia desde donde más se necesite. El
documento duplicado se desactualiza en una de las dos copias, siempre, y el verificador encuentra
la vieja.

## Índice maestro

El expediente sin índice no cumple el objetivo de los dos minutos. El índice es una matriz con
una fila por evidencia:

| Campo | Para qué |
|---|---|
| **ID** | Referencia única, citable en el acta y en una solicitud de revisión |
| **Estándar / criterio** | Contra qué condición responde |
| **Servicio y sede** | La evidencia no se presta entre sedes |
| **Documento** | Nombre, código, versión |
| **Ubicación** | Ruta digital y física |
| **Fecha de emisión** | |
| **Fecha de vencimiento** | **La columna más importante del expediente** |
| **Responsable** | Quién lo mantiene vigente, con nombre |
| **Estado** | Vigente · Por vencer · Vencido · Falta |

Plantilla en `plantillas/matriz-evidencia.md`.

## La columna de vencimientos

De aquí sale el hallazgo evitable más común. Todo lo que caduca, con alerta anticipada y dueño:

- Autorizaciones de ejercicio y certificados del talento humano
- Contratos de interdependencia
- Calibraciones y verificaciones metrológicas
- Registros sanitarios de dispositivos
- Extintores, sistema contra incendio, conceptos técnicos, dosimetría
- Pólizas
- La propia inscripción en el REPS y la autoevaluación

Revisión mensual, no anual. Un contrato que vence tres días antes de la visita es un hallazgo
perfectamente evitable y perfectamente frecuente.

## Digital y físico

- **Digital como fuente primaria**, con índice y búsqueda. Es lo que resuelve los dos minutos.
- **Físico para lo que debe existir en original** o lo que el verificador pide en papel.
- Ambos con la misma estructura y los mismos ID. Dos estructuras distintas garantizan que en la
  visita se busque en la equivocada.
- Copia de respaldo fuera de la sede.
- Control de acceso, especialmente donde hay dato clínico.

## Prueba de que el expediente sirve

No lo declares listo hasta que pase esta prueba, hecha por alguien que no lo montó:

1. Escoge diez evidencias al azar de estándares distintos y de sedes distintas.
2. Pídelas en voz alta, como las pide un verificador: "muéstreme...".
3. Cronómetro.

**Menos de 2 minutos cada una: sirve.** Más de 5 en alguna: esa rama está mal organizada, no es
que la persona sea lenta.

Repite la prueba con el turno de noche. Si la evidencia solo la encuentra una persona y esa
persona está de vacaciones el día de la visita, el expediente no sirve.

## Lo que no debe estar en el expediente

- Borradores y versiones anteriores sin control. El verificador puede tomar la equivocada, y una
  versión obsoleta a la mano es un hallazgo autoinfligido.
- Documentos de otras sedes mezclados.
- Historias clínicas fuera de su custodia normal.
- Documentos sin fecha ni responsable. Si no puedes decir quién lo mantiene, no está mantenido.

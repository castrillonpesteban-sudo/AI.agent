# Graph Report - AI.agent  (2026-09-03)

## Corpus Check
- Corpus is ~34,029 words - fits in a single context window. You may not need a graph.

## Summary
- 250 nodes · 335 edges · 25 communities (14 shown, 8 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.84)
- Token cost: 565,209 input · 0 output

## Community Hubs (Navigation)
- Auditoría de Habilitación (SOGCS)
- graphify Skill Pipeline
- TypeScript Config (asistente-android)
- README: Auditoría de Habilitación
- Dependencias Dev (asistente-android)
- Paquete Next.js (asistente-android)
- Interfaz de Chat (asistente-android)
- README: Componentes de Chat
- Layout Raíz y Service Worker
- README: Offline y Service Worker
- README: Stack PWA
- Íconos PWA
- Endpoint API Assistant
- Configuración ESLint
- Memoria de Consultas graphify
- Extracción graphify (AST + Semántica)
- Registro graphify en CLAUDE.md
- Manifest e Ícono 192
- Configuración Next.js
- Ícono iOS y Manifest PWA
- Service Worker (Caché)
- Configuración Tailwind

## God Nodes (most connected - your core abstractions)
1. `auditoria-habilitacion Skill` - 33 edges
2. `auditoria-habilitacion Skill` - 19 edges
3. `compilerOptions` - 17 edges
4. `graphify Skill Pipeline` - 15 edges
5. `auditor-habilitacion Agent` - 13 edges
6. `Referencia: Dotación e Ingeniería Clínica` - 13 edges
7. `Referencia: Marco Normativo` - 12 edges
8. `Referencia: Estándares y Criterios` - 11 edges
9. `Referencia: Postura del Auditor` - 10 edges
10. `Resolución 1732 de 2026` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Verificar la norma antes de citarla` --semantically_similar_to--> `Honesty Rules`  [INFERRED] [semantically similar]
  README.md → .claude/skills/graphify/SKILL.md
- `graphify claude install` --references--> `Project CLAUDE.md graphify Section`  [INFERRED]
  .claude/skills/graphify/references/hooks.md → CLAUDE.md
- `Project CLAUDE.md graphify Section` --references--> `Wiki Export`  [EXTRACTED]
  CLAUDE.md → .claude/skills/graphify/references/exports.md
- `Project CLAUDE.md graphify Section` --references--> `/graphify path`  [EXTRACTED]
  CLAUDE.md → .claude/skills/graphify/references/query.md
- `Project CLAUDE.md graphify Section` --references--> `/graphify explain`  [EXTRACTED]
  CLAUDE.md → .claude/skills/graphify/references/query.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Estructura del Hallazgo de Cinco Elementos** — concept_estructura_hallazgo, _claude_skills_auditoria_habilitacion_references_metodo_auditoria, _claude_skills_auditoria_habilitacion_plantillas_informe_auditoria, _claude_skills_auditoria_habilitacion_skill [INFERRED 0.85]
- **Modo B — Ruta del Ciclo de la Visita** — concept_modo_b_recibir_visita, _claude_skills_auditoria_habilitacion_references_preparacion_de_la_visita, _claude_skills_auditoria_habilitacion_references_expediente_de_habilitacion, _claude_skills_auditoria_habilitacion_references_dia_de_la_visita, _claude_skills_auditoria_habilitacion_references_despues_de_la_visita, _claude_skills_auditoria_habilitacion_references_ciclo_reps [EXTRACTED 1.00]
- **Transición Normativa Resolución 3100 a 1732** — concept_resolucion_3100_de_2019, concept_resolucion_1732_de_2026, _claude_skills_auditoria_habilitacion_references_transicion_3100_a_1732, concept_manual_tomo_i, concept_manual_tomo_ii [INFERRED 0.85]
- **graphify Skill Reference Pipeline** — claude_skills_graphify_skill, claude_skills_graphify_references_add_watch, claude_skills_graphify_references_exports, claude_skills_graphify_references_extraction_spec, claude_skills_graphify_references_github_and_merge, claude_skills_graphify_references_hooks, claude_skills_graphify_references_query, claude_skills_graphify_references_transcribe, claude_skills_graphify_references_update [EXTRACTED 1.00]
- **Auditoría Habilitación Method References** — readme_auditoria_habilitacion, readme_marco_normativo, readme_estandares_y_criterios, readme_metodo_auditoria, readme_hallazgos_frecuentes, readme_transicion_3100_a_1732 [EXTRACTED 1.00]
- **Assistant Chat UI Flow** — asistente_android_readme_page_tsx, asistente_android_readme_chatwindow, asistente_android_readme_messagebubble, asistente_android_readme_usechat, asistente_android_readme_api_assistant [INFERRED 0.85]

## Communities (25 total, 8 thin omitted)

### Community 0 - "Auditoría de Habilitación (SOGCS)"
Cohesion: 0.10
Nodes (51): auditor-habilitacion Agent, Plantilla: Acta de Visita de Verificación, Plantilla: Informe de Auditoría, Plantilla: Lista de Chequeo de Autoevaluación, Plantilla: Matriz de Evidencia, Plantilla: Plan de Mejoramiento, Plantilla: Respuesta a Hallazgos, Referencia: Ciclo de Vida en el REPS (+43 more)

### Community 1 - "graphify Skill Pipeline"
Cohesion: 0.07
Nodes (41): Project CLAUDE.md graphify Section, Add URL & Watch Folder Reference, graphify add (URL ingest), graphify --watch, Exports & Benchmark Reference, Token Reduction Benchmark, FalkorDB Export, GraphML Export (+33 more)

### Community 2 - "TypeScript Config (asistente-android)"
Cohesion: 0.07
Nodes (27): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+19 more)

### Community 3 - "README: Auditoría de Habilitación"
Cohesion: 0.07
Nodes (28): Honesty Rules, acta-visita-verificacion.md, .claude/agents/auditor-habilitacion.md, auditor-habilitacion Agent, auditoria-habilitacion Skill, ciclo-reps.md, despues-de-la-visita.md, dia-de-la-visita.md (+20 more)

### Community 4 - "Dependencias Dev (asistente-android)"
Cohesion: 0.11
Nodes (19): devDependencies, autoprefixer, eslint, eslint-config-next, postcss, tailwindcss, @types/node, @types/react (+11 more)

### Community 5 - "Paquete Next.js (asistente-android)"
Cohesion: 0.12
Nodes (15): dependencies, next, react, react-dom, next, name, private, scripts (+7 more)

### Community 6 - "Interfaz de Chat (asistente-android)"
Cohesion: 0.29
Nodes (6): ChatWindow(), MessageBubble(), ChatMessage, ChatRole, makeId(), useChat()

### Community 7 - "README: Componentes de Chat"
Cohesion: 0.33
Nodes (6): ANTHROPIC_API_KEY, src/app/api/assistant, ChatWindow.tsx, MessageBubble.tsx, src/app/page.tsx, useChat.ts

### Community 8 - "Layout Raíz y Service Worker"
Cohesion: 0.40
Nodes (3): metadata, viewport, RegisterServiceWorker()

### Community 9 - "README: Offline y Service Worker"
Cohesion: 0.50
Nodes (5): Sin Conexión Offline Page, src/app/layout.tsx, public/offline.html, RegisterServiceWorker.tsx, public/sw.js (Service Worker)

### Community 10 - "README: Stack PWA"
Cohesion: 0.40
Nodes (5): src/app/manifest.ts, Next.js 14 App Router, Asistente Personal PWA, Tailwind CSS, TypeScript

### Community 11 - "Íconos PWA"
Cohesion: 0.83
Nodes (4): Asistente Android PWA, icon-512.png (PWA App Icon), PWA Maskable Icon (512x512), PWA Web App Manifest

### Community 14 - "Memoria de Consultas graphify"
Cohesion: 0.67
Nodes (3): graphify reflect / LESSONS.md, graphify save-result, Work Memory (Self-Improving Loop)

### Community 15 - "Extracción graphify (AST + Semántica)"
Cohesion: 0.67
Nodes (3): Structural (AST) Extraction, Semantic Extraction Cache, Semantic (LLM) Extraction

## Knowledge Gaps
- **104 isolated node(s):** `extends`, `next/core-web-vitals`, `nextConfig`, `name`, `version` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 117 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `graphify Skill Pipeline` connect `graphify Skill Pipeline` to `README: Auditoría de Habilitación`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `auditor-habilitacion Agent` (e.g. with `Referencia: Postura del Auditor` and `auditoria-habilitacion Skill`) actually correct?**
  _`auditor-habilitacion Agent` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `extends`, `next/core-web-vitals`, `nextConfig` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auditoría de Habilitación (SOGCS)` be split into smaller, more focused modules?**
  _Cohesion score 0.10196078431372549 - nodes in this community are weakly interconnected._
- **Should `graphify Skill Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.06707317073170732 - nodes in this community are weakly interconnected._
- **Should `TypeScript Config (asistente-android)` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `README: Auditoría de Habilitación` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
# Agent Reach — instalación del CLI

El skill `agent-reach` de esta carpeta viene de
[Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) (v1.5.0) y **solo enruta**:
decide qué herramienta usar para cada plataforma. Las herramientas hay que instalarlas aparte, en
la máquina donde corre el agente.

## Instalar el CLI

```bash
pipx install https://github.com/Panniantong/agent-reach/archive/main.zip
agent-reach install --env=auto            # solo revisa, no toca nada
agent-reach install --env=auto --system   # instala lo que falta
agent-reach doctor                        # estado de los canales
```

Si el zip de GitHub está bloqueado por un proxy corporativo, instala por git:

```bash
pipx install --backend pip "git+https://github.com/Panniantong/agent-reach.git@main"
```

Con Python de Homebrew o cualquier PEP 668 (`externally-managed-environment`), usa `pipx` o un
`venv`; no `pip install` al sistema.

## Qué deja instalado `--system`

`gh` CLI, `mcporter` (con Exa configurado), runtime JS de Node para `yt-dlp`. `yt-dlp` se instala
aparte:

```bash
pipx install "yt-dlp[default]"
agent-reach install --env=auto --system   # reejecutar para que escriba la config de runtime JS
```

Con eso quedan activos los canales sin credenciales: web (Jina Reader), YouTube, GitHub, RSS, Exa,
V2EX y Bilibili básico.

## Canales opcionales

Los demás piden cookies o sesión de navegador y hay que pedirlos explícitamente:

```bash
agent-reach install --env=auto --system --channels=twitter,reddit,xiaohongshu
```

Nombres válidos: `opencli`, `twitter`, `xiaoyuzhou`, `xueqiu`, `xiaohongshu`, `reddit`,
`facebook`, `instagram`, `bilibili`, `linkedin`, `all`.

**Usa una cuenta secundaria para estos.** La autenticación por cookie da acceso completo a la
cuenta y las plataformas pueden restringirla al detectar llamadas fuera del navegador.

## Estado en sesiones remotas de Claude Code

En un contenedor remoto de Claude Code el CLI se instala bien, pero la política de red del entorno
solo deja salir a un allowlist (API de GitHub, PyPI, npm). YouTube, `r.jina.ai`, V2EX y el OAuth de
Exa responden `403 Forbidden` en el proxy. El contenedor además es efímero.

Los canales de Agent Reach sirven en la máquina local del usuario, no en la sesión remota.

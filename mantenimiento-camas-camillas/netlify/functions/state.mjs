import { getStore, getDeployStore } from "@netlify/blobs";

// Todo el estado vive en un unico registro JSON bajo esta clave.
// Reemplaza a Redis/Upstash: Netlify Blobs viene incluido en el plan gratis.
const STORE = "mantenimiento-camas";
const KEY = "estado";

export const config = { path: "/api/state" };

// El estado de produccion no se mezcla con el de deploy previews.
function abrirStore() {
  const opts = { name: STORE, consistency: "strong" };
  return process.env.CONTEXT === "production"
    ? getStore(opts)
    : getDeployStore(opts);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function leerPlaca(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return { error: json({ error: "bad_json" }, 400) };
  }
  const placa = body && body.placa;
  if (typeof placa !== "string" || !placa.trim()) {
    return { error: json({ error: "no_placa" }, 400) };
  }
  return { placa, patch: body.patch };
}

export default async (req) => {
  const store = abrirStore();

  if (req.method === "GET") {
    const estado = await store.get(KEY, { type: "json" });
    return json(estado || {});
  }

  if (req.method === "POST") {
    const { placa, patch, error } = await leerPlaca(req);
    if (error) return error;
    const estado = (await store.get(KEY, { type: "json" })) || {};
    estado[placa] = {
      ...estado[placa],
      ...(patch || {}),
      upd: new Date().toISOString(),
    };
    await store.setJSON(KEY, estado);
    return json({ ok: true, placa, registro: estado[placa] });
  }

  if (req.method === "DELETE") {
    const { placa, error } = await leerPlaca(req);
    if (error) return error;
    const estado = (await store.get(KEY, { type: "json" })) || {};
    delete estado[placa];
    await store.setJSON(KEY, estado);
    return json({ ok: true, placa });
  }

  return json({ error: "method_not_allowed" }, 405);
};

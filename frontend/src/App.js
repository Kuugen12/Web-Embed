import React, { useState, useEffect, useRef } from "react";

// Single-file React preview component. Default export is the App component.
// Copy this to frontend/src/App.js (or adapt into your component structure).
// This example uses native WebSocket to receive real-time weight updates from the backend
// and REST calls to fetch recipes and to start/reset the mixing job.

// NOTE: replace WS_URL and API_BASE with your backend URL if different.
const WS_URL = "ws://localhost:5000/ws";
const API_BASE = "http://localhost:5000";

// Local image (provided by the user). The path below is the local file path that will be
// transformed into a served URL by the environment/tooling: /mnt/data/2aa59c5a-dba6-4620-8b97-1048f13f5676.png
const LOGO_PATH = "/mnt/data/2aa59c5a-dba6-4620-8b97-1048f13f5676.png";

function Login({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");

  const handle = async () => {
    try {
      const r = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const j = await r.json();
      setMsg(j.message || JSON.stringify(j));
      if (j.success) onLogin({ username: user });
    } catch (e) {
      setMsg("Server tidak tersedia");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", textAlign: "center", padding: 20 }}>
      <img src={LOGO_PATH} alt="logo" style={{ width: 120, marginBottom: 20 }} />
      <h2>Login</h2>
      <input placeholder="Username" value={user} onChange={(e) => setUser(e.target.value)} style={{ width: "100%", padding: 8, margin: "8px 0" }} />
      <input placeholder="Password" type="password" value={pass} onChange={(e) => setPass(e.target.value)} style={{ width: "100%", padding: 8, margin: "8px 0" }} />
      <button onClick={handle} style={{ padding: "8px 16px", marginTop: 8 }}>Login</button>
      {msg && <p>{msg}</p>}
      <p style={{ fontSize: 12, color: '#666' }}>Default demo login: admin / 1234</p>
    </div>
  );
}

function RecipeCard({ recipe, onSelect }) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{recipe.name}</strong>
        <button onClick={() => onSelect(recipe)}>Pilih</button>
      </div>
      <ul>
        {recipe.ingredients.map((ing, i) => (
          <li key={i}>{ing.name}: {ing.weight} kg</li>
        ))}
      </ul>
    </div>
  );
}

function Dashboard({ user, ws, api }) {
  const [recipes, setRecipes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [currentWeight, setCurrentWeight] = useState(0); // total weight measured by load cell
  const [ingredientWeights, setIngredientWeights] = useState({}); // per-ingredient measured weights (optional)
  const [log, setLog] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API_BASE}/recipes`);
        const j = await r.json();
        setRecipes(j);
      } catch (e) {
        // fallback sample recipes
        setRecipes([
          { id: 1, name: 'Racikan 1', ingredients: [ { name: 'Jagung', weight: 8 }, { name: 'Telor', weight: 2 }, { name: 'Daon', weight: 5 } ] },
          { id: 2, name: 'Racikan 2', ingredients: [ { name: 'Telor', weight: 8 }, { name: 'Jagung', weight: 5 }, { name: 'Daon', weight: 2 } ] }
        ]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!ws) return;
    const handler = (ev) => {
      try {
        const d = JSON.parse(ev.data);
        // expected payload: { type: 'weight', value: 12.34 } or { type: 'log', message: '...' }
        if (d.type === 'weight') {
          setCurrentWeight(d.value);
        } else if (d.type === 'ingredient') {
          setIngredientWeights(prev => ({ ...prev, [d.name]: d.value }));
        } else if (d.type === 'log') {
          setLog(prev => [d.message, ...prev].slice(0, 200));
        }
      } catch (e) { console.error(e); }
    };
    ws.addEventListener('message', handler);
    return () => ws.removeEventListener('message', handler);
  }, [ws]);

  const totalTarget = selected ? selected.ingredients.reduce((s,i) => s + i.weight, 0) : 0;
  const percent = totalTarget > 0 ? Math.min(100, Math.round((currentWeight / totalTarget) * 100)) : 0;

  const startMix = async (recipe) => {
    setSelected(recipe);
    setLog(prev => [`Racikan ${recipe.name} dipilih`, ...prev]);
    // notify backend to start a mixing job (if implemented)
    try { await fetch(`${API_BASE}/start`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ recipeId: recipe.id }) }); } catch(e){}
  };

  const reset = async () => {
    setSelected(null);
    setCurrentWeight(0);
    setIngredientWeights({});
    setLog(prev => ['Reset', ...prev]);
    try { await fetch(`${API_BASE}/reset`, { method: 'POST' }); } catch(e){}
  };

  return (
    <div style={{ maxWidth: 1100, margin: '20px auto', display: 'grid', gridTemplateColumns: '360px 1fr 320px', gap: 20 }}>
      <div>
        <h3>Resep</h3>
        <div>
          {recipes.map(r => <RecipeCard key={r.id} recipe={r} onSelect={startMix} />)}
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={reset}>Reset</button>
        </div>
      </div>

      <div style={{ border: '1px solid #eee', padding: 16, borderRadius: 8 }}>
        <h2>Monitor Pengisian</h2>
        {!selected && <p>Pilih racikan pada kolom kiri. Instruksi juga tampil di LCD mesin.</p>}

        {selected && (
          <div>
            <h3>{selected.name}</h3>
            <p>Target total: <strong>{totalTarget} kg</strong></p>

            <div style={{ margin: '12px 0' }}>
              <div style={{ height: 28, width: '100%', background: '#f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${percent}%`, background: '#4caf50', transition: 'width 300ms' }}></div>
              </div>
              <p style={{ marginTop: 8 }}>{percent}% terisi ({currentWeight} / {totalTarget} kg)</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {selected.ingredients.map((ing, idx) => {
                const currentIng = ingredientWeights[ing.name] ?? 0;
                const ingPercent = Math.min(100, Math.round((currentIng / ing.weight) * 100));
                return (
                  <div key={idx} style={{ border: '1px solid #eee', padding: 8, borderRadius: 6 }}>
                    <strong>{ing.name}</strong>
                    <div>Target: {ing.weight} kg</div>
                    <div>Terisi: {currentIng} kg</div>
                    <div style={{ height: 10, background: '#f4f4f4', marginTop: 8 }}>
                      <div style={{ width: `${ingPercent}%`, height: '100%', background: '#2196f3' }}></div>
                    </div>
                    <div style={{ fontSize: 12, marginTop: 6 }}>{ingPercent}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      <aside style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
        <h4>LCD (simulasi)</h4>
        <div style={{ minHeight: 120, padding: 12, background: '#000', color: '#0f0', borderRadius: 6, fontFamily: 'monospace' }}>
          {!selected && <div>{"Silahkan pilih porsi racikan bahan"}</div>}
          {selected && (
            <div>
              <div>{`Resep: ${selected.name}`}</div>
              <div>{`Target total: ${totalTarget} kg`}</div>
              <div>{`Terisi: ${currentWeight} kg (${percent}%)`}</div>
            </div>
          )}
        </div>

        <h4 style={{ marginTop: 12 }}>Keypad (web control)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {recipes.map(r => (
            <button key={r.id} onClick={() => startMix(r)} style={{ padding: 12 }}>{r.id}</button>
          ))}
        </div>

        <h4 style={{ marginTop: 12 }}>Log</h4>
        <div style={{ maxHeight: 220, overflow: 'auto', background: '#fafafa', padding: 8 }}>
          {log.map((l, i) => <div key={i} style={{ fontSize: 13, marginBottom: 6 }}>{l}</div>)}
        </div>
      </aside>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ws, setWs] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    // open WS connection
    try {
      const s = new WebSocket(WS_URL);
      s.addEventListener('open', () => console.log('ws open'));
      s.addEventListener('close', () => console.log('ws closed'));
      setWs(s);
      wsRef.current = s;
      return () => { s.close(); };
    } catch (e) { console.warn('ws fail', e); }
  }, []);

  return (
    <div>
      {!user && <Login onLogin={setUser} />}
      {user && <Dashboard user={user} ws={ws} api={{ base: API_BASE }} />}
    </div>
  );
}

/*
Backend (short notes) - to implement server integration for full functionality:

1) REST endpoints (Node.js/Express):
   GET /recipes -> return list of recipes
   POST /login -> authenticate user
   POST /start -> start mixing job for recipeId
   POST /reset -> reset job

2) WebSocket endpoint (ws://localhost:5000/ws) that sends JSON messages:
   { type: 'weight', value: 12.34 }  // total weight from load cell
   { type: 'ingredient', name: 'Jagung', value: 3.2 } // optional per-ingredient weights if available
   { type: 'log', message: 'Jagung masuk: 1.2 kg' }

3) On the microcontroller side (ESP32/Arduino): when keypad pressed send a small HTTP request to /start or directly to WebSocket; publish weight readings periodically so the web dashboard updates in real-time.

4) Load cell integration: typical stack is HX711 -> ESP32 -> REST/WS -> server.

This single-file React component is a working UI prototype. Copy it to frontend/src/App.js and ensure the backend implements WS and REST endpoints described above. The dashboard uses the local image path:

  /mnt/data/2aa59c5a-dba6-4620-8b97-1048f13f5676.png

The environment/tooling will transform that local path into a served URL when previewing.
*/

import React, { useState, useEffect, useRef } from "react";

// URL backend
const WS_URL = "ws://localhost:5000/ws";
const API_BASE = "[http://localhost:5000](http://localhost:5000)";

// ==== LOGIN COMPONENT ====
function Login({ onLogin }) {
const [user, setUser] = useState("");
const [pass, setPass] = useState("");
const [msg, setMsg] = useState("");

const handleLogin = async () => {
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
<div style={{ maxWidth: 420, margin: "60px auto", textAlign: "center", padding: 20 }}> <h2>Login</h2>
<input
placeholder="Username"
value={user}
onChange={(e) => setUser(e.target.value)}
style={{ width: "100%", padding: 8, margin: "8px 0" }}
/>
<input
placeholder="Password"
type="password"
value={pass}
onChange={(e) => setPass(e.target.value)}
style={{ width: "100%", padding: 8, margin: "8px 0" }}
/>
<button onClick={handleLogin} style={{ padding: "8px 16px", marginTop: 8 }}>
Login </button>
{msg && <p>{msg}</p>} </div>
);
}

// ==== RECIPE CARD ====
function RecipeCard({ recipe, onSelect }) {
return (
<div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 8 }}>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> <strong>{recipe.name}</strong>
<button onClick={() => onSelect(recipe)}>Pilih</button> </div> <ul>
{recipe.ingredients.map((ing, i) => ( <li key={i}>{ing.name}: {ing.weight} kg</li>
))} </ul> </div>
);
}

// ==== DASHBOARD ====
function Dashboard({ user, ws }) {
const [recipes, setRecipes] = useState([]);
const [selected, setSelected] = useState(null);
const [currentWeight, setCurrentWeight] = useState(0);
const [log, setLog] = useState([]);

useEffect(() => {
const load = async () => {
try {
const r = await fetch(`${API_BASE}/recipes`);
const j = await r.json();
setRecipes(j);
} catch (e) {
setRecipes([
{ id: 1, name: 'Racikan Default 1', ingredients: [ { name: 'Jagung', weight: 8 }, { name: 'Telor', weight: 2 }, { name: 'Daun', weight: 5 } ] },
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
if (d.type === 'weight') setCurrentWeight(d.value);
else if (d.type === 'log') setLog(prev => [d.message, ...prev]);
} catch (e) {}
};
ws.addEventListener('message', handler);
return () => ws.removeEventListener('message', handler);
}, [ws]);

const totalTarget = selected ? selected.ingredients.reduce((s,i) => s + i.weight, 0) : 0;
const percent = totalTarget > 0 ? Math.min(100, Math.round((currentWeight / totalTarget) * 100)) : 0;

const startMix = (recipe) => {
setSelected(recipe);
setLog(prev => [`Racikan ${recipe.name} dimulai`, ...prev]);
};

return (
<div style={{ maxWidth: 1100, margin: '20px auto', display: 'grid', gridTemplateColumns: '360px 1fr 320px', gap: 20 }}>

```
  <div>
    <h3>Resep</h3>
    {recipes.map(r => <RecipeCard key={r.id} recipe={r} onSelect={startMix} />)}
  </div>

  <div style={{ border: '1px solid #eee', padding: 16, borderRadius: 8 }}>
    <h2>Monitor Pengisian</h2>

    {selected && (
      <>
        <h3>{selected.name}</h3>
        <p>Total target: {totalTarget} kg</p>
        <p>Terisi: {currentWeight} kg ({percent}%)</p>
      </>
    )}
  </div>

  <aside style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
    <h4>Log</h4>
    <div style={{ maxHeight: 220, overflow: 'auto', background: '#fafafa', padding: 8 }}>
      {log.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  </aside>
</div>


);
}

// ==== MAIN APP ====
export default function App() {
const [user, setUser] = useState(null);
const [ws, setWs] = useState(null);
const wsRef = useRef(null);

useEffect(() => {
try {
const s = new WebSocket(WS_URL);
setWs(s);
wsRef.current = s;
return () => s.close();
} catch (e) {}
}, []);

return ( <div>
{!user && <Login onLogin={setUser} />}
{user && <Dashboard user={user} ws={ws} />} </div>
);
}

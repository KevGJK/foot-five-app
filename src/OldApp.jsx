import { supabase } from "./lib/supabase";
import { useEffect, useState } from "react";

export default function App() {

  console.log("Supabase OK", supabase);

  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [level, setLevel] = useState(3);
  const [selected, setSelected] = useState([]);

  // 🧠 labels niveaux
  const levelLabels = {
    1: "N1 - Débutant",
    2: "N2 - Moyen",
    3: "N3 - Bon niveau",
    4: "N4 - Très bon",
    5: "N5 - Expert",
  };

  const getLevelLabel = (level) => levelLabels[level];

  // 💾 chargement
  useEffect(() => {
    const saved = localStorage.getItem("players");
    if (saved) setPlayers(JSON.parse(saved));
  }, []);

  // 💾 sauvegarde auto
  useEffect(() => {
    localStorage.setItem("players", JSON.stringify(players));
  }, [players]);

  const addPlayer = () => {
    if (!name.trim()) return;

    setPlayers([
      ...players,
      {
        id: Date.now(),
        name,
        level: Number(level),
      },
    ]);

    setName("");
    setLevel(3);
  };

  const deletePlayer = (id) => {
    setPlayers(players.filter((p) => p.id !== id));
    setSelected(selected.filter((p) => p.id !== id));
  };

  const changeLevel = (id, newLevel) => {
    setPlayers(
      players.map((p) =>
        p.id === id ? { ...p, level: Number(newLevel) } : p
      )
    );
  };

  const togglePlayer = (player) => {
    const exists = selected.find((p) => p.id === player.id);

    if (exists) {
      setSelected(selected.filter((p) => p.id !== player.id));
    } else {
      setSelected([...selected, player]);
    }
  };

  // ⚖️ équilibrage
  const generateMessage = () => {
    const sorted = [...selected].sort((a, b) => b.level - a.level);

    const teamA = [];
    const teamB = [];
    let scoreA = 0;
    let scoreB = 0;

    sorted.forEach((p) => {
      if (scoreA <= scoreB) {
        teamA.push(p);
        scoreA += p.level;
      } else {
        teamB.push(p);
        scoreB += p.level;
      }
    });

    return `⚽ MATCH FOOT FIVE ⚽

🔵 ÉQUIPE A (score ${scoreA})
${teamA
  .map((p) => `- ${p.name} (${getLevelLabel(p.level)})`)
  .join("\n")}

🔴 ÉQUIPE B (score ${scoreB})
${teamB
  .map((p) => `- ${p.name} (${getLevelLabel(p.level)})`)
  .join("\n")}

🔥 Bon match !`;
  };

  const sendWhatsApp = () => {
    const text = generateMessage();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div
      style={{
        padding: 15,
        fontFamily: "Arial",
        maxWidth: 500,
        margin: "auto",
      }}
    >
      <h2>⚽ Foot Five Manager</h2>

      {/* AJOUT JOUEUR */}
      <div style={{ display: "flex", gap: 5 }}>
        <input
          placeholder="Nom du joueur"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1 }}
        />

        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          {Object.entries(levelLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <button onClick={addPlayer}>+</button>
      </div>

      <hr />

      {/* LISTE JOUEURS */}
      {players.map((p) => (
        <div
          key={p.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 8,
            border: "1px solid #ddd",
            borderRadius: 8,
            marginBottom: 6,
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={selected.some((s) => s.id === p.id)}
              onChange={() => togglePlayer(p)}
            />
            {p.name} — {getLevelLabel(p.level)}
          </label>

          <div>
            <select
              value={p.level}
              onChange={(e) =>
                changeLevel(p.id, e.target.value)
              }
            >
              {Object.entries(levelLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <button onClick={() => deletePlayer(p.id)}>
              🗑️
            </button>
          </div>
        </div>
      ))}

      <hr />

      {/* WHATSAPP */}
      <button
        onClick={sendWhatsApp}
        style={{
          width: "100%",
          padding: 12,
          background: "#25D366",
          color: "white",
          border: "none",
          borderRadius: 8,
          fontSize: 16,
          fontWeight: "bold",
        }}
      >
        📲 Envoyer sur WhatsApp
      </button>
    </div>
  );
}
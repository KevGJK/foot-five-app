import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Switch from "../components/ui/Switch";
import { useEffect, useState } from "react";
import { registerDevice } from "../services/registerDevice";

export default function Settings() {
  const [pushEnabled, setPushEnabled] = useState(false);

  const [pushSupported, setPushSupported] = useState(false);

  const [pushPermission, setPushPermission] = useState("default");

  const [notifications, setNotifications] = useState({
    newMatch: true,
    matchCancelled: true,
    teamsReady: true,
    matchReminder: true,
    newMember: true,
    newSeason: true,
    seasonClosed: true,
    results: true,
  });

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        return;
      }

      await loadProfile(user.id);

      if (cancelled) {
        return;
      }

      await loadSettings(user.id);

      if (cancelled) {
        return;
      }

      await checkPush();
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadProfile(profileId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("display_name,email")
      .eq("id", profileId)
      .single();

    setProfile(data);
  }

  async function loadSettings(profileId) {
    let { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("profile_id", profileId)
      .single();

    if (!data) {
      const { data: created } = await supabase
        .from("user_settings")
        .insert({
          profile_id: profileId,
        })
        .select()
        .single();

      data = created;
    }

    if (!data) return;

    setPushEnabled(data.push_enabled);

    setNotifications({
      newMatch: data.new_match,
      matchCancelled: data.match_cancelled,
      teamsReady: data.teams_ready,
      matchReminder: data.match_reminder,
      newMember: data.new_member,
      newSeason: data.new_season,
      seasonClosed: data.season_closed,
      results: data.results,
    });
  }

  async function checkPush() {
    const supported = "Notification" in window;

    setPushSupported(supported);

    if (supported) {
      setPushPermission(Notification.permission);
    }
  }

  async function updateNotification(key, value) {
    const mapping = {
      newMatch: "new_match",
      matchCancelled: "match_cancelled",
      teamsReady: "teams_ready",
      matchReminder: "match_reminder",
      newMember: "new_member",
      newSeason: "new_season",
      seasonClosed: "season_closed",
      results: "results",
    };

    const column = mapping[key];

    if (!column) {
      console.error("Préférence de notification inconnue :", key);
      return;
    }

    const updated = {
      ...notifications,
      [key]: value,
    };

    setNotifications(updated);

    await saveSettings({
      [column]: value,
    });
  }

  async function saveSettings(changes = {}) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("user_settings")
      .upsert({
        profile_id: user.id,

        push_enabled: pushEnabled,

        new_match: notifications.newMatch,

        match_cancelled: notifications.matchCancelled,

        teams_ready: notifications.teamsReady,

        match_reminder: notifications.matchReminder,

        new_member: notifications.newMember,

        new_season: notifications.newSeason,

        season_closed: notifications.seasonClosed,

        results: notifications.results,

        ...changes,

        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Erreur sauvegarde paramètres :", error);
      alert("❌ Impossible d'enregistrer les paramètres.");
    }
  }

  return (
    <Page>
      <h1 className="page-title">
        ⚙ Paramètres
      </h1>

      <Card>
        <h2 className="section-title">
          👤 Mon profil
        </h2>

        <div
          style={{
            fontSize: "22px",
            fontWeight: "700",
          }}
        >
          {profile?.display_name || "..."}
        </div>

        <div
          style={{
            opacity: 0.7,
            marginTop: "6px",
            marginBottom: "24px",
          }}
        >
          {profile?.email || ""}
        </div>

        <Button
          variant="danger"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.reload();
          }}
        >
          🚪 Déconnexion
        </Button>
      </Card>

      <Card>
        <h2 className="section-title">
          🔔 Notifications
        </h2>

        <Switch
          label="Activer les notifications"
          checked={pushEnabled}
          onChange={async (value) => {
            setPushEnabled(value);

            await saveSettings({
              push_enabled: value,
            });
          }}
        />

        <div
          style={{
            opacity: 0.65,
            fontSize: "14px",
            marginTop: "8px",
            lineHeight: "1.5",
          }}
        >
          Active ou désactive globalement les notifications Push.
          Les préférences ci-dessous permettent ensuite de choisir
          les types de notifications que tu souhaites recevoir.
        </div>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid rgba(255,255,255,.08)",
            margin: "18px 0",
          }}
        />

        <Switch
          label="Nouveau match"
          checked={notifications.newMatch}
          onChange={(value) => updateNotification("newMatch", value)}
        />

        <Switch
          label="Match annulé"
          checked={notifications.matchCancelled}
          onChange={(value) =>
            updateNotification("matchCancelled", value)
          }
        />

        <Switch
          label="Composition des équipes"
          checked={notifications.teamsReady}
          onChange={(value) =>
            updateNotification("teamsReady", value)
          }
        />

        <Switch
          label="Rappel avant le match"
          checked={notifications.matchReminder}
          onChange={(value) =>
            updateNotification("matchReminder", value)
          }
        />

        <Switch
          label="Nouveau membre"
          checked={notifications.newMember}
          onChange={(value) =>
            updateNotification("newMember", value)
          }
        />

        <Switch
          label="Nouvelle saison"
          checked={notifications.newSeason}
          onChange={(value) =>
            updateNotification("newSeason", value)
          }
        />

        <Switch
          label="Fin de saison"
          checked={notifications.seasonClosed}
          onChange={(value) =>
            updateNotification("seasonClosed", value)
          }
        />

        <Switch
          label="Résultats"
          checked={notifications.results}
          onChange={(value) =>
            updateNotification("results", value)
          }
        />
      </Card>

      <Card>
        <h2 className="section-title">
          📲 Notifications Push
        </h2>

        <div style={{ marginBottom: "10px" }}>
          <b>Compatibilité :</b>{" "}
          {pushSupported ? "✅ Oui" : "❌ Non"}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <b>Autorisation :</b>{" "}
          {pushPermission === "granted"
            ? "✅ Accordée"
            : pushPermission === "denied"
            ? "❌ Refusée"
            : "⏳ Non demandée"}
        </div>

        <Button
          onClick={async () => {
            try {
              await registerDevice();

              setPushPermission(Notification.permission);

              alert("✅ Notifications Push activées");
            } catch (e) {
              console.error(e);
              alert(e.message);
            }
          }}
          disabled={!pushSupported}
        >
          🔔 Autoriser les notifications Push
        </Button>
      </Card>

      <Card>
        <h2 className="section-title">
          📱 Application
        </h2>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <span>Version</span>
          <b>1.0.0</b>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Plateforme</span>
          <b>PWA</b>
        </div>
      </Card>

      <Card>
        <h2 className="section-title">
          ℹ️ À propos
        </h2>

        <div
          style={{
            lineHeight: "1.8",
          }}
        >
          <b>Foot Five Manager</b>

          <br />

          Développé par Kevin Gajecki

          <br />

          Version 1.0.0
        </div>
      </Card>
    </Page>
  );
}
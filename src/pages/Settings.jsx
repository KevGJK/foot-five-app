import {
  useLanguage
} from "../i18n/useLanguage";
import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Switch from "../components/ui/Switch";
import {
  useEffect,
  useState,
  useCallback
} from "react";
import { registerDevice } from "../services/registerDevice";

export default function Settings() {

const {
  language,
  setLanguage,
  t
} = useLanguage();

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

  const loadSettings = useCallback(async (profileId) => {
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
      language: language,
    })
    .select()
    .single();

  data = created;
}

if (!data) return;

setPushEnabled(data.push_enabled);

if (data.language) {
  setLanguage(
    data.language
  );
}

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

}, [language, setLanguage]);

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
 }, [loadSettings]);

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

        language: language,

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
      alert(t("settingsSaveError"));
    }
  }

  return (
    <Page>
<h1 className="page-title">
  ⚙ {t("settings")}
</h1>

      <Card>
        <h2 className="section-title">
  👤 {t("profile")}
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
          🚪 {t("logout")}
        </Button>
      </Card>

      <Card>
        <h2 className="section-title">
  🔔 {t("notifications")}
</h2>

        <Switch
          label={t("enableNotifications")}
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
  {t("notificationsDescription")}
</div>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid rgba(255,255,255,.08)",
            margin: "18px 0",
          }}
        />

        <Switch
          label={t("newMatch")}
          checked={notifications.newMatch}
          onChange={(value) => updateNotification("newMatch", value)}
        />

        <Switch
          label={t("matchCancelled")}
          checked={notifications.matchCancelled}
          onChange={(value) =>
            updateNotification("matchCancelled", value)
          }
        />

        <Switch
          label={t("teamsReady")}
          checked={notifications.teamsReady}
          onChange={(value) =>
            updateNotification("teamsReady", value)
          }
        />

        <Switch
          label={t("matchReminder")}
          checked={notifications.matchReminder}
          onChange={(value) =>
            updateNotification("matchReminder", value)
          }
        />

        <Switch
          label={t("newMember")}
          checked={notifications.newMember}
          onChange={(value) =>
            updateNotification("newMember", value)
          }
        />

        <Switch
          label={t("newSeason")}
          checked={notifications.newSeason}
          onChange={(value) =>
            updateNotification("newSeason", value)
          }
        />

        <Switch
          label={t("seasonClosed")}
          checked={notifications.seasonClosed}
          onChange={(value) =>
            updateNotification("seasonClosed", value)
          }
        />

        <Switch
          label={t("results")}
          checked={notifications.results}
          onChange={(value) =>
            updateNotification("results", value)
          }
        />
      </Card>

      <Card>
        <h2 className="section-title">
          📲 {t("pushNotifications")}
        </h2>

        <div style={{ marginBottom: "10px" }}>
          <b>{t("compatibility")} :</b>{" "}
{pushSupported ? `✅ ${t("yes")}` : `❌ ${t("no")}`}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <b>{t("authorization")} :</b>{" "}
{pushPermission === "granted"
  ? `✅ ${t("granted")}`
  : pushPermission === "denied"
  ? `❌ ${t("denied")}`
  : `⏳ ${t("notRequested")}`}
        </div>

        <Button
          onClick={async () => {
            try {
              await registerDevice();

              setPushPermission(Notification.permission);

              alert(`✅ ${t("pushActivated")}`);
            } catch (e) {
              console.error(e);
              alert(e.message);
            }
          }}
          disabled={!pushSupported}
        >
          🔔 {t("authorizePush")}
        </Button>
      </Card>

<Card>

  <h2 className="section-title">
    🌍 {t("language")}
  </h2>

  <div
    style={{
      marginBottom: "10px",
      opacity: 0.75
    }}
  >
    {t("languageDescription")}
  </div>

  <select

    value={language}

    onChange={async (e) => {

      const newLanguage =
        e.target.value;

      setLanguage(
        newLanguage
      );

      await saveSettings({
        language:
          newLanguage
      });

    }}

    style={{

      width: "100%",

      padding: "14px",

      borderRadius: "12px",

      border:
        "1px solid rgba(255,255,255,.15)",

      background:
        "rgba(255,255,255,.05)",

      color:
        "white",

      fontSize:
        "16px",

      cursor:
        "pointer"

    }}

  >

<option
  value="fr"
  style={{
    color: "black",
    background: "white"
  }}
>
  🇫🇷 Français
</option>

<option
  value="en"
  style={{
    color: "black",
    background: "white"
  }}
>
  🇬🇧 English
</option>

<option
  value="es"
  style={{
    color: "black",
    background: "white"
  }}
>
  🇪🇸 Español
</option>

<option
  value="de"
  style={{
    color: "black",
    background: "white"
  }}
>
  🇩🇪 Deutsch
</option>

<option
  value="it"
  style={{
    color: "black",
    background: "white"
  }}
>
  🇮🇹 Italiano
</option>

<option
  value="pt"
  style={{
    color: "black",
    background: "white"
  }}
>
  🇵🇹 Português
</option>

  </select>

</Card>

      <Card>
        <h2 className="section-title">
          📱 {t("application")}
        </h2>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <span>{t("version")}</span>
          <b>1.0.0</b>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{t("platform")}</span>
          <b>PWA</b>
        </div>
      </Card>

      <Card>
        <h2 className="section-title">
          ℹ️ {t("about")}
        </h2>

        <div
          style={{
            lineHeight: "1.8",
          }}
        >
          <b>Foot Five Manager</b>

          <br />

                    {t("developedBy")}

          <br />

                    {t("version")} 1.0.0
        </div>
      </Card>
    </Page>
  );
}
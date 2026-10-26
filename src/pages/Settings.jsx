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
import {
  useTheme
} from "../theme/useTheme";

export default function Settings() {

const {
  language,
  setLanguage,
  t
} = useLanguage();

const {
  theme,
  setTheme
} = useTheme();

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

  const [ownedClubs, setOwnedClubs] = useState([]);
  const [clubMembers, setClubMembers] = useState({});
  const [selectedOwners, setSelectedOwners] = useState({});
  const [loadingOwnedClubs, setLoadingOwnedClubs] = useState(false);
  const [transferringClubId, setTransferringClubId] = useState(null);
  const [transferError, setTransferError] = useState("");
  const [transferSuccess, setTransferSuccess] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");

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

  const loadOwnedClubs = useCallback(async (profileId) => {
    setLoadingOwnedClubs(true);
    setTransferError("");

    try {
      const { data: clubs, error: clubsError } = await supabase
        .from("clubs")
        .select("id, name, owner_id")
        .eq("owner_id", profileId)
        .order("name");

      if (clubsError) {
        throw clubsError;
      }

      const owned = clubs || [];
      setOwnedClubs(owned);

      const membersByClub = {};

      for (const club of owned) {
        const { data: members, error: membersError } = await supabase
          .from("club_members")
          .select(`
            profile_id,
            role,
            profiles(
              id,
              display_name,
              email
            )
          `)
          .eq("club_id", club.id)
          .neq("profile_id", profileId)
          .order("role");

        if (membersError) {
          throw membersError;
        }

        membersByClub[club.id] = members || [];
      }

      setClubMembers(membersByClub);
    } catch (error) {
      console.error("Erreur de chargement des clubs propriétaires :", error);
      setTransferError(
        t("clubOwnershipLoadError")
      );
      } finally {
      setLoadingOwnedClubs(false);
    }
  }, [t]);

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

      await loadOwnedClubs(user.id);

      if (cancelled) {
        return;
      }

      await checkPush();
    }

    load();

    return () => {
      cancelled = true;
    };
 }, [loadSettings, loadOwnedClubs]);

 useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "auto"
  });
}, []);


  async function transferClubOwnership(clubId) {
    const newOwnerId = selectedOwners[clubId];

    if (!newOwnerId) {
      setTransferError(t("clubOwnershipSelectOwner"));
      return;
    }

    const club = ownedClubs.find((item) => item.id === clubId);
    const selectedMember = (clubMembers[clubId] || []).find(
      (member) => member.profile_id === newOwnerId
    );

    if (!club || !selectedMember) {
      setTransferError(t("clubOwnershipMemberNotFound"));
      return;
    }

    const memberName =
      selectedMember.profiles?.display_name ||
      selectedMember.profiles?.email ||
      t("unknownMember");

const confirmed = window.confirm(
  t("clubOwnershipConfirm", {
    clubName: club.name,
    memberName,
  })
);

if (!confirmed) return;

    setTransferringClubId(clubId);
    setTransferError("");
    setTransferSuccess("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "transfer-club-ownership",
        {
          body: {
            club_id: clubId,
            new_owner_id: newOwnerId,
          },
        }
      );

      if (error || !data?.success) {
        throw new Error(
          data?.error || error?.message || t("clubOwnershipTransferFailed")
        );
      }

      setTransferSuccess(
  t("clubOwnershipTransferSuccess", {
    clubName: club.name,
    memberName,
  })
);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await loadOwnedClubs(user.id);
      }
    } catch (error) {
      console.error("Erreur de transfert de propriété :", error);
      setTransferError(
        error.message || t("clubOwnershipTransferError")
      );
    } finally {
      setTransferringClubId(null);
    }
  }


  async function deleteAccount() {
    if (loadingOwnedClubs || ownedClubs.length > 0) {
      setDeleteAccountError(
        t("accountDeletionTransferRequiredError")
      );
      return;
    }

const confirmation = window.confirm(
  t("accountDeletionConfirm")
);

if (!confirmation) return;

const finalConfirmation = window.prompt(
  t("accountDeletionTypeConfirm")
);

if (
  finalConfirmation !==
  t("accountDeletionConfirmationWord")
) {
  setDeleteAccountError(t("accountDeletionCancelled"));
  return;
}

    setDeletingAccount(true);
    setDeleteAccountError("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "delete-account",
        { body: {} }
      );

      if (error || !data?.success) {
        throw new Error(
          data?.error || error?.message ||
          t("accountDeletionError")
        );
      }

      await supabase.auth.signOut();
      window.location.replace("/");

    } catch (error) {
      console.error("Erreur de suppression du compte :", error);
      setDeleteAccountError(
        error.message || t("accountDeletionError")
      );
    } finally {
      setDeletingAccount(false);
    }
  }


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
          {t("clubOwnershipTransferTitle")}
        </h2>

        <p>
          {t("clubOwnershipTransferDescription")}
        </p>

        {loadingOwnedClubs ? (
          <p>{t("clubOwnershipLoading")}</p>
        ) : ownedClubs.length === 0 ? (
          <p>{t("clubOwnershipNoClubs")}</p>
        ) : (
          ownedClubs.map((club) => {
            const members = clubMembers[club.id] || [];

            return (
              <div
                key={club.id}
                style={{
                  padding: "14px",
                  marginTop: "12px",
                  border: "1px solid rgba(255,255,255,.15)",
                  borderRadius: "12px",
                }}
              >
                <h3 style={{ marginTop: 0 }}>{club.name}</h3>

                {members.length === 0 ? (
                  <p>{t("clubOwnershipNoMembers")}</p>
                ) : (
                  <>
                    <label
                      htmlFor={`new-owner-${club.id}`}
                      style={{
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      {t("clubOwnershipNewOwner")}
                    </label>

                    <select
                      id={`new-owner-${club.id}`}
                      value={selectedOwners[club.id] || ""}
                      onChange={(event) =>
                        setSelectedOwners((previous) => ({
                          ...previous,
                          [club.id]: event.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "10px",
                        marginBottom: "12px",
                      }}
                    >
                      <option value="">{t("clubOwnershipChooseMember")}</option>

                      {members.map((member) => (
                        <option
                          key={member.profile_id}
                          value={member.profile_id}
                        >
                          {member.profiles?.display_name ||
                            member.profiles?.email ||
                            member.profile_id}
                          {member.role === "admin" ? ` (${t("admin")})` : ""}
                        </option>
                      ))}
                    </select>

                    <Button
                      variant="danger"
                      disabled={transferringClubId === club.id}
                      onClick={() => transferClubOwnership(club.id)}
                    >
                      {transferringClubId === club.id
                      ? t("clubOwnershipTransferring")
                      : t("clubOwnershipTransferButton")}
                    </Button>
                  </>
                )}
              </div>
            );
          })
        )}

        {transferError && (
          <p style={{ color: "#ff6b6b", marginTop: "12px" }}>
            {transferError}
          </p>
        )}

        {transferSuccess && (
          <p style={{ color: "#4ade80", marginTop: "12px" }}>
            {transferSuccess}
          </p>
        )}
      </Card>


<Card>
  <h2 className="section-title">
    {t("accountDeletionTitle")}
  </h2>

  <p>
    {t("accountDeletionDescription")}
  </p>

  {loadingOwnedClubs ? (
    <p>{t("accountDeletionCheckingClubs")}</p>
  ) : ownedClubs.length > 0 ? (
    <p>
  {t("accountDeletionTransferRequired").replace(
    "{count}",
    String(ownedClubs.length)
  )}
</p>
  ) : (
    <p>{t("accountDeletionNoOwnedClubs")}</p>
  )}

  {deleteAccountError && (
    <p style={{ color: "#ff6b6b" }}>
      {deleteAccountError}
    </p>
  )}

  <Button
    variant="danger"
    disabled={loadingOwnedClubs || ownedClubs.length > 0 || deletingAccount}
    onClick={deleteAccount}
  >
    {deletingAccount
  ? t("accountDeletionDeleting")
  : t("accountDeletionButton")}
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
    🎨 {t("theme")}
  </h2>

  <div
    style={{
      marginBottom: "10px",
      opacity: 0.75
    }}
  >
    {t("themeDescription")}
  </div>

  <select
    value={theme}
    onChange={(e) => {
      setTheme(e.target.value);
    }}
    style={{
      width: "100%",
      padding: "14px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,.15)",
      background: "rgba(255,255,255,.05)",
      color: "white",
      fontSize: "16px",
      cursor: "pointer"
    }}
  >

    <option
      value="foot-five"
      style={{
        color: "black",
        background: "white"
      }}
    >
      🟢 {t("themeFootFive")}
    </option>

    <option
      value="ocean"
      style={{
        color: "black",
        background: "white"
      }}
    >
      🔵 {t("themeOcean")}
    </option>

    <option
      value="energy"
      style={{
        color: "black",
        background: "white"
      }}
    >
      🟠 {t("themeEnergy")}
    </option>

    <option
      value="violet"
      style={{
        color: "black",
        background: "white"
      }}
    >
      🟣 {t("themeViolet")}
    </option>

  </select>

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
          <b>1.0.1</b>
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

                    {t("version")} 1.0.1
        </div>
      </Card>

<Card>
  <h2 className="section-title">
    ⚖️ {t("legalNotice")}
  </h2>

  <a
    href="/consent-management"
    style={{
      display: "block",
      width: "100%",
      boxSizing: "border-box",
      padding: "14px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,.15)",
      background: "rgba(255,255,255,.05)",
      color: "white",
      fontSize: "16px",
      textAlign: "center",
      textDecoration: "none",
    }}
  >
    {t("consentManagement")}
  </a>
</Card>

    </Page>
  );
}
import { useLanguage } from "../i18n/useLanguage";
import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useEffect, useState, useCallback } from "react";

export default function Account() {

const { t } = useLanguage();

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
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [passwordError, setPasswordError] = useState("");
const [passwordSuccess, setPasswordSuccess] = useState("");
const [changingPassword, setChangingPassword] = useState(false);

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

      await loadOwnedClubs(user.id);

      if (cancelled) {
        return;
      }
    }

    load();

    return () => {
      cancelled = true;
    };
}, [loadOwnedClubs]);

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

  
  async function changePassword(event) {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

if (newPassword.length < 6) {
  setPasswordError(t("passwordMinLengthError"));
  return;
}

    if (newPassword !== confirmPassword) {
      setPasswordError(t("passwordsDoNotMatch"));
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(t("passwordChangeSuccess"));
    } catch (error) {
      console.error("Erreur de changement du mot de passe :", error);
      setPasswordError(
        error.message || t("passwordChangeError")
      );
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <Page>
<h1 className="page-title">
  👤 {t("myAccount")}
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
  🔐 {t("changePasswordTitle")}
</h2>

        <form onSubmit={changePassword}>
          <label
            htmlFor="new-password"
            style={{ display: "block", marginBottom: "8px" }}
          >
            {t("newPassword")}
          </label>

          <Input
  id="new-password"
  type="password"
  eyeOffsetY={-6}
  autoComplete="new-password"
  value={newPassword}
  onChange={(event) => setNewPassword(event.target.value)}
  required
  style={{
  marginBottom: "16px",
  minHeight: "44px",
}}
/>

          <label
            htmlFor="confirm-password"
            style={{ display: "block", marginBottom: "8px" }}
          >
            {t("confirmPassword")}
          </label>

          <Input
  id="confirm-password"
  type="password"
  eyeOffsetY={-6}
  autoComplete="new-password"
  value={confirmPassword}
  onChange={(event) => setConfirmPassword(event.target.value)}
  required
  style={{
  marginBottom: "16px",
  minHeight: "44px",
}}
/>

          {passwordError && (
            <p style={{ color: "#ff6b6b" }}>{passwordError}</p>
          )}

          {passwordSuccess && (
            <p style={{ color: "#4ade80" }}>{passwordSuccess}</p>
          )}

          <Button
            type="submit"
            disabled={changingPassword}
          >
            {changingPassword
  ? t("changingPassword")
  : t("changePasswordButton")}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="section-title">
          {t("clubOwnershipTransferTitle")}

        </h2>

        <p
  style={{
    opacity: 0.65,
    fontSize: "14px",
    marginTop: "8px",
    lineHeight: "1.5",
  }}
>
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

  <p
  style={{
    opacity: 0.65,
    fontSize: "14px",
    marginTop: "8px",
    marginBottom: "20px",
    lineHeight: "1.5",
  }}
>
  {t("accountDeletionDescription")}
</p>

  {loadingOwnedClubs ? (
    <p>{t("accountDeletionCheckingClubs")}</p>
    ) : ownedClubs.length > 0 ? (
    <p
      style={{
        opacity: 0.65,
        fontSize: "14px",
        marginTop: "8px",
        marginBottom: "20px",
        lineHeight: "1.5",
      }}
    >
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

    </Page>
  );
}
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useLanguage } from "../i18n/useLanguage";

export default function Members() {

const { t } = useLanguage();

  const [members, setMembers] = useState([]);

  const [inviteCode, setInviteCode] = useState("");

  const [clubRole, setClubRole] = useState(null);

  const [clubName, setClubName] = useState("");

  const [myUserId, setMyUserId] = useState(null);


  useEffect(() => {

    load();

  }, []);


  async function load() {

    try {

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        return;
      }

      setMyUserId(user.id);


      /*
       * --------------------------------------------------
       * PROFIL UTILISATEUR
       * --------------------------------------------------
       */

      const {
        data: profile,
        error: profileError
      } = await supabase

        .from("profiles")

        .select(
          "active_club_id"
        )

        .eq(
          "id",
          user.id
        )

        .single();


      if (profileError) {
        throw profileError;
      }


      if (!profile?.active_club_id) {
        return;
      }


      /*
       * --------------------------------------------------
       * MEMBRE ACTUEL
       * --------------------------------------------------
       */

      const {
        data: member,
        error: memberError
      } = await supabase

        .from(
          "club_members"
        )

        .select(`
          club_id,
          role
        `)

        .eq(
          "profile_id",
          user.id
        )

        .eq(
          "club_id",
          profile.active_club_id
        )

        .single();


      if (memberError) {
        throw memberError;
      }


      if (!member) {
        return;
      }


      setClubRole(
        member.role
      );


      /*
       * --------------------------------------------------
       * CLUB
       * --------------------------------------------------
       */

      const {
        data: club,
        error: clubError
      } = await supabase

        .from("clubs")

        .select(
          "invite_code,name"
        )

        .eq(
          "id",
          member.club_id
        )

        .single();


      if (clubError) {
        throw clubError;
      }


      setClubName(
        club?.name || ""
      );


      /*
       * --------------------------------------------------
       * CODE D'INVITATION
       * --------------------------------------------------
       */

      if (
        member.role === "owner" ||
        member.role === "admin"
      ) {

        setInviteCode(
          club?.invite_code || ""
        );

      } else {

        setInviteCode("");

      }


      /*
       * --------------------------------------------------
       * MEMBRES DU CLUB
       * --------------------------------------------------
       */

      const {
        data,
        error: membersError
      } = await supabase

        .from("club_members")

        .select(`
          id,
          profile_id,
          role,
          level,
          profiles(
            id,
            display_name,
            email
          )
        `)

        .eq(
          "club_id",
          member.club_id
        );


      if (membersError) {
        throw membersError;
      }


      const sorted =

        (data || [])

          .sort((a, b) => {

            /*
             * L'UTILISATEUR CONNECTÉ EN PREMIER
             */

            if (
              a.profile_id === user.id
            ) {
              return -1;
            }

            if (
              b.profile_id === user.id
            ) {
              return 1;
            }


            /*
             * PUIS TRI ALPHABÉTIQUE
             */

            return (

              a.profiles?.display_name ||
              ""

            )

              .localeCompare(

                b.profiles?.display_name ||
                "",

                "fr"

              );

          });


      setMembers(
        sorted
      );

    }

    catch (error) {

      console.error(
        "❌ Erreur chargement membres :",
        error
      );

    }

  }


  /*
   * =====================================================
   * MODIFICATION DU RÔLE
   * =====================================================
   */

  async function updateRole(
    memberId,
    newRole
  ) {

    try {

      const {
        error
      } = await supabase

        .from(
          "club_members"
        )

        .update({

          role:
            newRole

        })

        .eq(
          "id",
          memberId
        );


      if (error) {
        throw error;
      }


      await load();

    }

    catch (error) {

      console.error(
        "❌ Erreur modification rôle :",
        error
      );

      alert(
  t("memberManagementError")
);

    }

  }


  /*
   * =====================================================
   * SUPPRESSION D'UN MEMBRE
   * =====================================================
   */

  async function removeMember(
    memberId,
    name
  ) {

 const ok =
  window.confirm(
    t("removeMemberConfirm")
      .replace("{name}", name)
  );


    if (!ok) {
      return;
    }


    try {

      const {
        error
      } = await supabase

        .from(
          "club_members"
        )

        .delete()

        .eq(
          "id",
          memberId
        );


      if (error) {
        throw error;
      }


      alert(
  t("memberRemoved")
);


      await load();

    }

    catch (error) {

      console.error(
        "❌ Erreur suppression membre :",
        error
      );

      alert(
  t("memberRemoveError")
);

    }

  }


  /*
   * =====================================================
   * MODIFICATION DU NIVEAU
   * =====================================================
   */

  async function updateLevel(
    memberId,
    level
  ) {

    try {

      const {
        error
      } = await supabase

        .from(
          "club_members"
        )

        .update({

          level

        })

        .eq(

          "id",

          memberId

        );


      if (error) {
        throw error;
      }


      await load();

    }

    catch (error) {

      console.error(
        "❌ Erreur modification niveau :",
        error
      );

     alert(
  t("memberLevelUpdateError")
);

    }

  }


  /*
   * =====================================================
   * DROITS
   * =====================================================
   */


  /*
   * Seul l'owner peut modifier
   * les rôles.
   */

  function canManageRoles() {

    return (
      clubRole === "owner"
    );

  }


  /*
   * Owner et admin peuvent
   * inviter un nouveau joueur.
   */

  function canInvite() {

    return (

      clubRole === "owner" ||

      clubRole === "admin"

    );

  }


  /*
   * Détermine si l'utilisateur connecté
   * peut retirer ce membre précis.
   *
   * Owner :
   * - player
   * - admin
   *
   * Admin :
   * - player uniquement
   *
   * Owner :
   * - jamais supprimable
   */

  function canRemoveMember(member) {

    /*
     * Impossible de retirer l'owner
     */

    if (
      member.role === "owner"
    ) {
      return false;
    }


    /*
     * On ne propose pas la suppression
     * de son propre compte ici.
     */

    if (
      member.profile_id === myUserId
    ) {
      return false;
    }


    /*
     * OWNER
     */

    if (
      clubRole === "owner"
    ) {

      return (

        member.role === "player" ||

        member.role === "admin"

      );

    }


    /*
     * ADMIN
     */

    if (
      clubRole === "admin"
    ) {

      return (
        member.role === "player"
      );

    }


    /*
     * PLAYER
     */

    return false;

  }


  /*
   * =====================================================
   * INVITATION
   * =====================================================
   */

  async function invite() {

    if (!canInvite()) {

      alert(
  t("invitePermissionDenied")
);

      return;

    }


    if (!inviteCode) {

      alert(
  t("inviteCodeUnavailable")
);

      return;

    }


    const link =

      `https://foot-five-app.vercel.app/join/${inviteCode}`;


    const text =
  t("clubInvitationText")
    .replace("{clubName}", clubName) +
  `\n\n${link}`;


    try {

      if (
        navigator.share
      ) {

        await navigator.share({

          title:
            "Foot Five",

          text

        });

        return;

      }


      await navigator.clipboard.writeText(
        text
      );


      alert(
  t("invitationCopied")
);

    }

    catch (error) {

      /*
       * L'utilisateur peut simplement
       * annuler le partage natif.
       */

      if (
        error?.name !==
        "AbortError"
      ) {

        console.error(
          "❌ Erreur invitation :",
          error
        );

      }

    }

  }


  /*
   * =====================================================
   * AFFICHAGE
   * =====================================================
   */

  return (

    <Page>

      <h1 className="page-title">

        👥 {t("members")}

      </h1>


      {

        canInvite() && (

          <Card>

            <h2

              style={{

                marginTop:
                  "-10px",

                marginBottom:
                  "18px"

              }}

            >

              {t("invitationCodeTitle")}

            </h2>


            <p

              style={{

                fontSize:
                  26,

                fontWeight:
                  "700",

                textAlign:
                  "center",

                padding:
                  "16px",

                borderRadius:
                  "14px",

                background:
                  "rgba(255,255,255,.04)",

                border:
                  "1px solid rgba(255,255,255,.10)",

                letterSpacing:
                  "4px",

                marginBottom:
                  "20px"

              }}

            >

              {inviteCode}

            </p>


            <br/>


            <Button

              onClick={
                invite
              }

            >

              {t("invitePlayer")}

            </Button>

          </Card>

        )

      }


      {

        members.map(

          (m) => (

            <Card

              key={
                m.id
              }

            >


              {/* NOM */}

              <div

                style={{

                  fontSize:
                    "20px",

                  fontWeight:
                    "700",

                  lineHeight:
                    "1.2",

                  marginTop:
                    "-8px",

                  marginBottom:
                    "8px"

                }}

              >

                {

                  m.profile_id ===
                  myUserId

                    ?

                    `👤 ${m.profiles?.display_name} (${t("myself")})`

                    :

                    m.profiles?.display_name

                }

              </div>


              <div

                style={{

                  height:
                    2

                }}

              />


              {/* RÔLE */}

              <div

                style={{

                  opacity:
                    .75,

                  fontSize:
                    "15px",

                  marginBottom:
                    "16px"

                }}

              >

                {

                 m.role === "owner"

  ?

  t("ownerRole")

  :

  m.role === "admin"

    ?

    t("adminRole")

    :

    t("playerRole")

                }

              </div>


              {/* NIVEAU */}

              {

                (
                  clubRole === "owner" ||

                  clubRole === "admin"
                )

                &&

                m.role !== "owner"

                &&

                (

                  <div

                    style={{

                      marginTop:
                        8

                    }}

                  >

                    <div

                      style={{

                        fontSize:
                          13,

                        opacity:
                          .7,

                        marginBottom:
                          6

                      }}

                    >

                      {t("level")}

                    </div>


                    <select

                      value={

                        m.level || ""

                      }

                      onChange={

                        (e) => {

                          updateLevel(

                            m.id,

                            e.target.value

                              ?

                              Number(
                                e.target.value
                              )

                              :

                              null

                          );

                        }

                      }

                      style={{

                        width:
                          "100%",

                        padding:
                          "12px",

                        borderRadius:
                          "12px",

                        fontSize:
                          "15px",

                        background:
                          "#2a2a2a",

                        color:
                          "#ffffff",

                        border:
                          "1px solid rgba(255,255,255,.12)"

                      }}

                    >

                      <option value="">

                         {t("notRated")}

                      </option>

                      <option value="1">

                       1️⃣ {t("levelBeginner")}

                      </option>

                      <option value="2">

                       2️⃣ {t("levelLeisure")}

                      </option>

                      <option value="3">

                       3️⃣ {t("levelIntermediate")}

                      </option>

                      <option value="4">

                       4️⃣ {t("levelConfirmed")}

                      </option>

                      <option value="5">

                       5️⃣ {t("levelAdvanced")}

                      </option>

                      <option value="6">

                       6️⃣ {t("levelExpert")}

                      </option>

                      <option value="7">

                       7️⃣ {t("levelElite")}

                      </option>

                    </select>

                  </div>

                )

              }


              <div

                style={{

                  height:
                    4

                }}

              />


              {/* GESTION DES RÔLES */}

              {

                canManageRoles()

                &&

                m.role !== "owner"

                &&

                m.profile_id !==
                myUserId

                &&

                (

                  <>

                    {

                      m.role === "player"

                        ?

                        <Button

                          variant="secondary"

                          onClick={

                            () =>

                              updateRole(
                                m.id,
                                "admin"
                              )

                          }

                          style={{

                            marginTop:
                              "10px"

                          }}

                        >

                          {t("makeAdmin")}

                        </Button>

                        :

                        <Button

                          variant="secondary"

                          onClick={

                            () =>

                              updateRole(
                                m.id,
                                "player"
                              )

                          }

                          style={{

                            marginTop:
                              "10px"

                          }}

                        >

                          {t("removeAdmin")}

                        </Button>

                    }

                  </>

                )

              }


              {/* SUPPRESSION DU MEMBRE */}

              {

                canRemoveMember(
                  m
                )

                &&

                (

                  <>

                    <div

                      style={{

                        height:
                          4

                      }}

                    />


                    <Button

                      variant="danger"

                      onClick={

                        () =>

                          removeMember(

                            m.id,

                            m.profiles
                              ?.display_name

                          )

                      }

                      style={{

                        marginTop:
                          "10px"

                      }}

                    >

                      {t("removeFromClub")}

                    </Button>

                  </>

                )

              }


            </Card>

          )

        )

      }

    </Page>

  );

}
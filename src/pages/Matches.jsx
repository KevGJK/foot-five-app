import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { createNotification } from "../services/notifications";
import { useLanguage } from "../i18n/useLanguage";

export default function Matches() {

const { t, language } = useLanguage();

const dateLocale = {
  fr: "fr-FR",
  en: "en-GB",
  es: "es-ES",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
};

const currentLocale =
  dateLocale[language] || "fr-FR";

const [matches,setMatches]=useState([]);
const [user,setUser]=useState(null);
const [clubRole,setClubRole]=useState(null);
const [guestName,setGuestName]=useState({});
const [editingGuest,setEditingGuest]=useState(null);
const [editGuestName,setEditGuestName]=useState("");
const [editGuestLevel,setEditGuestLevel]=useState(3);
const [guestLevel,setGuestLevel]=useState({});
const [memberLevels,setMemberLevels]=useState({});
const [reload,setReload]=useState(false);
const [teams,setTeams]=useState({});
const [expanded,setExpanded]=useState(null);
const [scoreWhite,setScoreWhite]=useState({});
const [scoreBlack,setScoreBlack]=useState({});

const [resultConfirmation, setResultConfirmation] = useState(null);

const levelLabels = {

  1: `1️⃣ ${t("levelBeginner")}`,

  2: `2️⃣ ${t("levelLeisure")}`,

  3: `3️⃣ ${t("levelIntermediate")}`,

  4: `4️⃣ ${t("levelConfirmed")}`,

  5: `5️⃣ ${t("levelAdvanced")}`,

  6: `6️⃣ ${t("levelExpert")}`,

  7: `7️⃣ ${t("levelElite")}`

};

function formatMatchDate(dateString) {

  const date = new Date(dateString);

  const dateText =
    date.toLocaleDateString(
      currentLocale,
      {
        weekday: "long",
        day: "numeric",
        month: "long"
      }
    );

  const timeText =
    date.toLocaleTimeString(
      currentLocale,
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  return `${dateText} à ${timeText}`;

}

useEffect(() => {

  let cancelled = false;

  async function load() {

    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();

    if (cancelled) {
      return;
    }

    setUser(user);

    if (!user) {
      return;
    }

const {
  data: profile,
  error: profileError
} = await supabase
  .from("profiles")
  .select("active_club_id")
  .eq("id", user.id)
  .single();

if (profileError || !profile?.active_club_id) {
  console.error(
    "Impossible de récupérer le club actif",
    profileError
  );

  return;
}

const {
  data: member,
  error: memberError
} = await supabase
  .from("club_members")
  .select(`
    club_id,
    role
  `)
  .eq("profile_id", user.id)
  .eq("club_id", profile.active_club_id)
  .single();

if (cancelled) {
  return;
}

if (memberError || !member) {
  console.error(
    "Impossible de récupérer le membre du club actif",
    memberError
  );

  return;
}

setClubRole(member.role);

    const {
      data: levels
    } = await supabase
      .from("club_members")
      .select("profile_id, level")
      .eq("club_id", member.club_id);

    if (cancelled) {
      return;
    }

    const map = {};

    (levels || []).forEach(m => {
      map[m.profile_id] = m.level || 3;
    });

    setMemberLevels(map);

    const {
      data
    } = await supabase
      .from("matches")
      .select(`
        *,
        seasons(
          active
        ),
        attendances(
          id,
          profile_id,
          response,
          team,
          created_at,
          guest_name,
          guest_level,
          profiles(
            display_name
          )
        )
      `)
      .eq("club_id", member.club_id)
      .order("match_date");

    if (cancelled) {
      return;
    }

    setMatches(data || []);

    const restored = {};

    (data || []).forEach(match => {

      const white = [];
      const black = [];

      (match.attendances || []).forEach(a => {

        if (a.team === "white") {

          white.push({
            name: playerName(a),
            level: a.guest_name
              ? Number(a.guest_level || 3)
              : 3
          });

        }

        if (a.team === "black") {

          black.push({
            name: playerName(a),
            level: a.guest_name
              ? Number(a.guest_level || 3)
              : 3
          });

        }

      });

      if (white.length || black.length) {

        restored[match.id] = {
          A: white,
          B: black,
          scoreA: white.reduce(
            (s, p) => s + p.level,
            0
          ),
          scoreB: black.reduce(
            (s, p) => s + p.level,
            0
          )
        };

      }

    });

    setTeams(restored);

  }

  load();

  return () => {
    cancelled = true;
  };

}, [reload]);

function seasonLocked(match){

return match.seasons && !match.seasons.active;

}

function isManager(){

  return (
    clubRole === "owner" ||
    clubRole === "admin"
  );

}

function canManageMatch(match){

  return (
    clubRole === "owner" ||
    clubRole === "admin" ||
    match?.organizer_id === user?.id
  );

}

function getMatchLocationText(match) {

  if (
    !match?.location ||
    !match.location.trim()
  ) {
    return "";
  }

  return `📍 ${match.location.trim()}`;

}

async function getMatchManagementRecipients(match) {

  if (!match?.club_id) {
    return [];
  }

  /*
   * -----------------------------------------------------
   * ORGANISATEUR DU MATCH
   * -----------------------------------------------------
   */

  const recipientIds = [];

  if (match.organizer_id) {
    recipientIds.push(match.organizer_id);
  }


  /*
   * -----------------------------------------------------
   * PROPRIÉTAIRES ET ADMINISTRATEURS DU CLUB
   * -----------------------------------------------------
   */

  const {
    data: managers,
    error
  } = await supabase
    .from("club_members")
    .select("profile_id, role")
    .eq("club_id", match.club_id)
    .in("role", ["owner", "admin"]);


  if (error) {

    console.error(
      "❌ Erreur récupération administrateurs du club :",
      error
    );

    return [
      ...new Set(
        recipientIds.filter(Boolean)
      )
    ];

  }


  /*
   * -----------------------------------------------------
   * AJOUT DES ADMINISTRATEURS
   * -----------------------------------------------------
   */

  (managers || []).forEach(
    manager => {

      if (manager.profile_id) {
        recipientIds.push(
          manager.profile_id
        );
      }

    }
  );


  /*
   * -----------------------------------------------------
   * SUPPRESSION DES DOUBLONS
   * -----------------------------------------------------
   */

  return [
    ...new Set(
      recipientIds.filter(Boolean)
    )
  ];

}

async function answer(matchId, response) {

  /*
   * =====================================================
   * ÉTAT AVANT MODIFICATION
   * =====================================================
   */

  const currentMatch = matches.find(
    m => m.id === matchId
  );

  if (!currentMatch) {
    console.error(
      "❌ Match introuvable :",
      matchId
    );
    return;
  }

  const currentAttendances =
    currentMatch.attendances || [];

  const currentPresent =
    present(currentAttendances);

  /*
   * Réponse actuelle du joueur
   */

  const currentPlayer =
    currentAttendances.find(
      a =>
        a.profile_id === user?.id
    );

  const previousResponse =
    currentPlayer?.response || null;


  /*
   * =====================================================
   * ÉTAT AVANT MODIFICATION
   * =====================================================
   */

  /*
   * Le joueur était-il dans les 10 participants
   * avant sa réponse ?
   */

  const wasParticipant =
    currentPresent
      .slice(0, 10)
      .some(
        a =>
          a.profile_id === user?.id
      );


  /*
   * Le joueur était-il dans la liste d'attente ?
   */

  /*
   * Premier joueur en attente AVANT le désistement.
   *
   * C'est lui qui sera automatiquement promu
   * si un participant des 10 premiers se désiste.
   */

  const waitingBefore =
    currentPresent.slice(10);

  const promotedPlayer =
    waitingBefore[0] || null;


  /*
   * =====================================================
   * ENREGISTREMENT DE LA NOUVELLE RÉPONSE
   * =====================================================
   */

  let error;


  /*
   * -----------------------------------------------------
   * ABSENT → PRÉSENT
   * -----------------------------------------------------
   *
   * Le joueur revient dans le match.
   *
   * Il doit être considéré comme une nouvelle inscription
   * et donc être placé à la fin de la file.
   */

  if (
    response === "present" &&
    previousResponse === "absent"
  ) {

    const result =
      await supabase
        .from("attendances")
        .update({
          response: "present",
          created_at:
            new Date().toISOString()
        })
        .eq(
          "match_id",
          matchId
        )
        .eq(
          "profile_id",
          user.id
        );

    error =
      result.error;

  }


  /*
   * -----------------------------------------------------
   * AUTRES CAS
   * -----------------------------------------------------
   *
   * Nouveau joueur ou changement de réponse classique.
   */

  else {

    const result =
      await supabase
        .from("attendances")
        .upsert(
          {
            match_id: matchId,
            profile_id: user.id,
            response
          },
          {
            onConflict:
              "match_id,profile_id"
          }
        );

    error =
      result.error;
  }


  /*
   * =====================================================
   * ERREUR
   * =====================================================
   */

  if (error) {

    console.error(
      "❌ Erreur enregistrement réponse :",
      error
    );

    return;
  }

/*
 * =====================================================
 * NOTIFICATION ORGANISATEUR / ADMINISTRATEURS
 * =====================================================
 */

try {

  /*
   * ---------------------------------------------------
   * JOUEUR QUI REJOINT LE MATCH
   * ---------------------------------------------------
   *
   * Cela couvre :
   *
   * - nouveau joueur → présent
   * - joueur absent → présent
   *
   * Dans les deux cas, sa nouvelle position
   * est calculée ensuite par created_at.
   */

  if (
    response === "present" &&
    previousResponse !== "present"
  ) {

    const recipientIds =
      await getMatchManagementRecipients(
        currentMatch
      );

    if (recipientIds.length > 0) {

      const playerDisplayName =
        currentPlayer?.guest_name ||
        user.user_metadata?.display_name ||
        t("unknownPlayer");

const matchDate =
  formatMatchDate(
    currentMatch.match_date
  );

const locationText =
  getMatchLocationText(
    currentMatch
  );

const isWaiting =
  currentPresent.length >= 10;

const message =
  t("joinedMatch")
    .replace("{player}", playerDisplayName)
    .replace("{date}", matchDate) +
  (locationText
    ? `\n${locationText}`
    : "") +
  (isWaiting
    ? `\n${t("waitingList")}`
    : "");

      await createNotification({

        clubId:
          currentMatch.club_id,

        createdBy:
          user.id,

        createdByName:
          user.user_metadata?.display_name ||
          "Foot Five",

        type:
          "PLAYER_JOINED",

        title:
  t("playerJoined"),

        message:
  message,

        action:
          "match",

        actionId:
          matchId,

        recipientIds

      });

    }

  }


  /*
   * ---------------------------------------------------
   * JOUEUR QUI SE DÉSISTE
   * ---------------------------------------------------
   */

  if (
    response === "absent" &&
    previousResponse === "present"
  ) {

    const recipientIds =
      await getMatchManagementRecipients(
        currentMatch
      );

    if (recipientIds.length > 0) {

      const playerDisplayName =
        currentPlayer?.guest_name ||
        user.user_metadata?.display_name ||
        t("unknownPlayer");

      await createNotification({

        clubId:
          currentMatch.club_id,

        createdBy:
          user.id,

        createdByName:
          user.user_metadata?.display_name ||
          "Foot Five",

        type:
          "PLAYER_LEFT",

        title:
          t("playerLeft"),

        message:
  t("leftMatch")
    .replace(
      "{player}",
      playerDisplayName
    )
    .replace(
      "{date}",
      formatMatchDate(
        currentMatch.match_date
      )
    ) +
  (
    getMatchLocationText(currentMatch)
      ? `\n${getMatchLocationText(currentMatch)}`
      : ""
  ) +
  (
    wasParticipant && promotedPlayer
      ? `\n${t("automaticallyPromoted")
          .replace(
            "{player}",
            promotedPlayer.guest_name ||
              promotedPlayer.profiles?.display_name ||
              t("unknownPlayer")
          )}`
      : wasParticipant
        ? `\n${t("placeAvailable")}`
        : ""
  ),

        action:
          "match",

        actionId:
          matchId,

        recipientIds

      });

    }

  }

}
catch (notificationError) {

  /*
   * Une erreur de notification ne doit jamais
   * empêcher la modification de la participation.
   */

  console.error(
    "❌ Erreur notification participation :",
    notificationError
  );

}

  /*
   * =====================================================
   * PROMOTION AUTOMATIQUE
   * =====================================================
   *
   * Si un joueur des 10 premiers se désiste
   * et qu'il existe quelqu'un en attente,
   * le premier joueur en attente devient
   * automatiquement participant.
   */

  if (
    response === "absent" &&
    wasParticipant &&
    promotedPlayer
  ) {

    console.log(
      "🎉 Promotion joueur :",
      promotedPlayer.profile_id ||
      promotedPlayer.guest_name ||
      "joueur"
    );


    /*
     * ===================================================
     * NOTIFICATION DU JOUEUR PROMU
     * ===================================================
     *
     * Un invité n'a pas de profile_id et ne peut donc
     * pas recevoir de notification push.
     *
     * Dans ce cas, aucune notification n'est créée.
     */

    if (
      promotedPlayer.profile_id
    ) {

      try {

        await createNotification({

          clubId:
            currentMatch.club_id,

          createdBy:
            user.id,

          createdByName:
            user.user_metadata?.display_name ||
            "Foot Five",

          type:
            "player_promoted",

          title:
  t("playerPromoted"),

          message:
  t("placeFreed")
    .replace(
      "{date}",
      formatMatchDate(
        currentMatch.match_date
      )
    ) +
  (
    getMatchLocationText(currentMatch)
      ? `\n${getMatchLocationText(currentMatch)}`
      : ""
  ) +
  `\n${t("nowParticipant")}`,

          action:
            "match",

          actionId:
            matchId,

          recipientIds: [
            promotedPlayer.profile_id
          ]

        });

        console.log(
          "📨 Notification de promotion envoyée"
        );

      } catch (
        notificationError
      ) {

        /*
         * Une erreur de notification ne doit
         * jamais empêcher le changement de
         * réponse du joueur.
         */

        console.error(
          "❌ Erreur notification promotion :",
          notificationError
        );

      }
    }
  }


  /*
   * =====================================================
   * RECHARGEMENT
   * =====================================================
   */

  setReload(
    v => !v
  );
}

async function addGuest(matchId){

  if(!isManager()){

    alert(
  t("guestAddPermissionDenied")
);

    return;

  }

const name =
  guestName[matchId];

if(!name){

  alert(
  t("guestNameRequired")
);

  return;

}

await supabase

.from(
"attendances"
)

.insert({

match_id:matchId,

guest_name:name,

guest_level:Number(
guestLevel[matchId]||3
),

response:"present"

});

setGuestName({

...guestName,

[matchId]:""

});

setGuestLevel({

...guestLevel,

[matchId]:3

});

setReload(
v=>!v
);

}

function startEditGuest(attendance){

setEditingGuest(attendance.id);

setEditGuestName(attendance.guest_name);

setEditGuestLevel(Number(attendance.guest_level || 3));

}

async function saveGuest(){

  if(!isManager()){

    alert(
  t("guestEditPermissionDenied")
);

    return;

  }

  await supabase

  .from("attendances")

  .update({

guest_name:editGuestName,

guest_level:Number(editGuestLevel)

})

.eq("id",editingGuest);

setEditingGuest(null);

setReload(v=>!v);

}

async function removeGuest(attendanceId){

  if(!isManager()){

    alert(
  t("guestRemovePermissionDenied")
);

    return;

  }

  const ok = window.confirm(
  t("guestRemoveConfirm")
);

if(!ok){

return;

}

await supabase

.from("attendances")

.delete()

.eq("id",attendanceId);

setReload(v=>!v);

}

async function removeMatch(id){

    const matchToDelete = matches.find(
        m => m.id === id
    );

    if(!matchToDelete || !canManageMatch(matchToDelete)){

    alert(
        `🔒 ${t("deleteMatchPermissionDenied")}`
    );

    return;

}

    const confirmDelete = window.confirm(
        t("deleteMatchConfirm")
    );

    if (!confirmDelete) {
        return;
    }

    const {
        data: match,
        error: matchError
    } = await supabase
        .from("matches")
        .select(`
    id,
    title,
    club_id,
    match_date
`)
        .eq("id", id)
        .single();


    if(matchError){

        console.error(
            "Erreur récupération match :",
            matchError
        );

        alert(
            matchError.message
        );

        return;

    }


    const {
        data: attendances,
        error: attendancesError
    } = await supabase
        .from("attendances")
        .select(`
            profile_id,
            response
        `)
        .eq("match_id", id)
        .in(
            "response",
            [
                "present",
                "absent"
            ]
        );


    if(attendancesError){

        console.error(
            "Erreur récupération participants :",
            attendancesError
        );

        alert(
            attendancesError.message
        );

        return;

    }


    const recipientIds =
        (attendances || [])
            .map(
                attendance =>
                    attendance.profile_id
            )
            .filter(Boolean);


    const {
        data: {
            user
        }
    } = await supabase.auth.getUser();


    if(!user){

        alert(
    t("userNotConnected")
);

        return;

    }


    const {
        error: deleteError
    } = await supabase
        .from("matches")
        .delete()
        .eq(
            "id",
            id
        );


    if(deleteError){

        console.error(
            "Erreur suppression match :",
            deleteError
        );

        alert(
            deleteError.message
        );

        return;

    }


    try{

        if(
            recipientIds.length > 0
        ){

            await createNotification({

                clubId:
                    match.club_id,

                createdBy:
                    user.id,

                createdByName:
                    "Foot Five",

                type:
                    "match_cancelled",

                title:
    `❌ ${t("matchCancelled")}`,

                message:
    t("matchCancelledMessage")
        .replace(
            "{title}",
            match.title
        )
        .replace(
            "{date}",
            formatMatchDate(match.match_date)
        ),

                action:
                    "home",

                actionId:
                    null,

                recipientIds

            });

        }

    }
    catch(notificationError){

        console.error(
            "❌ Erreur notification annulation :",
            notificationError
        );

    }


    setReload(
        v => !v
    );

}

function present(list){

return list

.filter(
a=>
a.response==="present"
)

.sort(

(a,b)=>

new Date(
a.created_at
)

-

new Date(
b.created_at

)

);

}

function participants(list){

return present(
list
)

.slice(
0,
10
);

}

function waiting(list){

return present(
list
)

.slice(
10
);

}

function absent(list){

return list

.filter(
a=>
a.response==="absent"
);

}

function myAnswer(list){

  const me=

    list.find(

      a=>

        a.profile_id
        ===
        user?.id

    );

  if(
    !me
  ){

    return t("notAnsweredYet");

  }

  if(
    me.response==="present"
  ){

    return t("present");

  }

  return t("absent");

}

function placesLeft(list){

  const count=

    participants(
      list
    ).length;

  if(
    count<10
  ){

    return t("placesLeft")
      .replace(
        "{count}",
        10-count
      );

  }

  if(
    waiting(
      list
    ).length>0
  ){

    return t("waitingListActive");

  }

  return t("full");

}

function playerName(p){

if(
p.guest_name
){

return p.guest_name;

}

return p.profiles?.display_name;

}

function playerLevel(p){

if(
p.guest_name
){

return Number(
p.guest_level
)||3;

}

return memberLevels[p.profile_id]||3;

}

function canSeeLevels(){

return clubRole==="owner" || clubRole==="admin";

}

async function compose(matchId,list){

const match = matches.find(
  m => m.id === matchId
);

if(!match || !canManageMatch(match)){

  alert(
  `🔒 ${t("manageMatchPermissionDenied")}`
);

  return;

}

const players=[];

for(

const p

of

participants(
list
)

){

players.push({

name:

playerName(
p
),

level:

playerLevel(
p
)

});

}

players.sort(

(a,b)=>

b.level-
a.level

);

const A=[];

const B=[];

let scoreA=0;

let scoreB=0;

players.forEach(

p=>{

if(
scoreA<=scoreB
){

A.push(
p
);

scoreA+=
p.level;

}

else{

B.push(
p
);

scoreB+=
p.level;

}

}

);

const updates=[];

participants(
list
)

.forEach(

p=>{

const name=

playerName(
p
);

updates.push({

id:
p.id,

team:

A.some(
x=>
x.name===name
)

?

"white"

:

"black"

});

}

);

for(

const u

of

updates

){

await supabase

.from(
"attendances"
)

.update({

team:
u.team

})

.eq(
"id",
u.id);

}

await supabase

.from(
"match_teams"
)

.delete()

.eq(
"match_id",
matchId
);

const rows=[];

A.forEach(

p=>

rows.push({

match_id:
matchId,

team:
"white",

player_name:
p.name

})

);

B.forEach(

p=>

rows.push({

match_id:
matchId,

team:
"black",

player_name:
p.name

})

);

if(
rows.length
){

const {

error

}

=

await supabase

.from(
"match_teams"
)

.insert(
rows
);

if(
error
){

console.log(
error
);

alert(
error.message
);

return;

}

}

try {

    const recipientIds = participants(list)
        .map(p => p.profile_id)
        .filter(Boolean);

   if (recipientIds.length > 0 && user) {

    const {
        data: matchData,
        error: matchError
    } = await supabase
        .from("matches")
        .select("club_id")
        .eq("id", matchId)
        .single();

    if (matchError) {
        throw matchError;
    }

    await createNotification({

        clubId: matchData.club_id,

        createdBy: user.id,

            createdByName:
  user.user_metadata?.display_name
  || t("footFive"),

            type:
                "teams_ready",

            title:
  t("teamsComposedTitle"),

message:
  t("teamsComposedMessage"),

            action:
                "match",

            actionId:
                matchId,

            recipientIds

        });

    }

} catch (notificationError) {

    console.error(
        "❌ Erreur notification équipes :",
        notificationError
    );

}

setTeams(

prev=>({

...prev,

[matchId]:{

A,
B,
scoreA,
scoreB

}

})

);


}

function askResultConfirmation(matchId) {

  const match =
    matches.find(
      m => m.id === matchId
    );

  if (
    !match ||
    !canManageMatch(match)
  ) {

    alert(
      `🔒 ${t("validateResultPermissionDenied")}`
    );

    return;

  }

  const white =
    Number(
      scoreWhite[matchId] || 0
    );

  const black =
    Number(
      scoreBlack[matchId] || 0
    );

  if (
    white === 0 &&
    black === 0
  ) {

    alert(
      t("enterScore")
    );

    return;

  }

  setResultConfirmation({
    matchId,
    white,
    black
  });

}

async function saveResult(matchId) {

const matchToManage = matches.find(
  m => m.id === matchId
);

if(!matchToManage || !canManageMatch(matchToManage)){

    alert(
    `🔒 ${t("validateResultPermissionDenied")}`
);

    return;

}

    const white =
        Number(scoreWhite[matchId] || 0);

    const black =
        Number(scoreBlack[matchId] || 0);

    if (
        white === 0 &&
        black === 0
    ) {
        alert(
    t("enterScore")
);
        return;
    }

    let winner = "draw";

    if (white > black) {
        winner = "white";
    }

    if (black > white) {
        winner = "black";
    }


    /*
     * =====================================================
     * ENREGISTREMENT DU RÉSULTAT
     * =====================================================
     */

    const {
        error: resultError
    } = await supabase
        .from("matches")
        .update({
            score_white: white,
            score_black: black,
            winner,
            status: "finished"
        })
        .eq("id", matchId);


    if (resultError) {

        console.error(
            "❌ Erreur enregistrement résultat :",
            resultError
        );

        alert(resultError.message);

        return;
    }


    /*
     * =====================================================
     * RÉCUPÉRATION DU MATCH
     * =====================================================
     */

    const {
        data: match,
        error: matchError
    } = await supabase
        .from("matches")
        .select(`
            id,
            title,
            club_id
        `)
        .eq("id", matchId)
        .single();


    if (matchError) {

        console.error(
            "❌ Erreur récupération match :",
            matchError
        );

        alert(
    t("resultSavedNotificationFailed")
);

        setReload(v => !v);

        return;
    }


/*
 * =====================================================
 * PARTICIPANTS ET ÉQUIPES
 * =====================================================
 *
 * On relit directement les présences depuis Supabase.
 *
 * Cela garantit que les équipes utilisées pour les
 * notifications correspondent bien à la composition
 * réellement enregistrée en base.
 */

const {
    data: attendancesData,
    error: attendancesError
} = await supabase
    .from("attendances")
    .select(`
        profile_id,
        response,
        team,
        created_at
    `)
    .eq(
        "match_id",
        matchId
    );


if (attendancesError) {

    console.error(
        "❌ Erreur récupération participants pour résultat :",
        attendancesError
    );

    alert(
    t("resultSavedParticipantsFailed")
);

    setReload(
        v => !v
    );

    return;

}


/*
 * On applique exactement la même logique que dans
 * le reste de l'application :
 *
 * - uniquement les joueurs présents ;
 * - tri par ordre d'inscription ;
 * - les 10 premiers participants.
 */

const participantsList =
    (attendancesData || [])
        .filter(
            attendance =>
                attendance.response === "present"
        )
        .sort(
            (a, b) =>
                new Date(a.created_at) -
                new Date(b.created_at)
        )
        .slice(
            0,
            10
        );


/*
 * =====================================================
 * NOTIFICATIONS PERSONNALISÉES
 * =====================================================
 */

try {

    console.log(
        "🏁 Début notifications résultat"
    );

    console.log(
        "👥 Participants détectés :",
        participantsList
    );

    console.log(
        "👤 Utilisateur actuel :",
        user?.id
    );


    if (!user) {

        throw new Error(
    t("userNotConnectedNotification")
);

    }


    if (
        participantsList.length === 0
    ) {

        throw new Error(
    t("noParticipantDetected")
);

    }


    if (
        winner === "draw"
    ) {

        const recipientIds =
            participantsList
                .map(
                    p => p.profile_id
                )
                .filter(Boolean);


        console.log(
            "🤝 Destinataires match nul :",
            recipientIds
        );


        if (
            recipientIds.length === 0
        ) {

            throw new Error(
    t("noValidDrawRecipient")
);

        }


        await createNotification({

            clubId:
                match.club_id,

            createdBy:
                user.id,

            createdByName:
    user.user_metadata?.display_name ||
    t("footFive"),

            type:
                "match_result",

            title:
    t("matchDrawTitle"),

message:
    t("matchDrawMessage")
        .replace(
            "{title}",
            match.title
        )
        .replace(
            "{white}",
            white
        )
        .replace(
            "{black}",
            black
        ),

            action:
                "match",

            actionId:
                matchId,

            recipientIds

        });


        console.log(
            "✅ Notification match nul créée"
        );

    }

    else {

        const winnerIds =
            participantsList
                .filter(
                    p =>
                        p.team === winner
                )
                .map(
                    p =>
                        p.profile_id
                )
                .filter(Boolean);


        const loserIds =
            participantsList
                .filter(
                    p =>
                        p.team &&
                        p.team !== winner
                )
                .map(
                    p =>
                        p.profile_id
                )
                .filter(Boolean);


        console.log(
            "🏆 Équipe gagnante :",
            winner
        );

        console.log(
            "🏆 Destinataires victoire :",
            winnerIds
        );

        console.log(
            "😔 Destinataires défaite :",
            loserIds
        );


        /*
         * -------------------------------------------------
         * VICTOIRE
         * -------------------------------------------------
         */

        if (
            winnerIds.length > 0
        ) {

            await createNotification({

                clubId:
                    match.club_id,

                createdBy:
                    user.id,

                createdByName:
    user.user_metadata?.display_name ||
    t("footFive"),

                type:
                    "match_result",

                title:
    t("victoryTitle"),

message:
    t("victoryMessage")
        .replace(
            "{white}",
            white
        )
        .replace(
            "{black}",
            black
        ),

                action:
                    "match",

                actionId:
                    matchId,

                recipientIds:
                    winnerIds

            });


            console.log(
                "✅ Notification victoire créée"
            );

        }


        /*
         * -------------------------------------------------
         * DÉFAITE
         * -------------------------------------------------
         */

        if (
            loserIds.length > 0
        ) {

            await createNotification({

                clubId:
                    match.club_id,

                createdBy:
                    user.id,

                createdByName:
    user.user_metadata?.display_name ||
    t("footFive"),

                type:
                    "match_result",

                title:
    t("defeatTitle"),

message:
    t("defeatMessage")
        .replace(
            "{white}",
            white
        )
        .replace(
            "{black}",
            black
        ),

                action:
                    "match",

                actionId:
                    matchId,

                recipientIds:
                    loserIds

            });


            console.log(
                "✅ Notification défaite créée"
            );

        }


        /*
         * Aucun destinataire
         */

        if (
            winnerIds.length === 0 &&
            loserIds.length === 0
        ) {

            throw new Error(
    t("noValidTeamRecipient")
);

        }

    }


}
catch (notificationError) {

    console.error(
        "❌ Erreur notification résultat complète :",
        notificationError
    );

    alert(
    `${t("resultNotificationFailed")}

${
    notificationError?.message ||
    t("unknownError")
}`
);

}

    /*
     * =====================================================
     * FIN
     * =====================================================
     */

    setReload(
        v => !v
    );

}

function myResult(match){

  const me =
    match.attendances?.find(
      a =>
        a.profile_id === user?.id
    );

  if(!me){

    return `⚪ ${t("notPlayed")}`;

  }

  if(
    match.winner === "draw"
  ){

    return `🟡 ${t("matchDraw")}`;

  }

  if(
    me.team === match.winner
  ){

    return `🟢 ${t("victory")}`;

  }

  return `🔴 ${t("defeat")}`;

}

async function reopenMatch(matchId){

  const match =
    matches.find(
      m => m.id === matchId
    );

  if(!match){

    alert(
      `❌ ${t("matchNotFound")}`
    );

    return;

  }


  /*
   * =====================================================
   * SAISON CLÔTURÉE
   * =====================================================
   */

  if(seasonLocked(match)){

    alert(
      `🔒 ${t("reopenMatchSeasonLocked")}`
    );

    return;

  }


  /*
   * =====================================================
   * AUTORISATION
   * =====================================================
   */

  if(!isManager()){

    alert(
      `🔒 ${t("reopenMatchPermissionDenied")}`
    );

    return;

  }


  /*
   * =====================================================
   * CONFIRMATION
   * =====================================================
   */

  const ok =
    window.confirm(
      t("reopenMatchConfirm")
    );


  if(!ok){

    return;

  }


  /*
   * =====================================================
   * RÉOUVERTURE DU MATCH
   * =====================================================
   */

  const {
    error
  } = await supabase

    .from(
      "matches"
    )

    .update({

      winner:
        null,

      score_white:
        null,

      score_black:
        null,

      status:
        "open"

    })

    .eq(
      "id",
      matchId
    );


  /*
   * =====================================================
   * ERREUR
   * =====================================================
   */

  if(error){

    console.error(
      "❌ Erreur réouverture match :",
      error
    );

    alert(
      error.message
    );

    return;

  }


  /*
   * =====================================================
   * NETTOYAGE LOCAL
   * =====================================================
   */

  setScoreWhite(
    prev => ({

      ...prev,

      [matchId]:
        ""

    })
  );


  setScoreBlack(
    prev => ({

      ...prev,

      [matchId]:
        ""

    })
  );


  /*
   * =====================================================
   * FIN
   * =====================================================
   */

  alert(
    `🔓 ${t("matchReopenedSuccess")}`
  );


  setReload(
    v => !v
  );

}

const activeMatches=

matches

.filter(
m=>
!m.winner
)

.sort(

(a,b)=>

new Date(
a.match_date
)

-

new Date(
b.match_date
)

);

const finishedMatches=

matches

.filter(
m=>
m.winner
)

.sort(

(a,b)=>

new Date(
b.match_date
)

-

new Date(
a.match_date
)

);

return(

<Page>

<h1 className="page-title">

📅 {t("matches")}

</h1>

{

activeMatches.map(

(m)=>(

<Card key={m.id}>

<h2
style={{
marginTop:"-8px",
marginBottom:"18px",
fontSize:"28px"
}}
>

{m.title}

</h2>

<p style={{marginBottom:"8px"}}>

<b>📍 {t("matchLocation")} :</b> {m.location}

</p>

<p style={{marginBottom:"8px"}}>

    <b>🕒 {t("date")} :</b>{" "}

    {formatMatchDate(m.match_date)}

</p>

<p style={{marginBottom:"18px"}}>

<b>🙋 {t("myStatus")} :</b>{" "}

{myAnswer(m.attendances||[])}

</p>


<Button

variant="success"

disabled={!!m.winner || seasonLocked(m)}

onClick={()=>answer(m.id,"present")}

>

✅ {t("present")}

</Button>

<Button

variant="danger"

disabled={!!m.winner || seasonLocked(m)}

onClick={()=>answer(m.id,"absent")}

style={{
marginTop:"10px"
}}

>

❌ {t("absent")}

</Button>

<hr/>

<h3
style={{
marginTop:"26px",
marginBottom:"10px"
}}
>

👥 {t("participants")} ({participants(m.attendances||[]).length}/10)

</h3>

<p>

{
placesLeft(
m.attendances||[]
)
}

</p>

{

participants(
m.attendances||[]
)

.map(

(p,index)=>

<div

key={index}

style={{

padding:"10px 14px",

marginBottom:"8px",

background:"rgba(255,255,255,.04)",

border:"1px solid rgba(255,255,255,.08)",

borderRadius:"10px"

}}

>

<div
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center"
}}
>

<div
style={{
display:"flex",
alignItems:"center",
gap:"8px"
}}
>

<span
style={{
fontWeight:"600"
}}
>

{p.guest_name ? "👥" : "⚽"} {playerName(p)}

</span>

{canSeeLevels() && (

<span
style={{
fontSize:"14px",
opacity:.7
}}
>

• {levelLabels[playerLevel(p)]}

</span>

)}

</div>

{

p.guest_name &&
editingGuest !== p.id &&
isManager() && (

<div
style={{
display:"flex",
alignItems:"center",
gap:"8px"
}}
>

<button

onClick={()=>startEditGuest(p)}

style={{

width:"32px",

height:"32px",

borderRadius:"50%",

border:"none",

background:"#394055",

color:"white",

cursor:"pointer",

display:"flex",

alignItems:"center",

justifyContent:"center",

fontSize:"16px"

}}

>

✏️

</button>

<button

onClick={()=>removeGuest(p.id)}

style={{

width:"32px",

height:"32px",

borderRadius:"50%",

border:"none",

background:"#E84545",

color:"white",

cursor:"pointer",

display:"flex",

alignItems:"center",

justifyContent:"center",

fontSize:"16px"

}}

>

❌

</button>

</div>

)

}

</div>

{

editingGuest===p.id && (

<>

<Input

value={editGuestName}

onChange={(e)=>setEditGuestName(e.target.value)}

style={{
marginTop:"12px"
}}

/>

<select

value={editGuestLevel}

onChange={(e)=>setEditGuestLevel(Number(e.target.value))}

style={{

width:"100%",

padding:"12px",

borderRadius:"12px",

marginTop:"10px",

marginBottom:"10px"

}}

>

{

Object.entries(levelLabels).map(([k,v])=>

<option key={k} value={k}>

{v}

</option>

)

}

</select>

<Button

variant="success"

onClick={saveGuest}

>

💾 {t("save")}

</Button>

<Button

variant="secondary"

style={{
marginTop:"10px"
}}

onClick={()=>setEditingGuest(null)}

>

{t("cancel")}

</Button>

</>

)
}

</div>

)

}

{
  canManageMatch(m) && (

    <div
      style={{
        display:"flex",
        gap:10,
        marginBottom:10
      }}
    >

      <Button

        variant="secondary"

        disabled={
          !!m.winner ||
          seasonLocked(m)
        }

        onClick={async()=>{

          if(teams[m.id]){

            const ok=window.confirm(

              t("replaceTeamsConfirm")

            );

            if(!ok){

              return;

            }

          }

          await compose(

            m.id,

            m.attendances

          );

        }}

      >

        {

          teams[m.id]

          ?

          `🔄 ${t("recomposeTeams")}`

          :

          `⚽ ${t("composeTeams")}`

        }

      </Button>

    </div>

  )
}

{

isManager() && (

<>

<hr/>

<Input

placeholder={t("guestNamePlaceholder")}

value={guestName[m.id] || ""}

onChange={(e)=>

setGuestName({

...guestName,

[m.id]:e.target.value

})

}

/>

<select

value={
guestLevel[m.id]||3
}

onChange={(e)=>

setGuestLevel({

...guestLevel,

[m.id]:
e.target.value

})

}

style={{

width:"100%",

padding:"12px",

borderRadius:"12px",

fontSize:"15px",

background:"#2a2a2a",

color:"#ffffff",

border:"1px solid rgba(255,255,255,.12)",

marginTop:"10px",

marginBottom:"20px"

}}

>

{

Object.entries(
levelLabels
)

.map(

([k,v])=>

<option
key={k}
value={k}
>

{v}

</option>

)

}

</select>

<Button

variant="secondary"

disabled={!!m.winner || seasonLocked(m)}

onClick={()=>addGuest(m.id)}

>

➕ {t("addGuest")}

</Button>

</>

)

}

<hr/>

<h3
style={{
marginTop:"24px",
marginBottom:"10px"
}}
>

❌ {t("absentPlayers")}

(
{
absent(
m.attendances||[]
).length
}
)

</h3>

{

absent(
m.attendances||[]
)

.map(

(p,index)=>

<div

key={index}

style={{

padding:"10px 14px",

marginBottom:"8px",

background:"rgba(255,255,255,.03)",

border:"1px solid rgba(255,255,255,.08)",

borderRadius:"10px"

}}

>

❌ {playerName(p)}

{canSeeLevels() && (

<div
style={{
marginTop:"4px",
fontSize:"14px",
opacity:.7
}}
>

{levelLabels[playerLevel(p)]}

</div>

)}

</div>

)

}


<h3
style={{
marginTop:"24px",
marginBottom:"10px"
}}
>

⏳ {t("waitingList")}

(
{
waiting(
m.attendances||[]
).length
}
)

</h3>

{

waiting(
m.attendances||[]
)

.map(

(p,index)=>

<div

key={index}

style={{

padding:"10px 14px",

marginBottom:"8px",

background:"rgba(255,255,255,.03)",

border:"1px solid rgba(255,255,255,.08)",

borderRadius:"10px"

}}

>

⚽ {playerName(p)}

{canSeeLevels() && (

<div
style={{
marginTop:"4px",
fontSize:"14px",
opacity:.7
}}
>

{levelLabels[playerLevel(p)]}

</div>

)}

</div>

)

}


{

teams[m.id]

&&

<>

<hr/>

<h3
style={{
marginTop:"24px",
marginBottom:"12px"
}}
>

⚪ {t("whiteTeam")} ({teams[m.id].scoreA})

</h3>

{

teams[m.id].A.map(

(p,index)=>

<div

key={index}

style={{

padding:"10px 14px",

marginBottom:"8px",

background:"rgba(255,255,255,.04)",

border:"1px solid rgba(255,255,255,.08)",

borderRadius:"10px"

}}

>

⚽ {p.name}

</div>

)

}

<h3
style={{
marginTop:"20px",
marginBottom:"12px"
}}
>

⚫ {t("darkTeam")} ({teams[m.id].scoreB})

</h3>

{

teams[m.id].B.map(

(p,index)=>

<div

key={index}

style={{

padding:"10px 14px",

marginBottom:"8px",

background:"rgba(255,255,255,.04)",

border:"1px solid rgba(255,255,255,.08)",

borderRadius:"10px"

}}

>

⚽ {p.name}

</div>

)

}

<hr/>

{

canManageMatch(m) && (

<>

<h3
style={{
marginTop:"26px",
marginBottom:"14px"
}}
>

🏆 {t("matchResult")}

</h3>

<Input

type="number"

placeholder={t("whiteTeamScore")}

value={scoreWhite[m.id] || ""}

onChange={(e)=>

setScoreWhite({

...scoreWhite,

[m.id]:e.target.value

})

}

/>

<Input

type="number"

placeholder={t("darkTeamScore")}

value={scoreBlack[m.id] || ""}

onChange={(e)=>

setScoreBlack({

...scoreBlack,

[m.id]:e.target.value

})

}

/>

<Button

variant="success"

disabled={
  !!m.winner ||
  seasonLocked(m) ||
  !canManageMatch(m)
}

onClick={() => askResultConfirmation(m.id)}

style={{
marginTop:"12px"
}}

>

🏆 {t("validateResult")}

</Button>

</>

)

}

</>

}

{
  canManageMatch(m) && (

    <Button

      variant="danger"

      disabled={
        seasonLocked(m)
      }

      onClick={()=>removeMatch(m.id)}

      style={{
        marginTop:"20px"
      }}

    >

      🗑 {t("deleteMatch")}

    </Button>

  )
}

</Card>

)

)

}

<h2
className="section-title"
style={{
textAlign:"center",
marginTop:"36px",
marginBottom:"18px"
}}
>

🏁 {t("finishedMatches")}

</h2>

{

finishedMatches.map(

(m)=>(

<Card

key={m.id}

style={{
cursor:"pointer"
}}

onClick={()=>

setExpanded(

expanded===m.id

?

null

:

m.id

)

}

>

<div
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
fontWeight:"700",
fontSize:"22px",
marginTop:"-6px"
}}
>

<span>

⚽ {m.title}

</span>

<span>

{

expanded===m.id

?

"▲"

:

"▼"

}

</span>

</div>

<p
style={{
marginTop:"10px",
marginBottom:"12px"
}}
>

📅 {formatMatchDate(m.match_date)}

</p>

<p
style={{
fontWeight:"700",
marginBottom:"12px"
}}
>

{
myResult(m)
}

</p>

{

expanded===m.id

&&

<div
style={{
marginTop:10
}}
>

<div
style={{
fontSize:"34px",
fontWeight:"800",
textAlign:"center",
margin:"14px 0"
}}
>

⚪ {m.score_white}

<span
style={{
margin:"0 18px"
}}
>

-

</span>

⚫ {m.score_black}

</div>

<div
style={{
textAlign:"center",
fontWeight:"700",
fontSize:"18px",
marginBottom:"8px"
}}
>

🏆 {

m.winner==="white"

?

t("whiteTeamVictory")

:

m.winner==="black"

?

t("darkTeamVictory")

:

t("matchDraw")

}

</div>

{

isManager() &&
!seasonLocked(m)

&&

<Button

variant="secondary"

onClick={(event)=>{

  event.stopPropagation();

  reopenMatch(
    m.id
  );

}}

style={{

marginTop:"16px"

}}

>

🔓 {t("reopenMatch")}

</Button>

}

</div>

}

</Card>

)

)

}

{
  resultConfirmation && (

    <div
      style={{

        position: "fixed",

        top: 0,

        left: 0,

        right: 0,

        bottom: 0,

        background:
          "rgba(0,0,0,.75)",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        padding: "20px",

        zIndex: 9999

      }}
    >

      <div
        style={{

          width: "100%",

          maxWidth: "420px",

          background: "#1f1f1f",

          borderRadius: "20px",

          padding: "24px",

          boxShadow:
            "0 20px 60px rgba(0,0,0,.5)",

          border:
            "1px solid rgba(255,255,255,.12)"

        }}
      >

        <h2
          style={{

            textAlign: "center",

            marginTop: 0,

            marginBottom: "20px"

          }}
        >

          ⚠️ {t("confirmResult")}

        </h2>


        <p
          style={{

            textAlign: "center",

            opacity: .8,

            marginBottom: "20px"

          }}
        >

          {t("confirmResultDescription")}

        </p>

        <div
          style={{

            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",

            padding: "20px",

            borderRadius: "16px",

            background:
              "rgba(255,255,255,.05)",

            marginBottom: "20px"

          }}
        >

          <div
            style={{

              textAlign: "center",

              flex: 1

            }}
          >

            <div
              style={{

                fontSize: "14px",

                opacity: .7,

                marginBottom: "6px"

              }}
            >

              ⚪ {t("whiteTeam")}

            </div>

            <div
              style={{

                fontSize: "32px",

                fontWeight: "700"

              }}
            >

              {
                resultConfirmation.white
              }

            </div>

          </div>


          <div
            style={{

              fontSize: "24px",

              fontWeight: "700",

              opacity: .7

            }}
          >

            -

          </div>


          <div
            style={{

              textAlign: "center",

              flex: 1

            }}
          >

            <div
              style={{

                fontSize: "14px",

                opacity: .7,

                marginBottom: "6px"

              }}
            >

              ⚫ {t("darkTeam")}

            </div>

            <div
              style={{

                fontSize: "32px",

                fontWeight: "700"

              }}
            >

              {
                resultConfirmation.black
              }

            </div>

          </div>

        </div>


        <p
          style={{

            textAlign: "center",

            fontSize: "14px",

            opacity: .7,

            marginBottom: "24px"

          }}
        >

          {t("confirmResultQuestion")}

        </p>


        <div
          style={{

            display: "flex",

            gap: "12px"

          }}
        >

          <Button

            variant="secondary"

            onClick={() => {

              setResultConfirmation(
                null
              );

            }}

            style={{

              flex: 1

            }}

          >

            {t("cancel")}

          </Button>


          <Button

            onClick={async () => {

              const matchId =
                resultConfirmation.matchId;

              setResultConfirmation(
                null
              );

              await saveResult(
                matchId
              );

            }}

            style={{

              flex: 1

            }}

          >

            ✅ {t("confirm")}

          </Button>

        </div>

      </div>

    </div>

  )
}

</Page>

);

}
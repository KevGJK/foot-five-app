import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { createNotification } from "../services/notifications";

export default function Matches() {

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

const levelLabels={

1:"1️⃣ Débutant",

2:"2️⃣ Loisir",

3:"3️⃣ Intermédiaire",

4:"4️⃣ Confirmé",

5:"5️⃣ Avancé",

6:"6️⃣ Expert",

7:"7️⃣ Élite"

};

function formatMatchDate(dateString) {
    const date = new Date(dateString);

    return `${date.toLocaleDateString("fr-FR")} à ${date.toLocaleTimeString(
        "fr-FR",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    )}`;
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
      data: member
    } = await supabase
      .from("club_members")
      .select(`
        club_id,
        role
      `)
      .eq("profile_id", user.id)
      .single();

    if (cancelled) {
      return;
    }

    if (!member) {
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
            "🎉 Tu es maintenant inscrit !",

          message:
            `Une place vient de se libérer pour le match "${currentMatch.title}". ` +
            `Tu es maintenant dans les 10 participants. ⚽`,

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

const name=
guestName[matchId];

if(!name){

alert(
"Nom obligatoire"
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

const ok=window.confirm(

"Retirer cet invité du match ?"

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

    const ok =
        window.confirm(
            "Supprimer ce match ?"
        );

    if(!ok)
        return;


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
            "Utilisateur non connecté."
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
                    "❌ Match annulé",

                message:
    `Le match "${match.title}" a été annulé.\n📅 ${formatMatchDate(match.match_date)}`,

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

return "Pas encore repondu";

}

if(
me.response==="present"
){

return "Present";

}

return "Absent";

}

function placesLeft(list){

const count=

participants(
list
).length;

if(
count<10
){

return `${10-count} place(s) restante(s)`;

}

if(
waiting(
list
).length>0
){

return "Liste attente active";

}

return "COMPLET";

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
                || "Foot Five",

            type:
                "teams_ready",

            title:
                "👕 Équipes constituées",

            message:
                "Les équipes de ton prochain match sont prêtes.",

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

async function saveResult(matchId) {

    const white =
        Number(scoreWhite[matchId] || 0);

    const black =
        Number(scoreBlack[matchId] || 0);

    if (
        white === 0 &&
        black === 0
    ) {
        alert("Saisir un score");
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
            "Résultat enregistré, mais impossible de créer la notification."
        );

        setReload(v => !v);

        return;
    }


    /*
     * =====================================================
     * PARTICIPANTS
     * =====================================================
     */

    const matchData =
        matches.find(
            m => m.id === matchId
        );

    const participantsList =
        participants(
            matchData?.attendances || []
        );


    /*
     * =====================================================
     * NOTIFICATIONS PERSONNALISÉES
     * =====================================================
     */

    try {

        if (
            participantsList.length > 0 &&
            user
        ) {

            /*
             * -------------------------------------------------
             * MATCH NUL
             * -------------------------------------------------
             */

            if (winner === "draw") {

                const recipientIds =
                    participantsList
                        .map(
                            p => p.profile_id
                        )
                        .filter(Boolean);

                if (
                    recipientIds.length > 0
                ) {

                    await createNotification({

                        clubId:
                            match.club_id,

                        createdBy:
                            user.id,

                        createdByName:
                            user.user_metadata?.display_name
                            || "Foot Five",

                        type:
                            "match_result",

                        title:
                            "🤝 Match nul",

                        message:
                            `Le match "${match.title}" est terminé.\n` +
                            `⚪ ${white} - ${black} ⚫\n` +
                            `🤝 Les deux équipes se quittent sur un match nul.`,

                        action:
                            "match",

                        actionId:
                            matchId,

                        recipientIds

                    });

                }

            }


            /*
             * -------------------------------------------------
             * VICTOIRE / DÉFAITE
             * -------------------------------------------------
             */

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


                /*
                 * -------------------------------
                 * NOTIFICATION DES GAGNANTS
                 * -------------------------------
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
                            user.user_metadata?.display_name
                            || "Foot Five",

                        type:
                            "match_result",

                        title:
                            "🏆 VICTOIRE !",

                        message:
                            `Ton équipe s'impose ${white} - ${black} !\n` +
                            `🔥 Bravo à toute l'équipe !`,

                        action:
                            "match",

                        actionId:
                            matchId,

                        recipientIds:
                            winnerIds

                    });

                }


                /*
                 * -------------------------------
                 * NOTIFICATION DES PERDANTS
                 * -------------------------------
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
                            user.user_metadata?.display_name
                            || "Foot Five",

                        type:
                            "match_result",

                        title:
                            "😔 Défaite",

                        message:
                            `Ton équipe s'incline ${white} - ${black}.\n` +
                            `💪 On fera mieux au prochain match !`,

                        action:
                            "match",

                        actionId:
                            matchId,

                        recipientIds:
                            loserIds

                    });

                }

            }

        }

    }
    catch (notificationError) {

        console.error(
            "❌ Erreur notification résultat :",
            notificationError
        );

    }


    /*
     * =====================================================
     * FIN
     * =====================================================
     */

    alert(
        "Résultat enregistré"
    );

    setReload(
        v => !v
    );

}

function myResult(match){

const me=

match.attendances?.find(

a=>

a.profile_id

===

user?.id

);

if(
!me
){

return "⚪ Non joué";

}

if(

me.team

===

match.winner

){

return "🟢 Victoire";

}

return "🔴 Défaite";

}

async function reopenMatch(matchId){

const match = matches.find(m => m.id === matchId);

if (match && seasonLocked(match)) {
    alert("Cette saison est clôturée. Les matchs ne peuvent plus être réouverts.");
    return;
}

if(

clubRole

!==

"owner"

){

return;

}

const ok=

window.confirm(

`⚠️ Réouvrir ce match ?

Le classement et les statistiques
pourront changer.`

);

if(
!ok
){

return;

}

await supabase

.from(
"matches"
)

.update({

winner:null,

score_white:null,

score_black:null

})

.eq(
"id",
matchId);

alert(
"Match réouvert"
);

setReload(
v=>!v
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

📅 Matchs

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

<b>📍 Lieu :</b> {m.location}

</p>

<p style={{marginBottom:"8px"}}>

    <b>🕒 Date :</b>{" "}

    {formatMatchDate(m.match_date)}

</p>

<p style={{marginBottom:"18px"}}>

<b>🙋 Mon statut :</b>{" "}

{myAnswer(m.attendances||[])}

</p>


<Button

variant="success"

disabled={!!m.winner || seasonLocked(m)}

onClick={()=>answer(m.id,"present")}

>

✅ Présent

</Button>

<Button

variant="danger"

disabled={!!m.winner || seasonLocked(m)}

onClick={()=>answer(m.id,"absent")}

style={{
marginTop:"10px"
}}

>

❌ Absent

</Button>

<hr/>

<h3
style={{
marginTop:"26px",
marginBottom:"10px"
}}
>

👥 Participants ({participants(m.attendances||[]).length}/10)

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

p.guest_name && editingGuest !== p.id && (

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

💾 Enregistrer

</Button>

<Button

variant="secondary"

style={{
marginTop:"10px"
}}

onClick={()=>setEditingGuest(null)}

>

Annuler

</Button>

</>

)
}

</div>

)

}

<div
style={{
display:"flex",
gap:10,
marginBottom:10
}}
>

<Button

variant="secondary"

disabled={!!m.winner || seasonLocked(m)}

onClick={async()=>{

if(teams[m.id]){

const ok=window.confirm(

"Les équipes actuelles seront remplacées. Continuer ?"

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

"🔄 Recomposer les équipes"

:

"⚽ Composer les équipes"

}

</Button>


</div>

<hr/>

<Input

placeholder="Nom de l'invité"

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

➕ Ajouter un invité

</Button>

<hr/>

<h3
style={{
marginTop:"24px",
marginBottom:"10px"
}}
>

❌ Absents

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

⏳ Liste d'attente

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

⚪ Équipe Blanche ({teams[m.id].scoreA})

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

⚫ Équipe Foncée ({teams[m.id].scoreB})

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

<h3
style={{
marginTop:"26px",
marginBottom:"14px"
}}
>

🏆 Résultat du match

</h3>

<Input

type="number"

placeholder="Score équipe blanche"

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

placeholder="Score équipe foncée"

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

disabled={!!m.winner || seasonLocked(m)}

onClick={()=>saveResult(m.id)}

style={{
marginTop:"12px"
}}

>

🏆 Valider le résultat

</Button>


{

m.winner

&&

<div>

<p>

Score :

{
m.score_white
}

-

{
m.score_black
}

</p>

{

clubRole==="owner" && !seasonLocked(m)

&&

<Button

variant="secondary"

onClick={()=>reopenMatch(m.id)}

style={{
marginTop:"10px"
}}

>

🔓 Réouvrir le match

</Button>

}

</div>

}

</>

}

<Button

variant="danger"

disabled={seasonLocked(m)}

onClick={()=>removeMatch(m.id)}

style={{
marginTop:"20px"
}}

>

🗑 Supprimer le match

</Button>

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

🏁 Matchs terminés

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

"Victoire Équipe Blanche"

:

m.winner==="black"

?

"Victoire Équipe Foncée"

:

"Match nul"

}

</div>

</div>

}

</Card>

)

)

}

</Page>

);

}
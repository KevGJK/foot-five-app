import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { createNotification } from "../services/notifications";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function ClubSelector({

goJoin

}){

const [clubName,setClubName]=useState("");

const [loading,setLoading]=useState(false);

const [clubs,setClubs]=useState([]);

const [activeClub,setActiveClub]=useState(null);

useEffect(() => {

  let cancelled = false;

  async function loadClubs() {

    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();

    if (!user || cancelled) {
      return;
    }

    const {
      data: profile
    } = await supabase
      .from("profiles")
      .select("active_club_id")
      .eq("id", user.id)
      .single();

    if (cancelled) {
      return;
    }

    setActiveClub(
      profile?.active_club_id
    );

    const {
      data
    } = await supabase
      .from("club_members")
      .select(`
        role,
        clubs(
          id,
          name
        )
      `)
      .eq("profile_id", user.id);

   console.table(
  (data || []).map(item => ({
    role: item.role,
    club: item.clubs,
    club_id: item.clubs?.id,
    club_name: item.clubs?.name
  }))
);

    if (cancelled) {
      return;
    }

    setClubs(
  (data || []).filter(
    item => item.clubs
  )
);

  }

  loadClubs();

  return () => {
    cancelled = true;
  };

}, []);

function generateCode(){

return (

"FIVE"

+

Math.random()

.toString()

.slice(2,8)

);

}

async function switchClub(club){

if(

club.id===activeClub

){

return;

}

const ok=

window.confirm(

`Changer de club ?

${club.name}`

);

if(!ok)
return;

const {

data:{user}

}

=

await supabase.auth.getUser();

await supabase

.from(
"profiles"
)

.update({

active_club_id:
club.id

})

.eq(
"id",
user.id

);

alert(
"Club changé"
);

window.location.reload();

}

async function createClub(){

if(!clubName){

alert(
"Nom du club obligatoire"
);

return;

}

setLoading(true);

const {

data:existing

}

=

await supabase

.from(
"clubs"
)

.select(
"id"
)

.ilike(

"name",

clubName

);

if(

existing

&&

existing.length>0

){

setLoading(false);

alert(
"Ce nom de club existe déjà"
);

return;

}

const {

data:{user}

}

=

await supabase.auth.getUser();

if(!user){

setLoading(false);

return;

}

const inviteCode=

generateCode();

const {
  data: club,
  error
} =
await supabase
.from("clubs")
.insert({

  name:
    clubName.trim(),

  invite_code:
    inviteCode,

  owner_id:
    user.id

})
.select()
.single();

if(error){

setLoading(false);

alert(
error.message
);

return;

}

const {

error:memberError

}

=

await supabase

.from(
"club_members"
)

.insert({

club_id:
club.id,

profile_id:
user.id,

role:
"owner"

});

if(memberError){

setLoading(false);

alert(
memberError.message
);

return;

}

await supabase

.from(
"profiles"
)

.update({

active_club_id:
club.id

})

.eq(

"id",

user.id

);

setLoading(false);

if(memberError){

alert(
memberError.message
);

return;

}

alert(
"Club créé"
);

window.location.reload();

}

async function leaveClub(membership){

  const club =
  membership.clubs;

  if (
    membership.role === "owner"
  ){

    alert(
      "Le propriétaire ne peut pas quitter son propre club."
    );

    return;

  }

  const ok =
  window.confirm(
    `Quitter le club "${club.name}" ?`
  );

  if (!ok) {
    return;
  }

  const {
    data: {
      user
    }
  } =
  await supabase.auth.getUser();

  if (!user) {
    return;
  }


  /*
   * ----------------------------------------
   * RÉCUPÉRATION DU PROFIL
   * ----------------------------------------
   */

  const {
    data: profile,
    error: profileError
  } =
  await supabase
  .from("profiles")
  .select("display_name")
  .eq(
    "id",
    user.id
  )
  .single();


  if (profileError) {

    console.error(
      "Erreur récupération profil :",
      profileError
    );

  }


  /*
   * ----------------------------------------
   * RÉCUPÉRATION DES OWNERS ET ADMINS
   * ----------------------------------------
   *
   * Cette opération doit être effectuée
   * avant la suppression de l'adhésion.
   */

  const {
    data: managers,
    error: managersError
  } =
  await supabase
  .from("club_members")
  .select(
    "profile_id"
  )
  .eq(
    "club_id",
    club.id
  )
  .in(
    "role",
    [
      "owner",
      "admin"
    ]
  );


  if (managersError) {

    console.error(
      "Erreur récupération responsables :",
      managersError
    );

  } else {

    const recipientIds =
    (managers || [])

      .map(
        manager =>
          manager.profile_id
      )

      .filter(Boolean)

      .filter(
        profileId =>
          profileId !== user.id
      );


    /*
     * ----------------------------------------
     * NOTIFICATION :
     * MEMBRE PARTI
     * ----------------------------------------
     */

    if (
      recipientIds.length > 0
    ) {

      const displayName =
        profile?.display_name ||
        user.user_metadata?.display_name ||
        "Un membre";


      try {

        await createNotification({

          clubId:
            club.id,

          createdBy:
            user.id,

          createdByName:
            displayName,

          type:
            "member_left",

          title:
            "👋 Membre parti",

          message:
            `${displayName} a quitté le club.`,

          action:
            null,

          actionId:
            null,

          recipientIds

        });

      } catch (
        notificationError
      ) {

        /*
         * La notification est secondaire.
         * Une erreur ici ne doit jamais
         * empêcher le départ du membre.
         */

        console.error(
          "Erreur notification départ membre :",
          notificationError
        );

      }

    }

  }


  /*
   * ----------------------------------------
   * CHOIX DU NOUVEAU CLUB ACTIF
   * ----------------------------------------
   */

  const remainingClubs =
  clubs.filter(
    item =>
      item.clubs.id !== club.id
  );

  const newActiveClub =
  remainingClubs[0];


  /*
   * ----------------------------------------
   * CHANGEMENT DU CLUB ACTIF
   * ----------------------------------------
   */

  if (
    club.id === activeClub
  ){

    const {
      error: activeClubError
    } =
    await supabase
    .from("profiles")
    .update({

      active_club_id:
      newActiveClub
        ? newActiveClub.clubs.id
        : null

    })
    .eq(
      "id",
      user.id
    );


    if (activeClubError) {

      alert(
        activeClubError.message
      );

      return;

    }

  }


  /*
   * ----------------------------------------
   * SUPPRESSION DE L'ADHÉSION
   * ----------------------------------------
   */

  const {
    error
  } =
  await supabase
  .from("club_members")
  .delete()
  .eq(
    "club_id",
    club.id
  )
  .eq(
    "profile_id",
    user.id
  );


  if (error) {

    alert(
      error.message
    );

    return;

  }


  /*
   * ----------------------------------------
   * FIN
   * ----------------------------------------
   */

  alert(
    `Vous avez quitté le club "${club.name}".`
  );

  window.location.reload();

}

return(

<Page>

<h1 className="page-title">

🏟 Clubs

</h1>

<Card>

<h2
style={{
marginTop:"-10px",
marginBottom:"18px"
}}
>

👥 Mes clubs

</h2>

{

clubs.map(

(c)=>(

<div

key={c.clubs.id}

style={{

padding:"16px",

marginBottom:"12px",

border:

c.clubs.id===activeClub

?

"2px solid #43d98c"

:

"1px solid rgba(255,255,255,.12)",

borderRadius:"14px",

background:

c.clubs.id===activeClub

?

"rgba(67,217,140,.08)"

:

"rgba(255,255,255,.02)",

transition:"all .2s",

display:"flex",

alignItems:"center",

justifyContent:"space-between",

gap:"12px"

}}

>

<div

onClick={()=>

switchClub(
c.clubs
)

}

style={{

cursor:"pointer",

flex:1

}}

>

{

c.clubs.id===activeClub

?

"🟢 "

:

"⚪ "

}

{
c.clubs.name
}

—

{

c.role==="owner"

?

"👑 Owner"

:

c.role==="admin"

?

"🛡 Admin"

:

"⚽ Joueur"

}

</div>

{

c.role !== "owner" && (

<button

onClick={

(e)=>{

e.stopPropagation();

leaveClub(c);

}

}

title="Quitter le club"

style={{

background:"transparent",

border:"none",

cursor:"pointer",

fontSize:"22px",

padding:"4px",

opacity:.8

}}

>

🚪

</button>

)

}

</div>

)

)

}

</Card>

<Card>

<h2
style={{
marginTop:"-10px",
marginBottom:"18px"
}}
>

➕ Créer un club

</h2>

<Input

placeholder="Nom du club"

value={clubName}

onChange={(e)=>setClubName(e.target.value)}

/>

<Button

loading={loading}

onClick={createClub}

style={{
marginTop:"20px"
}}

>

➕ Créer mon club

</Button>

</Card>

<Button

variant="secondary"

onClick={goJoin}

style={{
marginTop:"20px"
}}

>

🔗 Rejoindre un club

</Button>

</Page>

);

}
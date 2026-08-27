import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function MatchVote(){

  const [match,setMatch] = useState(null);
  const [user,setUser] = useState(null);
  const [loading,setLoading] = useState(true);

  const matchId =
    window.location.pathname
      .split("/")
      .pop();

  // Nouveau :
  // permet de savoir si la page doit afficher
  // le vote ou les équipes
  const view =
    new URLSearchParams(
      window.location.search
    ).get("view");

  const [teams,setTeams] = useState({
    white: [],
    black: []
  });

  useEffect(() => {

    let cancelled = false;

    async function load() {

      const {
        data: {
          user
        }
      } = await supabase
        .auth
        .getUser();

      if (cancelled) {
        return;
      }

      setUser(user);

      /*
       * ------------------------------------------------
       * MODE ÉQUIPES
       * ------------------------------------------------
       */

      if (
  view === "teams" ||
  view === "details"
) {

        const {
          data,
          error
        } = await supabase
          .from("matches")
          .select(`
            *,
            attendances(
  id,
  profile_id,
  team,
  response,
  created_at,
  guest_name,
  guest_level,
  profiles(
    display_name
  )
)
          `)
          .eq(
            "id",
            matchId
          )
          .single();

        if (cancelled) {
          return;
        }

        if (error) {

          console.error(
            "Erreur chargement équipes :",
            error
          );

          setLoading(false);

          return;

        }

        setMatch(data);

setMatch(data);

if (view === "teams") {

  const white = [];
  const black = [];

  /*
   * ------------------------------------------------
   * PARTICIPANTS RÉELS DU MATCH
   * ------------------------------------------------
   *
   * Même logique que dans Matches.jsx :
   * les 10 premiers joueurs "present"
   * sont les participants.
   */

  const participants =
    (data?.attendances || [])
      .filter(
        player =>
          player.response === "present"
      )
      .sort(
        (a, b) =>
          new Date(a.created_at) -
          new Date(b.created_at)
      )
      .slice(0, 10);


  /*
   * ------------------------------------------------
   * RÉPARTITION DES 10 PARTICIPANTS
   * ------------------------------------------------
   */

  participants.forEach(player => {

    if (
      player.team === "white"
    ) {

      white.push(player);

    }

    if (
      player.team === "black"
    ) {

      black.push(player);

    }

  });

  setTeams({
    white,
    black
  });

}

setLoading(false);

return;

      }

      /*
       * ------------------------------------------------
       * MODE VOTE NORMAL
       * ------------------------------------------------
       */

const {
  data,
  error
} = await supabase
  .from("matches")
  .select("*")
  .eq(
    "id",
    matchId
  )
  .maybeSingle();

if (cancelled) {
  return;
}

if (error) {

  console.error(
    "Erreur chargement match :",
    error
  );

  setMatch(null);
  setLoading(false);

  return;

}

setMatch(data);
setLoading(false);

    }

    load();

    return () => {
      cancelled = true;
    };

  }, [matchId, view]);


  /*
   * ------------------------------------------------
   * VOTE
   * ------------------------------------------------
   */

  async function vote(response){

    if (!user) {

      alert(
        "Connecte-toi avant de voter"
      );

      return;

    }

    const {
      error
    } = await supabase

      .from("attendances")

      .upsert({

        match_id:
          matchId,

        profile_id:
          user.id,

        response

      }, {

        onConflict:
          "match_id,profile_id"

      });

    if (error) {

      alert(
        error.message
      );

      return;

    }

    alert(
      "Vote enregistré"
    );

    window.location.href =
      "/";

  }


  /*
   * ------------------------------------------------
   * CHARGEMENT
   * ------------------------------------------------
   */

  if (loading) {

    return (

      <div
        style={{
          padding:30
        }}
      >

        Chargement…

      </div>

    );

  }


  /*
   * ------------------------------------------------
   * MATCH INTROUVABLE
   * ------------------------------------------------
   */

  if (!match) {

    return (

      <div
        style={{
          padding:30
        }}
      >

        Match introuvable

      </div>

    );

  }


  /*
   * ------------------------------------------------
   * MODE ÉQUIPES
   * ------------------------------------------------
   */

  if (view === "teams") {

    function playerName(player){

      if (
        player.guest_name
      ) {

        return player.guest_name;

      }

      return (
        player.profiles?.display_name
        ||
        "Joueur"
      );

    }

    return (

      <div

        style={{

          padding:30,

          maxWidth:600,

          margin:"auto"

        }}

      >

        <h1>

          ⚽ {match.title}

        </h1>

        <p>

          📍 {match.location}

        </p>

        <p>

          🕒 {

            new Date(
              match.match_date
            ).toLocaleString()

          }

        </p>

        <hr
          style={{
            margin:"25px 0"
          }}
        />

        <h2
          style={{
            textAlign:"center"
          }}
        >

          🏆 Équipes constituées

        </h2>


        {/* ÉQUIPE BLANC */}

        <div
          style={{
            border:"2px solid #ddd",
            borderRadius:15,
            padding:20,
            marginTop:20
          }}
        >

          <h2>

            ⚪ Équipe BLANC

          </h2>

          {
            teams.white.length === 0

              ?

              <p>
                Aucune équipe constituée.
              </p>

              :

              <ol>

                {
                  teams.white.map(
                    player => (

                      <li
                        key={
                          player.id
                        }
                        style={{
                          marginBottom:8,
                          fontSize:17
                        }}
                      >

                        {
                          playerName(
                            player
                          )
                        }

                      </li>

                    )
                  )

                }

              </ol>

          }

        </div>


        {/* ÉQUIPE NOIRE */}

        <div
          style={{
            border:"2px solid #222",
            borderRadius:15,
            padding:20,
            marginTop:20
          }}
        >

          <h2>

            ⚫ Équipe FONCÉ

          </h2>

          {
            teams.black.length === 0

              ?

              <p>
                Aucune équipe constituée.
              </p>

              :

              <ol>

                {
                  teams.black.map(
                    player => (

                      <li
                        key={
                          player.id
                        }
                        style={{
                          marginBottom:8,
                          fontSize:17
                        }}
                      >

                        {
                          playerName(
                            player
                          )
                        }

                      </li>

                    )
                  )

                }

              </ol>

          }

        </div>


        <button

          style={{

            width:"100%",

            padding:15,

            fontSize:17,

            marginTop:25,

            borderRadius:10,

            cursor:"pointer"

          }}

          onClick={() => {

            window.location.href =
              "/";

          }}

        >

          🏠 Retour à l'accueil

        </button>

      </div>

    );

  }

/*
 * ------------------------------------------------
 * MODE RÉSULTAT DU MATCH
 * ------------------------------------------------
 */

if (view === "result") {

  function playerName(player) {

    if (player.guest_name) {

      return player.guest_name;

    }

    return (
      player.profiles?.display_name ||
      "Joueur"
    );

  }

  const participants =
    (match.attendances || [])
      .filter(
        player =>
          player.response === "present"
      )
      .sort(
        (a, b) =>
          new Date(a.created_at) -
          new Date(b.created_at)
      )
      .slice(0, 10);

  return (

    <div
      style={{
        padding:30,
        maxWidth:600,
        margin:"auto"
      }}
    >

      <h1>

        🏆 Résultat du match

      </h1>

      <h2
        style={{
          textAlign:"center",
          marginTop:25
        }}
      >

        ⚽ {match.title}

      </h2>

      <p
        style={{
          textAlign:"center"
        }}
      >

        📅 {
          new Date(
            match.match_date
          ).toLocaleDateString(
            "fr-FR",
            {
              weekday:"long",
              day:"numeric",
              month:"long"
            }
          )
        }

      </p>

      <p
        style={{
          textAlign:"center"
        }}
      >

        🕒 {
          new Date(
            match.match_date
          ).toLocaleTimeString(
            "fr-FR",
            {
              hour:"2-digit",
              minute:"2-digit"
            }
          )
        }

      </p>

      <hr
        style={{
          margin:"25px 0"
        }}
      />

      <div
        style={{
          textAlign:"center",
          fontSize:42,
          fontWeight:"800",
          margin:"25px 0"
        }}
      >

        {match.score_white}

        <span
          style={{
            margin:"0 18px",
            opacity:.6
          }}
        >
          -
        </span>

        {match.score_black}

      </div>

      <div
        style={{
          textAlign:"center",
          fontSize:24,
          fontWeight:"700",
          marginBottom:30
        }}
      >

        {
          match.winner === "draw"

            ?

            "🤝 Match nul"

            :

            match.winner === "white"

              ?

              "🏆 Équipe BLANCHE victorieuse"

              :

              "🏆 Équipe FONCÉ victorieuse"
        }

      </div>

      <hr
        style={{
          margin:"25px 0"
        }}
      />

      <h2>

        👥 Participants

      </h2>

      <ol>

        {
          participants.map(
            player => (

              <li
                key={player.id}
                style={{
                  marginBottom:8,
                  fontSize:17
                }}
              >

                {
                  playerName(player)
                }

                {
                  player.team === match.winner &&
                  match.winner !== "draw"

                  ?

                  " 🏆"

                  :

                  ""
                }

              </li>

            )
          )
        }

      </ol>

      <button

        style={{

          width:"100%",

          padding:15,

          fontSize:17,

          marginTop:25,

          borderRadius:10,

          cursor:"pointer"

        }}

        onClick={() => {

          window.location.href =
            "/";

        }}

      >

        🏠 Retour à l'accueil

      </button>

    </div>

  );

}


  /*
   * ------------------------------------------------
   * MODE DÉTAILS DU MATCH
   * ------------------------------------------------
   */

  if (view === "details") {

    function playerName(player) {

      if (
        player.guest_name
      ) {

        return player.guest_name;

      }

      return (
        player.profiles?.display_name ||
        "Joueur"
      );

    }

    const presentPlayers =
      (match.attendances || [])
        .filter(
          player =>
            player.response === "present"
        )
        .sort(
          (a, b) =>
            new Date(a.created_at) -
            new Date(b.created_at)
        );

    const participants =
      presentPlayers.slice(0, 10);

    const waitingPlayers =
      presentPlayers.slice(10);

    return (

      <div

        style={{

          padding:30,

          maxWidth:600,

          margin:"auto"

        }}

      >

        <h1>

          ⚽ {match.title}

        </h1>

        <p>

          📅 {

            new Date(
              match.match_date
            ).toLocaleDateString(
              "fr-FR",
              {
                weekday:"long",
                day:"numeric",
                month:"long"
              }
            )

          }

        </p>

        <p>

          🕒 {

            new Date(
              match.match_date
            ).toLocaleTimeString(
              "fr-FR",
              {
                hour:"2-digit",
                minute:"2-digit"
              }
            )

          }

        </p>

        {
          match.location && (

            <p>

              📍 {match.location}

            </p>

          )
        }

        <hr
          style={{
            margin:"25px 0"
          }}
        />

        <h2>

          👥 Participants
          {" "}
          ({participants.length}/10)

        </h2>

        {
          participants.length === 0

            ?

            <p>
              Aucun joueur inscrit.
            </p>

            :

            <ol>

              {
                participants.map(
                  player => (

                    <li
                      key={player.id}
                      style={{
                        marginBottom:8,
                        fontSize:17
                      }}
                    >

                      {
                        playerName(
                          player
                        )
                      }

                    </li>

                  )
                )
              }

            </ol>
        }


        {
          waitingPlayers.length > 0 && (

            <>

              <hr
                style={{
                  margin:"25px 0"
                }}
              />

              <h2>

                ⏳ Liste d'attente
                {" "}
                ({waitingPlayers.length})

              </h2>

              <ol>

                {
                  waitingPlayers.map(
                    player => (

                      <li
                        key={player.id}
                        style={{
                          marginBottom:8,
                          fontSize:17
                        }}
                      >

                        {
                          playerName(
                            player
                          )
                        }

                      </li>

                    )
                  )
                }

              </ol>

            </>

          )
        }


        <button

          style={{

            width:"100%",

            padding:15,

            fontSize:17,

            marginTop:25,

            borderRadius:10,

            cursor:"pointer"

          }}

          onClick={() => {

            window.location.href =
              "/";

          }}

        >

          🏠 Retour à l'accueil

        </button>

      </div>

    );

  }


  /*
   * ------------------------------------------------
   * MODE VOTE NORMAL
   * ------------------------------------------------
   */

  return (

    <div

      style={{

        padding:30,

        maxWidth:600,

        margin:"auto"

      }}

    >

      <h1>

        ⚽ {match.title}

      </h1>

      <p>

        📍 {match.location}

      </p>

      <p>

        🕒 {

          new Date(
            match.match_date
          ).toLocaleString()

        }

      </p>

      <br/>

      <button

        style={{

          width:"100%",

          padding:15,

          fontSize:18,

          marginBottom:10

        }}

        onClick={() =>
          vote("present")
        }

      >

        ✅ Je participe

      </button>


      <button

        style={{

          width:"100%",

          padding:15,

          fontSize:18

        }}

        onClick={() =>
          vote("absent")
        }

      >

        ❌ Je ne participe pas

      </button>

    </div>

  );

}
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

      if (view === "teams") {

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

const white = [];
const black = [];

/*
 * ------------------------------------------------
 * PARTICIPANTS RÉELS DU MATCH
 * ------------------------------------------------
 *
 * Même logique que dans Matches.jsx :
 * les 10 premiers joueurs ayant répondu
 * "present" sont les participants.
 *
 * Les joueurs suivants sont en liste d'attente,
 * même s'ils possèdent encore un ancien
 * team = "white" ou "black".
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

        setLoading(false);

        return;

      }

      /*
       * ------------------------------------------------
       * MODE VOTE NORMAL
       * ------------------------------------------------
       */

      const {
        data
      } = await supabase
        .from("matches")
        .select("*")
        .eq(
          "id",
          matchId
        )
        .single();

      if (cancelled) {
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
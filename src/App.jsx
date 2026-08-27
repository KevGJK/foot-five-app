import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MatchVote from "./pages/MatchVote";
import JoinClub from "./pages/JoinClub";
import PlayerProfile from "./pages/PlayerProfile";

export default function App() {

  const [connected, setConnected] =
    useState(null);


  /*
   * =====================================================
   * AUTHENTIFICATION
   * =====================================================
   */

  useEffect(() => {

    let mounted = true;


    async function initializeAuth() {

      const {
        data
      } = await supabase.auth.getSession();


      if (mounted) {

        setConnected(
          !!data.session
        );

      }

    }


    initializeAuth();


    const {
      data: listener
    } = supabase.auth.onAuthStateChange(
      (_, session) => {

        if (mounted) {

          setConnected(
            !!session
          );

        }

      }
    );


    return () => {

      mounted = false;

      listener.subscription.unsubscribe();

    };

  }, []);



  /*
   * =====================================================
   * ATTENTE DE LA RESTAURATION DE SESSION
   * =====================================================
   *
   * Important :
   *
   * Lorsqu'un utilisateur ouvre directement l'application
   * depuis une notification, la session Supabase peut ne pas
   * être immédiatement disponible.
   *
   * On attend donc que l'authentification soit déterminée
   * AVANT de charger une page nécessitant des données
   * protégées par les règles RLS.
   *
   */

  if (connected === null) {

    return (

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "20px",
          fontWeight: "600"
        }}
      >

        ⚽ Chargement...

      </div>

    );

  }



  /*
   * =====================================================
   * UTILISATEUR NON CONNECTÉ
   * =====================================================
   */

  if (!connected) {

    return (

      <Login

        onSuccess={() => {

          setConnected(
            true
          );

          /*
           * On conserve l'URL actuelle.
           *
           * C'est important pour :
           * - /match/...
           * - /join/...
           * - /player/...
           */

          window.location.reload();

        }}

      />

    );

  }



  /*
   * =====================================================
   * ROUTAGE
   * =====================================================
   *
   * À partir d'ici, la session Supabase est disponible.
   *
   */

  const path =
    window.location.pathname;



  /*
   * -----------------------------------------------------
   * MATCH
   * -----------------------------------------------------
   */

  if (
    path.startsWith(
      "/match/"
    )
  ) {

    return (

      <MatchVote />

    );

  }



  /*
   * -----------------------------------------------------
   * REJOINDRE UN CLUB
   * -----------------------------------------------------
   */

  if (
    path.startsWith(
      "/join/"
    )
  ) {

    return (

      <JoinClub

        goHome={() => {

          window.location =
            "/";

        }}

      />

    );

  }



  /*
   * -----------------------------------------------------
   * PROFIL JOUEUR
   * -----------------------------------------------------
   */

  if (
    path.startsWith(
      "/player/"
    )
  ) {

    return (

      <PlayerProfile />

    );

  }



  /*
   * =====================================================
   * TABLEAU DE BORD
   * =====================================================
   */

  return (

    <Dashboard />

  );

}
import { useState } from "react";
import { supabase } from "../lib/supabase";

export function useStatistics() {

  const [stats, setStats] = useState({
    created: 0,
    present: 0,
    absent: 0,
    rate: 0,
  });

  async function loadStats(userId) {

    // Récupération du club actif
    const {
      data: profile
    } = await supabase
      .from("profiles")
      .select("active_club_id")
      .eq("id", userId)
      .single();

    if (!profile?.active_club_id) {

      setStats({
        created: 0,
        present: 0,
        absent: 0,
        rate: 0,
      });

      return;
    }

    // Récupération de la saison active
    const {
      data: season
    } = await supabase
      .from("seasons")
      .select("id")
      .eq("club_id", profile.active_club_id)
      .eq("active", true)
      .single();

    if (!season) {

      setStats({
        created: 0,
        present: 0,
        absent: 0,
        rate: 0,
      });

      return;
    }

    // Matchs créés pendant la saison active
    const {
      count: created
    } = await supabase
      .from("matches")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("organizer_id", userId)
      .eq("season_id", season.id);

    // Présences / absences pendant la saison active
    const {
      data
    } = await supabase
      .from("attendances")
      .select(`
        response,
        match_id,
        matches(
          season_id
        )
      `)
      .eq("profile_id", userId);

    const seasonAttendances =
      (data || []).filter(
        item =>
          item.matches?.season_id === season.id
      );

    const present =
      seasonAttendances.filter(
        item => item.response === "present"
      ).length;

    const absent =
      seasonAttendances.filter(
        item => item.response === "absent"
      ).length;

    const total = present + absent;

    setStats({
      created: created || 0,
      present,
      absent,
      rate: total
        ? Math.round((present / total) * 100)
        : 0,
    });

  }

  return {
    stats,
    loadStats
  };

}
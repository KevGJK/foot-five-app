import { useState } from "react";

export function useClub() {

  const [club, setClub] = useState(null);

  const [logoUrl, setLogoUrl] = useState(null);

  return {

    club,
    setClub,

    logoUrl,
    setLogoUrl

  };

}
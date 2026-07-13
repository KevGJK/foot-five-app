import { RiLogoutBoxFill } from "react-icons/ri";
import Button from "./Button";

export default function DashboardHeader({
  club,
  logoUrl,
  showLogo,
  setShowLogo,
  logoInput,
  changeLogo,
  setLogoInput,
}) {
  return (
    <>
      {showLogo && (
        <div
          onClick={() => setShowLogo(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.95)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <img
            src={logoUrl}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: 20,
            }}
          />
        </div>
      )}

      <div
        style={{
          position: "relative",
          textAlign: "center",
          marginBottom: 24,
        }}
      >
       <button
  onClick={async () => {
    const { supabase } = await import("../../lib/supabase");
    await supabase.auth.signOut();
    window.location.reload();
  }}
  style={{
    position: "absolute",
    right: 0,
    top: 0,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "70px",
    color: "var(--text-secondary)"
  }}
>
  <RiLogoutBoxFill size={42} />

  <span
    style={{
      fontSize: "11px",
      marginTop: "4px"
    }}
  >
    Me déconnecter
  </span>
</button>

        <div
          onClick={() => logoUrl && setShowLogo(true)}
          style={{
            width: 145,
            height: 145,
            margin: "0 auto 16px",
            borderRadius: "50%",
            overflow: "hidden",
            background: "#161616",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: logoUrl ? "pointer" : "default",
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div style={{ fontSize: 60 }}>⚽</div>
          )}
        </div>

        {club?.role === "owner" && (
     <div
  style={{
    display: "flex",
    justifyContent: "center",
    marginTop: "-12px",
    marginBottom: "8px"
  }}
>
  <Button
    variant="secondary"
    fullWidth={false}
    onClick={() => logoInput?.click()}
    style={{
    height: "28px",
    fontSize: "10px",
    padding: "0 10px",
    minWidth: "105px"
}}
  >
    ✏️ Modifier le logo
  </Button>
</div>
        )}

        <input
          ref={(el) => setLogoInput(el)}
          type="file"
          accept="image/*"
          onChange={changeLogo}
          style={{ display: "none" }}
        />

        <h1
    className="page-title"
    style={{
        fontSize: "26px",
        marginBottom: "6px",
        lineHeight: "1.2"
    }}
>
    {club?.clubs?.name}
</h1>

        <div
          style={{
            opacity: .75,
            marginTop: -10,
          }}
        >
          👑 {club?.role}
        </div>
      </div>
    </>
  );
}
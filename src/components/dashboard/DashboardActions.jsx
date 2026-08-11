import MenuButton from "../ui/MenuButton";
import Button from "../ui/Button";

export default function DashboardActions({ setPage }) {

  return (

    <>

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "stretch"
        }}
      >

        <MenuButton
          icon="🏟"
          title="Clubs"
          onClick={() => setPage("club")}
          style={{
            flex: 1,
            marginBottom: 0
          }}
        />

        <MenuButton
          icon="⚙"
          title="Paramètres"
          onClick={() => setPage("settings")}
          style={{
            flex: 1,
            marginBottom: 0
          }}
        />

      </div>

      <Button
  variant="secondary"
  fullWidth
  onClick={() => setPage("admin")}
  style={{
    marginTop: "12px"
  }}
>
  👑 Administration
</Button>

    </>

  );

}
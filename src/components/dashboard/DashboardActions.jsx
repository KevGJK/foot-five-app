import MenuButton from "../ui/MenuButton";
import Button from "../ui/Button";

import { useLanguage } from "../../i18n/useLanguage";

export default function DashboardActions({
  setPage,
  clubRole
}) {

const { t } = useLanguage();

  return (

    <>

<div style={{ display: "flex", gap: "12px", alignItems: "stretch" }}>
  <MenuButton
    icon="🏟"
    title={t("clubs")}
    onClick={() => setPage("club")}
    centered
    style={{ flex: 1, marginBottom: 0 }}
  />

  <MenuButton
    icon="⚙"
    title={t("settings")}
    onClick={() => setPage("settings")}
    centered
    style={{ flex: 1, marginBottom: 0 }}
  />
</div>

            <MenuButton
        icon="👤"
        title={t("myAccount")}
        onClick={() => setPage("account")}
        centered
        style={{
          width: "100%",
          marginTop: "12px",
          marginBottom: 0,
          justifyContent: "center"
        }}
      />

{(clubRole === "owner" || clubRole === "admin") && (

  <Button
    variant="secondary"
    fullWidth
    onClick={() => setPage("admin")}
    style={{
      marginTop: "12px"
    }}
  >
    👑 {t("administration")}
  </Button>
)}

    </>

  );

}
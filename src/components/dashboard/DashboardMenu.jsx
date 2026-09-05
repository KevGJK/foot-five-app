import MenuButton from "../ui/MenuButton";
import { useLanguage } from "../../i18n/useLanguage";

export default function DashboardMenu({ setPage,unreadCount }) {

const { t } = useLanguage();

  return (
    <>

      <MenuButton
        icon="➕"
        title={t("createMatch")}
        onClick={() => setPage("create")}
      />

      <MenuButton
        icon="📅"
        title={t("matches")}
        onClick={() => setPage("matches")}
      />

<MenuButton
    icon="👥"
    title={t("members")}
    onClick={() => setPage("members")}
/>

<MenuButton
    icon="📊"
    title={t("seasonStats")}
    onClick={() => setPage("stats")}
/>

<MenuButton
    icon="🏆"
    title={t("seasonRanking")}
    onClick={() => setPage("ranking")}
/>

<MenuButton
    icon="🔔"
    title={t("notifications")}
    badge={unreadCount}
    onClick={() => setPage("notifications")}
/>

    </>
  );

}
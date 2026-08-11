import MenuButton from "../ui/MenuButton";

export default function DashboardMenu({ setPage,unreadCount }) {

  return (
    <>

      <MenuButton
        icon="➕"
        title="Créer un match"
        onClick={() => setPage("create")}
      />

      <MenuButton
        icon="📅"
        title="Matchs"
        onClick={() => setPage("matches")}
      />

<MenuButton
    icon="👥"
    title="Membres"
    onClick={() => setPage("members")}
/>

<MenuButton
    icon="📊"
    title="Statistiques saison"
    onClick={() => setPage("stats")}
/>

<MenuButton
    icon="🏆"
    title="Classement saison"
    onClick={() => setPage("ranking")}
/>

<MenuButton
    icon="🔔"
    title="Notifications"
    badge={unreadCount}
    onClick={() => setPage("notifications")}
/>

    </>
  );

}
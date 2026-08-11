import Section from "../ui/Section";

export default function DashboardStats({
  stats,
  reliability
}) {

  return (

    <Section title="📈 Tableau de bord">

      <p>
        <b>📅 Matchs créés :</b> {stats.created}
      </p>

      <p style={{ marginTop: 8 }}>
        <b>✅ Présences :</b> {stats.present}
      </p>

      <p style={{ marginTop: 8 }}>
        <b>❌ Absences :</b> {stats.absent}
      </p>

      <p style={{ marginTop: 8 }}>
        <b>📊 Taux de présence :</b> {stats.rate}%
      </p>

      <p style={{ marginTop: 8 }}>
        <b>🎯 Fiabilité :</b> {reliability()}
      </p>

    </Section>

  );

}
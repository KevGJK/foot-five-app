import Section from "../ui/Section";
import { useLanguage } from "../../i18n/useLanguage";

export default function DashboardStats({
  stats,
  reliability
}) {

  const { t } = useLanguage();

  return (

    <Section title={t("dashboardStats")}>

      <p>
        <b>{t("matchesCreated")}</b> {stats.created}
      </p>

      <p style={{ marginTop: 8 }}>
        <b>{t("presences")}</b> {stats.present}
      </p>

      <p style={{ marginTop: 8 }}>
        <b>{t("dashboardAbsences")}</b> {stats.absent}
      </p>

      <p style={{ marginTop: 8 }}>
        <b>{t("attendanceRate")}</b> {stats.rate}%
      </p>

      <p style={{ marginTop: 8 }}>
        <b>{t("dashboardReliability")}</b> {reliability()}
      </p>

    </Section>

  );

}
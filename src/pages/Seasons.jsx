import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import BackButton from "../components/ui/BackButton";

import { useLanguage } from "../i18n/useLanguage";

export default function Seasons({
  goBack,
  activeSeason,
  allSeasons,
  loadingSeason,
  closeSeason,
  viewResults
}) {

const { t, language } = useLanguage();

const dateLocale = {
  fr: "fr-FR",
  en: "en-GB",
  es: "es-ES",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
};

const currentLocale =
  dateLocale[language] || "fr-FR";

  return (
    <>
      <BackButton onClick={goBack}>
        ⚙ {t("backToAdministration")}
      </BackButton>

      <Page>

        <h1 className="page-title">
          🏆 {t("seasonManagement")}
        </h1>

        <Card>

          <h2>
            🏆 {t("activeSeason")}
          </h2>

          {loadingSeason ? (

            <p>
              {t("loading")}
            </p>

          ) : activeSeason ? (

            <>
              <p>
                <b>🏷️ {t("name")} :</b> {activeSeason.name}
              </p>

              <p style={{ marginTop: 8 }}>
  <b>📅 {t("startDate")} :</b>{" "}
  {new Date(
    activeSeason.start_date
  ).toLocaleDateString(currentLocale)}
</p>

<p style={{ marginTop: 8 }}>
  🟢 <b>{t("status")} :</b> {t("currentSeason")}
</p>
            </>

          ) : (

            <p>
              {t("noActiveSeason")}
            </p>

          )}

        </Card>

        <Card>

          <h2>
            📚 {t("seasonHistory")}
          </h2>

          <p
            style={{
              opacity: .7,
              fontSize: "14px",
              marginBottom: "16px"
            }}
          >
            {t("seasonHistoryDescription")}
          </p>

          {allSeasons?.map(season => (

            <div
              key={season.id}
              style={{
                padding: "14px 0",
                borderBottom:
                  "1px solid rgba(255,255,255,.08)"
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px"
                }}
              >

                <div>

                  <div
                    style={{
                      fontWeight: "700",
                      fontSize: "16px"
                    }}
                  >
                    🏆 {season.name}
                  </div>

                <div
  style={{
    fontSize: "13px",
    opacity: .7,
    marginTop: "4px"
  }}
>
  {season.active ? (
    <>
      📅 {t("startDate")} :{" "}
      {new Date(
        season.start_date
      ).toLocaleDateString(currentLocale)}
    </>
  ) : (
    <>
      📅{" "}
      {new Date(
        season.start_date
      ).toLocaleDateString(currentLocale)}
      {" → "}
      {new Date(
        season.end_date
      ).toLocaleDateString(currentLocale)}
    </>
  )}
</div>

                </div>

                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "14px"
                  }}
                >
                  {season.active
  ? t("active")
  : t("finished")}
                </div>

              </div>

              {!season.active && viewResults && (

                <Button
                  variant="secondary"
                  onClick={() => viewResults(season)}
                  style={{
                    marginTop: "12px",
                    width: "100%"
                  }}
                >
                  🏆 {t("viewFinalRanking")}
                </Button>

              )}

            </div>

          ))}

        </Card>

        {activeSeason && (

          <Button
            variant="danger"
            onClick={closeSeason}
            style={{
              marginTop: "20px"
            }}
          >
            🔒 {t("closeSeason")}
          </Button>

        )}

      </Page>
    </>
  );
}
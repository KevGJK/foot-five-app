import Page from "../components/ui/Page";
import BackButton from "../components/ui/BackButton";
import legalContent from "../i18n/legalContent";
import { useLanguage } from "../i18n/useLanguage";

export default function LegalPage({ type }) {
  const { language } = useLanguage();

  const content = legalContent[language] || legalContent.fr;
  const document = content[type];

  if (!document) {
    return null;
  }

return (
  <>
    <BackButton
      onClick={() => {
        window.location.href = "/";
      }}
    />

    <Page>
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto",
          padding: "32px 20px 50px",
          boxSizing: "border-box",
        }}
      >

        <h1
          style={{
            margin: "0 0 8px",
            textAlign: "center",
            fontSize: "32px",
            lineHeight: 1.25,
          }}
        >
          {document.title}
        </h1>

        <div
          style={{
            textAlign: "center",
            fontSize: "14px",
            opacity: 0.7,
            marginBottom: "42px",
          }}
        >
          {document.version} — {document.date}
        </div>

        <div>
          {document.sections.map((section, index) => (
            <section
              key={index}
              style={{
                marginBottom:
                  index === document.sections.length - 1 ? "0" : "38px",
                paddingBottom:
                  index === document.sections.length - 1 ? "0" : "34px",
                borderBottom:
                  index === document.sections.length - 1
                    ? "none"
                    : "1px solid rgba(148, 163, 184, 0.22)",
              }}
            >
              <h2
                style={{
                  margin: "0 0 22px",
                  textAlign: "center",
                  fontSize: "22px",
                  lineHeight: 1.35,
                }}
              >
                {section.title}
              </h2>

              <div
                style={{
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                {section.paragraphs.map(
                  (paragraph, paragraphIndex) => (
                    <p
                      key={paragraphIndex}
                      style={{
                        margin:
                          paragraphIndex === 0
                            ? "0 0 18px"
                            : "5px 0",
                      }}
                    >
                      {paragraph}
                    </p>
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Page>
    </>
  );
}
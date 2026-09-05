import LegalFooter from "../LegalFooter";

export default function Page({ children }) {
  return (
    <div className="page">
      {children}

      <LegalFooter />
    </div>
  );
}
import { useLanguage } from "../../i18n/useLanguage";
import Button from "./Button";

export default function BackButton({ onClick, children }) {

    const { t } = useLanguage();

    return (

        <div style={{
            padding: "20px"
        }}>

            <Button
                variant="secondary"
                onClick={onClick}
            >

                {children || `🏠 ${t("backToHome")}`}

            </Button>

        </div>

    );

}
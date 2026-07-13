import Button from "./Button";

export default function BackButton({ onClick, children = "🏠 Retour à l'accueil" }) {

    return (

        <div style={{
            padding: "20px"
        }}>

            <Button
                variant="secondary"
                onClick={onClick}
            >

                {children}

            </Button>

        </div>

    );

}
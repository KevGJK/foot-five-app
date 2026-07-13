import Card from "./Card";

export default function StatCard({
    title,
    value,
    icon
}) {

    return (

        <Card>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px"
                }}
            >

                <div
                    style={{
                        fontSize: "32px"
                    }}
                >
                    {icon}
                </div>

                <div>

                    <div
                        style={{
                            fontSize: "14px",
                            opacity: .7
                        }}
                    >
                        {title}
                    </div>

                    <div
                        style={{
                            fontSize: "28px",
                            fontWeight: 700
                        }}
                    >
                        {value}
                    </div>

                </div>

            </div>

        </Card>

    );

}
export default function Badge({

    children,

    color = "primary",

    small = false

}) {

    const colors = {

        primary:"var(--primary)",

        warning:"var(--warning)",

        danger:"var(--danger)",

        neutral:"var(--secondary)"

    };

    return(

        <span

            style={{

                display:"inline-flex",

                alignItems:"center",

                justifyContent:"center",

                minWidth: small ? "22px" : "auto",

                height: small ? "22px" : "auto",

                padding: small ? "0 6px" : "6px 12px",

                borderRadius:"999px",

                background:colors[color],

                color:

                    color==="warning"

                    ?

                    "#111"

                    :

                    "#fff",

                fontWeight:"600",

                fontSize:

                    small

                    ?

                    "12px"

                    :

                    "14px"

            }}

        >

            {children}

        </span>

    );

}
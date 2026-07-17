export default function Badge({

    children,

    color = "primary",

    small = false

}) {

    const colors = {

        primary:"#3DDC84",

        warning:"#F5A524",

        danger:"#E5484D",

        neutral:"#394055"

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
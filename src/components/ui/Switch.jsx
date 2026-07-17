export default function Switch({

label,

checked,

onChange,

disabled = false

}) {

return(

<div

style={{

display:"flex",

justifyContent:"space-between",

alignItems:"center",

padding:"14px 0",

opacity:disabled?0.5:1

}}

>

<div

style={{

fontSize:"16px",

fontWeight:"500"

}}

>

{label}

</div>

<div

onClick={()=>{

if(!disabled){

onChange(!checked);

}

}}

style={{

width:"52px",

height:"30px",

borderRadius:"999px",

background:

checked

?

"#3DDC84"

:

"#555",

position:"relative",

cursor:

disabled

?

"default"

:

"pointer",

transition:"0.25s"

}}

>

<div

style={{

position:"absolute",

top:"3px",

left:

checked

?

"25px"

:

"3px",

width:"24px",

height:"24px",

borderRadius:"50%",

background:"#fff",

transition:"0.25s",

boxShadow:"0 2px 6px rgba(0,0,0,.35)"

}}

>

</div>

</div>

</div>

);

}
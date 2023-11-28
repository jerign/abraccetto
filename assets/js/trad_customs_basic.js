function get_cookie ( cookie_name ){
    var results = document.cookie.match ( '(^|;) ?' + cookie_name + '=([^;]*)(;|$)' );
    if ( results )
        return ( unescape ( results[2] ) );
    else
        return null;
}
  
function ChangePlaceHolder(lang){
    if(lang=="fr" || lang === ""){
        document.getElementById("email2").placeholder = "Email"
    }
    if(lang=="es"){
        document.getElementById("email2").placeholder = "Correo electrónico"
    }
    if(lang=="en"){
        document.getElementById("email2").placeholder = "Email"
  }
}
var lang = get_cookie("lang")

ChangePlaceHolder(lang)

if(lang !=null){
    ChangePlaceHolder(lang)
}

document.getElementById('lang').addEventListener('change', function() {
    ChangePlaceHolder(this.value)
})
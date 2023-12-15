
function get_cookie ( cookie_name ){
    var results = document.cookie.match ( '(^|;) ?' + cookie_name + '=([^;]*)(;|$)' );
    if ( results )
        return ( unescape ( results[2] ) );
    else
        return null;
}

function ChangePlaceHolder(lang){
    if(lang=="fr" || lang === ""){
      if (typeof document.getElementById("name") != "undefined" && document.getElementById("name").hasOwnProperty('placeholder')) {
        document.getElementById("name").placeholder = "Nom"
     }
      if (typeof document.getElementById("email") != "undefined") {
        document.getElementById("email").placeholder = "Email"
     }
      // if (typeof document.getElementById("email2") != "undefined") {
      //   document.getElementById("email2").placeholder = "Email"
      // }
      if (typeof document.getElementById("text") != "undefined") {
        document.getElementById("text").placeholder = "Entrez votre demande ici..."
      }
    }
    if(lang=="es"){
      if (typeof document.getElementById("name") != "undefined") {
        document.getElementById("name").placeholder = "Apellido"
     }
      if (typeof document.getElementById("email") != "undefined") {
        document.getElementById("email").placeholder = "Correo electrónico"
     }
      // if (typeof document.getElementById("email2") != "undefined") {
      //   document.getElementById("email2").placeholder = "Correo electrónico"
      // }
      if (typeof document.getElementById("text") != "undefined") {
        document.getElementById("text").placeholder = "Ingrese su solicitud aquí..."
      }
    }
    if(lang=="en"){
      if (typeof document.getElementById("name") != "undefined") {
        document.getElementById("name").placeholder = "Name"
     }
      if (typeof document.getElementById("email") != "undefined") {
        document.getElementById("email").placeholder = "Email"
     }
      // if (typeof document.getElementById("email2") != "undefined") {
      //   document.getElementById("email2").placeholder = "Email"
      // }
      if (typeof document.getElementById("text") != "undefined") {
        document.getElementById("text").placeholder = "Enter your request here..."
      }
    }
  }
  
var lang = get_cookie("lang")

ChangePlaceHolder(lang)

if(lang !=null){
ChangePlaceHolder(lang)
}

document.getElementById('lang').addEventListener('change', function() {
ChangePlaceHolder(this.value)
});
  
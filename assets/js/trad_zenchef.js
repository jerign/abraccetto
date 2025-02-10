function get_cookie(cookie_name) {
  var results = document.cookie.match('(^|;) ?' + cookie_name + '=([^;]*)(;|$)');
  if (results)
    return (unescape(results[2]));
  else
    return null;
}

function ChangePlaceHolder(lang) {
  // if (lang == "fr" || lang === "") {
  //   document.querySelector('[data-testid="bookings-btn"]').textContent = "Nouveau Texte";
  // }
  // if (lang == "es") {
  //   document.querySelector('[data-testid="bookings-btn"]').textContent = "Reservar una mesa";
  // }
  // if (lang == "en") {
  //   document.querySelector('[data-testid="bookings-btn"]').textContent = "Book a table";
  // }
}

var lang = get_cookie("lang")

ChangePlaceHolder(lang)

if (lang != null) {
  ChangePlaceHolder(lang)
}

document.getElementById('lang').addEventListener('change', function () {
  ChangePlaceHolder(this.value)
});
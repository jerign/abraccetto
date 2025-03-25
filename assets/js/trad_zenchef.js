document.addEventListener("DOMContentLoaded", function () {
  
  

  function get_cookie(cookie_name) {
    var results = document.cookie.match('(^|;) ?' + cookie_name + '=([^;]*)(;|$)');
    if (results)
      return (unescape(results[2]));
    else
      return null;
  }

  function ChangePlaceHolder(lang) {
    console.log("this is the script for zenchef")
    
    const zenchefWidget = document.querySelector(".zc-widget-config");
    if (zenchefWidget) {
        zenchefWidget.setAttribute("data-lang", lang);
    }

  }

  var lang = get_cookie("lang")

  ChangePlaceHolder(lang)

  if (lang != null) {
    ChangePlaceHolder(lang)
  }

  document.getElementById('lang').addEventListener('change', function () {
    ChangePlaceHolder(this.value);

    document.getElementsByClassName("ZC_sdk__zc-iframe_k5FE3 ZC_sdk__opened_MKywu ZC_sdk__position-right_HkYTz ZC_sdk__zc-width-numeral_MRI1B").src += '';
    window.location.reload();
  });
});
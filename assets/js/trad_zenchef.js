document.addEventListener("DOMContentLoaded", function () {
  
  

  function get_cookie(cookie_name) {
    var results = document.cookie.match('(^|;) ?' + cookie_name + '=([^;]*)(;|$)');
    if (results)
      return (unescape(results[2]));
    else
      return null;
  }

  function ChangePlaceHolder(lang) {
    console.log("Changing Zenchef language to:", lang);
    const zenchefWidget = document.querySelector(".zc-widget-config");
    if (zenchefWidget) {
        // Remove the old widget
        const oldWidget = document.querySelector(".zc-widget-config");
        if (oldWidget) {
            oldWidget.remove();
        }

        // Create new widget with updated language
        const newWidget = document.createElement("div");
        newWidget.className = "zc-widget-config";
        newWidget.setAttribute("data-restaurant", "372763");
        newWidget.setAttribute("data-lang", lang);
        
        // Insert the new widget
        document.head.appendChild(newWidget);

        // Force Zenchef SDK to reload
        const script = document.querySelector('script[src*="sdk.zenchef.com"]');
        if (script) {
            script.remove();
            const newScript = document.createElement('script');
            newScript.id = 'zenchef-sdk';
            newScript.src = 'https://sdk.zenchef.com/v1/sdk.min.js';
            newScript.async = true;
            document.head.appendChild(newScript);
        }
    }
  }

  // Initialize with current language from cookie
  var lang = get_cookie("lang");
  if (lang) {
    ChangePlaceHolder(lang);
  }

  // Listen for language changes
  const langSelect = document.querySelector('select[id="lang"]');
  if (langSelect) {
    langSelect.addEventListener('change', function () {
      const newLang = this.value;
      ChangePlaceHolder(newLang);
    });
  }
});
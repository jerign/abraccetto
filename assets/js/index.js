class Translator {
  constructor(options = {}) {
    this._options = Object.assign({}, this.defaultConfig, options);
    this._elements = document.querySelectorAll("[data-i18n]");
    this._cache = new Map();

    if (this._options.detectLanguage) {
      this._options.defaultLanguage = this._detectLanguage();
    }

    if (
      this._options.defaultLanguage &&
      typeof this._options.defaultLanguage == "string"
    ) {
      this._getResource(this._options.defaultLanguage);
    }
  }

  _detectLanguage() {
    var stored = localStorage.getItem("language");

    if (this._options.persist && stored) {
      return stored;
    }

    var lang = navigator.languages
      ? navigator.languages[0]
      : navigator.language;

    return lang.substr(0, 2);
  }

  _fetch(path) {
    return fetch(path)
      .then(response => response.json())
      .catch(() => {
        console.error(
          `Could not load ${path}. Please make sure that the file exists.`
        );
      });
  }

  async _getResource(lang) {
    var cached = this._cache.get(lang);
    if (cached != null && typeof cached === "string") {
      try {
        return JSON.parse(cached);
      } catch (e) {
        this._cache.delete(lang);
      }
    }

    var translation = await this._fetch(
      `${this._options.filesLocation}/${lang}.json`
    );

    if (translation != null && typeof translation === "object") {
      this._cache.set(lang, JSON.stringify(translation));
    }

    return translation;
  }

  async load(lang) {
    if (!lang) {
      lang = this._options.defaultLanguage;
    }
    
    if (!this._options.languages.includes(lang)) {
      return;
    }

    this._elements = document.querySelectorAll("[data-i18n]");

    var translation = await this._getResource(lang);
    if (translation && typeof translation === "object") {
      this._translate(translation);
    }

    document.documentElement.lang = lang;

    if (this._options.persist) {
      localStorage.setItem("language", lang);
    }
  }

  async getTranslationByKey(lang, key) {
    if (!key) throw new Error("Expected a key to translate, got nothing.");

    if (typeof key != "string")
      throw new Error(
        `Expected a string for the key parameter, got ${typeof key} instead.`
      );

    var translation = await this._getResource(lang);

    return this._getValueFromJSON(key, translation, true);
  }

  _getValueFromJSON(key, json, fallback) {
    if (!json || typeof json !== "object") {
      if (fallback && this._options.defaultLanguage) {
        var cachedDefault = this._cache.get(this._options.defaultLanguage);
        if (cachedDefault != null && typeof cachedDefault === "string") {
          try {
            return this._getValueFromJSON(key, JSON.parse(cachedDefault), false);
          } catch (e) {
            // ignore invalid cache
          }
        }
      }
      return null;
    }
    var text = key.split(".").reduce((obj, i) => obj && obj[i], json);

    if (!text && this._options.defaultLanguage && fallback) {
      var cachedDefault = this._cache.get(this._options.defaultLanguage);
      if (cachedDefault != null && typeof cachedDefault === "string") {
        try {
          var fallbackTranslation = JSON.parse(cachedDefault);
          text = this._getValueFromJSON(key, fallbackTranslation, false);
        } catch (e) {
          // ignore invalid cache
        }
      }
    }
    if (!text) {
      text = key;
      console.warn(`Could not find text for attribute "${key}".`);
    }

    return text;
  }

  _translate(translation) {
    var zip = (keys, values) => keys.map((key, i) => [key, values[i]]);
    var nullSafeSplit = (str, separator) => (str ? str.split(separator) : null);

    var replace = element => {
      var i18nRaw = element.getAttribute("data-i18n");
      var attrRaw = element.getAttribute("data-i18n-attr");
      // Si data-i18n-attr est absent : une seule clé, propriété innerHTML
      var keys = attrRaw
        ? (nullSafeSplit(i18nRaw, " ") || [])
        : (i18nRaw ? [i18nRaw.trim()] : []);
      var properties = nullSafeSplit(attrRaw, " ") || ["innerHTML"];

      if (keys.length > 0 && keys.length !== properties.length) {
        console.error(
          "data-i18n and data-i18n-attr must contain the same number of items"
        );
      } else {
        var pairs = zip(keys, properties);
        pairs.forEach(pair => {
          const [key, property] = pair;
          var text = this._getValueFromJSON(key, translation, true);

          if (text && text !== key) {
            element[property] = text;
            element.setAttribute(property, text);
          } else if (!text) {
            console.error(`Could not find text for attribute "${key}".`);
          }
        });
      }
    };

    this._elements.forEach(replace);
  }

  get defaultConfig() {
    return {
      persist: false,
      languages: ["en"],
      defaultLanguage: "",
      detectLanguage: true,
      filesLocation: ""
    };
  }
}

export default Translator;

function get_cookie ( cookie_name ){
  var results = document.cookie.match ( '(^|;) ?' + cookie_name + '=([^;]*)(;|$)' );
  if ( results )
    return ( unescape ( results[2] ) );
  else
    return null;
}

// i18n cuite au build par Eleventy : plus de Translator runtime ni de fetch JSON.
// On dérive la langue courante de <html lang> (posé par le layout) pour OpenTable.
var lang = (document.documentElement.getAttribute("lang") || get_cookie("lang") || "fr")
  .toString()
  .substr(0, 2);
window.currentReservationLang = lang;

function getOpenTableLang() {
  var docLang =
    window.currentReservationLang ||
    (document.getElementById("lang") && document.getElementById("lang").value) ||
    document.documentElement.getAttribute("lang") ||
    "fr";
  docLang = String(docLang).substr(0, 2);
  var map = { fr: "fr-FR", en: "en-US", es: "es-ES" };
  return map[docLang] || "fr-FR";
}

function updateReservationIframeLang() {
  var overlay = document.getElementById("reservation-popup-overlay");
  var iframe = document.getElementById("reservation-popup-iframe");
  if (overlay && overlay.classList.contains("is-open") && iframe) {
    var otLang = getOpenTableLang();
    iframe.src =
      "https://www.opentable.fr/widget/reservation/canvas?rid=342114&domain=fr&type=standard&theme=tall&lang=" +
      otLang +
      "&iframe=true&overlay=false&v=" +
      Date.now();
  }
}


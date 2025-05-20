// Fonction pour traduire manuellement les éléments du widget des cookies
function translateCookieElements() {
    // Attendre que les fichiers de traduction soient chargés
    setTimeout(function() {
        const currentLang = document.getElementById('lang').value || 'fr';
        
        // Charger le fichier de traduction manuellement
        fetch(`assets/i18n/${currentLang}.json`)
            .then(response => response.json())
            .then(translations => {
                // Traduire les éléments du banner
                const cookieText = document.querySelector('[data-i18n="CookieConsent.Text"]');
                if (cookieText && translations.CookieConsent && translations.CookieConsent.Text) {
                    cookieText.textContent = translations.CookieConsent.Text;
                }
                
                const acceptAllBtn = document.querySelector('[data-i18n="CookieConsent.AcceptAll"]');
                if (acceptAllBtn && translations.CookieConsent && translations.CookieConsent.AcceptAll) {
                    acceptAllBtn.textContent = translations.CookieConsent.AcceptAll;
                }
                
                const acceptNecessaryBtn = document.querySelector('[data-i18n="CookieConsent.AcceptNecessary"]');
                if (acceptNecessaryBtn && translations.CookieConsent && translations.CookieConsent.AcceptNecessary) {
                    acceptNecessaryBtn.textContent = translations.CookieConsent.AcceptNecessary;
                }
                
                const preferencesBtn = document.querySelector('[data-i18n="CookieConsent.Preferences"]');
                if (preferencesBtn && translations.CookieConsent && translations.CookieConsent.Preferences) {
                    preferencesBtn.textContent = translations.CookieConsent.Preferences;
                }
                
                // Traduire les éléments du modal
                const prefsTitle = document.querySelector('[data-i18n="CookiePreferences.Title"]');
                if (prefsTitle && translations.CookiePreferences && translations.CookiePreferences.Title) {
                    prefsTitle.textContent = translations.CookiePreferences.Title;
                }
                
                const prefsDesc = document.querySelector('[data-i18n="CookiePreferences.Description"]');
                if (prefsDesc && translations.CookiePreferences && translations.CookiePreferences.Description) {
                    prefsDesc.textContent = translations.CookiePreferences.Description;
                }
                
                const necessaryTitle = document.querySelector('[data-i18n="CookiePreferences.Necessary"]');
                if (necessaryTitle && translations.CookiePreferences && translations.CookiePreferences.Necessary) {
                    necessaryTitle.textContent = translations.CookiePreferences.Necessary;
                }
                
                const necessaryDesc = document.querySelector('[data-i18n="CookiePreferences.NecessaryDescription"]');
                if (necessaryDesc && translations.CookiePreferences && translations.CookiePreferences.NecessaryDescription) {
                    necessaryDesc.textContent = translations.CookiePreferences.NecessaryDescription;
                }
                
                const analyticsTitle = document.querySelector('[data-i18n="CookiePreferences.Analytics"]');
                if (analyticsTitle && translations.CookiePreferences && translations.CookiePreferences.Analytics) {
                    analyticsTitle.textContent = translations.CookiePreferences.Analytics;
                }
                
                const analyticsDesc = document.querySelector('[data-i18n="CookiePreferences.AnalyticsDescription"]');
                if (analyticsDesc && translations.CookiePreferences && translations.CookiePreferences.AnalyticsDescription) {
                    analyticsDesc.textContent = translations.CookiePreferences.AnalyticsDescription;
                }
                
                const marketingTitle = document.querySelector('[data-i18n="CookiePreferences.Marketing"]');
                if (marketingTitle && translations.CookiePreferences && translations.CookiePreferences.Marketing) {
                    marketingTitle.textContent = translations.CookiePreferences.Marketing;
                }
                
                const marketingDesc = document.querySelector('[data-i18n="CookiePreferences.MarketingDescription"]');
                if (marketingDesc && translations.CookiePreferences && translations.CookiePreferences.MarketingDescription) {
                    marketingDesc.textContent = translations.CookiePreferences.MarketingDescription;
                }
                
                const cancelBtn = document.querySelector('[data-i18n="CookiePreferences.Cancel"]');
                if (cancelBtn && translations.CookiePreferences && translations.CookiePreferences.Cancel) {
                    cancelBtn.textContent = translations.CookiePreferences.Cancel;
                }
                
                const saveBtn = document.querySelector('[data-i18n="CookiePreferences.Save"]');
                if (saveBtn && translations.CookiePreferences && translations.CookiePreferences.Save) {
                    saveBtn.textContent = translations.CookiePreferences.Save;
                }
            })
            .catch(error => console.error('Erreur de chargement des traductions:', error));
    }, 200);
}

// Exécuter la traduction au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    translateCookieElements();
    
    // Ajouter un écouteur d'événement pour le changement de langue
    const langSelector = document.getElementById('lang');
    if (langSelector) {
        langSelector.addEventListener('change', function() {
            translateCookieElements();
        });
    }
    
    // Ajouter un écouteur d'événement pour le bouton des préférences de cookies
    const preferencesBtn = document.getElementById('cookie-preferences');
    if (preferencesBtn) {
        preferencesBtn.addEventListener('click', function() {
            // Traduire après l'ouverture du modal
            setTimeout(translateCookieElements, 100);
        });
    }
    
    // Observer les changements dans le DOM pour détecter quand le banner de cookies est affiché
    const cookieBanner = document.getElementById('cookie-consent-banner');
    if (cookieBanner) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'style' && cookieBanner.style.display !== 'none') {
                    translateCookieElements();
                }
            });
        });
        
        observer.observe(cookieBanner, { attributes: true });
    }
}); 


// Preloader
$.holdReady( true );

$('body').imagesLoaded({ background: ".background-holder" }, function(){
    $('#preloader').removeClass("loading");
    $.holdReady( false );
    setTimeout(function() {
        $('#preloader').remove();
    }, 800);
});

// Zanimation
$(window).on('load', function(){
    $('*[data-inertia]').each(function(){
        $(this).inertia();
    });
});

var navbarfade = document.getElementById('navbarfade');
// navbarfade.style.backgroundColor = '#82828200';

// trigger this function every time the user scrolls
window.onscroll = function (event) {
    var scroll = window.pageYOffset;
    if (scroll < 200) {
        // green
        navbarfade.style.backgroundColor = '#82828200';
    } else if (scroll > 200) {
        // yellow
        navbarfade.style.backgroundColor = 'rgba(17, 17, 17, 0.9)';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    document.body.addEventListener('click', (e) => {
        const avatar = e.target.closest('img[alt][src][class*="rounded-full"]');
        if (avatar && avatar.closest('#auth-container-desktop, #auth-container-mobile')) {
            window.location.href = '/profil.html';
        }
    });
});

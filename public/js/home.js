// =========================================
// VOICEBRIDGE HOME JAVASCRIPT
// =========================================


// ================================
// MOBILE MENU
// ================================

const menuButton = document.getElementById("menuButton");
const mobileMenu = document.getElementById("mobileMenu");

if (menuButton && mobileMenu) {

    menuButton.addEventListener("click", () => {

        mobileMenu.classList.toggle("open");

    });


    // Close mobile menu after clicking a link

    const mobileLinks =
        mobileMenu.querySelectorAll("a");

    mobileLinks.forEach((link) => {

        link.addEventListener("click", () => {

            mobileMenu.classList.remove("open");

        });

    });

}


// ================================
// SCROLL REVEAL
// ================================

const revealElements =
    document.querySelectorAll(".reveal");


const revealObserver =
    new IntersectionObserver(
        (entries) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("visible");

                    revealObserver.unobserve(
                        entry.target
                    );

                }

            });

        },
        {
            threshold: 0.12
        }
    );


revealElements.forEach((element) => {

    revealObserver.observe(element);

});


// ================================
// MINI AUDIO PREVIEW
// ================================

const playButtons =
    document.querySelectorAll(".play-button");


playButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const isPlaying =
            button.dataset.playing === "true";


        if (isPlaying) {

            button.dataset.playing = "false";

            button.textContent = "▶";

            button.classList.remove("active");

        } else {

            button.dataset.playing = "true";

            button.textContent = "Ⅱ";

            button.classList.add("active");

        }

    });

});
// Utility Functions for LocalStorage
const getStoredUsers = () => {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
};

const setStoredUsers = (users) => {
    localStorage.setItem('users', JSON.stringify(users));
};

const getCurrentUser = () => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
};

const setCurrentUser = (user) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
};

const clearCurrentUser = () => {
    localStorage.removeItem('currentUser');
};

// --- AUTHENTICATION LOGIC ---

// Sign Up Function
const handleSignUp = (event) => {
    event.preventDefault(); // Prevent form submission

    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const messageContainer = document.getElementById('signup-message');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Basic Validation
    if (!name || !email || !password) {
        showMessage(messageContainer, 'All fields are required.', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage(messageContainer, 'Password must be at least 6 characters.', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage(messageContainer, 'Please enter a valid email.', 'error');
        return;
    }

    const users = getStoredUsers();

    // Check for duplicate email
    const userExists = users.some(user => user.email === email);
    if (userExists) {
        showMessage(messageContainer, 'Email is already registered.', 'error');
        return;
    }

    // Register User
    const newUser = { name, email, password };
    users.push(newUser);
    setStoredUsers(users);

    showMessage(messageContainer, 'Registration successful! You can now log in.', 'success');

    // Clear form
    nameInput.value = '';
    emailInput.value = '';
    passwordInput.value = '';
};

// Login Function
const handleLogin = (event) => {
    event.preventDefault();

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const messageContainer = document.getElementById('login-message');

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showMessage(messageContainer, 'Please enter email and password.', 'error');
        return;
    }

    const users = getStoredUsers();

    // Validate credentials
    const validUser = users.find(user => user.email === email && user.password === password);

    if (validUser) {
        setCurrentUser({ name: validUser.name, email: validUser.email });

        // Redirect to intended page or home
        const intendedPage = localStorage.getItem('intendedPage') || 'index.html';
        localStorage.removeItem('intendedPage'); // Clear after use
        window.location.href = intendedPage;
    } else {
        showMessage(messageContainer, 'Invalid email or password.', 'error');
    }
};

// Logout Function
const handleLogout = () => {
    clearCurrentUser();
    window.location.href = 'index.html';
};

// Utility to display messages
const showMessage = (container, text, type) => {
    if (!container) return;
    container.textContent = text;
    container.style.color = type === 'error' ? '#e50914' : '#16a34a'; // Red for error, green for success
    container.style.marginTop = '10px';
    container.style.fontSize = '0.9rem';
};

// --- ROUTE PROTECTION & NAVBAR UPDATE ---

// Protect specific routes
const protectRoute = () => {
    const protectedRoutes = ['feedback.html', 'watchlist.html']; // Add more protected pages here
    const currentPage = window.location.pathname.split('/').pop();

    if (protectedRoutes.includes(currentPage)) {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            // Store the page they wanted to visit
            localStorage.setItem('intendedPage', currentPage);
            // Redirect to login
            window.location.href = 'login.html';
        }
    }
};

// Update Navbar based on login state
const updateNavbar = () => {
    const navRight = document.querySelector('.nav-right');
    if (!navRight) return;

    const currentUser = getCurrentUser();

    if (currentUser) {
        // User is logged in
        navRight.innerHTML = `
            <div class="search-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input type="text" placeholder="Search movies, shows...">
            </div>
            <span style="color: #fff; font-size: 0.9rem; font-weight: 500; margin-right: 10px;">Welcome, ${currentUser.name}</span>
            <button class="nav-btn" id="logout-btn" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);">Logout</button>
            <div class="avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
        `;

        // Attach logout event listener
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    } else {
        // User is not logged in
        navRight.innerHTML = `
            <div class="search-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input type="text" placeholder="Search movies, shows...">
            </div>
            <a href="login.html" style="text-decoration: none; color: #fff; font-size: 0.9rem; font-weight: 500;">Login</a>
            <button class="nav-btn" onclick="window.location.href='signup.html'">Sign Up</button>
        `;
    }
};

// --- SEARCH LOGIC ---
let currentMovie = {}; // Global variable to store currently viewed movie

const moviesDB = [
    { title: "Shadowfall", desc: "A disgraced detective returns to her hometown after a string of impossible murders points to a killer she once put away.", rating: "⭐ 8.6", image: "https://i.ytimg.com/vi/iQQTA50W-R4/hq720.jpg" },
    { title: "Nexus Protocol", desc: "A brilliant hacker uncovers a global conspiracy embedded within the world's most advanced AI network.", rating: "⭐ 9.1", image: "https://m.media-amazon.com/images/M/MV5BMWI1NGRmNTctYTVkYS00MzVlLWEzZmYtOWMwYzI4NDdlODQ2XkEyXkFqcGc@._V1_.jpg" },
    { title: "Ocean's Deep", desc: "A team of researchers discovers an ancient civilization living at the bottom of the Mariana Trench.", rating: "⭐ 8.0", image: "https://www.defiant-ent.com/wp-content/uploads/DEF3034.jpg" },
    { title: "Blaze of Glory", desc: "A retired stuntman is forced back into action to save his kidnapped daughter from a ruthless cartel.", rating: "⭐ 7.9", image: "https://m.media-amazon.com/images/M/MV5BMjYwYjVlOGYtZDkxNi00NDk3LWJjNmEtN2ZiMGMyNGZiMWE3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg" },
    { title: "Void Walker", desc: "An astronaut gets trapped in a parallel dimension and must find her way back before her oxygen runs out.", rating: "⭐ 8.3", image: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1739386039i/222139730.jpg" },
    { title: "Eden's Last Garden", desc: "In a post-apocalyptic world, a lone survivor protects the last patch of fertile land from scavengers.", rating: "⭐ 7.9", image: "https://i.ytimg.com/vi/SQ__13rhAJs/sddefault.jpg" },
    { title: "Desert Kings", desc: "Two rival tribes clash over control of a newly discovered oasis in the heart of the Sahara.", rating: "⭐ 7.7", image: "https://m.media-amazon.com/images/M/MV5BNDA3ZmI2YzEtYjgxOC00ZjhhLTk4NjMtOGZiYWI4ZmM1NWNlXkEyXkFqcGc@._V1_QL75_UY281_CR11,0,190,281_.jpg" },
    { title: "Nova Station", desc: "A detective investigates a series of murders on a space station orbiting a black hole.", rating: "⭐ 8.5", image: "https://resizing.flixster.com/OuV7khuiMzOpFi9dj-mliWyABcU=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzLzc0ZGMxZTJkLTM3MjItNGM3ZS1hYjlhLWU3ZjBhZmY0OTJiYy5qcGc=" },
    { title: "Inferno Rising", desc: "A team of firefighters battles a massive blaze that threatens to destroy an entire city.", rating: "⭐ 8.7", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfF_evHwdV3qo7_RADa1djanmmUOz9BLvhfQ&s" },
    { title: "The Hollow", desc: "A group of teens uncovers a dark secret hidden in the woods behind their town.", rating: "⭐ 8.4", image: "https://m.media-amazon.com/images/M/MV5BMjMwNDI3MTk2MF5BMl5BanBnXkFtZTgwMzAwMjAxNzE@._V1_.jpg" },
    { title: "Blood Moon Rising", desc: "A werewolf hunter must protect a small village during a rare blood moon eclipse.", rating: "⭐ 7.8", image: "https://m.media-amazon.com/images/M/MV5BZjJmYmJlODAtN2I2Yy00YzQ1LTg5MzAtNWU4MGYyZWY1ZTMzXkEyXkFqcGc@._V1_.jpg" },
    { title: "Deep Fear", desc: "A deep-sea dive goes terribly wrong when the crew encounters an unknown predator.", rating: "⭐ 8.0", image: "https://images.justwatch.com/poster/309418706/s718/deep-fear-2023.jpg" },
    { title: "Happy Chaos", desc: "A comedy of errors unfolds when two identical strangers accidentally swap briefcases.", rating: "⭐ 8.2", image: "https://universus.cards/cards/ggs01/002.jpg" }
];

const allTitles = [
    "Animal", "Anupamaa", "Avengers: Endgame", "Baahubali 2", "Bade Achhe Lagte", "Barbie", "Barrister Babu", "Bhabiji Ghar Par Hai", "Bigg Boss 17", "Blaze of Glory", "Blood Moon Rising", "Brooklyn Nine-Nine", "Bumrah's Hat-trick vs SA", "Coastal Legends", "Cursed Manor", "Dance India Dance", "Date Night Disaster", "DDLJ", "Deep Fear", "Delta Force X", "Desert Kings", "Dune: Part One", "Dune: Part Two", "Eden's Last Garden", "Family Time", "FIR", "Gadar 2", "Ghum Hai Kisikey", "Grand Budapest Hotel", "Guardians Vol. 3", "Happu Ki Ultan Paltan", "Happy Chaos", "Haunting of Hill House", "Hereditary", "Imlie", "Inception", "IND vs PAK - Full Match", "Indian Idol 14", "Interstellar", "IPL 2025 - Best Catches", "Iron Siege", "Ishq Mein Marjawan", "Jawan", "Jhalak Dikhla Ja", "John Wick: Chapter 4", "Kabir Singh", "Kalki 2898 AD", "Kantara", "KBC Season 15", "KGF: Chapter 2", "Kundali Bhagya", "Letters Home", "M3GAN", "Maddam Sir", "Meet - Badlegi", "Molkki", "Monsoon Madness", "Monsoon Season", "Naagin 6", "Night Shift", "Nova Station", "Ocean's Deep", "Office Wars", "Oppenheimer", "Parasite", "Pathaan", "Phantom Room", "Pushpa 2", "Pushpa 2: The Rule", "Pushpa: The Rise", "Rohit's 150 vs Australia", "Rookie Cops", "RRR", "Sa Re Ga Ma Pa", "Sasural Simar Ka", "Shark Tank India", "Smile", "Storm Rider", "Stranger Things", "Stree 2", "Superbad", "T20 World Cup Final 2024", "Taarak Mehta", "Taarak Mehta Ka Ooltah Chashmah", "Tenali Rama", "The Batman", "The Conjuring", "The Godfather", "The Hollow", "The Kapil Sharma Show", "The Last of Us", "The Office", "The Squad", "Tide and Time", "Tiger 3", "Top 10 Sixes of 2024", "Top Gun: Maverick", "Udaariyaan", "Vikram", "Virat's 50th ODI Century", "Void Walker", "Wednesday", "Whisper in the Dark", "Yeh Hai Chahatein", "Yeh Rishta Kya"
];

const getImageUrl = (title) => {
    if(title.includes("vs") || title.includes("Cup") || title.includes("IPL") || title.includes("Century") || title.includes("Sixes") || title.includes("Hat-trick")) 
        return "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80"; // Sports Theme
    if(title.includes("Boss") || title.includes("Idol") || title.includes("Show") || title.includes("Dance") || title.includes("Tank")) 
        return "https://images.unsplash.com/photo-1603739903239-8b6e64c3b185?auto=format&fit=crop&w=400&q=80"; // Reality TV
    if(title.includes("Hai") || title.includes("Mein") || title.includes("Ki") || title.includes("Ka")) 
        return "https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?auto=format&fit=crop&w=400&q=80"; // TV Soaps
    return "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80"; // Movies Default
};

allTitles.forEach(title => {
    if (!moviesDB.find(m => m.title === title)) {
        moviesDB.push({
            title: title,
            desc: "Watch " + title + " and enjoy the ultimate entertainment experience on StreamVerse.",
            rating: "⭐ " + (Math.random() * (9.5 - 7.5) + 7.5).toFixed(1),
            image: getImageUrl(title)
        });
    }
});

const openGlobalInfoModal = (movie) => {
    currentMovie = movie;
    document.getElementById('info-title').innerText = movie.title;
    document.getElementById('info-desc').innerText = movie.desc;
    document.getElementById('info-rating').innerText = movie.rating;
    document.getElementById('info-modal').style.display = 'flex';
};

const initSearch = () => {
    document.addEventListener('input', (e) => {
        if (e.target.matches('.search-box input')) {
            const query = e.target.value.toLowerCase().trim();
            const searchBox = e.target.closest('.search-box');
            let resultsContainer = searchBox.querySelector('.search-results-dropdown');
            
            if (!resultsContainer) {
                resultsContainer = document.createElement('div');
                resultsContainer.className = 'search-results-dropdown';
                resultsContainer.style.cssText = 'position:absolute; top:110%; left:0; right:0; background:#1a1a24; border:1px solid rgba(255,255,255,0.1); border-radius:8px; max-height:350px; overflow-y:auto; z-index:1000; box-shadow:0 10px 30px rgba(0,0,0,0.8); display:none; flex-direction:column; min-width:260px;';
                searchBox.style.position = 'relative';
                searchBox.appendChild(resultsContainer);
            }

            if (query.length < 2) {
                resultsContainer.style.display = 'none';
                return;
            }

            const matches = moviesDB.filter(m => m.title.toLowerCase().includes(query));
            
            if (matches.length > 0) {
                resultsContainer.innerHTML = matches.map(movie => `
                    <div class="search-result-item" style="display:flex; gap:12px; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer; transition:background 0.2s;" data-title="${movie.title.replace(/"/g, '&quot;')}">
                        <img src="${movie.image}" style="width:40px; height:56px; object-fit:cover; border-radius:4px;">
                        <div style="flex:1;">
                            <div style="font-weight:600; font-size:0.9rem; margin-bottom:4px; color:#fff;">${movie.title}</div>
                            <div style="font-size:0.75rem; color:var(--gold);">${movie.rating}</div>
                        </div>
                    </div>
                `).join('');
                resultsContainer.style.display = 'flex';
                
                // Add click events for items
                resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
                    item.addEventListener('mouseenter', () => item.style.background = 'rgba(255,255,255,0.1)');
                    item.addEventListener('mouseleave', () => item.style.background = 'transparent');
                    item.addEventListener('click', () => {
                        const movieTitle = item.getAttribute('data-title');
                        const movie = moviesDB.find(m => m.title === movieTitle);
                        if (movie) {
                            openGlobalInfoModal(movie);
                            resultsContainer.style.display = 'none';
                            e.target.value = ''; // clear input
                        }
                    });
                });
            } else {
                resultsContainer.innerHTML = '<div style="padding:16px; text-align:center; color:#888; font-size:0.85rem;">No movies found.</div>';
                resultsContainer.style.display = 'flex';
            }
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            document.querySelectorAll('.search-results-dropdown').forEach(el => el.style.display = 'none');
        }
    });
};

// --- MODALS FOR PLAY & INFO ---

const initModals = () => {
    // 1. Video Modal HTML
    const videoModalHTML = `
        <div id="video-modal" style="display:none; position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.95); justify-content:center; align-items:center; backdrop-filter:blur(10px);">
            <div style="position:relative; width:90%; max-width:1000px; aspect-ratio:16/9; background:#000; border-radius:12px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.8); border:1px solid rgba(255,255,255,0.1);">
                <button id="close-video" style="position:absolute; top:20px; right:20px; background:rgba(255,255,255,0.1); border:none; color:#fff; width:40px; height:40px; border-radius:50%; font-size:1.2rem; cursor:pointer; z-index:10; display:flex; justify-content:center; align-items:center; transition:background 0.2s, transform 0.2s;">✕</button>
                <iframe id="video-frame" width="100%" height="100%" src="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
        </div>
    `;

    // 2. Info Modal HTML
    const infoModalHTML = `
        <div id="info-modal" style="display:none; position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.85); justify-content:center; align-items:center; backdrop-filter: blur(8px);">
            <div style="background:#14141d; width:90%; max-width:650px; border-radius:16px; border:1px solid rgba(255,255,255,0.1); padding:40px; position:relative; box-shadow:0 20px 60px rgba(0,0,0,0.8);">
                <button id="close-info" style="position:absolute; top:20px; right:20px; background:none; border:none; color:#bbb; font-size:1.5rem; cursor:pointer; transition:color 0.2s;">✕</button>
                <h2 id="info-title" style="font-size:2.5rem; font-family:'Bebas Neue', sans-serif; letter-spacing:2px; margin-bottom:12px; color:#fff;">Movie Title</h2>
                <div style="display:flex; gap:15px; font-size:0.9rem; color:#aaa; margin-bottom:24px; font-weight:500;">
                    <span id="info-year">2025</span>
                    <span id="info-rating" style="color:var(--gold);">⭐ 8.5</span>
                    <span style="border:1px solid rgba(255,255,255,0.2); padding:2px 6px; border-radius:4px; font-size:0.75rem;">HD</span>
                </div>
                <p id="info-desc" style="color:#ccc; line-height:1.7; font-size:1rem; margin-bottom:30px;">Description goes here.</p>
                <div style="display:flex; gap:16px;">
                    <button id="info-play-btn" style="background:var(--accent); color:#fff; border:none; padding:14px 32px; border-radius:8px; font-weight:700; cursor:pointer; font-size:1rem; font-family:'Outfit', sans-serif; transition:transform 0.2s, box-shadow 0.2s; display:flex; align-items:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 3l14 9-14 9V3z" fill="#fff"/></svg> Play Now
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', videoModalHTML + infoModalHTML);

    const videoModal = document.getElementById('video-modal');
    const closeVideoBtn = document.getElementById('close-video');
    const iframe = document.getElementById('video-frame');

    const infoModal = document.getElementById('info-modal');
    const closeInfoBtn = document.getElementById('close-info');
    const infoPlayBtn = document.getElementById('info-play-btn');

    // Video Functions
    const openVideo = (videoUrl) => {
        if (!getCurrentUser()) {
            localStorage.setItem('intendedPage', window.location.pathname.split('/').pop());
            window.location.href = 'login.html';
            return;
        }
        iframe.src = videoUrl + "?autoplay=1&controls=1&rel=0";
        videoModal.style.display = 'flex';
    };

    closeVideoBtn.addEventListener('click', () => {
        videoModal.style.display = 'none';
        iframe.src = '';
    });

    closeVideoBtn.addEventListener('mouseover', () => closeVideoBtn.style.transform = 'scale(1.1)');
    closeVideoBtn.addEventListener('mouseout', () => closeVideoBtn.style.transform = 'scale(1)');

    // Play Buttons
    document.querySelectorAll('.btn-play, .card-play-btn, .promo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openVideo('https://www.youtube.com/embed/GV3HUDMQ-F8'); // Example trailer
        });
    });

    // Info Functions
    closeInfoBtn.addEventListener('click', () => {
        infoModal.style.display = 'none';
    });

    closeInfoBtn.addEventListener('mouseover', () => closeInfoBtn.style.color = '#fff');
    closeInfoBtn.addEventListener('mouseout', () => closeInfoBtn.style.color = '#bbb');

    infoPlayBtn.addEventListener('click', () => {
        infoModal.style.display = 'none';
        openVideo('https://www.youtube.com/embed/GV3HUDMQ-F8');
    });

    // Info Buttons
    document.querySelectorAll('.btn-info').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            let title = "Shadowfall";
            let desc = "A disgraced detective returns to her hometown after a string of impossible murders points to a killer she once put away — who has been in prison for fifteen years.";
            let rating = "⭐ 8.6";

            const heroContent = btn.closest('.hero-content');
            if (heroContent) {
                const titleEl = heroContent.querySelector('.hero-title');
                if (titleEl) title = titleEl.innerText;
                const descEl = heroContent.querySelector('.hero-desc');
                if (descEl) desc = descEl.innerText;
                const ratingEl = heroContent.querySelector('.rating-badge');
                if (ratingEl) rating = ratingEl.innerText;
            }

            document.getElementById('info-title').innerText = title;
            document.getElementById('info-desc').innerText = desc;
            document.getElementById('info-rating').innerText = rating;

            infoModal.style.display = 'flex';
        });
    });
};

// --- INITIALIZATION ---
// Run these when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    protectRoute();
    updateNavbar();
    initModals();
    initSearch();

    // Attach form event listeners if the elements exist on the current page
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignUp);
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

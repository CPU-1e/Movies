const TMDB_API_KEY = '9f4143ead87e9955cfc58e4cbab49144';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const state = {
    currentType: 'movie',
    currentCategory: 'popular',
    currentPage: 1,
    totalPages: 1,
    movies: [],
    isLoading: false,
    currentMovie: null,
    currentSeason: 1,
    currentEpisode: 1,
    tvSeasons: []
};

const elements = {};

function getEl(id) {
    return document.getElementById(id);
}

function initElements() {
    elements.homeView = getEl('homeView');
    elements.movieDetailView = getEl('movieDetailView');
    elements.hero = getEl('hero');
    elements.heroTitle = getEl('heroTitle');
    elements.heroOverview = getEl('heroOverview');
    elements.heroRating = getEl('heroRating');
    elements.heroYear = getEl('heroYear');
    elements.heroPlayBtn = getEl('heroPlayBtn');
    elements.heroDetailsBtn = getEl('heroDetailsBtn');
    elements.sectionTitle = getEl('sectionTitle');
    elements.moviesGrid = getEl('moviesGrid');
    elements.loading = getEl('loading');
    elements.loadMoreBtn = getEl('loadMoreBtn');
    elements.loadMore = getEl('loadMore');
    elements.searchInput = getEl('searchInput');
    elements.searchBtn = getEl('searchBtn');
    elements.detailHero = getEl('detailHero');
    elements.detailTitle = getEl('detailTitle');
    elements.detailRating = getEl('detailRating');
    elements.detailYear = getEl('detailYear');
    elements.detailRuntime = getEl('detailRuntime');
    elements.detailOverview = getEl('detailOverview');
    elements.detailGenres = getEl('detailGenres');
    elements.detailPlayBtn = getEl('detailPlayBtn');
    elements.similarMoviesGrid = getEl('similarMoviesGrid');
    elements.playerModal = getEl('playerModal');
    elements.playerClose = getEl('playerClose');
    elements.playerFrame = getEl('playerFrame');
    elements.playerTitle = getEl('playerTitle');
    elements.playerControls = getEl('playerControls');
    elements.seasonSelect = getEl('seasonSelect');
    elements.episodeSelect = getEl('episodeSelect');
    elements.episodeControls = getEl('episodeControls');
    elements.mobileMenuBtn = getEl('mobileMenuBtn');
}

async function fetchFromTMDB(endpoint, params = {}) {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('TMDB Error:', error.message);
        return null;
    }
}

function getBackdropUrl(path, size = 'w1280') {
    return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : '';
}

function getPosterUrl(path, size = 'w500') {
    return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : '';
}

async function getImdbId(tmdbId) {
    if (state.currentType === 'tv') return null;
    const data = await fetchFromTMDB(`/movie/${tmdbId}`);
    return data ? data.imdb_id : null;
}

function renderHero(movie) {
    if (!movie) return;
    var backdrop = getBackdropUrl(movie.backdrop_path);
    if (backdrop) {
        elements.hero.style.backgroundImage = `url(${backdrop})`;
    }
    var title = state.currentType === 'tv' ? (movie.name || '') : (movie.title || '');
    var dateStr = state.currentType === 'tv' ? movie.first_air_date : movie.release_date;
    elements.heroTitle.textContent = title;
    elements.heroOverview.textContent = movie.overview || '';
    elements.heroRating.innerHTML = movie.vote_average ? `&#9733; ${movie.vote_average.toFixed(1)}` : '';
    elements.heroYear.textContent = dateStr ? dateStr.split('-')[0] : '';

    elements.heroPlayBtn.onclick = function() {
        if (state.currentType === 'tv') {
            playTvShow(movie, 1, 1);
            loadTvSeasons(movie);
        } else {
            playMovie(movie);
        }
    };
    elements.heroDetailsBtn.onclick = function() { openMovieDetail(movie); };
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('data-movie-id', movie.id);

    card.addEventListener('click', function() {
        var savedType = state.currentType;
        if (movie._type) state.currentType = movie._type;
        openMovieDetail(movie);
        state.currentType = savedType;
    });

    var posterUrl = getPosterUrl(movie.poster_path);
    var title = state.currentType === 'tv' ? (movie.name || 'Untitled') : (movie.title || 'Untitled');
    var dateStr = state.currentType === 'tv' ? movie.first_air_date : movie.release_date;
    var year = dateStr ? dateStr.split('-')[0] : 'N/A';
    var rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    var imgSrc = posterUrl || 'https://via.placeholder.com/300x450/1a1a25/ffffff?text=No+Poster';

    const poster = document.createElement('div');
    poster.className = 'movie-poster';

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = movie.title || '';
    img.loading = 'lazy';
    img.onerror = function() { this.src = 'https://via.placeholder.com/300x450/1a1a25/ffffff?text=No+Poster'; };

    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'movie-rating';
    ratingDiv.innerHTML = '&#9733; ' + rating;

    const overlay = document.createElement('div');
    overlay.className = 'movie-poster-overlay';

    const playBtn = document.createElement('button');
    playBtn.className = 'btn-play';
    playBtn.innerHTML = '&#9654; Play';
    playBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var itemType = movie._type || state.currentType;
        if (itemType === 'tv') {
            playTvShow(movie, 1, 1);
            loadTvSeasons(movie);
        } else {
            playMovie(movie);
        }
    });

    overlay.appendChild(playBtn);
    poster.appendChild(img);
    poster.appendChild(ratingDiv);
    poster.appendChild(overlay);

    const info = document.createElement('div');
    info.className = 'movie-info';

    const titleEl = document.createElement('h3');
    titleEl.className = 'movie-title';
    titleEl.textContent = title;

    const yearP = document.createElement('p');
    yearP.className = 'movie-year';
    yearP.textContent = year;

    const quality = document.createElement('span');
    quality.className = 'movie-quality';
    quality.textContent = 'HD 1080p';

    info.appendChild(titleEl);
    info.appendChild(yearP);
    info.appendChild(quality);

    card.appendChild(poster);
    card.appendChild(info);

    return card;
}

function renderMovies(movies, append) {
    if (!append) {
        elements.moviesGrid.innerHTML = '';
    }
    if (!movies || movies.length === 0) return;
    movies.forEach(function(movie) {
        var card = createMovieCard(movie);
        elements.moviesGrid.appendChild(card);
    });
}

function updateSectionTitle(category, type) {
    type = type || 'movie';
    var movieTitles = {
        popular: 'Popular Movies',
        top_rated: 'Top Rated Movies',
        upcoming: 'Upcoming Movies',
        now_playing: 'Now Playing'
    };
    var tvTitles = {
        popular: 'Popular TV Shows',
        top_rated: 'Top Rated TV Shows',
        on_the_air: 'On The Air',
        airing_today: 'Airing Today'
    };
    var titles = type === 'tv' ? tvTitles : movieTitles;
    elements.sectionTitle.textContent = titles[category] || (type === 'tv' ? 'TV Shows' : 'Movies');
}

async function loadMovies(category, page, append) {
    page = page || 1;
    append = append || false;
    if (state.isLoading) return;
    state.isLoading = true;
    elements.loading.classList.add('active');

    var endpoint = '/' + state.currentType + '/' + category;
    var data = await fetchFromTMDB(endpoint, {
        page: page,
        language: 'en-US'
    });

    if (data && data.results) {
        state.totalPages = data.total_pages;
        if (append) {
            state.movies = state.movies.concat(data.results);
        } else {
            state.movies = data.results;
        }
        renderMovies(data.results, append);
        if (page === 1 && data.results.length > 0) {
            var randomIndex = Math.floor(Math.random() * Math.min(5, data.results.length));
            renderHero(data.results[randomIndex]);
        }
        elements.loadMore.style.display = page < data.total_pages ? 'block' : 'none';
    } else {
        console.error('No data returned from API');
    }
    state.isLoading = false;
    elements.loading.classList.remove('active');
}

async function searchMovies(query) {
    if (!query || !query.trim()) {
        loadMovies(state.currentCategory);
        return;
    }
    state.isLoading = true;
    elements.loading.classList.add('active');
    elements.sectionTitle.textContent = 'Search: "' + query + '"';

    var movieData = await fetchFromTMDB('/search/movie', {
        query: query,
        page: 1,
        include_adult: false
    });

    var tvData = await fetchFromTMDB('/search/tv', {
        query: query,
        page: 1,
        include_adult: false
    });

    var combined = [];
    if (movieData && movieData.results) {
        movieData.results.forEach(function(m) { m._type = 'movie'; combined.push(m); });
    }
    if (tvData && tvData.results) {
        tvData.results.forEach(function(t) { t._type = 'tv'; combined.push(t); });
    }

    combined.sort(function(a, b) { return (b.vote_average || 0) - (a.vote_average || 0); });

    if (combined.length > 0) {
        state.movies = combined;
        elements.moviesGrid.innerHTML = '';
        combined.forEach(function(item) {
            var savedType = state.currentType;
            if (item._type) state.currentType = item._type;
            elements.moviesGrid.appendChild(createMovieCard(item));
            state.currentType = savedType;
        });
        elements.loadMore.style.display = 'none';
    }
    state.isLoading = false;
    elements.loading.classList.remove('active');
}

var providers = [
    { name: 'Server 1', getUrl: function(imdbId, tmdbId) { return 'https://vidfast.pro/movie/' + imdbId; } },
    { name: 'Server 2', getUrl: function(imdbId, tmdbId) { return 'https://1embed.cc/embed/movie/' + tmdbId; } }
];

var tvProviders = [
    { name: 'Server 1', getUrl: function(imdbId, tmdbId, season, episode) { return 'https://vidfast.pro/tv/' + tmdbId + '/' + season + '/' + episode; } },
    { name: 'Server 2', getUrl: function(imdbId, tmdbId, season, episode) { return 'https://1embed.cc/embed/tv/' + tmdbId + '/' + season + '/' + episode; } }
];
var currentProviderIndex = 0;

async function playMovie(movie) {
    if (!movie) return;
    state.currentMovie = movie;

    var imdbId = await getImdbId(movie.id);
    elements.playerTitle.textContent = movie.title || 'Movie';
    elements.episodeControls.style.display = 'none';

    state.currentMovieImdbId = imdbId;
    currentProviderIndex = 0;

    var url = providers[0].getUrl(imdbId, movie.id);
    elements.playerFrame.src = url;

    updateServerButtons();

    elements.playerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function playTvShow(show, season, episode) {
    if (!show) return;
    state.currentMovie = show;
    state.currentSeason = season || 1;
    state.currentEpisode = episode || 1;

    var imdbId = await getImdbId(show.id);
    elements.playerTitle.textContent = show.name || 'TV Show';

    state.currentMovieImdbId = imdbId;
    state.currentType = 'tv';
    currentProviderIndex = 0;

    var url = tvProviders[0].getUrl(imdbId, show.id, state.currentSeason, state.currentEpisode);
    elements.playerFrame.src = url;

    updateServerButtons();
    elements.episodeControls.style.display = 'flex';

    elements.playerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function loadTvSeasons(show) {
    var data = await fetchFromTMDB('/tv/' + show.id);
    if (data && data.seasons) {
        state.tvSeasons = data.seasons.filter(function(s) { return s.season_number > 0; });
        elements.seasonSelect.innerHTML = '';
        state.tvSeasons.forEach(function(s) {
            var opt = document.createElement('option');
            opt.value = s.season_number;
            opt.textContent = 'Season ' + s.season_number;
            elements.seasonSelect.appendChild(opt);
        });
        elements.seasonSelect.value = state.currentSeason;
        await loadTvEpisodes(show.id, state.currentSeason);
    }
}

async function loadTvEpisodes(showId, season) {
    var data = await fetchFromTMDB('/tv/' + showId + '/season/' + season);
    elements.episodeSelect.innerHTML = '';
    if (data && data.episodes) {
        data.episodes.forEach(function(ep) {
            var opt = document.createElement('option');
            opt.value = ep.episode_number;
            opt.textContent = 'E' + ep.episode_number + ' - ' + (ep.name || 'Episode ' + ep.episode_number);
            elements.episodeSelect.appendChild(opt);
        });
        elements.episodeSelect.value = state.currentEpisode;
    }
}

async function downloadMovie(movie) {
    return;
}

function tryNextProvider() {
    currentProviderIndex++;
    var activeProviders = state.currentType === 'tv' ? tvProviders : providers;
    if (currentProviderIndex >= activeProviders.length) {
        currentProviderIndex = 0;
    }
    var movie = state.currentMovie;
    if (!movie) return;
    var url = activeProviders[currentProviderIndex].getUrl(state.currentMovieImdbId, movie.id, state.currentSeason, state.currentEpisode);
    elements.playerFrame.src = url;
    updateServerButtons();
}

function switchServer(index) {
    var movie = state.currentMovie;
    if (!movie) return;
    currentProviderIndex = index;
    var activeProviders = state.currentType === 'tv' ? tvProviders : providers;
    var url = activeProviders[index].getUrl(state.currentMovieImdbId, movie.id, state.currentSeason, state.currentEpisode);
    elements.playerFrame.src = url;
    updateServerButtons();
}

function updateServerButtons() {
    var controls = elements.playerControls;
    controls.innerHTML = '';
    var activeProviders = state.currentType === 'tv' ? tvProviders : providers;
    for (var i = 0; i < activeProviders.length; i++) {
        (function(index) {
            var btn = document.createElement('button');
            btn.className = 'source-btn' + (index === currentProviderIndex ? ' active' : '');
            btn.textContent = activeProviders[index].name;
            btn.addEventListener('click', function() { switchServer(index); });
            controls.appendChild(btn);
        })(i);
    }
    var closeBtn = document.createElement('button');
    closeBtn.className = 'player-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closePlayer);
    controls.appendChild(closeBtn);
}

function closePlayer() {
    elements.playerFrame.src = '';
    elements.playerModal.classList.remove('active');
    document.body.style.overflow = '';
    state.currentType = 'movie';
}

function goHome() {
    elements.homeView.style.display = '';
    elements.movieDetailView.style.display = 'none';
    window.scrollTo(0, 0);
}

async function openMovieDetail(movie) {
    state.currentMovie = movie;
    window.scrollTo(0, 0);

    elements.homeView.style.display = 'none';
    elements.movieDetailView.style.display = '';

    var backdrop = getBackdropUrl(movie.backdrop_path);
    if (backdrop) {
        elements.detailHero.style.backgroundImage = 'url(' + backdrop + ')';
    }
    elements.detailTitle.textContent = state.currentType === 'tv' ? (movie.name || '') : (movie.title || '');
    elements.detailRating.innerHTML = movie.vote_average ? '&#9733; ' + movie.vote_average.toFixed(1) : '';
    var dateStr = state.currentType === 'tv' ? movie.first_air_date : movie.release_date;
    elements.detailYear.textContent = dateStr ? dateStr.split('-')[0] : '';
    elements.detailRuntime.textContent = movie.runtime ? movie.runtime + ' min' : '';
    elements.detailOverview.textContent = movie.overview || 'No description available.';

    elements.detailGenres.innerHTML = '';
    if (movie.genre_ids) {
        movie.genre_ids.forEach(function(genreId) {
            var tag = document.createElement('span');
            tag.className = 'genre-tag';
            tag.textContent = getGenreName(genreId);
            elements.detailGenres.appendChild(tag);
        });
    }

    elements.detailPlayBtn.onclick = function() {
        if (state.currentType === 'tv') {
            playTvShow(movie, 1, 1);
            loadTvSeasons(movie);
        } else {
            playMovie(movie);
        }
    };

    var similarEndpoint = state.currentType === 'tv' ? '/tv/' + movie.id + '/similar' : '/movie/' + movie.id + '/similar';
    var similarData = await fetchFromTMDB(similarEndpoint, { page: 1 });
    elements.similarMoviesGrid.innerHTML = '';
    if (similarData && similarData.results) {
        similarData.results.slice(0, 12).forEach(function(m) {
            elements.similarMoviesGrid.appendChild(createMovieCard(m));
        });
    }
}

var genres = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
    80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
    14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
    9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
    53: 'Thriller', 10752: 'War', 37: 'Western'
};

function getGenreName(id) {
    return genres[id] || 'Unknown';
}

function initEventListeners() {
    var navLinks = document.querySelectorAll('.nav-link');
    for (var i = 0; i < navLinks.length; i++) {
        (function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var category = link.getAttribute('data-category');
                var type = link.getAttribute('data-type') || 'movie';
                state.currentType = type;
                state.currentCategory = category;
                state.currentPage = 1;
                var allLinks = document.querySelectorAll('.nav-link');
                for (var j = 0; j < allLinks.length; j++) {
                    allLinks[j].classList.remove('active');
                }
                link.classList.add('active');
                updateSectionTitle(category, type);
                goHome();
                loadMovies(category);
            });
        })(navLinks[i]);
    }

    elements.searchBtn.addEventListener('click', function() {
        searchMovies(elements.searchInput.value);
    });
    elements.searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchMovies(elements.searchInput.value);
    });

    elements.loadMoreBtn.addEventListener('click', function() {
        state.currentPage++;
        loadMovies(state.currentCategory, state.currentPage, true);
    });

    elements.seasonSelect.addEventListener('change', function() {
        state.currentSeason = parseInt(elements.seasonSelect.value);
        state.currentEpisode = 1;
        if (state.currentMovie) {
            loadTvEpisodes(state.currentMovie.id, state.currentSeason);
            var url = tvProviders[currentProviderIndex].getUrl(state.currentMovieImdbId, state.currentMovie.id, state.currentSeason, state.currentEpisode);
            elements.playerFrame.src = url;
        }
    });

    elements.episodeSelect.addEventListener('change', function() {
        state.currentEpisode = parseInt(elements.episodeSelect.value);
        if (state.currentMovie) {
            var url = tvProviders[currentProviderIndex].getUrl(state.currentMovieImdbId, state.currentMovie.id, state.currentSeason, state.currentEpisode);
            elements.playerFrame.src = url;
        }
    });

    elements.playerFrame.addEventListener('load', function() {
        try {
            var loc = elements.playerFrame.contentWindow.location.href;
            if (loc === 'about:blank' || loc === '') {
                tryNextProvider();
            }
        } catch(e) {}
    });

    elements.playerClose.addEventListener('click', closePlayer);
    elements.playerModal.addEventListener('click', function(e) {
        if (e.target === elements.playerModal) closePlayer();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (elements.playerModal.classList.contains('active')) {
                closePlayer();
            } else if (elements.movieDetailView.style.display !== 'none') {
                goHome();
            }
        }
    });

    elements.mobileMenuBtn.addEventListener('click', function() {
        var nav = document.getElementById('mainNav');
        nav.classList.toggle('mobile-open');
    });
}

function init() {
    console.log('Initializing Movies...');
    initElements();
    initEventListeners();
    initAdBlocker();
    checkUblock();
    loadMovies('popular');
}

function initAdBlocker() {
    var origWindowOpen = window.open;
    window.open = function(url) {
        if (url && typeof url === 'string') {
            var allowed = ['2embed.cc', 'tmdb.org', 'vidfast.pro', 'vidlink.pro', '1embed.cc', 'multiembed.mov'];
            for (var i = 0; i < allowed.length; i++) {
                if (url.indexOf(allowed[i]) !== -1) return origWindowOpen.apply(this, arguments);
            }
        }
        return null;
    };

    var adDomains = ['doubleclick.net','googlesyndication.com','googleadservices.com','adnxs.com','adsrvr.org','facebook.net','amazon-adsystem.com','criteo.com','taboola.com','outbrain.com','moatads.com','adskeeper.com','propellerads.com','popcash.net','popads.net','exoclick.com','juicyads.com','coinhive.com','crypto-loot.com'];

    function isAdUrl(url) {
        if (!url) return false;
        var lower = url.toLowerCase();
        for (var i = 0; i < adDomains.length; i++) {
            if (lower.indexOf(adDomains[i]) !== -1) return true;
        }
        return false;
    }

    function isAdEl(el) {
        if (!el || el.nodeType !== 1) return false;
        var tag = el.tagName;
        if (tag === 'ADS' || tag === 'AD' || tag === 'ADVERTISEMENT') return true;
        if (tag === 'INS') return true;
        var id = el.id || '';
        var cls = typeof el.className === 'string' ? el.className : '';
        if ((id + cls).match(/ad[s]?[-_\s]|advert|popup|interstitial|preroll/i)) return true;
        return false;
    }

    document.addEventListener('click', function(e) {
        var el = e.target;
        while (el && el !== document) {
            if (el.tagName === 'A' && el.target === '_blank' && !el.closest('.movies-grid, .detail-buttons, .hero-buttons, .nav, .search-container, .player-controls, #playerFrame')) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            el = el.parentNode;
        }
    }, true);

    var origFetch = window.fetch;
    window.fetch = function() {
        var url = arguments[0];
        if (typeof url === 'string' && isAdUrl(url)) {
            return Promise.resolve(new Response('', { status: 200 }));
        }
        return origFetch.apply(this, arguments);
    };

    var origXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        if (typeof url === 'string' && isAdUrl(url)) { this._blocked = true; return; }
        return origXHROpen.apply(this, arguments);
    };
    var origXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function() {
        if (this._blocked) return;
        return origXHRSend.apply(this, arguments);
    };

    var playerFrame = null;
    var adObserver = new MutationObserver(function(mutations) {
        if (!playerFrame) playerFrame = document.getElementById('playerFrame');
        for (var m = 0; m < mutations.length; m++) {
            var nodes = mutations[m].addedNodes;
            for (var n = 0; n < nodes.length; n++) {
                var node = nodes[n];
                if (node.nodeType !== 1) continue;
                if (node === playerFrame) continue;
                if (node.tagName === 'IFRAME' || node.tagName === 'SCRIPT' || isAdEl(node)) {
                    node.remove();
                }
            }
        }
    });
    adObserver.observe(document.body, { childList: true });

    var s = document.createElement('style');
    s.textContent = 'ins.adsbygoogle,.adsbygoogle,.ad-slot,.ad-unit,.ad-container,.ad-wrapper,.ad-banner,.ad-box,[id*="google_ads"],[class*="google_ads"],[id*="taboola"],[class*="taboola"],[id*="outbrain"],[class*="outbrain"],.video-ads,.sponsored,.promo,.promotion{display:none!important;pointer-events:none!important;height:0!important;width:0!important}';
    document.head.appendChild(s);
}

function detectBrowser() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Firefox') !== -1 && ua.indexOf('Seamonkey') === -1) return 'firefox';
    if (ua.indexOf('Edg') !== -1) return 'edge';
    if (ua.indexOf('OPR') !== -1 || ua.indexOf('Opera') !== -1) return 'opera';
    if (ua.indexOf('Brave') !== -1) return 'brave';
    if (ua.indexOf('Vivaldi') !== -1) return 'vivaldi';
    if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Edg') === -1) return 'chrome';
    if (ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1) return 'safari';
    return 'unknown';
}

function getUblockUrl(browser) {
    var urls = {
        chrome: 'https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm',
        firefox: 'https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/',
        edge: 'https://microsoftedge.microsoft.com/addons/detail/ublock-origin/odifjihjnamlecblkaacjpgmldfbggdn',
        opera: 'https://addons.opera.com/en/extensions/details/ublock-origin/',
        brave: 'https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm',
        vivaldi: 'https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm'
    };
    return urls[browser] || urls.chrome;
}

function getBrowserName(browser) {
    var names = {
        chrome: 'Google Chrome', firefox: 'Mozilla Firefox', edge: 'Microsoft Edge',
        opera: 'Opera', brave: 'Brave', vivaldi: 'Vivaldi', safari: 'Safari',
        unknown: 'your browser'
    };
    return names[browser] || 'your browser';
}

function detectUblock() {
    return new Promise(function(resolve) {
        var bait = document.createElement('div');
        bait.innerHTML = '&nbsp;';
        bait.className = 'adsbox ad-banner advertisement';
        bait.setAttribute('id', 'ad-container');
        bait.style.cssText = 'position:absolute;left:-999px;width:1px;height:1px;overflow:hidden;';
        document.body.appendChild(bait);

        setTimeout(function() {
            var blocked = !bait || bait.offsetHeight === 0 || bait.clientHeight === 0 ||
                          getComputedStyle(bait).display === 'none' ||
                          getComputedStyle(bait).visibility === 'hidden';
            if (bait.parentNode) bait.parentNode.removeChild(bait);
            resolve(blocked);
        }, 100);
    });
}

function isRestrictedDevice() {
    var ua = navigator.userAgent;
    if (ua.indexOf('CrOS') !== -1) return true;
    if (ua.indexOf('Windows NT') !== -1 && navigator.userAgentData) {
        try {
            if (navigator.userAgentData.mobile) return false;
        } catch(e) {}
    }
    if (navigator.connection && navigator.connection.rtt === 0) return true;
    return false;
}

function hideUblockModal() {
    var modal = document.getElementById('ublockModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function showUblockModal(browser) {
    var modal = document.getElementById('ublockModal');
    var btn = document.getElementById('ublockInstallBtn');
    var refreshBtn = document.getElementById('ublockRefreshBtn');
    var closeBtn = document.getElementById('ublockClose');
    var browserText = document.getElementById('ublockBrowser');
    if (modal && btn) {
        btn.href = getUblockUrl(browser);
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        browserText.textContent = 'Detected: ' + getBrowserName(browser);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        btn.onclick = function() {
            localStorage.setItem('ublock_prompted', 'true');
            localStorage.setItem('ublock_browser', browser);
        };

        if (refreshBtn) {
            refreshBtn.onclick = function() {
                window.location.reload();
            };
        }

        if (closeBtn) {
            closeBtn.onclick = function() {
                hideUblockModal();
            };
        }
    }
}

async function checkUblock() {
    var browser = detectBrowser();
    if (browser === 'safari' || browser === 'unknown') return;
    if (isRestrictedDevice()) return;

    var hasUblock = await detectUblock();

    if (hasUblock) {
        localStorage.removeItem('ublock_prompted');
        localStorage.removeItem('ublock_browser');
        hideUblockModal();
        return;
    }

    if (localStorage.getItem('ublock_prompted') === 'true') {
        var savedBrowser = localStorage.getItem('ublock_browser') || browser;
        showUblockModal(savedBrowser);
        return;
    }

    showUblockModal(browser);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

const TMDB_API_KEY = '9f4143ead87e9955cfc58e4cbab49144';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const state = {
    currentCategory: 'popular',
    currentPage: 1,
    totalPages: 1,
    movies: [],
    isLoading: false,
    currentMovie: null
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
    const data = await fetchFromTMDB(`/movie/${tmdbId}`);
    return data ? data.imdb_id : null;
}

function renderHero(movie) {
    if (!movie) return;
    const backdrop = getBackdropUrl(movie.backdrop_path);
    if (backdrop) {
        elements.hero.style.backgroundImage = `url(${backdrop})`;
    }
    elements.heroTitle.textContent = movie.title || '';
    elements.heroOverview.textContent = movie.overview || '';
    elements.heroRating.innerHTML = movie.vote_average ? `&#9733; ${movie.vote_average.toFixed(1)}` : '';
    elements.heroYear.textContent = movie.release_date ? movie.release_date.split('-')[0] : '';

    elements.heroPlayBtn.onclick = function() { playMovie(movie); };
    elements.heroDetailsBtn.onclick = function() { openMovieDetail(movie); };
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('data-movie-id', movie.id);

    card.addEventListener('click', function() {
        openMovieDetail(movie);
    });

    const posterUrl = getPosterUrl(movie.poster_path);
    const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const imgSrc = posterUrl || 'https://via.placeholder.com/300x450/1a1a25/ffffff?text=No+Poster';

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
        playMovie(movie);
    });

    overlay.appendChild(playBtn);
    poster.appendChild(img);
    poster.appendChild(ratingDiv);
    poster.appendChild(overlay);

    const info = document.createElement('div');
    info.className = 'movie-info';

    const title = document.createElement('h3');
    title.className = 'movie-title';
    title.textContent = movie.title || 'Untitled';

    const yearP = document.createElement('p');
    yearP.className = 'movie-year';
    yearP.textContent = year;

    const quality = document.createElement('span');
    quality.className = 'movie-quality';
    quality.textContent = 'HD 1080p';

    info.appendChild(title);
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

function updateSectionTitle(category) {
    var titles = {
        popular: 'Popular Movies',
        top_rated: 'Top Rated Movies',
        upcoming: 'Upcoming Movies',
        now_playing: 'Now Playing'
    };
    elements.sectionTitle.textContent = titles[category] || 'Movies';
}

async function loadMovies(category, page, append) {
    page = page || 1;
    append = append || false;
    if (state.isLoading) return;
    state.isLoading = true;
    elements.loading.classList.add('active');

    var data = await fetchFromTMDB('/movie/' + category, {
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

    var data = await fetchFromTMDB('/search/movie', {
        query: query,
        page: 1,
        include_adult: false
    });

    if (data && data.results) {
        state.movies = data.results;
        elements.moviesGrid.innerHTML = '';
        renderMovies(data.results, false);
        elements.loadMore.style.display = 'none';
    }
    state.isLoading = false;
    elements.loading.classList.remove('active');
}

async function playMovie(movie) {
    if (!movie) return;
    state.currentMovie = movie;

    var imdbId = await getImdbId(movie.id);
    elements.playerTitle.textContent = movie.title || 'Movie';
    elements.episodeControls.style.display = 'none';

    if (imdbId) {
        elements.playerFrame.src = 'https://vidfast.pro/movie/' + imdbId;
    } else {
        elements.playerFrame.src = 'https://vidfast.pro/movie/' + movie.id;
    }

    elements.playerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePlayer() {
    elements.playerFrame.src = '';
    elements.playerModal.classList.remove('active');
    document.body.style.overflow = '';
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
    elements.detailTitle.textContent = movie.title || '';
    elements.detailRating.innerHTML = movie.vote_average ? '&#9733; ' + movie.vote_average.toFixed(1) : '';
    elements.detailYear.textContent = movie.release_date ? movie.release_date.split('-')[0] : '';
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

    elements.detailPlayBtn.onclick = function() { playMovie(movie); };

    var similarData = await fetchFromTMDB('/movie/' + movie.id + '/similar', { page: 1 });
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
                state.currentCategory = category;
                state.currentPage = 1;
                var allLinks = document.querySelectorAll('.nav-link');
                for (var j = 0; j < allLinks.length; j++) {
                    allLinks[j].classList.remove('active');
                }
                link.classList.add('active');
                updateSectionTitle(category);
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
        if (nav.style.display === 'flex') {
            nav.style.display = 'none';
        } else {
            nav.style.display = 'flex';
        }
    });
}

function init() {
    console.log('Initializing AbdulMovies...');
    initElements();
    initEventListeners();
    loadMovies('popular');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

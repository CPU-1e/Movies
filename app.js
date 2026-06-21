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

const elements = {
    homeView: document.getElementById('homeView'),
    movieDetailView: document.getElementById('movieDetailView'),
    hero: document.getElementById('hero'),
    heroTitle: document.getElementById('heroTitle'),
    heroOverview: document.getElementById('heroOverview'),
    heroRating: document.getElementById('heroRating'),
    heroYear: document.getElementById('heroYear'),
    heroPlayBtn: document.getElementById('heroPlayBtn'),
    heroDetailsBtn: document.getElementById('heroDetailsBtn'),
    sectionTitle: document.getElementById('sectionTitle'),
    moviesGrid: document.getElementById('moviesGrid'),
    loading: document.getElementById('loading'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    loadMore: document.getElementById('loadMore'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    detailHero: document.getElementById('detailHero'),
    detailTitle: document.getElementById('detailTitle'),
    detailRating: document.getElementById('detailRating'),
    detailYear: document.getElementById('detailYear'),
    detailRuntime: document.getElementById('detailRuntime'),
    detailOverview: document.getElementById('detailOverview'),
    detailGenres: document.getElementById('detailGenres'),
    detailPlayBtn: document.getElementById('detailPlayBtn'),
    similarMoviesGrid: document.getElementById('similarMoviesGrid'),
    playerModal: document.getElementById('playerModal'),
    playerClose: document.getElementById('playerClose'),
    playerFrame: document.getElementById('playerFrame'),
    playerTitle: document.getElementById('playerTitle'),
    seasonSelect: document.getElementById('seasonSelect'),
    episodeSelect: document.getElementById('episodeSelect'),
    episodeControls: document.getElementById('episodeControls')
};

async function fetchFromTMDB(endpoint, params = {}) {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API request failed');
        return await response.json();
    } catch (error) {
        console.error('TMDB API Error:', error);
        return null;
    }
}

function getBackdropUrl(path, size = 'w1280') {
    return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : '';
}

function getPosterUrl(path, size = 'w500') {
    return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : '';
}

function getEmbedUrl(imdbId) {
    return `https://vidfast.pro/movie/${imdbId}`;
}

function getTvEmbedUrl(tvShowId, season, episode) {
    return `https://vidfast.pro/tv/${tvShowId}/${season}/${episode}`;
}

async function getImdbId(tmdbId) {
    const data = await fetchFromTMDB(`/movie/${tmdbId}`);
    return data ? data.imdb_id : null;
}

function renderHero(movie) {
    if (!movie) return;
    const backdrop = getBackdropUrl(movie.backdrop_path);
    elements.hero.style.backgroundImage = `url(${backdrop})`;
    elements.heroTitle.textContent = movie.title;
    elements.heroOverview.textContent = movie.overview;
    elements.heroRating.innerHTML = `&#9733; ${movie.vote_average.toFixed(1)}`;
    elements.heroYear.textContent = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';

    elements.heroPlayBtn.onclick = () => playMovie(movie);
    elements.heroDetailsBtn.onclick = () => openMovieDetail(movie);
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.onclick = () => openMovieDetail(movie);
    const posterUrl = getPosterUrl(movie.poster_path);
    const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

    card.innerHTML = `
        <div class="movie-poster">
            <img src="${posterUrl || 'https://via.placeholder.com/300x450/1a1a25/ffffff?text=No+Poster'}" 
                 alt="${movie.title}" loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x450/1a1a25/ffffff?text=No+Poster'">
            <div class="movie-rating">&#9733; ${rating}</div>
            <div class="movie-poster-overlay">
                <button class="btn-play" onclick="event.stopPropagation(); playMovieById(${movie.id})">&#9654; Play</button>
            </div>
        </div>
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <p class="movie-year">${year}</p>
            <span class="movie-quality">HD 1080p</span>
        </div>
    `;
    return card;
}

function getMovieById(id) {
    return state.movies.find(m => m.id === id);
}

function renderMovies(movies, append = false) {
    if (!append) elements.moviesGrid.innerHTML = '';
    movies.forEach(movie => {
        elements.moviesGrid.appendChild(createMovieCard(movie));
    });
}

function updateSectionTitle(category) {
    const titles = {
        popular: 'Popular Movies',
        top_rated: 'Top Rated Movies',
        upcoming: 'Upcoming Movies',
        now_playing: 'Now Playing'
    };
    elements.sectionTitle.textContent = titles[category] || 'Movies';
}

async function loadMovies(category, page = 1, append = false) {
    if (state.isLoading) return;
    state.isLoading = true;
    elements.loading.classList.add('active');

    const data = await fetchFromTMDB(`/movie/${category}`, {
        page: page,
        language: 'en-US'
    });

    if (data) {
        state.totalPages = data.total_pages;
        if (append) {
            state.movies = [...state.movies, ...data.results];
        } else {
            state.movies = data.results;
        }
        renderMovies(data.results, append);
        if (page === 1 && data.results.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(5, data.results.length));
            renderHero(data.results[randomIndex]);
        }
        elements.loadMore.style.display = page < data.total_pages ? 'block' : 'none';
    }
    state.isLoading = false;
    elements.loading.classList.remove('active');
}

async function searchMovies(query) {
    if (!query.trim()) {
        loadMovies(state.currentCategory);
        return;
    }
    state.isLoading = true;
    elements.loading.classList.add('active');
    elements.sectionTitle.textContent = `Search: "${query}"`;

    const data = await fetchFromTMDB('/search/movie', {
        query: query,
        page: 1,
        include_adult: false
    });

    if (data) {
        state.movies = data.results;
        elements.moviesGrid.innerHTML = '';
        renderMovies(data.results);
        elements.loadMore.style.display = 'none';
    }
    state.isLoading = false;
    elements.loading.classList.remove('active');
}

async function playMovie(movie) {
    if (!movie) return;
    state.currentMovie = movie;

    const imdbId = await getImdbId(movie.id);
    elements.playerTitle.textContent = movie.title;
    elements.episodeControls.style.display = 'none';

    if (imdbId) {
        elements.playerFrame.src = getEmbedUrl(imdbId);
    } else {
        elements.playerFrame.src = `https://vidfast.pro/movie/${movie.id}`;
    }

    elements.playerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function playMovieById(id) {
    const movie = state.movies.find(m => m.id === id) || state.currentMovie;
    if (movie) playMovie(movie);
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

    const backdrop = getBackdropUrl(movie.backdrop_path);
    elements.detailHero.style.backgroundImage = `url(${backdrop})`;
    elements.detailTitle.textContent = movie.title;
    elements.detailRating.innerHTML = `&#9733; ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}`;
    elements.detailYear.textContent = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    elements.detailRuntime.textContent = movie.runtime ? `${movie.runtime} min` : '';
    elements.detailOverview.textContent = movie.overview || 'No description available.';

    elements.detailGenres.innerHTML = '';
    if (movie.genre_ids) {
        movie.genre_ids.forEach(genreId => {
            const tag = document.createElement('span');
            tag.className = 'genre-tag';
            tag.textContent = getGenreName(genreId);
            elements.detailGenres.appendChild(tag);
        });
    }

    elements.detailPlayBtn.onclick = () => playMovie(movie);

    const similarData = await fetchFromTMDB(`/movie/${movie.id}/similar`, { page: 1 });
    elements.similarMoviesGrid.innerHTML = '';
    if (similarData && similarData.results) {
        similarData.results.slice(0, 12).forEach(m => {
            elements.similarMoviesGrid.appendChild(createMovieCard(m));
        });
    }
}

const genres = {
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
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.dataset.category;
            state.currentCategory = category;
            state.currentPage = 1;
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            updateSectionTitle(category);
            goHome();
            loadMovies(category);
        });
    });

    elements.searchBtn.addEventListener('click', () => searchMovies(elements.searchInput.value));
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchMovies(elements.searchInput.value);
    });

    elements.loadMoreBtn.addEventListener('click', () => {
        state.currentPage++;
        loadMovies(state.currentCategory, state.currentPage, true);
    });

    elements.playerClose.addEventListener('click', closePlayer);
    elements.playerModal.addEventListener('click', (e) => {
        if (e.target === elements.playerModal) closePlayer();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.playerModal.classList.contains('active')) {
                closePlayer();
            } else if (elements.movieDetailView.style.display !== 'none') {
                goHome();
            }
        }
    });

    elements.mobileMenuBtn.addEventListener('click', () => {
        const nav = document.getElementById('mainNav');
        nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    });
}

function init() {
    initEventListeners();
    loadMovies('popular');
}

document.addEventListener('DOMContentLoaded', init);

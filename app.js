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
    hero: document.getElementById('hero'),
    heroTitle: document.getElementById('heroTitle'),
    heroOverview: document.getElementById('heroOverview'),
    heroRating: document.getElementById('heroRating'),
    heroYear: document.getElementById('heroYear'),
    heroWatchBtn: document.getElementById('heroWatchBtn'),
    sectionTitle: document.getElementById('sectionTitle'),
    moviesGrid: document.getElementById('moviesGrid'),
    loading: document.getElementById('loading'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    loadMore: document.getElementById('loadMore'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    movieModal: document.getElementById('movieModal'),
    modalClose: document.getElementById('modalClose'),
    modalPoster: document.getElementById('modalPoster'),
    modalTitle: document.getElementById('modalTitle'),
    modalRating: document.getElementById('modalRating'),
    modalYear: document.getElementById('modalYear'),
    modalRuntime: document.getElementById('modalRuntime'),
    modalOverview: document.getElementById('modalOverview'),
    modalGenres: document.getElementById('modalGenres'),
    streamingLinks: document.getElementById('streamingLinks'),
    modalTrailer: document.getElementById('modalTrailer'),
    playerModal: document.getElementById('playerModal'),
    playerClose: document.getElementById('playerClose'),
    playerFrame: document.getElementById('playerFrame'),
    playerTitle: document.getElementById('playerTitle'),
    genreTags: document.getElementById('genreTags'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
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

function getEmbedUrls(imdbId, tmdbId) {
    return {
        vidfast: `https://vidfast.pro/movie/${imdbId}`,
        embed1: `https://1embed.cc/embed/${tmdbId}`
    };
}

function getTvEmbedUrls(tvShowId, season, episode) {
    return {
        vidfast: `https://vidfast.pro/tv/${tvShowId}/${season}/${episode}`,
        embed1: `https://1embed.cc/embed/tv/${tvShowId}/${season}/${episode}`
    };
}

async function getImdbId(tmdbId) {
    const data = await fetchFromTMDB(`/movie/${tmdbId}`);
    return data ? data.imdb_id : null;
}

function getYouTubeTrailerUrl(movieId) {
    return `https://www.youtube.com/results?search_query=movie+trailer+${movieId}`;
}

function renderHero(movie) {
    if (!movie) return;
    const backdrop = getBackdropUrl(movie.backdrop_path);
    elements.hero.style.backgroundImage = `url(${backdrop})`;
    elements.heroTitle.textContent = movie.title;
    elements.heroOverview.textContent = movie.overview;
    elements.heroRating.innerHTML = `★ ${movie.vote_average.toFixed(1)}`;
    elements.heroYear.textContent = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    elements.heroWatchBtn.onclick = () => openPlayer(movie);
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.onclick = () => openModal(movie);
    const posterUrl = getPosterUrl(movie.poster_path);
    const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

    card.innerHTML = `
        <div class="movie-poster">
            <img src="${posterUrl || 'https://via.placeholder.com/300x450/1a1a25/ffffff?text=No+Poster'}" 
                 alt="${movie.title}" loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x450/1a1a25/ffffff?text=No+Poster'">
            <div class="movie-rating">★ ${rating}</div>
            <div class="movie-poster-overlay">
                <button class="btn-play" onclick="event.stopPropagation(); openPlayer(getMovieById(${movie.id}))">&#9654; Play</button>
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

async function openPlayer(movie, season = null, episode = null) {
    if (!movie) return;
    state.currentMovie = movie;

    const isTv = movie.first_air_date && !movie.release_date;
    elements.playerTitle.textContent = movie.title;
    elements.episodeControls.style.display = 'none';

    if (isTv && season && episode) {
        const urls = getTvEmbedUrls(movie.id, season, episode);
        elements.playerFrame.src = urls.vidfast;
        loadTvSeasons(movie);
        elements.episodeControls.style.display = 'block';
    } else {
        const imdbId = await getImdbId(movie.id);
        if (imdbId) {
            const urls = getEmbedUrls(imdbId, movie.id);
            elements.playerFrame.src = urls.vidfast;
        } else {
            elements.playerFrame.src = `https://1embed.cc/embed/${movie.id}`;
        }
    }

    elements.playerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function loadTvSeasons(tvShow) {
    const data = await fetchFromTMDB(`/tv/${tvShow.id}`);
    if (data && data.seasons) {
        elements.seasonSelect.innerHTML = '<option value="">Select Season</option>';
        data.seasons.filter(s => s.season_number > 0).forEach(season => {
            const opt = document.createElement('option');
            opt.value = season.season_number;
            opt.textContent = `Season ${season.season_number}`;
            elements.seasonSelect.appendChild(opt);
        });

        elements.seasonSelect.onchange = async () => {
            const seasonNum = elements.seasonSelect.value;
            if (!seasonNum) return;
            const seasonData = await fetchFromTMDB(`/tv/${tvShow.id}/season/${seasonNum}`);
            if (seasonData && seasonData.episodes) {
                elements.episodeSelect.innerHTML = '<option value="">Select Episode</option>';
                seasonData.episodes.forEach(ep => {
                    const opt = document.createElement('option');
                    opt.value = ep.episode_number;
                    opt.textContent = `Ep ${ep.episode_number}: ${ep.name}`;
                    elements.episodeSelect.appendChild(opt);
                });
            }
        };

        elements.episodeSelect.onchange = async () => {
            const s = elements.seasonSelect.value;
            const e = elements.episodeSelect.value;
            if (s && e) {
                const urls = getTvEmbedUrls(tvShow.id, s, e);
                elements.playerFrame.src = urls.vidfast;
                elements.playerTitle.textContent = `${tvShow.title} - S${s}E${e}`;
            }
        };
    }
}

async function switchSource(source) {
    const movie = state.currentMovie;
    if (!movie) return;

    if (source === 'vidfast') {
        const imdbId = await getImdbId(movie.id);
        if (imdbId) {
            elements.playerFrame.src = `https://vidfast.pro/movie/${imdbId}`;
        }
    } else {
        elements.playerFrame.src = `https://1embed.cc/embed/${movie.id}`;
    }
}

async function openModal(movie) {
    state.currentMovie = movie;
    const posterUrl = getPosterUrl(movie.poster_path, 'w780');

    elements.modalPoster.src = posterUrl || 'https://via.placeholder.com/300x450/1a1a25/ffffff?text=No+Poster';
    elements.modalTitle.textContent = movie.title;
    elements.modalRating.innerHTML = `★ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}`;
    elements.modalYear.textContent = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    elements.modalRuntime.textContent = movie.runtime ? `${movie.runtime} min` : '';
    elements.modalOverview.textContent = movie.overview || 'No description available.';

    elements.modalGenres.innerHTML = '';
    if (movie.genre_ids) {
        movie.genre_ids.forEach(genreId => {
            const tag = document.createElement('span');
            tag.className = 'genre-tag';
            tag.textContent = getGenreName(genreId);
            elements.modalGenres.appendChild(tag);
        });
    }

    const imdbId = await getImdbId(movie.id);
    const imdbLink = imdbId ? `https://www.imdb.com/title/${imdbId}` : '#';

    elements.streamingLinks.innerHTML = `
        <button class="stream-link free" onclick="closeModal(); openPlayer(state.currentMovie)">
            &#9654; Watch Now (VidFast)
        </button>
        <button class="stream-link free" onclick="closeModal(); openPlayerAlt(state.currentMovie)">
            &#9654; Watch Now (1Embed)
        </button>
        <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title)}+trailer" target="_blank" rel="noopener noreferrer" class="stream-link">
            ▶ Trailer
        </a>
        <a href="${imdbLink}" target="_blank" rel="noopener noreferrer" class="stream-link" ${!imdbId ? 'style="display:none"' : ''}>
            IMDb
        </a>
    `;

    elements.movieModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function openPlayerAlt(movie) {
    if (!movie) return;
    state.currentMovie = movie;

    elements.playerTitle.textContent = movie.title;
    elements.playerFrame.src = `https://1embed.cc/embed/${movie.id}`;
    elements.playerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    elements.episodeControls.style.display = 'none';
}

function closeModal() {
    elements.movieModal.classList.remove('active');
    document.body.style.overflow = '';
}

function closePlayer() {
    elements.playerFrame.src = '';
    elements.playerModal.classList.remove('active');
    document.body.style.overflow = '';
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

    elements.modalClose.addEventListener('click', closeModal);
    elements.movieModal.addEventListener('click', (e) => {
        if (e.target === elements.movieModal) closeModal();
    });

    elements.playerClose.addEventListener('click', closePlayer);
    elements.playerModal.addEventListener('click', (e) => {
        if (e.target === elements.playerModal) closePlayer();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.playerModal.classList.contains('active')) {
                closePlayer();
            } else if (elements.movieModal.classList.contains('active')) {
                closeModal();
            }
        }
    });

    elements.heroWatchBtn.addEventListener('click', () => {
        if (state.movies[0]) openPlayer(state.movies[0]);
    });

    elements.mobileMenuBtn.addEventListener('click', () => {
        const nav = document.querySelector('.nav');
        nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    });
}

function init() {
    initEventListeners();
    loadMovies('popular');
}

document.addEventListener('DOMContentLoaded', init);

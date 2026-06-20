const TMDB_API_KEY = '9f4143ead87e9955cfc58e4cbab49144';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const state = {
    currentCategory: 'popular',
    currentPage: 1,
    totalPages: 1,
    movies: [],
    isLoading: false
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
    genreTags: document.getElementById('genreTags'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn')
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

function getStreamingSources(movieId, movieTitle) {
    const encodedTitle = encodeURIComponent(movieTitle);
    return [
        {
            name: 'YouTube',
            url: `https://www.youtube.com/results?search_query=${encodedTitle}+full+movie`,
            free: true
        },
        {
            name: 'Tubi',
            url: `https://tubitv.com/search/${encodedTitle}`,
            free: true
        },
        {
            name: 'Pluto TV',
            url: `https://pluto.tv/us/search?query=${encodedTitle}`,
            free: true
        },
        {
            name: 'Crackle',
            url: `https://www.crackle.com/search?query=${encodedTitle}`,
            free: true
        },
        {
            name: 'IMDb',
            url: `https://www.imdb.com/find?q=${encodedTitle}`,
            free: true
        },
        {
            name: 'JustWatch',
            url: `https://www.justwatch.com/us/search?q=${encodedTitle}`,
            free: true
        }
    ];
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

    elements.heroWatchBtn.onclick = () => openModal(movie);
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
                 alt="${movie.title}" 
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x450/1a1a25/ffffff?text=No+Poster'">
            <div class="movie-rating">★ ${rating}</div>
            <div class="movie-poster-overlay">
                <button class="btn-watch-small">▶ Play</button>
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

function renderMovies(movies, append = false) {
    if (!append) {
        elements.moviesGrid.innerHTML = '';
    }

    movies.forEach(movie => {
        const card = createMovieCard(movie);
        elements.moviesGrid.appendChild(card);
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

function openModal(movie) {
    const posterUrl = getPosterUrl(movie.poster_path, 'w780');
    const backdropUrl = getBackdropUrl(movie.backdrop_path);

    elements.modalPoster.src = posterUrl || 'https://via.placeholder.com/300x450/1a1a25/ffffff?text=No+Poster';
    elements.modalTitle.textContent = movie.title;
    elements.modalRating.innerHTML = `★ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}`;
    elements.modalYear.textContent = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    elements.modalRuntime.textContent = movie.runtime ? `${movie.runtime} min` : '';
    elements.modalOverview.textContent = movie.overview || 'No description available.';

    elements.modalGenres.innerHTML = '';
    if (movie.genre_ids) {
        movie.genre_ids.forEach(genreId => {
            const genreName = getGenreName(genreId);
            const tag = document.createElement('span');
            tag.className = 'genre-tag';
            tag.textContent = genreName;
            elements.modalGenres.appendChild(tag);
        });
    }

    const sources = getStreamingSources(movie.id, movie.title);
    elements.streamingLinks.innerHTML = sources.map(source => `
        <a href="${source.url}" target="_blank" rel="noopener noreferrer" class="stream-link ${source.free ? 'free' : ''}">
            ${source.free ? '✓' : '★'} ${source.name}
        </a>
    `).join('');

    elements.modalTrailer.innerHTML = `
        <a href="${getYouTubeTrailerUrl(movie.id)}" target="_blank" rel="noopener noreferrer" class="trailer-btn">
            ▶ Watch Trailer
        </a>
    `;

    elements.movieModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    elements.movieModal.classList.remove('active');
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

    elements.searchBtn.addEventListener('click', () => {
        searchMovies(elements.searchInput.value);
    });

    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchMovies(elements.searchInput.value);
        }
    });

    elements.loadMoreBtn.addEventListener('click', () => {
        state.currentPage++;
        loadMovies(state.currentCategory, state.currentPage, true);
    });

    elements.modalClose.addEventListener('click', closeModal);

    elements.movieModal.addEventListener('click', (e) => {
        if (e.target === elements.movieModal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    elements.heroWatchBtn.addEventListener('click', () => {
        const heroMovie = state.movies[0];
        if (heroMovie) {
            openModal(heroMovie);
        }
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

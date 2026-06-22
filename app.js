const TMDB_KEY='9f4143ead87e9955cfc58e4cbab49144';
const IMG='https://image.tmdb.org/t/p';

const s={
    type:'movie',
    category:'popular',
    page:1,
    total:1,
    movies:[],
    loading:false,
    movie:null,
    season:1,
    episode:1,
    seasons:[],
    imdbId:null,
    provIdx:0
};

const $={};

function id(v){return document.getElementById(v)}

function initEls(){
    $.home=id('homeView');
    $.detail=id('detailView');
    $.hero=id('hero');
    $.heroTitle=id('heroTitle');
    $.heroDesc=id('heroOverview');
    $.heroRating=id('heroRating');
    $.heroYear=id('heroYear');
    $.heroPlay=id('heroPlayBtn');
    $.heroDetails=id('heroDetailsBtn');
    $.secTitle=id('sectionTitle');
    $.grid=id('moviesGrid');
    $.spin=id('loading');
    $.loadMore=id('loadMore');
    $.loadBtn=id('loadMoreBtn');
    $.search=id('searchInput');
    $.searchBar=id('searchBar');
    $.searchToggle=id('searchToggle');
    $.searchClear=id('searchClear');
    $.dHero=id('detailHero');
    $.dTitle=id('detailTitle');
    $.dRating=id('detailRating');
    $.dYear=id('detailYear');
    $.dRuntime=id('detailRuntime');
    $.dDesc=id('detailOverview');
    $.dTags=id('detailGenres');
    $.dPlay=id('detailPlayBtn');
    $.simGrid=id('similarGrid');
    $.modal=id('playerModal');
    $.mTitle=id('playerTitle');
    $.mClose=id('playerClose');
    $.frame=id('playerFrame');
    $.servers=id('serverBtns');
    $.season=id('seasonSelect');
    $.episode=id('episodeSelect');
    $.epBar=id('episodeBar');
    $.menuBtn=id('menuBtn');
    $.nav=id('nav');
    $.overlay=id('overlay');
}

async function tmdb(path,params={}){
    const u=new URL('https://api.themoviedb.org/3'+path);
    u.searchParams.set('api_key',TMDB_KEY);
    for(const[k,v]of Object.entries(params))u.searchParams.set(k,v);
    try{
        const r=await fetch(u);
        if(!r.ok)throw Error(r.status);
        return await r.json();
    }catch(e){return null}
}

function backdrop(p){return p?IMG+'/w1280'+p:''}
function poster(p){return p?IMG+'/w500'+p:''}

function hero(m){
    if(!m)return;
    const b=backdrop(m.backdrop_path);
    if(b)$.hero.style.backgroundImage='url('+b+')';
    const t=s.type==='tv'?m.name||'':m.title||'';
    const d=s.type==='tv'?m.first_air_date:m.release_date;
    $.heroTitle.textContent=t;
    $.heroDesc.textContent=m.overview||'';
    $.heroRating.innerHTML=m.vote_average?'&#9733; '+m.vote_average.toFixed(1):'';
    $.heroYear.textContent=d?d.split('-')[0]:'';
    $.heroPlay.onclick=()=>{
        if(s.type==='tv'){playTv(m,1,1);loadSeasons(m)}
        else playMovie(m);
    };
    $.heroDetails.onclick=()=>openDetail(m);
}

function card(movie){
    const c=document.createElement('div');
    c.className='card';
    c.addEventListener('click',()=>{
        const t=s.type;
        if(movie._type)s.type=movie._type;
        openDetail(movie);
        s.type=t;
    });
    const p=poster(movie.poster_path);
    const t=s.type==='tv'?movie.name||'Untitled':movie.title||'Untitled';
    const d=s.type==='tv'?movie.first_air_date:movie.release_date;
    const y=d?d.split('-')[0]:'N/A';
    const r=movie.vote_average?movie.vote_average.toFixed(1):'N/A';
    const img=p||'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" fill="%231a1a28"><rect width="300" height="450"/><text x="50%" y="50%" fill="%23555570" font-family="sans-serif" font-size="14" text-anchor="middle" dy=".3em">No Poster</text></svg>';
    c.innerHTML='<div class="card-poster"><img src="'+img+'" alt="'+t.replace(/"/g,'&quot;')+'" loading="lazy"><div class="card-rating">&#9733; '+r+'</div><div class="card-play"><button aria-label="Play">&nbsp;&#9654;</button></div></div><div class="card-body"><div class="card-title">'+t+'</div><div class="card-year">'+y+'</div><div class="card-badge">HD</div></div>';
    c.querySelector('.card-play button').addEventListener('click',e=>{
        e.stopPropagation();
        const it=movie._type||s.type;
        if(it==='tv'){playTv(movie,1,1);loadSeasons(movie)}
        else playMovie(movie);
    });
    return c;
}

function render(movies,append){
    if(!append)$.grid.innerHTML='';
    if(!movies||!movies.length)return;
    movies.forEach(m=>$.grid.appendChild(card(m)));
}

function secTitle(cat,type){
    type=type||'movie';
    const m={popular:'Popular Movies',top_rated:'Top Rated',upcoming:'Upcoming',now_playing:'Now Playing'};
    const t={popular:'Popular TV',top_rated:'TV Top Rated',on_the_air:'On The Air',airing_today:'Airing Today'};
    const map=type==='tv'?t:m;
    $.secTitle.textContent=map[cat]||(type==='tv'?'TV Shows':'Movies');
}

async function load(category,page,append){
    page=page||1;append=append||false;
    if(s.loading)return;
    s.loading=true;
    $.spin.classList.add('active');
    const data=await tmdb('/'+s.type+'/'+category,{page,language:'en-US'});
    if(data&&data.results){
        s.total=data.total_pages;
        s.movies=append?s.movies.concat(data.results):data.results;
        render(data.results,append);
        if(page===1&&data.results.length>0){
            const idx=Math.floor(Math.random()*Math.min(5,data.results.length));
            hero(data.results[idx]);
        }
        $.loadMore.style.display=page<data.total_pages?'block':'none';
    }
    s.loading=false;
    $.spin.classList.remove('active');
}

async function search(q){
    if(!q||!q.trim()){load(s.category);return}
    s.loading=true;
    $.spin.classList.add('active');
    $.secTitle.textContent='Search: "'+q+'"';
    const[mData,tData]=await Promise.all([
        tmdb('/search/movie',{query:q,page:1,include_adult:false}),
        tmdb('/search/tv',{query:q,page:1,include_adult:false})
    ]);
    const all=[];
    if(mData&&mData.results)mData.results.forEach(m=>{m._type='movie';all.push(m)});
    if(tData&&tData.results)tData.results.forEach(t=>{t._type='tv';all.push(t)});
    all.sort((a,b)=>(b.vote_average||0)-(a.vote_average||0));
    if(all.length){
        s.movies=all;
        $.grid.innerHTML='';
        all.forEach(item=>{
            const ot=s.type;
            if(item._type)s.type=item._type;
            $.grid.appendChild(card(item));
            s.type=ot;
        });
        $.loadMore.style.display='none';
        // scroll to grid
        document.querySelector('.section')?.scrollIntoView({behavior:'smooth'});
    }
    s.loading=false;
    $.spin.classList.remove('active');
}

const prov=[
    {name:'Server 1',url:(i,t)=>'https://vidfast.pro/movie/'+i},
    {name:'Server 2',url:(i,t)=>'https://vidfast.pm/movie/'+i},
    {name:'Server 3',url:(i,t)=>'https://1embed.cc/embed/movie/'+t}
];
const tProv=[
    {name:'Server 1',url:(i,t,se,ep)=>'https://vidfast.pro/tv/'+t+'/'+se+'/'+ep},
    {name:'Server 2',url:(i,t,se,ep)=>'https://vidfast.pm/tv/'+t+'/'+se+'/'+ep},
    {name:'Server 3',url:(i,t,se,ep)=>'https://1embed.cc/embed/tv/'+t+'/'+se+'/'+ep}
];

async function getI(id){
    if(s.type==='tv')return null;
    const d=await tmdb('/movie/'+id);
    return d?d.imdb_id:null;
}

async function playMovie(m){
    if(!m)return;
    s.movie=m;
    s.imdbId=await getI(m.id);
    $.mTitle.textContent=m.title||'Movie';
    $.epBar.style.display='none';
    s.provIdx=0;
    $.frame.src=prov[0].url(s.imdbId,m.id);
    updateBtns();
    $.modal.classList.add('active');
    document.body.style.overflow='hidden';
}

async function playTv(sh,se,ep){
    if(!sh)return;
    s.movie=sh;s.season=se||1;s.episode=ep||1;
    s.imdbId=await getI(sh.id);
    $.mTitle.textContent=sh.name||'TV Show';
    s.provIdx=0;
    $.frame.src=tProv[0].url(s.imdbId,sh.id,s.season,s.episode);
    updateBtns();
    $.epBar.style.display='flex';
    $.modal.classList.add('active');
    document.body.style.overflow='hidden';
}

async function loadSeasons(sh){
    const d=await tmdb('/tv/'+sh.id);
    if(d&&d.seasons){
        s.seasons=d.seasons.filter(x=>x.season_number>0);
        $.season.innerHTML='';
        s.seasons.forEach(se=>{
            const o=document.createElement('option');
            o.value=se.season_number;
            o.textContent='S'+se.season_number;
            $.season.appendChild(o);
        });
        $.season.value=s.season;
        await loadEps(sh.id,s.season);
    }
}

async function loadEps(sid,se){
    const d=await tmdb('/tv/'+sid+'/season/'+se);
    $.episode.innerHTML='';
    if(d&&d.episodes){
        d.episodes.forEach(ep=>{
            const o=document.createElement('option');
            o.value=ep.episode_number;
            o.textContent='E'+ep.episode_number+' - '+(ep.name||'Ep '+ep.episode_number);
            $.episode.appendChild(o);
        });
        $.episode.value=s.episode;
    }
}

function switchSrv(idx){
    s.provIdx=idx;
    const m=s.movie;
    if(!m)return;
    const p=s.type==='tv'?tProv:prov;
    $.frame.src=p[idx].url(s.imdbId,m.id,s.season,s.episode);
    updateBtns();
}

function updateBtns(){
    const p=s.type==='tv'?tProv:prov;
    $.servers.innerHTML='';
    p.forEach((pr,i)=>{
        const b=document.createElement('button');
        b.className=i===s.provIdx?'active':'';
        b.textContent=pr.name;
        b.addEventListener('click',()=>switchSrv(i));
        $.servers.appendChild(b);
    });
}

function closePlayer(){
    $.frame.src='';
    $.modal.classList.remove('active');
    document.body.style.overflow='';
}

function goHome(){
    $.home.style.display='';
    $.detail.style.display='none';
    window.scrollTo(0,0);
}

async function openDetail(m){
    s.movie=m;
    window.scrollTo(0,0);
    $.home.style.display='none';
    $.detail.style.display='';
    const b=backdrop(m.backdrop_path);
    if(b)$.dHero.style.backgroundImage='url('+b+')';
    const t=s.type==='tv'?m.name||'':m.title||'';
    const d=s.type==='tv'?m.first_air_date:m.release_date;
    $.dTitle.textContent=t;
    $.dRating.innerHTML=m.vote_average?'&#9733; '+m.vote_average.toFixed(1):'';
    $.dYear.textContent=d?d.split('-')[0]:'';
    $.dRuntime.textContent=m.runtime?m.runtime+' min':'';
    $.dDesc.textContent=m.overview||'No description available.';
    $.dTags.innerHTML='';
    if(m.genre_ids){
        m.genre_ids.forEach(g=>{
            const el=document.createElement('span');
            el.className='tag';
            el.textContent=gn(g);
            $.dTags.appendChild(el);
        });
    }
    $.dPlay.onclick=()=>{
        if(s.type==='tv'){playTv(m,1,1);loadSeasons(m)}
        else playMovie(m);
    };
    const ep=s.type==='tv'?'/tv/'+m.id+'/similar':'/movie/'+m.id+'/similar';
    const sd=await tmdb(ep,{page:1});
    $.simGrid.innerHTML='';
    if(sd&&sd.results)sd.results.slice(0,12).forEach(x=>$.simGrid.appendChild(card(x)));
}

const genres={
    28:'Action',12:'Adventure',16:'Animation',35:'Comedy',
    80:'Crime',99:'Documentary',18:'Drama',10751:'Family',
    14:'Fantasy',36:'History',27:'Horror',10402:'Music',
    9648:'Mystery',10749:'Romance',878:'Sci-Fi',10770:'TV Movie',
    53:'Thriller',10752:'War',37:'Western'
};
function gn(id){return genres[id]||'Unknown'}

function events(){
    document.querySelectorAll('.nav-link').forEach(link=>{
        link.addEventListener('click',e=>{
            e.preventDefault();
            const cat=link.dataset.category;
            const type=link.dataset.type||'movie';
            s.type=type;s.category=cat;s.page=1;
            document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
            link.classList.add('active');
            secTitle(cat,type);
            // close mobile nav if open
            closeNav();
            goHome();
            load(cat);
        });
    });

    $.search.addEventListener('keydown',e=>{
        if(e.key==='Enter')search($.search.value);
    });
    $.searchClear.addEventListener('click',()=>{
        $.search.value='';
        search('');
    });
    $.searchToggle.addEventListener('click',()=>{
        $.searchBar.classList.toggle('open');
        if($.searchBar.classList.contains('open')){
            $.search.focus();
            closeNav();
        }
    });

    $.loadBtn.addEventListener('click',()=>{
        s.page++;
        load(s.category,s.page,true);
    });

    $.season.addEventListener('change',()=>{
        s.season=parseInt($.season.value);s.episode=1;
        if(s.movie){
            loadEps(s.movie.id,s.season);
            const p=tProv[s.provIdx];
            $.frame.src=p.url(s.imdbId,s.movie.id,s.season,s.episode);
        }
    });
    $.episode.addEventListener('change',()=>{
        s.episode=parseInt($.episode.value);
        if(s.movie){
            const p=tProv[s.provIdx];
            $.frame.src=p.url(s.imdbId,s.movie.id,s.season,s.episode);
        }
    });
    $.mClose.addEventListener('click',closePlayer);
    document.addEventListener('keydown',e=>{
        if(e.key==='Escape'){
            if($.modal.classList.contains('active'))closePlayer();
            else if($.detail.style.display!=='none')goHome();
        }
    });

    // Mobile menu
    $.menuBtn.addEventListener('click',()=>{
        $.menuBtn.classList.toggle('active');
        $.nav.classList.toggle('open');
        $.overlay.classList.toggle('active');
        $.searchBar.classList.remove('open');
        document.body.style.overflow=$.nav.classList.contains('open')?'hidden':'';
    });
    $.overlay.addEventListener('click',closeNav);
    window.addEventListener('resize',()=>{
        if(window.innerWidth>=769)closeNav();
    });
}

function closeNav(){
    $.menuBtn.classList.remove('active');
    $.nav.classList.remove('open');
    $.overlay.classList.remove('active');
    document.body.style.overflow='';
}

// Lightweight adblock detection (no API overrides, no MutationObserver)
function detectUblock(){
    return new Promise(resolve=>{
        const b=document.createElement('div');
        b.innerHTML='&nbsp;';
        b.className='adsbox ad-banner advertisement pub300x250';
        b.style.cssText='position:fixed;left:-9999px;width:1px;height:1px;overflow:hidden;pointer-events:none';
        document.body.appendChild(b);
        requestAnimationFrame(()=>{
            requestAnimationFrame(()=>{
                const blocked=!b||b.offsetHeight===0||b.clientHeight===0||
                    getComputedStyle(b).display==='none'||
                    getComputedStyle(b).visibility==='hidden';
                if(b.parentNode)b.parentNode.removeChild(b);
                resolve(blocked);
            });
        });
    });
}

function ublockBrowser(){
    const ua=navigator.userAgent;
    if(ua.includes('Firefox')&&!ua.includes('Seamonkey'))return 'firefox';
    if(ua.includes('Edg'))return 'edge';
    if(ua.includes('OPR')||ua.includes('Opera'))return 'opera';
    if(ua.includes('Brave'))return 'brave';
    if(ua.includes('Vivaldi'))return 'vivaldi';
    if(ua.includes('Chrome')&&!ua.includes('Edg'))return 'chrome';
    if(ua.includes('Safari')&&!ua.includes('Chrome'))return 'safari';
    return 'unknown';
}

function ublockUrl(br){
    const u={
        chrome:'https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm',
        firefox:'https://addons.mozilla.org/addon/ublock-origin/',
        edge:'https://microsoftedge.microsoft.com/addons/detail/ublock-origin/odifjihjnamlecblkaacjpgmldfbggdn',
        opera:'https://addons.opera.com/extensions/details/ublock-origin/',
        brave:'https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm',
        vivaldi:'https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm'
    };
    return u[br]||u.chrome;
}

function ublockName(br){
    const n={chrome:'Chrome',firefox:'Firefox',edge:'Edge',opera:'Opera',brave:'Brave',vivaldi:'Vivaldi',safari:'Safari',unknown:'your browser'};
    return n[br]||'your browser';
}

function showUblock(br){
    const m=id('ublockModal');
    if(!m)return;
    const btn=id('ublockInstallBtn');
    const skip=id('ublockSkip');
    const close=id('ublockClose');
    const browser=id('ublockBrowser');
    if(btn){
        btn.href=ublockUrl(br);
        btn.target='_blank';
        btn.rel='noopener';
    }
    if(browser)browser.textContent='Detected: '+ublockName(br);
    m.classList.add('active');
    document.body.style.overflow='hidden';
    if(btn)btn.onclick=()=>localStorage.setItem('ublock_prompted','1');
    if(skip)skip.onclick=()=>{hideUblock();localStorage.setItem('ublock_prompted','1')};
    if(close)close.onclick=hideUblock;
}

function hideUblock(){
    const m=id('ublockModal');
    if(m)m.classList.remove('active');
    document.body.style.overflow='';
}

async function checkUblock(){
    const br=ublockBrowser();
    if(br==='safari'||br==='unknown'){hideUblock();return}
    // Skip on iOS/Safari entirely
    if(/iPad|iPhone|iPod/.test(navigator.userAgent)){hideUblock();return}
    const has=await detectUblock();
    if(has){localStorage.removeItem('ublock_prompted');hideUblock();return}
    if(localStorage.getItem('ublock_prompted')==='1'){hideUblock();return}
    showUblock(br);
}

function init(){
    initEls();
    setupPlayerRetry();
    events();
    checkUblock();
    load('popular');
}

function setupPlayerRetry(){
    let timer=0;
    $.frame.addEventListener('load',function(){
        clearTimeout(timer);
        timer=setTimeout(()=>{
            try{
                const loc=this.contentWindow.location.href;
                if(loc==='about:blank'||loc===''){
                    s.provIdx++;
                    const p=s.type==='tv'?tProv:prov;
                    if(s.provIdx>=p.length)s.provIdx=0;
                    const m=s.movie;
                    if(m)$.frame.src=p[s.provIdx].url(s.imdbId,m.id,s.season,s.episode);
                    updateBtns();
                }
            }catch(e){}
        },5000);
    });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();

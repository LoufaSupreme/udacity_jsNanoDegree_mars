// global state of app:
let store = Immutable.Map({
    header: "PROJECT RED ROVER",
    view: 'intro',
    loading_msg: '',
    apod: '',
    rovers: ['Curiosity', 'Perseverance'],
    activeRover: 'None',
    imagePage: 0,
    roverPhotos: [],
    photoSelection: 'latest',
    photoAmount: 27,
    manifest: {
        Perseverance: {
            status: 'Active',
            launch_date: '07/30/2020',
            land_date: '02/18/2021',
            cost: '$2.4 Billion USD',
            weight: '4,060.5 kilograms',
            max_speed: '0.12 km/hr',
            objective: 'Seak signs of ancient life and collect samples of rock and regolith for possible Earth return.'
        },
        Curiosity: {
            status: 'Active',
            launch_date: '11/26/2011',
            land_date: '08/06/2012',
            cost: '$2.5 Billion USD',
            weight: '899 kilograms',
            max_speed: '0.14 km/hr',
            objective: 'Determine if Mars was ever able to support microbial life.'
        }
    },
    earthImg: {},
});

// grab main html element to add content to:
const root = document.getElementById('root');

// update app's state:
const updateStore = (state, newState) => {
    store = state.merge(newState)
    render(root, store)
}

// update app's state w/o re-rendering
const updateStoreNoRender = (state, newState) => {
    store = state.merge(newState);
}

// render html:
const render = async (root, state) => {
    root.innerHTML = App(state);
    addListeners(root, state);
}

// create content
const App = (state) => {

    // grab objects from state (Immutable.JS):
    const rovers = state.get('rovers');
    const apod = state.get('apod');
    const manifest = state.get('manifest');
    const loading_msg = state.get('loading_msg');
    const activeRover = state.get('activeRover');
    const view = state.get('view');
    const earthImg = state.get('earthImg');

    // this is where the main content of the page is generated:
    
    if (view === 'intro') {
        return `
            <header></header>
            <main>
                <section id="intro-container">
                    <div id="intro-title">Project Red Rover</div>
                    <div id="intro-blurb">
                        Explore Space with NASA
                    </div>
                    <div class="intro-btn-container">
                        ${makeIntroBtns()}
                    </div>
                </section>
                <footer>Copyright © Davis Innovations | Data from NASA</footer>
            </main>
        `;
    }
    else if (view === 'apod') {
        return `
        <header>${makeBackBtn()}</header>
        <main>
            ${Header(state.get('header'))}
            <section id="apod-container">
                ${ImageOfTheDay(apod)}
            </section>
            <footer>Copyright © Davis Innovations | Data from NASA</footer>
        </main>
        `;
    }
    else if (view === 'rover-selection') {
        return `
            <header>${makeBackBtn()}</header>
            <main>
                ${Header(state.get('header'))}
                <section class="btn-container">
                    ${makeButtons(rovers, 'large')}
                </section>
                <footer>Copyright © Davis Innovations | Data from NASA</footer>
            </main>
        `;
    }
    else if (view === 'rovers') {
        return `
            <header>${makeBackBtn()}</header>
            ${makeModal()}
            <main>
                ${Header(state.get('header'))}
                <section class="btn-container">
                    ${makeButtons(rovers, 'small')}
                </section>
                <section class="specs-container">
                    ${writeMessage(loading_msg)}
                    ${roverSpecs(manifest, activeRover, mkSpan, wrapStatus)}
                </section>
                <div class="filter-btn-container"></div>
                <section>
                    ${showPhotos(state)}
                </section>
                <footer>Copyright © Davis Innovations | Data from NASA</footer>
            </main>
        `;
    }
    else if (view === 'earth') {
        return `
            <header>${makeBackBtn()}</header>
            <main>
                ${Header(state.get('header'))}
                <section id="content">
                    ${earthPhoto(earthImg, mkSpan)}
                </section>
                <footer>Copyright © Davis Innovations | Data from NASA</footer>
            </main>
        `;
    }
}


// ------------------------------------------------------  COMPONENTS

// Pure function that renders conditional information
const Header = (title) => {
    if (title) return `<h1>${title}</h1>`;
    
    return `<h1>Mars Rover API</h1>`;
}

// create buttons for each view of the single-page application
const makeIntroBtns = () => {
    return `
        <div class="intro-btn" id="apod-btn" data-view="apod" onclick="changeView(this.dataset.view, store)">
            <div class="intro-btn-text">
                Astronomy Photo of the Day
            </div>
        </div>
        <div class="intro-btn" id="rovers-btn" data-view="rover-selection" onclick="changeView(this.dataset.view, store)">
            <div class="intro-btn-text">
                Mars Rovers
            </div>
        </div>
        <div class="intro-btn" id="earth-btn" data-view="earth" onclick="changeView(this.dataset.view, store)">
            <div class="intro-btn-text">
                Earth
            </div>
        </div>
    `;
}

// change the "view" and title according to which intro btn was clicked
const changeView = (view, state) => {
    if (view === 'apod') {
        history.pushState({view: view}, '', 'apod');  //modifies url bar
        state = state.set('header', 'Astronomy Photo of the Day');
        state = state.set('view', 'apod');
        updateStore(store, state);
    }
    else if (view === 'rover-selection') {
        history.pushState({view: view}, '', 'mars_rovers'); //modifies url bar
        state = state.set('header', 'Mars Rovers');
        state = state.set('view', 'rover-selection');
        updateStore(store, state);
    }
    else if (view === 'rovers') {
        history.pushState({view: view}, '', 'mars_rovers'); //modifies url bar
        state = state.set('header', 'Mars Rovers');
        state = state.set('view', 'rovers');
        updateStore(store, state);
    }
    else if (view === 'earth') {
        history.pushState({view: view}, '', 'Earth'); //modifies url bar
        state = state.set('header', 'Earth');
        state = state.set('view', 'earth');
        updateStore(store, state);
    }
    else if (view === 'intro') {
        history.pushState({view: view}, '', ''); //modifies url bar
        state = state.set('view', 'intro');
        updateStore(store, state);
    }
    else {
        console.log('Error. No view specified on element.');
    }
}

// creates a back button that returns user back to landing page ('intro'):
const makeBackBtn = () => {
    return `<button id="back-btn" onclick="backToIntro(store)">Back</button>`;
}

// resets view back to 'intro'
const backToIntro = (state) => {
    history.replaceState({view: 'intro'}, '', '/');
    state = state.set('view', 'intro');
    updateStore(store, state);
}

// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = (apod) => {

    // If image does not already exist, or it is not from today -- request it again
    const today = new Date();

    if (!apod || apod.date === today.getDate() ) {
        getImageOfTheDay(store);
        return '';
    }

    // check if the photo of the day is actually type video!
    if (apod.image.media_type === "video") {
        return (`
            <iframe title="vimeo-player" src="${apod.image.url}" max-width="100%" min-height="350" frameborder="0" allowfullscreen></iframe>
            
            <p id="apod-alt-link">Can't see the video? Go <a id="apod-video-link" href="${apod.image.url}">here</a> to check it out!</p>
            <h2 id="apod-title">${apod.image.title}</h2>
            <p id="apod-text">${apod.image.explanation}</p>
        `)
    } else {
        return (`
            <img id="apod-img" src="${apod.image.url}"/>
            <p id="apod-text">${apod.image.explanation}</p>
        `)
    }
}

const earthPhoto = (earthImg, fn) => {

    if (Object.keys(earthImg).length === 0) {
        getEarthPhoto(store);
        return '';
    } else {
        return `
        <img id="earth-img" src="${earthImg.url}"/>
        <div class="earth-info-container">
            <div id="earth-caption">${earthImg.caption}.</div>
            <div>${fn('Date:', 'earth-info')} ${earthImg.date}</div>
            <div>${fn('Colour:', 'earth-info')} ${earthImg.style}</div>
            <div class="earth-coords">
                ${fn('Centroid Coordinates:', 'earth-info')}
                <ul>
                    <li>${fn('Latitude:', 'earth-info-sm')} ${earthImg.lat}</li>
                    <li>${fn('Longitude:', 'earth-info-sm')} ${earthImg.lon}</li>
                </ul> 
            </div>
        </div>
        `;
    }
}

// displays manifest info for the selected rover
const roverSpecs = (manifest, activeRover, span, wrap) => {
    if (!manifest || activeRover === 'None') {
        return "";
    }

    manifest = manifest[activeRover]; 
    
    const launch_date = new Date(manifest.launch_date.replace(/-/g, '/'));
    const land_date = new Date(manifest.land_date.replace(/-/g, '/'));
    const latest_date = new Date();
    const flight_time = (land_date.getTime() - launch_date.getTime()) / (1000*60*60*24);
    const mission_duration = (latest_date.getTime() - land_date.getTime()) / (1000*60*60*24);

    return (`
        <div>
            <div class="specs-title">Mars Rover: ${activeRover}</div>
            <ul>
                <li>
                    ${span('Mission Status:','label')} ${wrap(manifest.status)}
                </li>
                <li>
                    ${span('Launched from Earth:', 'label')} ${launch_date.toDateString()}
                </li>
                <li>
                    ${span('Landed on Mars:', 'label')} ${land_date.toDateString()}
                </li>
                <li>
                    ${span('Flight Time:','label')} ${Math.round(flight_time)} days
                </li>
                <li>
                    ${span('Elapsed Mission Duration:','label')} ${formatNumber(Math.round(mission_duration))} days (${(mission_duration / 365).toFixed(1)} years)
                </li>
                <li>
                    ${span('Top Speed:','label')} ${manifest.max_speed}
                </li>
                <li>
                    ${span('Weight:','label')} ${manifest.weight}
                </li>
                <li>
                    ${span('Cost:','label')} ${manifest.cost}
                </li>
                <li>
                    ${span('Objective:','label')} ${manifest.objective}
                </li>
            </ul>
        </div>
    `)
}

const months = {
    0: 'January',
    1: 'February',
    2: 'March',
    3: 'April',
    4: 'May',
    5: 'June',
    6: 'July',
    7: 'August',
    8: 'September',
    9: 'October',
    10: 'November',
    11: 'December',
}

// takes an array of image objects from Nasa and returns html
const imgHandler = (photo_array) => {
   
    const pics = photo_array
        .map(pic => {
            const d = new Date(pic.date_taken);
            const date = formatDate(d);
            return (`
                <div class="img-date-box">
                    <div class="img-container">
                        <img src="${pic.img_large_URL}" class="photo" title="Sol ${pic.sol} from rover's ${pic.instrument}"/>
                    </div>
                    <div id="pic-date">${date}</div>
                </div>
            `);
        })
        .reduce((html, img) => {
            return html + img;
        },'');

    return pics;
}

// create rover selection buttons on the screen
const makeButtons = (rovers, size) => {
    const html = rovers.reduce((html, rover) => {
        return html + `
            <div class="btn rover-btn ${size === 'small' ? 'row' : ''}" data-name="${rover}">
                <div class='rover-btn-img-container ${size === 'small' ? 'small' : ""}'>
                    <img class='rover-btn-img' src='./assets/images/${rover}-rover.png'</img>
                </div>
                <div class='rover-btn-name'>${rover}</div>
            </div>`;
    },'');
    
    return (`
        <div class="btn-container">${html}</div>
    `);
}

// makes a Next Page and Prev Page button at bottom of page
// calls the getNextPage and getPrevPage function
const makeMoreBtn = (state) => {
    const photos = state.get('roverPhotos');
    const num_photos = state.get('photoAmount');
    const pageIndex = state.get('imagePage');

    return `
        <div class="more-btn-container">
            <button class="nav-btn prev-btn" value="prev"">Prev</button>

            <span id="page-num">Photos ${pageIndex*num_photos+1}-${pageIndex*num_photos+num_photos} </span>

            <button class="nav-btn next-btn" value="next">Next</button>
        </div>
    `;
}

// display a loading message while the API fetches data:
const writeMessage = (msg) => {
    if (!msg) {
        return '';
    }
    return `<div class="loading-msg">${msg}</div>`;
}

// create a loading message and add it to store
const setMessage = (state, name, msg = null) => {
    if (!msg) msg = `Red Rover, Red Rover, Send ${mkSpan(name, 'loading-name')} On Over...[LOADING]`;

    state = state.set('loading_msg', msg);
    updateStore(store, state);
}

// reset the pageIndex
const resetPageIndex = (state, index) => {
    state = state.set('imagePage', index);
    updateStore(store, state);
}

// set the active rover
const setRover = (state, name) => {
    console.log(`Setting rover name to ${name}`);
    state = state.set('activeRover', name);
    updateStore(store, state);
}

// create a modal div (for full sized image viewing)
const makeModal = () => {
    return `
        <div class="modal">
            <img src="" alt="" class="full-img"/>
            <div class="caption"></div>
        </div>
    `;
}

// add event listeners to element on the screen
// this function is called in render
const addListeners = (root, state) => {
    
    // rover buttons:
    if (state.get('view') === 'rovers' || state.get('view') === 'rover-selection') {
        const buttons = root.querySelectorAll(".btn");
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                changeView('rovers', store);
                resetPageIndex(store, 0);
                setMessage(store, e.target.dataset.name);
                roverCall(store, e.target.dataset.name);
            });
        });

        // next and prev image page btns
        const prevs = root.querySelectorAll('.prev-btn');
        const nexts = root.querySelectorAll('.next-btn');
        nexts.forEach(btn => {
            btn.addEventListener('click', (e) => {
                setMessage(store, store.get('activeRover'), "One moment...contacting space...")
                getNextPage(state);
            });
        });
        prevs.forEach(btn => {
            btn.addEventListener('click', (e) => {
                getPrevPage(state);
            });
        })
    }

    // full sized image modal
    // set to hidden if clicked on by removing class "open"
    if (state.get('view') === 'rovers') {
        const modal = root.querySelector('.modal');
        modal.addEventListener('click', (e) => {
            // if (e.target.classList.contains('modal')) {
                modal.classList.remove('open');
            // }
        });
    }

    // rover photos:
    const photos = root.querySelectorAll(".photo");
    photos.forEach(pic => {
        pic.addEventListener('click', (e) => {
            const modal = document.querySelector('.modal');
            const modal_img = modal.querySelector('.full-img');
            const caption = modal.querySelector('.caption');
            
            // find photo 
            const photos = state.get('roverPhotos');
            const photo = photos.filter((pic) => {
                return pic.img_large_URL === e.target.src;
            });
            
            // adjust modal
            modal.classList.add('open');
            modal_img.classList.add('open');
            modal_img.src = photo[0].img_large_URL;

            //adjust modal caption
            caption.innerHTML = `
                <p>${photo[0].caption}</p>
            `;
        })
    })
}

// ------------------------------------------------------  HELPER FUNCTIONS

// inserts commas to separate thousands:
// source: https://blog.abelotech.com/posts/number-currency-formatting-javascript/
function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  }

// wraps a span w/ a specified class name around an item:
function mkSpan(item, class_name) {
    return `<span class="${class_name}">${item}</span>`;
}

function formatDate(dateObj) {
    let hours = dateObj.getHours() % 12;
    hours = hours == 0 ? 12 : hours;

    let mins = dateObj.getMinutes();
    mins = mins < 10 ? `0${mins}` : mins;

    const meridian = dateObj.getHours() >= 12 ? "PM" : "AM";
    const month = months[dateObj.getMonth()];
    const day = dateObj.getDay();
    const year = dateObj.getFullYear();

    const date = `${hours}:${mins}${meridian} ${month} ${day}, ${year}`
    return date;
}

// takes the mission status and wraps it in a span depending on the value:
function wrapStatus(status) {
    // capitalize first letter
    const mission_status = status.replace(/^\w/, (c) => c.toUpperCase()); 

    if (status == "active") {
        return mkSpan(mission_status, 'active');
    } else {
        return mkSpan(mission_status, 'inactive');
    }
}

const photoLabel = (photoSelection) => {
    if (photoSelection === 'latest') {
        return `<div>${mkSpan('Latest Photos', 'photo-box-label')}</div>`;
    } else {
        return `<div>${mkSpan('All Photos', 'photo-box-label')}</div>`;
    }
}

// displays array of photos from a rover:
const showPhotos = (state) => {
    const photoAmount = state.get('photoAmount');
    const photos = state.get('roverPhotos').slice(-photoAmount);
    const loadingMsg = state.get('loading_msg');
    const selection = state.get('photoSelection');
    
    if (photos.length === 0 || loadingMsg !== "") {
        return "";
    }
    else {
        return `
            <div class="pic-container">
                <div id="photo-box-label-container">
                    ${photoLabel(selection)}
                    ${makeMoreBtn(state)}
                </div>
                ${imgHandler(photos)}
                <div id="photo-box-label-container">
                    ${makeMoreBtn(state)}
                </div>
            </div>
        `;
    }
}


// ------------------------------------------------------  API CALLS

// activated when the Next Page button is clicked
// gets the next set of photos from the rover by making another API call
const getNextPage = async (state) => {
    const roverName = state.get('activeRover');
    const numPics = state.get('photoAmount');
    let page = state.get('imagePage') + 1;

    let photos = [];
    if (roverName === 'Curiosity') {
        photos = await getCuriosityImages(numPics, page);
    }
    else if (roverName === 'Perseverance') {
        photos = await getPerseveranceImages(numPics, page);
    }
    
    state = state
        .set('roverPhotos', [...state.get('roverPhotos'), ...photos])
        .set('imagePage', page);

    updateStore(store, state);
}

// deletes the last "photoAmount" of photos from the array
const getPrevPage = (state) => {
    const deleteNum = state.get('photoAmount');
    let photos = state.get('roverPhotos');
    let page = state.get('imagePage') - 1;
    
    // if the photo array is > 27 pics, then delete the last 27 images
    if (photos.length > deleteNum) {
        photos = photos.splice(0, photos.length-deleteNum);
    }

    state = state
        .set('roverPhotos', photos)
        .set('imagePage', page);

    updateStore(store, state);
}

// Example API call
const getImageOfTheDay = (state) => {

    console.log('Fetching APOD');
    const apod = state.get('apod');

    fetch(`/api/apod`)
        .then(res => res.json())
        .then(apod => {
            state = state.set('apod', apod);
            updateStore(store, state)
        });

    return apod;
}

// API call to get Earth image:
const getEarthPhoto = async (state) => {

    console.log('Fetching Earth image.');
    // const earth_img = state.get('earthImg');

    const earth_img = await fetch('/api/earth')
        .then(res => res.json())
        .then(img => {
            state = state.set('earthImg', img);
            updateStore(store, state);
        })
        .catch(err => console.log(err));
    
    return earth_img;
}

// API call to get Perseverance rover images
const getPerseveranceImages = async (numPics, page) => {
    console.log(`Fetching ${numPics} images for Rover Perseverance`);

    const roverPhotos = await fetch(`/api/photos/perseverance/${numPics}/${page}`)
        .then(res => res.json())
        .then(res => res.data.images)
        .catch(err => console.log(err));

    const normalizedPhotos = roverPhotos.map(curr => {
        const normalized = {
            rover: 'perseverance',
            image_ID: curr.imageid,
            sol: curr.sol,
            img_large_URL: curr.image_files.full_res,
            img_small_URL: curr.image_files.medium,
            instrument: curr.camera.instrument,
            date_taken: curr.date_taken_utc,
            date_received: curr.date_received,
            title: curr.title,
            caption: curr.caption,
        };
        return normalized;
    });

    console.log('Perseverance images received');
    return normalizedPhotos;
}

// API call to get Curiosity rover images
const getCuriosityImages = async (numPics, page) => {
    console.log(`Fetching ${numPics} images for Rover Curiosity`);

    const roverPhotos = await fetch(`/api/photos/curiosity/${numPics}/${page}`)
        .then(res => res.json())
        .then(res => res.data.items)
        .catch(err => console.log(err));

    const normalizedPhotos = roverPhotos.map(curr => {
        const normalized = {
            rover: 'curiosity',
            image_ID: curr.id,
            sol: curr.sol,
            img_large_URL: curr.url,
            img_small_URL: "",
            instrument: curr.instrument,
            date_taken: curr.date_taken,
            date_received: curr.date_received,
            title: curr.title,
            caption: curr.description,
        };
        return normalized;
    });

    console.log('Curiosity images received');
    return normalizedPhotos;
}

// calls the NASA API multiple times 
// then takes the results of those API calls (promises) and updates the store once, so that there is only one re-render of the page.
const roverCall = async (state, activeRover) => {
    try {
        const numPics = state.get('photoAmount');
        const pageIndex = state.get('imagePage');
    
        if (activeRover === 'None') return;
    
        let photos = [];
        if (activeRover === 'Curiosity') {
            photos = await getCuriosityImages(numPics, pageIndex);
        }
        else {
            photos = await getPerseveranceImages(numPics, pageIndex);
        }
        
        state = state
            .set('loading_msg', '')
            .set('roverPhotos', photos)
            .set('activeRover', activeRover)
            .set('photoSelection', 'latest');

        updateStore(store, state);
    }
    catch(err) {
        console.error('Failed to fetch:', err);
    }
}

// ------------------------------------------------------  RUN ON LOAD

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    history.pushState({view: 'intro'}, '', '');
    render(root, store);
});

// popstate executes when browser back btn is pressed. This will return user to intro landing page.  Works in conjunction with history.pushState();
window.addEventListener('popstate', (e) => {
    const view = e.state.view;
    changeView(view, store);
});

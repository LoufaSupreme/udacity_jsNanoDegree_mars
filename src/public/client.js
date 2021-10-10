// global state of app:
let store = Immutable.Map({
    header: "PROJECT RED ROVER",
    view: 'intro',
    loading_msg: '',
    apod: '',
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
    activeRover: 'None',
    roverPhotos: [],
    photoSelection: 'latest',
    photoAmount: 25,
    manifest: '',
    earthImg: {},
});

// grab main html element to add content to:
const root = document.getElementById('root');

// update app's state:
const updateStore = (state, newState) => {
    store = state.merge(newState)
    render(root, store)
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
                        Explore Space with the NASA API
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
            <section id="">
                ${ImageOfTheDay(apod)}
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
                    ${makeButtons(rovers)}
                </section>
                <section class="specs-container">
                    ${writeMessage(loading_msg)}
                    ${roverSpecs(manifest)}
                </section>
                <div class="filter-btn-container">
                    ${makePhotoFilterBtns(activeRover)}
                </div>
                <section>
                    ${showPhotos(state)}
                </section>
                ${makeMoreBtn(state)}
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
                    ${earthPhoto(earthImg)}
                </section>
                <footer>Copyright © Davis Innovations | Data from NASA</footer>
            </main>
        `;
    }
}


// ------------------------------------------------------  COMPONENTS

// Pure function that renders conditional information -- THIS IS JUST AN EXAMPLE, you can delete it.
const Header = (title) => {
    if (title) return `<h1>${title}</h1>`;
    
    return `<h1>Mars Rover API</h1>`;
}

// create buttons for each view of the single-page application
const makeIntroBtns = () => {
    return `
        <div class="intro-btn" id="apod-btn" onclick="changeView(this, store)">
            <div class="intro-btn-text">
                Astronomy Photo of the Day
            </div>
        </div>
        <div class="intro-btn" id="rovers-btn" onclick="changeView(this, store)">
            <div class="intro-btn-text">
                Mars Rovers
            </div>
        </div>
        <div class="intro-btn" id="earth-btn" onclick="changeView(this, store)">
            <div class="intro-btn-text">
                Earth
            </div>
        </div>
    `;
}

// change the "view" and title according to which intro btn was clicked
const changeView = (elem, state) => {
    if (elem.id === 'apod-btn') {
        state = state.set('header', 'Astronomy Photo of the Day');
        state = state.set('view', 'apod');
        updateStore(store, state);
    }
    else if (elem.id === 'rovers-btn') {
        state = state.set('header', 'Mars Rovers');
        state = state.set('view', 'rovers');
        updateStore(store, state);
    }
    else if (elem.id === 'earth-btn') {
        // history.pushState(null, '', 'test');
        state = state.set('header', 'Earth');
        state = state.set('view', 'earth');
        updateStore(store, state);
    }
    else {
        console.log('Error. No ID on element.');
    }
}

// creates a back button that returns user back to landing page ('intro'):
const makeBackBtn = () => {
    return `<button id="back-btn" onclick="backToIntro(store)">Back</button>`;
}

// resets view back to 'intro'
const backToIntro = (state) => {
    state = state.set('view', 'intro');
    updateStore(store, state);
}

// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = (apod) => {

    // If image does not already exist, or it is not from today -- request it again
    const today = new Date();
    const photodate = new Date(apod.date);

    if (!apod || apod.date === today.getDate() ) {
        getImageOfTheDay(store);
        return '';
    }

    // check if the photo of the day is actually type video!
    if (apod.media_type === "video") {
        return (`
            <p>See today's featured video <a href="${apod.url}">here</a></p>
            <p>${apod.title}</p>
            <p>${apod.explanation}</p>
        `)
    } else {
        return (`
            <img src="${apod.image.url}" height="350px" width="100%" />
            <p id="apod-text">${apod.image.explanation}</p>
        `)
    }
}

const earthPhoto = (earthImg) => {

    if (Object.keys(earthImg).length === 0) {
        getEarthPhoto(store);
        return '';
    } else {
        return `
        <img src="${earthImg.url}" height="auto" width="100%" />
        <div class="earth-info-container">
            <div id="earth-caption">${earthImg.caption}.</div>
            <div>${mkSpan('Date:', 'earth-info')} ${earthImg.date}</div>
            <div class="earth-coords">
                ${mkSpan('Centroid Coordinates:', 'earth-info')}
                <ul>
                    <li>${mkSpan('Latitude:', 'earth-info-sm')} ${earthImg.lat}</li>
                    <li>${mkSpan('Longitude:', 'earth-info-sm')} ${earthImg.lon}</li>
                </ul> 
            </div>
        </div>
        `;
    }
}

// displays manifest info for the selected rover
const roverSpecs = (manifest) => {
    if (!manifest) {
        return "";
    }
    
    const launch_date = new Date(manifest.launch_date.replace(/-/g, '/'));
    const land_date = new Date(manifest.landing_date.replace(/-/g, '/'));
    const latest_date = new Date(manifest.latest_date.replace(/-/g, '/'));
    const flight_time = (land_date.getTime() - launch_date.getTime()) / (1000*60*60*24);
    const mission_duration = (latest_date.getTime() - land_date.getTime()) / (1000*60*60*24);

    return (`
        <div>
            <div class="specs-title">Mars Rover: ${manifest.name}</div>
            <ul>
                <li>
                    ${mkSpan('Launched from Earth:', 'label')} ${launch_date.toDateString()}
                </li>
                <li>
                    ${mkSpan('Landed on Mars:', 'label')} ${land_date.toDateString()}
                </li>
                <li>
                    ${mkSpan('Flight Time:','label')} ${Math.round(flight_time)} days
                </li>
                <li>
                    ${mkSpan('Latest Day on Mars:','label')} ${latest_date.toDateString()} (Sol ${formatNumber(manifest.latest_sol)})
                </li>
                <li>
                    ${mkSpan('Elapsed Mission Duration:','label')} ${formatNumber(Math.round(mission_duration))} days (${(mission_duration / 365).toFixed(1)} years)
                </li>
                <li>
                    ${mkSpan('Mission Status:','label')} ${wrapStatus(manifest.status)}
                </li>
                <li>
                    ${mkSpan('Total Photos Taken:','label')} ${formatNumber(manifest.total_photos)}
                </li>
            </ul>
        </div>
    `)
}

// takes an array of image objects from Nasa and returns html
const imgHandler = (photo_array, amount) => {
   
    const pics = photo_array
        // .sort((a,b) => a.id > b.id ? -1 : 1)
        .slice(-amount)  // take only the amount to be displayed
        .map(pic => {
            return (`
                <div class="img-date-box">
                    <div class="img-container">
                        <img src="${pic.img_src}" class="photo" title="Sol ${pic.sol} from ${pic.rover.name}'s ${pic.camera.name}"/>
                    </div>
                    <div id="pic-date">${pic.earth_date}</div>
                </div>
            `);
        })
        .reduce((html, img) => {
            return html + img;
        },'');

    return pics;
}

// create rover selection buttons on the screen
const makeButtons = (rovers) => {
    const html = rovers.reduce((html, rover) => {
        return html + `<div class="btn" data-name="${rover}">${rover}</div>`;
    },'');
    
    return (`
        <div class="btn-container">${html}</div>
    `);
}

// create buttons that change which rover photos are shown
// only show the buttons if a rover is selected (i.e. activeRover is not None)
const makePhotoFilterBtns = (activeRover) => {
    
    if (activeRover === 'None') {
        return '';
    }

    return `
        <button class="filter-btn" value="latest" onclick="filterPhotos(this.value, store)">Latest Photos</button>
        <button class="filter-btn" value="all" onclick="filterPhotos(this.value, store)">All Photos</button>
    `
}

// makes a Next Page and Prev Page button at bottom of page
// calls the getNextPage and getPrevPage function
const makeMoreBtn = (state) => {
    const tag = state.get('photoSelection');
    const tot_photos = state.get('manifest').total_photos;
    const photos = state.get('roverPhotos');
    const num_photos = state.get('photoAmount');
    
    if (tag != 'all') {
        return '';
    }

    return `
        <div class="more-btn-container">
            <button class="nav-btn prev-btn" value="prev" onclick="getPrevPage(store)">Prev Page</button>

            <span id="page-num">Photos ${photos.length-num_photos+1}-${photos.length} of ${formatNumber(tot_photos)} </span>

            <button class="nav-btn next-btn" value="next" onclick="getNextPage(store)">Next Page</button>
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
const setMessage = (state, name) => {
    const msg = `Red Rover, Red Rover, Send ${mkSpan(name, 'loading-name')} On Over...[LOADING]`;

    state = state.set('loading_msg', msg);
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
    if (state.get('view') === 'rovers') {
        const buttons = root.querySelectorAll(".btn");
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                setMessage(state, e.target.dataset.name);
                roverCall(state, e.target.dataset.name);
            });
        });
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
            
            // adjust modal
            modal.classList.add('open');
            modal_img.classList.add('open');
            modal_img.src = e.target.src;

            //adjust modal caption
            const photos = state.get('roverPhotos');
            const photo = photos.filter((pic) => {
                return pic.img_src === e.target.src;
            });
            caption.innerHTML = `
                <p>Captured By: ${photo[0].rover.name}'s ${photo[0].camera.name} (${photo[0].camera.full_name})</p>
                <p>Date: ${photo[0].earth_date} (Sol ${photo[0].sol})</p>
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
    const photos = state.get('roverPhotos');
    const amount = state.get('photoAmount');
    const selection = state.get('photoSelection');
    
    if (photos.length === 0) {
        return "";
    }
    else {
        return `
            <div class="pic-container">
                <div id="photo-box-label-container">
                    ${photoLabel(selection)}
                    ${makeMoreBtn(state)}
                </div>
                ${imgHandler(photos, amount)}
            </div>
        `;
    }
}

// runs if "latest Photos", or "all photos" btns are clicked.
// grabs photos from relevant API path
const filterPhotos = async (tag, state) => {
    const roverName = state.get('manifest').name;
    const latest_date = state.get('manifest').latest_date;
    const numPhotosToDisplay = state.get('photoAmount');

    // show latest photos:
    if (tag === 'latest') {
        const photos = await getLatestPhotos(roverName);
        state = state.set('roverPhotos', photos);
        state = state.set('photoSelection', tag);
        updateStore(store, state);    
    } 
    // show all photos (up to numPhotosToDisplay):
    else if (tag === 'all') {
        setMessage(state, roverName);
        const photos = await getNumPhotos(roverName, latest_date, numPhotosToDisplay);
        state = state.set('roverPhotos', photos);
        state = state.set('photoSelection', tag);
        updateStore(store, state);    
    }
    else {
        return;
    }
}

// activated when the Next Page button is clicked
// gets the next set of photos from the rover by making another API call
const getNextPage = async (state) => {
    const roverName = state.get('manifest').name;
    const current_photos = state.get('roverPhotos');
    // find the latest date of the photos currently on the screen:
    const latest_date = current_photos[current_photos.length-1].earth_date;
    const numPhotos = state.get('photoAmount');
    // find the tot. # of photos taken on the latest date
    // this is important so that we can fetch atleast this many, so we know we always have new unique photos (otherwise could just keep fetching duplicates):
    const totPhotosThatDay = state.get('manifest').photo_info_list
        .find(sol => sol.earth_date === latest_date).total_photos;
    
    // we need to fetch a min. of either 2x the amount of photos currently displayed, or the total num of photos taken that day + num photos currently displayed
    // this will ensure that when we fetch a new batch of photos, even though we're starting at the first photo of the specified day, we'll fetch enough photos that atleast numPhotos of them will be unique (not duplicates):
    const numPicsToFetch = Math.max(numPhotos*2, totPhotosThatDay+numPhotos);

    // fetching way more than needed so if we got duplicates we can remove them and still have 100% new photos left over:
    const photos = await getNumPhotos(roverName, latest_date, numPicsToFetch);
    
    // filter returned photos array to remove photos already displayed:
    console.log('Filtering out duplicate images.');
    // have to map to a new array of IDs, b/c JS can't check equality of 2 objects:
    const filteredPhotos = photos.filter(pic => {
        const current_IDs = current_photos.map(p => p.id);
        return !current_IDs.includes(pic.id);
    });

    // pair it down to just the first results up to the specified number of photos to display:
    console.log('Pairing down to specified display number.');
    const finalPhotos = filteredPhotos.slice(0, numPhotos);
    finalPhotos.forEach(pic => current_photos.push(pic));

    state = state.set('roverPhotos', current_photos);
    updateStore(store, state);    
}

// deletes the last 25 (or w/e photoAmount is set to) photos from the array
const getPrevPage = (state) => {
    const deleteNum = state.get('photoAmount');
    let photos = state.get('roverPhotos');
    
    // if the photo array is > 25 pics, then delete the last 25 images
    if (photos.length > deleteNum) {
        photos = photos.splice(0, photos.length-deleteNum);
    }

    state = state.set('roverPhotos', photos);
    updateStore(store, state);
}

// ------------------------------------------------------  API CALLS

// Example API call
const getImageOfTheDay = (state) => {

    console.log('Fetching APOD');
    const apod = state.get('apod');

    fetch(`http://localhost:3000/apod`)
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

    const earth_img = await fetch('http://localhost:3000/earth')
        .then(res => res.json())
        .then(img => {
            state = state.set('earthImg', img);
            updateStore(store, state);
        })
        .catch(err => console.log(err));
    
    return earth_img;
}

// API call to get rover manifest info
const getManifest = async (roverName) => {

    console.log(`Fetching Manifest for Rover ${roverName}`);

    const manifest = await fetch(`http://localhost:3000/manifests/${roverName}`)
        .then(res => res.json())
        .then(res => {
            const info = res.data.photo_manifest;
            const roverManifest = {
                name: info.name,                    // rover name
                launch_date: info.launch_date,
                landing_date: info.landing_date,
                latest_date: info.max_date,         // latest earth date
                latest_sol: info.max_sol,           // latest mars day (sol)
                status: info.status,                // mission status
                total_photos: info.total_photos,    // tot # photos taken by rover
                photo_info_list: info.photos        // array of each sol with info on photos taken that sol
            }
            return roverManifest;
        })
        .catch(err => console.log(err));

    console.log('Manifest Received.')
    return manifest;
}

// API Call to get rover "latest_photos"
const getLatestPhotos = async (roverName) => {    

    console.log(`Fetching latest photos for Rover ${roverName}`);
    
    const roverPhotos = await fetch(`http://localhost:3000/latest_photos/${roverName}`)
        .then(res => res.json())
        .then(res => res.data.latest_photos)
        .catch(err => console.log(err));
    
    console.log('Latest Photos Received.')
    return roverPhotos;
}

// API call to get several days worth of pictures starting from the rover's most recent day on Mars
const getDaysOfPhotos = async (roverName, date, num_days) => {
    
    console.log(`Fetching ${num_days}days worth of images for Rover ${roverName}`);

    const photos = await fetch(`http://localhost:3000/photos/days/${roverName}/${date}/${num_days}`)
        .then(res => res.json())
        .then(data => data)
        .catch(err => console.log(err));
    
    console.log(`${num_days} days of photos received.`)
    return photos;
}

// API call to get a certain number of photos per rover, starting from a particular day.
const getNumPhotos = async (roverName, date, amount) => {

    console.log(`Fetching ${amount} images from Rover ${roverName}`);
    
    const photos = await fetch(`http://localhost:3000/photos/amount/${roverName}/${date}/${amount}`)
        .then(res => res.json())
        .then(data => data)
        .catch(err => console.log(err));

    console.log(`${amount} photos received.`)
    return photos;
}

// calls the NASA API multiple times 
// then takes the results of those API calls (promises) and updates the store once, so that there is only one re-render of the page.
const roverCall = async (state, roverName) => {
    const manifest = getManifest(roverName);
    const photos = getLatestPhotos(roverName);
    
    const promises = [manifest, photos];
    Promise.all(promises)
        .then(results => {
            state = state.set('manifest', results[0]);
            state = state.set('roverPhotos', results[1]);
            state = state.set('loading_msg', '');
            state = state.set('activeRover', roverName);
            state = state.set('photoSelection', 'latest');
            updateStore(store, state);
        })
        .catch(err => console.log(err));    
}


// ------------------------------------------------------  RUN ON LOAD

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    render(root, store);
})

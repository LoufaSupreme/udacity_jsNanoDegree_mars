// global state of app:
let store = Immutable.Map({
    header: { title: "PROJECT RED ROVER" },
    apod: '',
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
    activeRover: 'None',
    roverPhotos: [],
    photoSelection: 'latest',
    photoAmount: 25,
    manifest: '',
    loading_msg: '',
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
    const roverPhotos = state.get('roverPhotos');
    const manifest = state.get('manifest');
    const loading_msg = state.get('loading_msg');
    const activeRover = state.get('activeRover');
    const photoSelection = state.get('photoSelection');
    const photoAmount = state.get('photoAmount');

    // this is where the main content of the page is generated:
    return `
        <header></header>
        ${makeModal()}
        <main>
            ${Header(state.get('header').title)}
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
                ${showPhotos(roverPhotos, photoAmount)}
            </section>
            <div class="more-btn-container">
                ${makeMoreBtn(state)}
            </div>
            <footer>Copyright © Davis Innovations | Data from NASA</footer>
        </main>
    `
}


// ------------------------------------------------------  COMPONENTS

// Pure function that renders conditional information -- THIS IS JUST AN EXAMPLE, you can delete it.
const Header = (title) => {
    if (title) {
        return `
            <h1>${title}</h1>
        `
    }

    return `
        <h1>Mars Rover API</h1>
    `
}

// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = (apod) => {

    // If image does not already exist, or it is not from today -- request it again
    const today = new Date();
    const photodate = new Date(apod.date);
    console.log(photodate.getDate(), today.getDate());

    console.log(photodate.getDate() === today.getDate());
    if (!apod || apod.date === today.getDate() ) {
        getImageOfTheDay(store);
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
            <p>${apod.image.explanation}</p>
        `)
    }
}

// displays manifest info for the selected rover
const roverSpecs = (manifest) => {
    if (!manifest) {
        return "";
    }
    
    const launch_date = new Date(manifest.launch_date);
    const land_date = new Date(manifest.landing_date);
    const latest_date = new Date(manifest.latest_date);
    const flight_time = (land_date.getTime() - launch_date.getTime()) / (1000*60*60*24);
    const mission_duration = (latest_date.getTime() - land_date.getTime()) / (1000*60*60*24);

    return (`
        <div class="specs-title">Mars Rover: ${manifest.name}</div>
        <ul>
            <li>
                ${mkSpan('Launched from Earth:', 'label')} ${launch_date.toDateString()}
            </li>
            <li>
                ${mkSpan('Landed on Mars:', 'label')} ${land_date.toDateString()}
            </li>
            <li>
                ${mkSpan('Flight Time:','label')} ${flight_time} days
            </li>
            <li>
                ${mkSpan('Latest Day on Mars:','label')} ${latest_date.toDateString()} (Sol ${formatNumber(manifest.latest_sol)})
            </li>
            <li>
                ${mkSpan('Elapsed Mission Duration:','label')} ${formatNumber(mission_duration)} days (${(mission_duration / 365).toFixed(1)} years)
            </li>
            <li>
                ${mkSpan('Mission Status:','label')} ${wrapStatus(manifest.status)}
            </li>
            <li>
                ${mkSpan('Total Photos Taken:','label')} ${formatNumber(manifest.total_photos)}
            </li>
        </ul>
    `)
}

// takes an array of image objects from Nasa and returns html
const imgHandler = (photo_array, amount) => {
    const pics = photo_array
        .slice(-amount) 
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

    return (`
            <div class="pic-container">${pics}</div>
        `);
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
        <button class="prev-btn" value="prev" onclick="getPrevPage(store)">Prev Page</button>

        <span id="page-num">Photos ${photos.length-num_photos+1}-${photos.length} of ${formatNumber(tot_photos)} </span>

        <button class="next-btn" value="next" onclick="getNextPage(store)">Next Page</button>
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
    const buttons = root.querySelectorAll(".btn");
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            setMessage(state, e.target.dataset.name);
            roverCall(state, e.target.dataset.name);
        });
    });

    // full sized image modal
    // set to hidden if clicked on by removing class "open"
    const modal = root.querySelector('.modal');
    modal.addEventListener('click', (e) => {
        // if (e.target.classList.contains('modal')) {
            modal.classList.remove('open');
        // }
    });

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

// displays array of photos from a rover:
const showPhotos = (photos, amount) => {
    if (photos.length === 0) {
        return "";
    }
    else {
        return imgHandler(photos, amount);
    }
}

// runs if "latest Photos", "50 Photos" or "3 Days of Photos" btns are clicked.
// grabs photos from a different API path
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
    const latest_date = current_photos[current_photos.length-1].earth_date;
    const numPhotos = state.get('photoAmount');

    // fetch twice the amount of photos, starting at the latest earth day of the photos currently shown
    // fetching 2x the amount so that if we got 100% duplicates at first, we can remove them and still have 100% new photos left over
    const photos = await getNumPhotos(roverName, latest_date, numPhotos*2);
    
    // filter returned photos array to remove photos already displayed:
    console.log('Filtering out duplicate images.');
    const filteredPhotos = photos.filter(pic => !current_photos.includes(pic));

    // pair it down to just the first results up to the specified number of photos to display:
    console.log('Pairing down to specified display number.');
    const finalPhotos = filteredPhotos.slice(0, -numPhotos);

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
    let apod = state.get('apod');

    fetch(`http://localhost:3000/apod`)
        .then(res => res.json())
        .then(apod => {
            state = state.set('apod', apod);
            updateStore(store, state)
        });

    return apod;
}

// API call to get rover manifest info
const getManifest = async (roverName) => {

    console.log(`Fetching Manifest for Rover ${roverName}`);

    const manifest = await fetch(`http://localhost:3000/manifests/${roverName}`)
        .then(res => res.json())
        .then(res => {
            const info = res.data.photo_manifest;
            const roverManifest = {
                name: info.name,
                launch_date: info.launch_date,
                landing_date: info.landing_date,
                latest_date: info.max_date,
                latest_sol: info.max_sol,
                status: info.status,
                total_photos: info.total_photos
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
            updateStore(store, state);
        })
        .catch(err => console.log(err));    
}


// ------------------------------------------------------  RUN ON LOAD

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    render(root, store);
})

let store = Immutable.Map({
    header: { title: "PROJECT RED ROVER" },
    apod: '',
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
    roverPhotos: '',
    photoHistory: [],
    manifest: '',
});

// add our markup to the page
const root = document.getElementById('root');

const updateStore = (state, newState) => {
    store = state.merge(newState)
    render(root, store)
}

const render = async (root, state) => {
    root.innerHTML = App(state);
    addListeners(root);
}


// create content
const App = (state) => {
    // let { rovers, apod } = state
    const rovers = state.get('rovers');
    const apod = state.get('apod');
    const roverPhotos = state.get('roverPhotos');
    const photoHistory = state.get('photoHistory');
    const manifest = state.get('manifest');

    return `
        <header></header>
        <main>
            ${Header(state.get('header').title)}
            <section>
                ${makeButtons(rovers)}
            </section>
            <section>
                ${roverSpecs(manifest)}
            </section>
            <section>
                ${daysOfPhotos(photoHistory)}
            </section>
             <footer>Copyright © Davis Innovations | Data from NASA</footer>
        </main>
    `
    // ${roverPics(roverPhotos)}

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
        return "<div></div>";
    }
    
    const launch_date = new Date(manifest.launch_date);
    const land_date = new Date(manifest.landing_date);
    const latest_date = new Date(manifest.latest_date);
    const flight_time = (land_date.getTime() - launch_date.getTime()) / (1000*60*60*24);
    const mission_duration = (latest_date.getTime() - land_date.getTime()) / (1000*60*60*24);

    return (`
        <h3>Red Rover, Red Rover, Send ${manifest.name} On Over!</h3>
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

// displays images from the selected rover
const roverPics = (roverPhotos) => {
    if (!roverPhotos) {
        return "<div></div>";
    }
    else {
        const picsArray = roverPhotos.data.latest_photos;
        const pics = picsArray
            .map(pic => {
                return (`
                    <img src="${pic.img_src}" class="photo" title="Sol ${pic.sol} from ${pic.rover.name}'s ${pic.camera.name}"/>
                    <span id="pic-date">${pic.earth_date}</span>
                `);
            })
            .reduce((html, img) => {
                return html + img;
            },'');

        return (`
                <div class="pic-container">${pics}</div>
            `);
    }
}

const daysOfPhotos = (photoHistory) => {
    if (photoHistory.length === 0) {
        return "<div></div>";
    }
    else {
        const pics = photoHistory
            .reduce((html, pic) => {
                return html + `<img src="${pic.img_src}" class="photo" title="Sol ${pic.sol} from ${pic.rover.name}'s ${pic.camera.name}"/>
                <span id="pic-date">${pic.earth_date}</span>`
            },'');
        
        return `<div class="pic-container">${pics}</div>`;
    }
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

// add event listeners to each button on the screen
// this function is called in render
const addListeners = (root) => {
    const buttons = root.querySelectorAll(".btn");
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            roverCall(store, e.target.dataset.name);
        });
    });
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

    return manifest;
}

// API Call to get rover "latest_photos"
const getRoverPhotos = async (roverName) => {    

    const roverPhotos = await fetch(`http://localhost:3000/latest_photos/${roverName}`)
        .then(res => res.json())
        .then(data => data)
        .catch(err => console.log(err));
    
    return roverPhotos;
}

// API call to get several days worth of pictures starting from the rover's most recent day on Mars
const getDaysOfPhotos = async (roverName, date, num_days) => {

    const photos = await fetch(`http://localhost:3000/photos/days/${roverName}/${date}/${num_days}`)
        .then(res => res.json())
        .then(data => data)
        .catch(err => console.log(err));
    
    return photos;
}

// API call to get a certain number of photos per rover, starting from a particular day.
const getNumPhotos = async (roverName, date, amount) => {
    
    const photos = await fetch(`http://localhost:3000/photos/amount/${roverName}/${date}/${amount}`)
        .then(res => res.json())
        .then(data => data)
        .catch(err => console.log(err));

    return photos;
}

// calls the NASA API 3+ times, once for "latest photos", once for manifest and multiple times for an array of photos across several days 
// then takes the results of those API calls (promises) and updates the store once, so only one render.
const roverCall = async (state, roverName) => {
    const manifest = await getManifest(roverName);
    const latest_date = manifest.latest_date;
    // const photos = await getDaysOfPhotos(roverName, latest_date, 5);
    const photos = await getNumPhotos(roverName, latest_date, 12);
    const latest_photos = await getRoverPhotos(roverName);
    
    const promises = [latest_photos, manifest, photos];
    Promise.all(promises)
        .then(results => {
            state = state.set('roverPhotos', results[0]);
            state = state.set('manifest', results[1]);
            state = state.set('photoHistory', results[2]);
            updateStore(store, state);
        })
        .catch(err => console.log(err));    
}

////////////////////////////////////////////////////////////////////////////////////////////

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    console.log('DOM is loaded.');
    render(root, store);
})

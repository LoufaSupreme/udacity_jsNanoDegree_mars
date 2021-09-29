let store = Immutable.Map({
    header: { title: "PROJECT RED ROVER" },
    apod: '',
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
    roverInfo: '',
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
    const roverInfo = state.get('roverInfo');
    const manifest = state.get('manifest');

    // apod:
    // return `${ImageOfTheDay(apod)}`;
    
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
                ${roverPics(roverInfo)}
            </section>
        </main>
        <footer></footer>
    `
}


// ------------------------------------------------------  COMPONENTS

// Pure function that renders conditional information -- THIS IS JUST AN EXAMPLE, you can delete it.
const Header = (name) => {
    if (name) {
        return `
            <h1>${name}</h1>
        `
    }

    return `
        <h1>Mars Rover</h1>
    `
}

// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = (apod) => {

    // If image does not already exist, or it is not from today -- request it again
    const today = new Date()
    const photodate = new Date(apod.date)
    console.log(photodate.getDate(), today.getDate());

    console.log(photodate.getDate() === today.getDate());
    if (!apod || apod.date === today.getDate() ) {
        getImageOfTheDay(store)
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

        return (`
            <h3>${manifest.name}</h3>
            <ul>
                <li>Launched from Earth: ${manifest.launch_date}</li>
                <li>Landed on Mars: ${manifest.landing_date}</li>
                <li>Mission Status: ${manifest.status}</li>
                <li>Latest Day on Mars: ${manifest.latest_date} (Sol ${manifest.latest_sol})</li>
                <li>Total Photos Taken: ${manifest.total_photos}</li>
            </ul>
        `)
}

// displays images from the selected rover
const roverPics = (roverInfo) => {
    if (!roverInfo) {
        return "<div></div>";
    }

    const picsArray = roverInfo.data.latest_photos;
    const pics = picsArray.reduce((html, pic) => {
        return html + `<img src="${pic.img_src}" class="photo" title="Sol ${pic.sol} from ${pic.rover.name}'s ${pic.camera.name}"/>`;
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

// API Call to get rover info
const getRoverInfo = async (roverName) => {    

    const roverInfo = await fetch(`http://localhost:3000/rover/${roverName}`)
        .then(res => res.json())
        .then(data => data)
        .catch(err => console.log(err));
    
    return roverInfo;
}

// calls the NASA API twice, once for photos and once for manifest
// then takes the results of those API calls (promises) and updates the store once, so only one render.
const roverCall = async (state, roverName) => {
    const manifest = await getManifest(roverName);
    const info = await getRoverInfo(roverName);
    
    const promises = [info, manifest];
    Promise.all(promises)
        .then(results => {
            state = state.set('roverInfo', results[0]);
            state = state.set('manifest', results[1]);
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

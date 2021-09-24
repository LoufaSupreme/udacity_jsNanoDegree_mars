let store = Immutable.Map({
    user: { name: "Joshua" },
    apod: '',
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
    roverInfo: '',
    intro: true,
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
    const intro = state.get('intro');
    const roverInfo = state.get('roverInfo')

    // apod:
    // return `${ImageOfTheDay(apod)}`;
    
    return `
        <header></header>
        <main>
            ${Greeting(state.get('user').name)}
            <section>
                <h3>Red Rover</h3>
                <p>Placeholder.</p>
            </section>
            <section>
                ${makeButtons(intro, rovers)}
                ${roverPics(roverInfo)}
            </section>
        </main>
        <footer></footer>
    `
}


// ------------------------------------------------------  COMPONENTS

// Pure function that renders conditional information -- THIS IS JUST AN EXAMPLE, you can delete it.
const Greeting = (name) => {
    if (name) {
        return `
            <h1>Welcome, ${name}!</h1>
        `
    }

    return `
        <h1>Hello!</h1>
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

const roverPics = (roverInfo) => {
    if (!roverInfo) {
        getRoverInfo(store, 'Curiosity');
    }
    let html = '';
    const pics = roverInfo.data.latest_photos;
    for (let i = 0; i < pics.length; i++) {
        html += `<img src="${pics[i].img_src}" class="photo" alt="">`
    }
    return (`
            <div class="pic-container">${html}</div>
        `);
}

const makeButtons = (intro, rovers) => {
    html = '';
    if (intro) {
        for (let i = 0; i < rovers.length; i++) {
            html += `<div class="btn" data-name="${rovers[i]}">${rovers[i]}</div>`;
        }
    }
    return (`
        <div class="btn-container">${html}</div>
    `);
}

const addListeners = (root) => {
    const buttons = root.querySelectorAll(".btn");
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            getRoverInfo(store, e.target.dataset.name);
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

const getRoverInfo = (state, roverName) => {
    let roverInfo = state.get('roverInfo');
    
    fetch(`http://localhost:3000/rover/${roverName}`)
        .then(res => res.json())
        .then(roverInfo => {
            state = state.set('roverInfo', roverInfo);
            updateStore(store, state)
        });

    return roverInfo;
}

////////////////////////////////////////////////////////////////////////////////////////////

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    console.log('DOM is loaded.');
    render(root, store);
})

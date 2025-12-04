require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const path = require('path')

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', express.static(path.join(__dirname, '../public')))

// Astronomy Photo of the Day API endpoint:
app.get('/api/apod', async (req, res) => {
    try {
        let image = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`)
            .then(response => response.json());
        res.send({ image });
    } catch (err) {
        console.log('error:', err);
    }
})

// send an API request to server every 10min to keep Render.com from
// spinning down my free tier deployment
setInterval(async () => {
    const status = await fetch('https://project-red-rover.onrender.com/api/status');
    const statusJSON = await status.json();
    const statusMsg = statusJSON.statusMsg;

    console.log(`Status: ${statusMsg}`)
}, 600000);

// just a way to ping the server
app.get('/api/status', (req, res) => {
    try {
        res.send({statusMsg: 'App still up bro'});
    }
    catch(err) {
        console.log('error:', err);
    }
})

// get certain amount of images for rover perseverance
app.get('/api/photos/perseverance/:numPics/:page', async (req, res) => {
    const numPics = req.params.numPics;
    const page = req.params.page;
    console.log(`Fetching ${numPics} images for rover Perseverance`);
    const url = `https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020,ingenuity&feedtype=json&ver=1.2&num=${numPics}&page=${page}&&order=sol+desc&&&`;
    const response = await fetch(url)
    const data = await response.json();
    res.send({ data });
})

// get certain amount of images for rover curiosity
app.get('/api/photos/curiosity/:numPics/:page', async (req, res) => {
    const numPics = req.params.numPics;
    const page = req.params.page;
    console.log(`Fetching ${numPics} images for rover Curiosity`);
    const url = `https://mars.nasa.gov/api/v1/raw_image_items/?order=sol+desc%2Cinstrument_sort+asc%2Csample_type_sort+asc%2C+date_taken+desc&per_page=${numPics}&page=${page}&condition_1=msl%3Amission&search=&extended=thumbnail%3A%3Asample_type%3A%3Anoteq`;
    const response = await fetch(url)
    const data = await response.json();
    res.send({ data });
})

// NASA EPIC API call to get an image URL of photo of Earth:
app.get('/api/earth', async (req, res) => {
    try {
        // get array of natural earth images from the latest date:
        const nat_imgs = await fetch('https://epic.gsfc.nasa.gov/api/natural/')
            .then(res => res.json())
            .catch(err => console.error(err));

        const images = [];
        nat_imgs.map(img => {
            // take the date of the image out and make a JS date from it:
            const d = new Date(img.date);

            // convert the date to the correct format YYYY-MM-DD:
            const date = `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;

            // construct API URL from the above image/date.  The API directly returns an image, so this URL can be used directly as an img src.
            // NOTE: api_key will be visible in html doing this...
            const url = `https://epic.gsfc.nasa.gov/archive/natural/${date}/png/${img.image}.png`;
            
            const img_obj = {
                url: url,
                style: 'Natural',
                caption: img.caption,
                date: img.date,
                lat: img.centroid_coordinates.lat,
                lon: img.centroid_coordinates.lon,
            };

            return img_obj;

        }).forEach(img => images.push(img));  // push into images array

        // pick one of the returned imgs at random:
        const random_img = images[Math.floor(Math.random() * images.length)];

        res.send(random_img);

    } catch (err) {
        console.log('error:', err);
    }
})

// redirects to point back to landing page.
// these are necessary b/c I used history.pushState to change the URL, so user can use the browser back btn

app.get('/earth', async (req, res) => {
    res.redirect('/');
});

app.get('/apod', async (req, res) => {
    res.redirect('/');
});

app.get('/mars_rovers', async (req, res) => {
    res.redirect('/');
});

app.listen(process.env.PORT || port, () => console.log(`Mars Rover app listening on port ${port}!`))
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

// rover latest pictures API endpoint:
app.get('/api/latest_photos/:roverName', async (req, res) => {
    const roverName = req.params.roverName;
    let now = new Date();
    // add 1 to month b/c JS dates are stupid:
    now = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;

    try {
        const data = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${roverName}/latest_photos?earth_date=${now}&api_key=${process.env.API_KEY}`)
            .then(res => res.json());
        res.send({ data });
    } catch (err) {
        console.log('error:', err);
    }
})

// rover photos API, getting multiple days worth of pictures
app.get('/api/photos/days/:roverName/:date/:duration/', async (req, res) => {
    
    try {
        const roverName = req.params.roverName;
        const start_date = new Date(req.params.date);
        const duration = req.params.duration;
        
        const photos = [];

        for (let i = 0; i < duration; i++) {

            // set target date to the start_date plus i, up to duration.
            let target_date = new Date(start_date);
            target_date.setDate(start_date.getDate() - i);

            // check that calculated date is a valid date.  If not, continue subtracting days until it is a valid date:
            let subtract = 1;
            while (isNaN(target_date.getDate())) {
                console.log('invalid date...adjusting');
                working_date = new Date(target_date);
                target_date.setDate(working_date.getDate() - subtract);
                subtract++;
            }

            date = `${target_date.getFullYear()}-${target_date.getMonth()+1}-${target_date.getDate()}`;
            
            // fetch an array of photos from that day
            const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${roverName}/photos?earth_date=${date}&api_key=${process.env.API_KEY}`;
            
            const res = await fetch(url)
            const data = await res.json();
            // push each image object to the photos array
            data.photos.forEach(pic => photos.push(pic));                
        }
        res.send(photos);
    } 
    catch (err) {
        console.log(err);
    }            
})

// API call to get a certain amount of rover photos
app.get('/api/photos/amount/:roverName/:date/:amount', async (req, res) => {
    
    try {
        const roverName = req.params.roverName;
        const amount = req.params.amount;
        const start_date = new Date(req.params.date.replace(/-/g,'/'));
        
        const photos = [];

        let date_counter = 0;
        while (photos.length < amount) {

            // set target date to the start_date minus date_counter.
            let target_date = new Date(start_date);
            target_date.setDate(start_date.getDate() - date_counter);

            // check that calculated date is a valid date.  If not, continue subtracting days until it is a valid date:
            if (isNaN(target_date.getDate())) {
                console.log("invalid date");
                date_counter++;
                target_date = new Date(start_date);
                target_date.setDate(start_date.getDate() - date_counter);
            }

            // add 1 to getMonth b/c of how stupid JS dates are:
            date = `${target_date.getFullYear()}-${target_date.getMonth()+1}-${target_date.getDate()}`;
            
            // fetch an array of photos from that day
            const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${roverName}/photos?earth_date=${date}&api_key=${process.env.API_KEY}`;

            const res = await fetch(url)
            const data = await res.json();
            // push each image object to the photos array
            data.photos.forEach(pic => {
                if (photos.length < amount) {
                    photos.push(pic)
                } else {
                    return;
                }
            });   
            date_counter++;             
        }
        res.send(photos);
    } 
    catch (err) {
        console.log(err);
    }            
})

// rover manifest API endpoint:
app.get('/api/manifests/:roverName', async (req, res) => {
    const roverName = req.params.roverName;
    try {
        const data = await fetch(`https://api.nasa.gov/mars-photos/api/v1/manifests/${roverName}/?api_key=${process.env.API_KEY}`)
            .then(res => res.json());
        res.send({ data });
    } catch (err) {
        console.log('error:', err);
    }
})

// NASA EPIC API call to get an image URL of photo of Earth:
app.get('/api/earth', async (req, res) => {
    try {
        // get array of natural earth images from the latest date:
        // const nat_imgs = await fetch(`https://api.nasa.gov/EPIC/api/natural?api_key=${process.env.API_KEY}`)
        //     .then(res => res.json());
        
        // get array of enhanced earth images from the latest date:
        const enhanced_imgs = await fetch(`https://api.nasa.gov/EPIC/api/enhanced?api_key=${process.env.API_KEY}`)
            .then(res => res.json())
            .catch(err => console.log(err));

        const images = [];
        // nat_imgs.forEach(img => images.push(img));
        enhanced_imgs.forEach(img => images.push(img));

        // pick one of the returned imgs at random:
        const random_img = images[Math.floor(Math.random() * images.length) + 1];

        // take the date of the image out and make a JS date from it:
        const d = new Date(random_img.date);
        // convert the date to the correct format YYYY-MM-DD:
        const date = `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;

        // construct API URL from the above image/date.  The API directly returns an image, so this URL can be used directly as an img src.
        const url = `https://api.nasa.gov/EPIC/archive/enhanced/${date}/png/${random_img.image}.png?api_key=${process.env.API_KEY}`;

        const img_obj = {
            url: url,
            caption: random_img.caption,
            date: random_img.date,
            lat: random_img.centroid_coordinates.lat,
            lon: random_img.centroid_coordinates.lon,
        }

        res.send(img_obj);

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
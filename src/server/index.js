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
app.get('/apod', async (req, res) => {
    try {
        let image = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`)
            .then(response => response.json());
        res.send({ image });
    } catch (err) {
        console.log('error:', err);
    }
})

// rover latest pictures API endpoint:
app.get('/latest_photos/:roverName', async (req, res) => {
    const roverName = req.params.roverName;
    let now = new Date();
    now = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

    try {
        const data = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${roverName}/latest_photos?earth_date=${now}&api_key=${process.env.API_KEY}`)
            .then(res => res.json());
        res.send({ data });
    } catch (err) {
        console.log('error:', err);
    }
})

app.get('/photos/:roverName/:date/:duration/', async (req, res) => {
    
    try {
        const roverName = req.params.roverName;
        const start_date = new Date(req.params.date);
        const duration = req.params.duration;
        
        const photos = [];

        for (let i = 0; i < duration; i++) {

            // set date to the start_date plus i, up to duration.
            let target_date = new Date(start_date);
            target_date.setDate(start_date.getDate() - i);
            date = `${target_date.getFullYear()}-${target_date.getMonth()+1}-${target_date.getDate()+1}`;
            
            // fetch an array of photos from that day ("dayOfPhotos")
            const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${roverName}/photos?earth_date=${date}&api_key=${process.env.API_KEY}`;
            
            const res = await fetch(url)
            const data = await res.json();
            data.photos.forEach(pic => photos.push(pic));                
        }
        res.send(photos);
    } 
    catch (err) {
        console.log(err);
    }
            
        // add each pic obj to the photos array
        // console.log(dayOfPhotos)
        // dayOfPhotos.forEach(pic => photos.push(pic));
})

// rover manifest API endpoint:
app.get('/manifests/:roverName', async (req, res) => {
    const roverName = req.params.roverName;
    try {
        const data = await fetch(`https://api.nasa.gov/mars-photos/api/v1/manifests/${roverName}/?api_key=${process.env.API_KEY}`)
            .then(res => res.json());
        res.send({ data });
    } catch (err) {
        console.log('error:', err);
    }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
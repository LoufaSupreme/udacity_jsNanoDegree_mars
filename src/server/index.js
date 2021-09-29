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
app.get('/rover/:roverName', async (req, res) => {
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
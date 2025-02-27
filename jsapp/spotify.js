require('dotenv').config()
const express = require('express')
const SpotifyWebAPI = require('spotify-web-api-node')

const app = express()
const port = 3000

const spotifyAPI = new SpotifyWebAPI({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
})

app.get('/login', (req, res) => {
    const scopes = [
        'user-read-private',
        'user-read-email',
        'user-top-read',
        'user-read-recently-played',
        'user-read-playback-position'
    ]
    res.redirect(spotifyAPI.createAuthorizeURL(scopes))
})

app.get('/callback', async (req, res) => {
    console.log("REDIRECTED")
    const error = req.query.error
    const code = req.query.code

    if(error){
        console.error('Error:', error)
        res.send(`Error: ${error}`)
        return
    }
    
    spotifyAPI.authorizationCodeGrant(code).then(data => {
        const accessToken = data.body.access_token
        const refreshToken = data.body.refresh_token
        const expiresIn = data.body.expires_in

        spotifyAPI.setAccessToken(accessToken)
        spotifyAPI.setRefreshToken(refreshToken)

        console.log('Access Token:', accessToken)
        console.log('Refresh Token:', refreshToken)

        res.redirect(`/spotify.html?access_token=${accessToken}`)
    }).catch(error => {
        console.error('Error:', error)
        res.send("Error getting token")
    })
})

app.get('/spotify/me', (req, res) => {
    spotifyAPI.getMe().then(data => {
        console.log('Information:', data.body)
        res.send(data.body)
    }).catch(error => {
        console.error('Error:', error)
        res.send("Error has occured:", error)
    })
})

app.get('/me/top-tracks', (req, res) => {
    const {time_range} = req.query
    console.log("QUERY:", time_range)
    spotifyAPI.getMyTopTracks({time_range: time_range}).then(data => {
        const tracks = data.body.items.map(track => ({
            artist: track.artists.map(artist => artist.name).join(', '),
            name: track.name,
            album: track.album.name,
            albumImage: track.album.images[0]?.url,
            popularity: track.popularity
        }))
        console.log("Sent Tracks!")
        res.send(tracks)
    }).catch(error => {
        console.error('Error:', error)
        res.status("Error has occured:").send(error)
    })
})

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})
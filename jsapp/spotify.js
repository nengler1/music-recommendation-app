require('dotenv').config()
const express = require('express')
const SpotifyWebAPI = require('spotify-web-api-node')

const app = express()
const port = 3000

app.use(express.json())

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

const session = require('express-session')

app.use(session({
    secret: 'c3BvdGlmeWFwaWtleQ==',
    resave: false,
    saveUninitialized: true
}))

app.get('/callback', async (req, res) => {
    console.log("REDIRECTED")
    const error = req.query.error
    const code = req.query.code

    if(error){
        console.error('Error:', error)
        res.send(`Error: ${error}`)
        return
    }
    
    try {
        const data = await spotifyAPI.authorizationCodeGrant(code)
        const accessToken = data.body.access_token
        const refreshToken = data.body.refresh_token

        spotifyAPI.setAccessToken(accessToken)
        spotifyAPI.setRefreshToken(refreshToken)

        req.session.accessToken = accessToken
        req.session.refreshToken = refreshToken

        res.redirect('/spotify.html')
    } catch(error) {
        console.error('Error:', error)
        res.send("Error getting token")
    }
})


app.get('/api/me/status', (req, res) => {
    if (req.session.accessToken){
        res.json({loggedIn: true})
    } else {
        res.json({loggedIn: false})
    }
})

async function fetchWebApi(endpoint, accessToken){
    try {
        const response = await fetch(`https://api.spotify.com/${endpoint}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        return await response.json()
    } catch (error) {
        console.error("Error:", error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

app.get('/api/me/profile', async (req, res) => {
    const accessToken = req.session.accessToken
    if(!accessToken){
        return res.status(401).json({ message: 'Not logged in'})
    }

    const profile = await fetchWebApi('v1/me', accessToken)
    const details = {
        name: profile.display_name,
        profileImage: profile.images[0]?.url || '',
        spotifyProfileLink: profile.href,
        followers: profile.followers?.total
    }
    res.json(details)
})

app.get('/api/me/top-tracks', async (req, res) => {
    const {time_range} = req.query

    const accessToken = req.session.accessToken
    if(!accessToken){
        return res.status(401).json({ message: 'Not logged in'})
    }

    try {
        const response = await fetch('https://api.spotify.com/v1/me/top/tracks', {
            headers: { Authorization: `Bearer ${accessToken}` }
        })

        if(!response.ok){
            const error = await response.json()
            return res.status(response.status).json({error})
        }

        const data = await response.json()
        const tracks = data.items.map(track => ({
            artist: track.artists.map(artist => artist.name).join(', '),
            name: track.name,
            album: track.album.name,
            albumImage: track.album.images[0]?.url,
            popularity: track.popularity
        }))
        console.log("Sent Tracks!")
        res.json(tracks)
    } catch (error) {
        console.error("Error fetching top tracks:", error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// -- Playlist creation --

const playlists = {}

app.post('/api/playlists', (req, res) => {
    const {title} = req.body
    console.log(req.body)
    if(!title){
        return res.status(400).json({ message: 'No playlist title'})
    }

    const id = crypto.randomUUID()
    playlists[id] = {id, title, tracks: []}
    res.status(201).json(playlists[id])
})

// get all playlists
app.get('/api/playlists', (req, res) => {
    res.json(Object.values(playlists))
})

// get specific playlist
app.get('/api/playlists/:id', (req, res) => {
    const playlist = playlists[req.params.id]
    if(!playlist){
        return res.status(404).json({ message: 'No playlist found'})
    }

    res.json(playlist)
})

// update playlist
app.put('/api/playlists/:id', (req, res) => {
    const playlist = playlists[req.params.id]
    if(!playlist){
        return res.status(404).json({ message: 'No playlist found'})
    }

    new_title = req.body.title || playlist.title
    playlist.title = new_title
    res.json(playlist)
})

// delete playlist
app.delete('/api/playlists/:id', (req, res) => {
    const {id} = req.params
    if(!playlists[id]){
        return res.status(404).json({ message: 'No playlist found'})
    }

    delete playlists[id]
    res.status(204).json()
})

// -- Tracks w/ in playlists --

// Add tracks
app.post('/api/playlists/:id/tracks', (req, res) => {
    const playlist = playlists[req.params.id]
    if (!playlist) {
        return res.status(404).json({ message: 'No playlist found'})
    }
    const { name, artist } = req.body
    const track = { id: crypto.randomUUID(), name, artist }
    playlist.tracks.push(track)
    res.status(201).json(track)
});

// Update track in playlist
app.put('/api/playlists/:playlistId/tracks/:trackId', (req, res) => {
    const playlist = playlists[req.params.playlistId]
    if (!playlist) {
        return res.status(404).json({ message: 'No playlist found'})
    }
    const track = playlist.tracks.find(t => t.id === req.params.trackId)
    if (!track) {
        return res.status(404).json({ message: 'No track found'})
    }
    track.name = req.body.name || track.name
    track.artist = req.body.artist || track.artist
    res.json(track)
});

// Delete track from playlist
app.delete('/api/playlists/:playlistId/tracks/:trackId', (req, res) => {
    const playlist = playlists[req.params.playlistId]
    if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' })
    }
    const trackIndex = playlist.tracks.findIndex(t => t.id === req.params.trackId)
    if (trackIndex === -1) {
        return res.status(404).json({ message: 'Track not found' })
    }
    playlist.tracks.splice(trackIndex, 1)
    res.status(204).send()
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})
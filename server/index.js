const needle = require('needle')
const config = require('dotenv').config()
const http = require('http')
const path = require('path')
const express = require('express')
const socketIo = require('socket.io')
const TOKEN = process.env.TWITTER_BEARER_TOKEN
const PORT = process.env.PORT || 3000

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

app.get('/', (req,res) => {
    res.sendFile(path.resolve(__dirname, '../', 'client', 'index.html'))
})

app.use(express.static('images'))
app.use(express.static('css'))

// console.log(TOKEN)

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'
const streamURL = 'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics,created_at&expansions=author_id&user.fields=profile_image_url'
// const imageURL = 'https://api.twitter.com/1.1/users/show.json?'

const rules = [{value: "\"Blue Jays\" from:JeffPassan"}, {value: "\"Blue Jays\" from:Sportsnet"}, 
              {value: "\"Blue Jays\" is:verified"}, {value: "\"BlueJays\" is:verified"}, 
              {value: "from:YankeeX_ranger"},  
              {value: "\"baseball\" is:verified"}, {value: "\"Dodgers\" is:verified"},]
// {value: "\"baseball\" -is:retweet"},

//get stream rules
async function getRules() {
  const response = await needle('get', rulesURL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  })
  console.log(response.body)
  return response.body
}

//set stream rules
async function setRules() {
    const data = {
        add: rules,
    }

    const response = await needle('post', rulesURL, data, {
      headers: {
          'content-type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
    })

    return response.body
  }
  
// delete rules
  async function deleteRules(rules) {
    if (!Array.isArray(rules.data)){
        return null
    }

    const ids = rules.data.map((rule) => rule.id)

    const data = {
        delete: {
            ids: ids,
        },
    }

    const response = await needle('post', rulesURL, data, {
      headers: {
          'content-type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
    })

    return response.body
  }
  
  //stream tweets
 function streamTweets(socket){
     const stream = needle.get(streamURL, {
         headers:{
         Authorization: `Bearer ${TOKEN}`,
         },
 })
     stream.on('data', (data) => {

        try {
            const json = JSON.parse(data)
            // console.log(json)
            socket.emit('tweet', json)
        } catch (error) {}
     })
}

io.on('connection',  async () => {
    console.log('client connected...')


    let currentRules

    try {
        currentRules = await getRules()
        await deleteRules(currentRules)
        await setRules()
    } catch (error) {
        console.error(error)
        process.exit(1)
    }

    streamTweets(io)
})

server.listen(PORT, () => console.log(`Listening on port ${PORT}`))
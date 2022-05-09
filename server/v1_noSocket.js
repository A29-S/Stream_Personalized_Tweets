const needle = require('needle')
const config = require('dotenv').config()
const TOKEN = process.env.TWITTER_BEARER_TOKEN

console.log(TOKEN)

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'
const streamURL = 'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id'

const rules = [{value: 'baseball'} ]

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
 function streamTweets(){
     const stream = needle.get(streamURL, {
         headers:{
         Authorization: `Bearer ${TOKEN}`,
         },
 })
     stream.on('data', (data) => {

        try {
            const json = JSON.parse(data)
            console.log(json)
        } catch (error) {}
     })
}



;(async() => {
    let currentRules

    try {
        currentRules = await getRules()
        await deleteRules(currentRules)
        await setRules()
    } catch (error) {
        console.error(error)
        process.exit(1)
    }

    streamTweets()
})()
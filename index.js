const Express = require('express')(),
  BodyParser = require("body-parser"),
  HTTP       = require('http'),
  FileSystem = require('fs'),
  SQLite     = require('better-sqlite3'),
  Path       = require('path')

const Port = 1512
let Database
try {
  Database = new SQLite(`${__dirname}/database.db`, {})
} catch (error) {
  if (error) {
    console.log(`Database seems to be missing, or it has no table with name 'urls', can't start the server.`)
    process.exit(0)
  }
}
const DatabaseQueries = {
  Insert: Database.prepare('INSERT INTO urls (ID, content, date) VALUES (@ID, @content, @date)'),
  Select: {
    ID:      Database.prepare('SELECT * FROM urls WHERE `ID` = ? LIMIT 1'),
    Content: Database.prepare('SELECT * FROM urls WHERE `content` = ? LIMIT 1')
  }
}
const Server = HTTP.createServer(Express)

Express.use(require('express').static(Path.join(__dirname, '/ui')))
Express.use(BodyParser.urlencoded({
  extended: false
}))
Express.use(BodyParser.json())

Express.get("/", (request, response) => {
  response.writeHeader(200, {
    "Content-Type": "text/html"
  })
  FileSystem.readFile('ui/index.html', (error, content) => {
    if (error) {
      response.write(`<center><h3 style="color:red;">Error, UI file is missing</h3></center>`)
      response.end()
      return
    }
    response.write(content.toString())
    response.end()
  })
})

Express.post("/shorten", (request, response) => {
  let shortenURL, search = DatabaseQueries.Select.Content.get(request.body.url)
  response.writeHeader(200, {
    "Content-Type": "text/plain"
  })
  if (search == undefined) {
    let url_id = id()
    shortenURL = url_id
    try {
      DatabaseQueries.Insert.run({
        ID:      url_id,
        content: request.body.url,
        date:    formatTimestamp((new Date()).getTime())
      })
    } catch (error) {
      return
    }
  } else {
    shortenURL = search.ID
  }
  shortenURL ??= "failed"
  response.write(shortenURL)
  response.end()
})

Express.get("/s/:url_id", (request, response) => {
  let row = DatabaseQueries.Select.ID.get(request.params.url_id)
  if (row == undefined) {
    response.writeHeader(200, {
      "Content-Type": "text/plain"
    })
    response.write("URL not found.")
    response.end()
    return
  }
  response.redirect(row.content)
})

Server.listen(Port, () => {
  console.log(`NodeJS URL Shortener server is running on port ${Port}.`)
})

let formatTimestamp = (timestamp) => {
  let date = new Date(timestamp)
  let year = date.getUTCFullYear(),
    month = date.getUTCMonth(),
    day   = date.getUTCDate()
  month     = (month < 1) ? 1 : ((month > 12) ? 12 : (++month))
  month     = (month < 10) ? `0${month}` : month
  day       = (day < 10) ? `0${day}` : day
  let hours = date.getHours(),
    mintues = date.getMinutes(),
    seconds = date.getSeconds()
  hours   = (hours < 10) ? `0${hours}` : hours
  mintues = (mintues < 10) ? `0${mintues}` : mintues
  seconds = (seconds < 10) ? `0${seconds}` : seconds
  return `${day}-${month}-${year} ${hours}:${mintues}:${seconds}`
}

let id = (length = 5) => {
  let charachters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '_', ],
    id = ''
  for (let i = 1; i <= length; ++i) {
    id += charachters[Math.floor(Math.random() * charachters.length)]
  }
  return id
}

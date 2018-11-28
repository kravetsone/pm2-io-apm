import pmx from '../../../src'
pmx.init({
  metrics: {
    eventLoopActive: true,
    eventLoopDelay: true,
    v8: {
      GC: true
    }
  },
  network: true
})

const httpModule = require('http')

let timer

const server = httpModule.createServer((req, res) => {
  res.writeHead(200)
  res.end('hey')
}).listen(0, () => {
  timer = setInterval(function () {
    httpModule.get('http://localhost:' + server.address().port)
    httpModule.get('http://localhost:' + server.address().port + '/toto')
  }, 10)
})

process.on('SIGINT', function () {
  clearInterval(timer)
  server.close()
})

import SpecUtils from '../fixtures/utils'
import { expect } from 'chai'
import { fork, exec } from 'child_process'
import Action from '../../src/features/actions'

const MODULE = 'v8-profiler-node8'

describe('ProfilingAction', function () {
  this.timeout(50000)

  before(function (done) {
    exec('npm uninstall ' + MODULE, done)
  })

  after(function (done) {
    exec('npm uninstall ' + MODULE, done)
  })

  describe('CPU', () => {
    before(function (done) {
      exec('npm install ' + MODULE, function (err) {
        expect(err).to.equal(null)
        setTimeout(done, 1000)
      })
    })

    it('should get cpu profile data', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/actions/profilingCPUChild.js'))

      child.on('message', res => {

        if (res.type === 'axm:reply') {
          expect(res.data.return.success).to.equal(true)

          if (res.data.action_name === 'km:cpu:profiling:stop') {
            expect(res.data.return.cpuprofile).to.equal(true)
            expect(typeof res.data.return.dump_file).to.equal('string')

            child.kill('SIGINT')
            done()
          }
        }
      })

      setTimeout(function () {
        child.send('km:cpu:profiling:start')
      }, 100)

      setTimeout(function () {
        child.send('km:cpu:profiling:stop')
      }, 1000)
    })
  })

  describe('Heap', () => {
    before(function (done) {
      exec('npm install ' + MODULE, function (err) {
        expect(err).to.equal(null)
        setTimeout(done, 1000)
      })
    })

    it('should get heap profile data', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/actions/profilingHeapChild.js'))

      child.on('message', res => {

        if (res.type === 'axm:reply') {
          expect(res.data.return.success).to.equal(true)

          if (res.data.action_name === 'km:heap:sampling:stop') {
            expect(res.data.return.heapdump).to.equal(true)
            expect(typeof res.data.return.dump_file).to.equal('string')

            child.kill('SIGINT')
            done()
          }
        }
      })

      setTimeout(function () {
        child.send('km:heap:sampling:start')
      }, 100)

      setTimeout(function () {
        child.send('km:heap:sampling:stop')
      }, 1000)
    })

    it('should get heap dump data', (done) => {
      const child = fork(SpecUtils.buildTestPath('fixtures/actions/profilingHeapChild.js'))

      child.on('message', res => {

        if (res.type === 'axm:reply') {

          expect(res.data.return.success).to.equal(true)

          if (res.data.action_name === 'km:heapdump') {
            expect(res.data.return.heapdump).to.equal(true)
            expect(typeof res.data.return.dump_file).to.equal('string')

            child.kill('SIGINT')
            done()
          }
        }
      })

      setTimeout(function () {
        child.send('km:heapdump')
      }, 500)
    })
  })
})
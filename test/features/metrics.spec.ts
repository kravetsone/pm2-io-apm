import { expect, assert } from 'chai'
import 'mocha'

import Metric from '../../src/features/metrics'

describe('Metrics', () => {

  describe('init', () => {
    it('should init metrics', () => {
      const metric = new Metric()
      const metrics = metric.init()

      expect(metrics.hasOwnProperty('meter')).to.equal(true)
      expect(metrics.hasOwnProperty('histogram')).to.equal(true)
      expect(metrics.hasOwnProperty('counter')).to.equal(true)
      expect(metrics.hasOwnProperty('metric')).to.equal(true)
    })

    it('should calculate a meter after mark', (done) => {
      const metric = new Metric()

      const meter = metric.meter({tickInterval: 50})

      expect(meter.val()).to.equal(0)

      meter.mark(10)

      setTimeout(function () {
        expect(meter.val()).to.equal(0.17)
        done()
      }, 60)
    })
  })

  describe('meter', () => {
    it('should calculate a meter', (done) => {
      const metric = new Metric()

      const meter = metric.meter({tickInterval: 50})

      expect(meter.val()).to.equal(0)

      setTimeout(function () {
        expect(meter.val()).to.equal(0)
        done()
      }, 60)
    })

    it('should calculate a meter after mark', (done) => {
      const metric = new Metric()

      const meter = metric.meter({tickInterval: 50})

      expect(meter.val()).to.equal(0)

      meter.mark(10)

      setTimeout(function () {
        expect(meter.val()).to.equal(0.17)
        done()
      }, 60)
    })
  })

  describe('counter', () => {
    it('should calculate a meter', () => {
      const metric = new Metric()

      const counter = metric.counter()

      expect(counter.val()).to.equal(0)

      counter.inc()
      expect(counter.val()).to.equal(1)

      counter.dec()
      expect(counter.val()).to.equal(0)

      counter.inc(2)
      expect(counter.val()).to.equal(2)

      counter.dec(1)
      expect(counter.val()).to.equal(1)

      counter.reset()
      expect(counter.val()).to.equal(0)

      counter.reset(10)
      expect(counter.val()).to.equal(10)
    })
  })

  describe('histogram', () => {
    it('should calculate an histogram', () => {
      const metric = new Metric()

      const histo = metric.histogram({
        name        : 'latency',
        measurement : 'mean'
      })

      expect(histo.val()).to.equal(0)

      histo.update(10)

      expect(histo.val()).to.equal(10)

      histo.update(1)

      expect(histo.val()).to.equal(5.5)

      const res = histo.fullResults()
      expect(res.min).to.equal(1)
      expect(res.max).to.equal(10)
      expect(res.sum).to.equal(11)
      expect(res.variance).to.equal(40.5)
      expect(res.mean).to.equal(5.5)
      expect(res.count).to.equal(2)
      expect(res.median).to.equal(5.5)
      expect(res.p75).to.equal(10)
      expect(res.p95).to.equal(10)
      expect(res.p99).to.equal(10)
      expect(res.p999).to.equal(10)
      expect(res.ema).to.equal(4.000000000000001)
    })

    it('should calculate an histogram and getters', () => {
      const metric = new Metric()

      const histo = metric.histogram({
        name        : 'latency',
        measurement : 'max'
      })

      expect(histo.val()).to.equal(undefined)

      histo.update(10)
      histo.update(1)
      expect(histo.val()).to.equal(10)
      expect(histo.getMin()).to.equal(1)
      expect(histo.getMax()).to.equal(10)
      expect(histo.getCount()).to.equal(2)
      expect(histo.getSum()).to.equal(11)
    })

    it('should calculate an histogram : ema', () => {
      const metric = new Metric()

      const histo = metric.histogram({
        name        : 'latency',
        measurement : 'ema'
      })

      expect(histo.val()).to.equal(0)

      histo.update(10)
      expect(histo.val()).to.equal(0)
    })

    it('should calculate an histogram : median', () => {
      const metric = new Metric()

      const histo = metric.histogram({
        name        : 'latency',
        measurement : 'median'
      })

      expect(histo.val()).to.equal(null)

      histo.update(10)
      expect(histo.val()).to.equal(10)
    })
  })

  describe('transpose', () => {
    it('should use transpose method and fail', () => {
      const metric = new Metric()
      const transpose = metric.transpose('test', 'not a function')

      expect(transpose).to.equal(undefined)
    })

    it('should use transpose method', () => {
      const metric = new Metric()
      const transpose = metric.transpose('test', function () {
        return 'Hello world !'
      })

      expect(metric.getVar()['test'].value()).to.equal('Hello world !')
    })

    it('should use transpose method with object', () => {
      const metric = new Metric()
      const transpose = metric.transpose({name: 'test', data: function () {
        return 'Hello world !'
      }})

      expect(metric.getVar()['test'].value()).to.equal('Hello world !')
    })
  })

  describe('metric', () => {
    it('should create a metric and and fail cause no name', () => {
      const metrics = new Metric()
      let metric = metrics.metric({
      })

      expect(metric).to.equal(undefined)
    })

    it('should create a metric and use it', () => {
      const metrics = new Metric()
      let metric = metrics.metric({
        name: 'test'
      })

      expect(metric.val()).to.equal(0)
      metric.set(1)
      expect(metric.val()).to.equal(1)
      let vars = metrics.getVar()
      expect(vars['test'].unit).to.equal(undefined)
      expect(vars['test'].agg_type).to.equal('avg')
      expect(vars['test'].historic).to.equal(true)
      expect(vars['test'].type).to.equal('test')

      metric = metrics.metric({
        name: 'test',
        type: 'type',
        agg_type: 'sum',
        historic: false,
        unit: 'unit'
      })

      vars = metrics.getVar()
      expect(vars['test'].unit).to.equal('unit')
      expect(vars['test'].agg_type).to.equal('sum')
      expect(vars['test'].historic).to.equal(false)
      expect(vars['test'].type).to.equal('type')

      metric = metrics.metric({
        name: 'test',
        historic: true
      })

      vars = metrics.getVar()
      expect(vars['test'].historic).to.equal(true)

      metric = metrics.metric({
        name: 'test',
        historic: true,
        value: function () {
          return 'test is real !'
        }
      })

      expect(metric.val()).to.equal('test is real !')
    })
  })
})

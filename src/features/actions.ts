import * as domain from 'domain'
import debug from 'debug'
debug('axm:events')
import { ServiceManager } from '../index'
import Transport from '../utils/transport'
import { Feature } from './featureTypes'

export default class ActionsFeature implements Feature {

  private transport: Transport

  async init (): Promise<Object> {

    this.transport = ServiceManager.get('transport')

    return {
      action: this.action
    }
  }

  action (actionName, opts?, fn?) {
    if (!fn) {
      fn = opts
      opts = null
    }

    if (!actionName) {
      return console.error('[PMX] action.action_name is missing')
    }

    if (!fn) {
      return console.error('[PMX] emit.data is mission')
    }

    if (!process.send) {
      debug('Process not running within PM2')
      return false
    }

    // Notify the action
    this.transport.send({
      type : 'axm:action',
      data : {
        action_name : actionName,
        opts        : opts,
        arity       : fn.length
      }
    })

    const self = this
    function reply (data) {

      self.transport.send({
        type        : 'axm:reply',
        data        : {
          return      : data,
          action_name : actionName
        }
      })
    }

    process.on('message', function (data) {
      if (!data) return false

      // In case 2 arguments has been set but no options has been transmitted
      if (fn.length === 2 && typeof(data) === 'string' && data === actionName) {
        return fn({}, reply)
      }

      // In case 1 arguments has been set but options has been transmitted
      if (fn.length === 1 && typeof(data) === 'object' && data.msg === actionName) {
        return fn(reply)
      }

      /**
       * Classical call
       */
      if (typeof(data) === 'string' && data === actionName) {
        return fn(reply)
      }

      /**
       * If data is an object == v2 protocol
       * Pass the opts as first argument
       */
      if (typeof(data) === 'object' && data.msg === actionName) {
        return fn(data.opts, reply)
      }
    })
  }

  scopedAction (actionName, fn) {

    if (!actionName) {
      return console.error('[PMX] action.action_name is missing')
    }
    if (!fn) {
      return console.error('[PMX] callback is missing')
    }

    if (!process.send) {
      debug('Process not running within PM2')
      return false
    }

    // Notify the action
    this.transport.send({
      type : 'axm:action',
      data : {
        action_name : actionName,
        action_type : 'scoped'
      }
    })

    process.on('message', function (data) {
      if (!data
        || data.uuid === undefined
        || data.action_name === undefined) {
        return false
      }

      if (data.action_name === actionName) {
        const res = {
          send : function (dt) {
            this.transport.send({
              type        : 'axm:scoped_action:stream',
              data        : {
                data        : dt,
                uuid        : data.uuid,
                action_name : actionName
              }
            })
          },
          error : function (dt) {
            this.transport.send({
              type        : 'axm:scoped_action:error',
              data        : {
                data        : dt,
                uuid        : data.uuid,
                action_name : actionName
              }
            })
          },
          end : function (dt) {
            this.transport.send({
              type        : 'axm:scoped_action:end',
              data        : {
                data        : dt,
                uuid        : data.uuid,
                action_name : actionName
              }
            })
          }
        }

        const d = domain.create()

        d.on('error', function (err) {
          res.error(err.message || err.stack || err)
          setTimeout(function () {
            process.exit(1)
          }, 300)
        })

        d.run(function () {
          fn(data.opts || null, res)
        })
      }
    }.bind(this))
  }
}
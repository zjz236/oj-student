'use strict'

const Controller = require('egg').Controller
const axios = require('axios')
const ObjectID = require('mongodb').ObjectID

class IDEController extends Controller {
  async addIDEData() {
    const { ctx, app } = this
    try {
      const { code, language, inputData } = ctx.request.body
      const mongo = app.mongo.get('oj')
      let inputFile = ''
      if (inputData) {
        try {
          const { data } = await axios.post('http://127.0.0.1:7001/upload/uploadTestData', {
            inputData
          })
          if (data.code === 0) {
            return ctx.body = {
              code: 0,
              msg: '系统异常'
            }
          }
          inputFile = data.data
        } catch (e) {
          return ctx.body = {
            code: 0,
            msg: '系统异常'
          }
        }
      }
      const result = await mongo.insertOne('processResult', {
        doc: {
          code,
          language,
          inputFile,
          status: 'Queuing',
          isIDE: true
        }
      })
      if (result.insertedId) {
        ctx.body = {
          code: 1,
          msg: 'success',
          data: {
            insertedId: result.insertedId
          }
        }
      } else {
        ctx.body = {
          code: 0,
          msg: '系统异常'
        }
      }
    } catch (e) {
      console.error(e)
      ctx.body = {
        code: 0,
        msg: '系统异常'
      }
    }
  }

  async getIDEData() {
    const { ctx, app } = this
    const mongo = app.mongo.get('oj')
    const { id } = ctx.request.query
    const result = await mongo.findOne('processResult', {
      query: {
        _id: ObjectID(id)
      }
    })
    if (result) {
      ctx.body = {
        code: 1,
        msg: 'success',
        data: result
      }
    } else {
      ctx.body = {
        code: 0,
        msg: '系统异常'
      }
    }
  }
}

module.exports = IDEController

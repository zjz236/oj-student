'use strict'

const Controller = require('egg').Controller
const ObjectID = require('mongodb').ObjectID

class RankController extends Controller {
  async getRankList() {
    const { ctx, app } = this
    try {
      const mongo = app.mongo.get('oj')
      const { examId, pageSize, pageNo } = ctx.request.query
      const { isSort } = await mongo.findOne('examList', {
        query: {
          _id: ObjectID(examId)
        }
      })
      if (isSort === 0) {
        ctx.body = {
          code: 1,
          msg: 'success',
          data: {
            total: 0,
            list: []
          }
        }
      }
      let total = await mongo.countDocuments('examinee', {
        query: {
          examId: ObjectID(examId)
        }
      })
      if (isSort === 1) {
        total = parseInt(total / 2)
        const limit = (total - (pageNo - 1) * pageSize) >= pageSize ? pageSize : (total - (pageNo - 1) * pageSize)
        const result = await mongo.aggregate('examinee', {
          pipeline: [
            {
              $project: {
                score: { $add: [ '$tfScore', '$selectScore', '$gapScore', '$programScore' ] },
                username: 1,
                name: 1,
                studentId: 1,
                examId: 1
              }
            },
            {
              $sort: {
                score: -1,
                studentId: 1
              }
            },
            {
              $skip: parseInt(pageNo) - 1
            },
            {
              $limit: parseInt(limit)
            }
          ]
        })
        ctx.body = {
          code: 1,
          msg: 'success',
          data: {
            list: result,
            total
          }
        }
      } else if (isSort === 2) {
        const result = await mongo.aggregate('examinee', {
          pipeline: [
            {
              $project: {
                score: { $add: [ '$tfScore', '$selectScore', '$gapScore', '$programScore' ] },
                username: 1,
                name: 1,
                studentId: 1,
                examId: 1
              }
            },
            {
              $sort: {
                score: -1,
                studentId: 1
              }
            },
            {
              $skip: parseInt(pageNo) - 1
            },
            {
              $limit: parseInt(pageSize)
            }
          ]
        })
        ctx.body = {
          code: 1,
          msg: 'success',
          data: {
            list: result,
            total
          }
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
}

module.exports = RankController

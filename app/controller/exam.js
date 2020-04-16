'use strict'

const Controller = require('egg').Controller
const ObjectID = require('mongodb').ObjectID

class ExamController extends Controller {
  async getExamList() {
    const { ctx, app } = this
    try {
      const mongo = app.mongo.get('oj')
      const { pageSize, pageNo, searchType, searchText, status } = ctx.request.query
      let search
      const reg = new RegExp(searchText)
      if (searchType === 'teacher') {
        search = {
          $match: {
            'user.trueName': {
              $regex: reg
            }
          }
        }
      } else {
        search = {
          $match: {
            examName: {
              $regex: reg
            }
          }
        }
      }
      if (status === 'pending') {
        search.$match.startTime = { $gt: new Date() }
      } else if (status === 'starting') {
        search.$match.startTime = { $lt: new Date() }
        search.$match.finishTime = { $gt: new Date() }
      } else if (status === 'ending') {
        search.$match.finishTime = { $lt: new Date() }
      }
      const total = await mongo.aggregate('examList', {
        pipeline: [
          {
            $lookup: {
              from: 'user',
              localField: 'userId',
              foreignField: '_id',
              as: 'user'
            }
          },
          search,
          {
            $group: {
              _id: '_id',
              total: { $sum: 1 }
            }
          }
        ]
      })
      const result = await mongo.aggregate('examList', {
        pipeline: [
          {
            $lookup: {
              from: 'user',
              localField: 'userId',
              foreignField: '_id',
              as: 'user'
            }
          },
          search,
          {
            $sort: { finishTime: -1 }
          },
          {
            $skip: (parseInt(pageNo) - 1) * parseInt(pageSize)
          },
          {
            $limit: parseInt(pageSize)
          }
        ]
      })
      ctx.body = {
        code: 1,
        data: {
          list: result,
          total: total.length ? total[0].total : 0
        },
        msg: 'success'
      }
    } catch (e) {
      console.error(e)
      ctx.body = {
        code: 0,
        msg: '系统异常'
      }
    }
  }

  async getExamNotice() {
    const { ctx, app } = this
    try {
      const mongo = app.mongo.get('oj')
      const { examId } = ctx.request.query
      const result = await mongo.find('notice', {
        query: {
          examId: ObjectID(examId)
        },
        sort: {
          _id: 1
        }
      })
      ctx.body = {
        code: 1,
        msg: 'success',
        data: result
      }
    } catch (e) {
      console.error(e)
      ctx.body = {
        code: 0,
        msg: '系统异常'
      }
    }
  }

  async getExamineeInfo() {
    const { ctx, app } = this
    try {
      const { userId } = ctx
      const mongo = await app.mongo.get('oj')
      const result = await mongo.findOne('examinee', {
        query: {
          _id: ObjectID(userId)
        },
        options: {
          projection: {
            username: 1,
            studentId: 1,
            name: 1,
            school: 1,
            major: 1,
            college: 1,
            sex: 1
          }
        }
      })
      ctx.body = {
        code: 1,
        data: result,
        msg: 'success'
      }
    } catch (e) {
      console.error(e)
      ctx.body = {
        code: 0,
        msg: '系统异常'
      }
    }
  }

  async getExamInfo() {
    const { ctx, app } = this
    try {
      const { examId } = ctx.request.query
      const mongo = app.mongo.get('oj')
      const result = await mongo.findOne('examList', {
        query: {
          _id: ObjectID(examId)
        }
      })
      if (!result) {
        ctx.body = {
          code: 0,
          msg: '考试不存在'
        }
      } else {
        ctx.body = {
          code: 1,
          msg: 'success',
          data: result
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

module.exports = ExamController

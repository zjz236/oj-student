'use strict'

const Controller = require('egg').Controller
const ObjectID = require('mongodb').ObjectID

class TopicController extends Controller {
  async getTopicList() {
    const { ctx, app } = this
    try {
      const { examId } = ctx.request.query
      const mongo = app.mongo.get('oj')
      const result = await mongo.findOne('examList', {
        query: {
          _id: ObjectID(examId),
          $or: [
            { isShow: true },
            { startTime: { $lte: new Date() } }
          ]
        }
      })
      if (!result) {
        return ctx.body = {
          code: 1,
          msg: 'success',
          data: []
        }
      }
      const tfTopicCount = await mongo.countDocuments('examTFTopic', {
        query: {
          examId: ObjectID(examId)
        }
      })
      const selectTopicCount = await mongo.countDocuments('examSelectTopic', {
        query: {
          examId: ObjectID(examId)
        }
      })
      const gapTopicCount = await mongo.countDocuments('examGapTopic', {
        query: {
          examId: ObjectID(examId)
        }
      })
      const programTopicCount = await mongo.countDocuments('examProgramTopic', {
        query: {
          examId: ObjectID(examId)
        }
      })
      const tfAnswerCount = await mongo.countDocuments('examTFAnswer', {
        query: {
          examId: ObjectID(examId)
        }
      })
      const selectAnswerCount = await mongo.countDocuments('examSelectAnswer', {
        query: {
          examId: ObjectID(examId)
        }
      })
      const gapAnswerCount = await mongo.countDocuments('examGapAnswer', {
        query: {
          examId: ObjectID(examId)
        }
      })
      const programAnswerCount = await mongo.countDocuments('examProgramAnswer', {
        query: {
          examId: ObjectID(examId)
        }
      })
      const data = []
      tfTopicCount > 0 && data.push({ type: 'tfTopic', topicCount: tfTopicCount, answerCount: tfAnswerCount })
      selectTopicCount > 0 && data.push({
        type: 'selectTopic',
        topicCount: selectTopicCount,
        answerCount: selectAnswerCount
      })
      gapTopicCount > 0 && data.push({ type: 'gapTopic', topicCount: gapTopicCount, answerCount: gapAnswerCount })
      programTopicCount > 0 && data.push({
        type: 'programTopic',
        topicCount: programTopicCount,
        answerCount: programAnswerCount
      })
      ctx.body = {
        code: 1,
        msg: 'success',
        data
      }
    } catch (e) {
      console.error(e)
      ctx.body = {
        code: 0,
        msg: '系统异常'
      }
    }
  }

  async getTopicInfo() {
    const { ctx, app } = this
    try {
      const mongo = app.mongo.get('oj')
      const { topicType, examId } = ctx.request.query
      const topicTypePro = {
        examTFTopic: { description: 1 },
        examSelectTopic: { description: 1, options: 1 },
        examGapTopic: {},
        examProgramTopic: {}
      }
      const topicData = await mongo.find(topicType, {
        query: {
          examId: ObjectID(examId)
        },
        projection: topicTypePro[topicType]
      })
      topicType === 'examGapTopic' && topicData.map(item => {
        item.gaps = item.gaps.length
        return item
      })
      const topicTypeCollection = {
        examTFTopic: 'examTFAnswer',
        examSelectTopic: 'examSelectAnswer',
        examGapTopic: 'examGapAnswer',
        examProgramTopic: 'examProgramAnswer'
      }
      const answer = await mongo.find(topicTypeCollection[topicType], {
        query: {
          examId: ObjectID(examId)
        },
        projection: {
          topicId: 1,
          _id: 0,
          answer: 1,
          code: 1,
          status: 1,
          score: 1
        }
      })
      if (topicType === 'examProgramTopic') {
        for (const item of topicData) {
          const testCount = await mongo.countDocuments('examProgramTestData', {
            query: {
              programId: ObjectID(item._id)
            }
          })
          item.testCount = testCount
        }
      }
      ctx.body = {
        code: 1,
        msg: 'success',
        data: {
          topicData,
          answer
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

module.exports = TopicController

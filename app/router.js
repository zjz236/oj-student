'use strict'

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app
  router.get('/', controller.home.index)
  router.get('/exam/getExamList', controller.exam.getExamList)
  router.get('/exam/getExamInfo', controller.exam.getExamInfo)
  router.get('/exam/getExamineeInfo', controller.exam.getExamineeInfo)
  router.get('/exam/getExamNotice', controller.exam.getExamNotice)
  router.get('/account/getPublicKey', controller.account.getPublicKey)
  router.post('/account/login', controller.account.login)
  router.post('/account/userPasswordModify', controller.account.userPasswordModify)
  router.get('/topic/getTopicList', controller.topic.getTopicList)
  router.get('/topic/getTopicInfo', controller.topic.getTopicInfo)
  router.post('/operation/topicSubmit', controller.operation.topicSubmit)
  router.get('/operation/getProgramStatus', controller.operation.getProgramStatus)
  router.post('/ide/addIDEData', controller.ide.addIDEData)
  router.get('/ide/getIDEData', controller.ide.getIDEData)
  router.get('/rank/getRankList', controller.rank.getRankList)
}

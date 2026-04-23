/**
 * 历史记录云函数
 * 管理用户的创作历史记录
 */

'use strict';

const db = uniCloud.database()
const dbCmd = db.command
const historyCollection = db.collection('history')
const uniIDCommon = require('uni-id-common')

// 创建uni-id实例
const uniIDIns = uniIDCommon.createInstance({
    context: event.context || {}
})

// 获取用户ID
async function getAuthUid(event) {
    let authUid = ''
    try {
        const token = event.uniIdToken || (event.context && event.context.uniIdToken)
        if (token) {
            const res = await uniIDIns.getUserInfo({ token: token })
            if (res.code === 0) {
                authUid = res.uid
            }
        }
    } catch (e) {
        console.log('token解析失败', e)
    }
    return authUid
}

// 创建历史记录
async function createHistory(data, authUid) {
    const {
        canvas_data,
        settings,
        original_image,
        thumbnail,
        share_code_id,
        discovery_work_id
    } = data

    const addRes = await historyCollection.add({
        user_id: authUid,
        canvas_data: canvas_data || {},
        settings: settings || {},
        original_image: original_image || '',
        thumbnail: thumbnail || '',
        share_code_id: share_code_id || '',
        discovery_work_id: discovery_work_id || '',
        create_date: new Date(),
        update_date: new Date()
    })

    return {
        code: 0,
        message: '创建成功',
        data: {
            _id: addRes.id
        }
    }
}

// 更新历史记录
async function updateHistory(id, data, authUid) {
    const record = await historyCollection.doc(id).get()
    if (!record.data || record.data.length === 0) {
        return { code: 20001, message: '记录不存在' }
    }
    if (record.data[0].user_id !== authUid) {
        return { code: 20002, message: '无权限操作' }
    }

    const updateData = {
        update_date: new Date()
    }

    // 只更新传入的字段
    if (data.canvas_data !== undefined) updateData.canvas_data = data.canvas_data
    if (data.settings !== undefined) updateData.settings = data.settings
    if (data.original_image !== undefined) updateData.original_image = data.original_image
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail
    if (data.share_code_id !== undefined) updateData.share_code_id = data.share_code_id
    if (data.discovery_work_id !== undefined) updateData.discovery_work_id = data.discovery_work_id

    await historyCollection.doc(id).update(updateData)

    return {
        code: 0,
        message: '更新成功',
        data: { _id: id }
    }
}

// 获取历史记录列表
async function getHistoryList(limit = 20, offset = 0, authUid) {
    const res = await historyCollection.where({
        user_id: authUid
    })
    .orderBy('update_date', 'desc')
    .skip(offset)
    .limit(limit)
    .get()

    return {
        code: 0,
        message: '获取成功',
        data: res.data
    }
}

// 获取单条历史记录
async function getHistoryById(id, authUid) {
    const record = await historyCollection.doc(id).get()
    if (!record.data || record.data.length === 0) {
        return { code: 20003, message: '记录不存在' }
    }
    if (record.data[0].user_id !== authUid) {
        return { code: 20002, message: '无权限操作' }
    }

    return {
        code: 0,
        message: '获取成功',
        data: record.data[0]
    }
}

// 删除历史记录
async function deleteHistory(id, authUid) {
    const record = await historyCollection.doc(id).get()
    if (!record.data || record.data.length === 0) {
        return { code: 20003, message: '记录不存在' }
    }
    if (record.data[0].user_id !== authUid) {
        return { code: 20002, message: '无权限操作' }
    }

    await historyCollection.doc(id).remove()

    return {
        code: 0,
        message: '删除成功'
    }
}

// 清理过期草稿（定时任务）
async function cleanupExpiredHistory() {
    // 获取所有用户的清理设置
    const usersCollection = db.collection('uni-id-users')
    const users = await usersCollection.field({ _id: true, draft_cleanup_days: true }).get()

    let totalDeleted = 0

    for (const user of users.data) {
        const cleanupDays = user.draft_cleanup_days
        if (!cleanupDays || cleanupDays < 0) continue // -1=从不清理

        const expireDate = new Date(Date.now() - cleanupDays * 24 * 60 * 60 * 1000)

        const res = await historyCollection.where({
            user_id: user._id,
            update_date: dbCmd.lt(expireDate)
        }).remove()

        totalDeleted += res.deleted
    }

    return {
        code: 0,
        message: '清理完成',
        data: { deleted: totalDeleted }
    }
}

// 主入口
exports.main = async (event, context) => {
    const { action, data } = event

    // 获取用户ID
    const authUid = await getAuthUid(event)

    let result
    switch (action) {
        case 'create':
            if (!authUid) {
                result = { code: 20004, message: '请先登录' }
            } else {
                result = await createHistory(data, authUid)
            }
            break
        case 'update':
            if (!authUid) {
                result = { code: 20004, message: '请先登录' }
            } else {
                result = await updateHistory(data._id, data, authUid)
            }
            break
        case 'list':
            if (!authUid) {
                result = { code: 20004, message: '请先登录' }
            } else {
                result = await getHistoryList(data.limit, data.offset, authUid)
            }
            break
        case 'get':
            if (!authUid) {
                result = { code: 20004, message: '请先登录' }
            } else {
                result = await getHistoryById(data._id, authUid)
            }
            break
        case 'delete':
            if (!authUid) {
                result = { code: 20004, message: '请先登录' }
            } else {
                result = await deleteHistory(data._id, authUid)
            }
            break
        case 'cleanup':
            result = await cleanupExpiredHistory()
            break
        default:
            result = { code: 99999, message: '未知操作' }
    }

    return result
}

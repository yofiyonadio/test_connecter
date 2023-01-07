import fs from 'fs'
import { NextFunction, Response } from 'express'
import * as TimeHelper from 'sub_modules/utils/helpers/time'
import { isArray, isObject } from 'sub_modules/utils/helpers/object'
import { isString } from 'sub_modules/utils'
import { v4 as uuidv4 } from 'uuid'

const __path = './src/log/'
const __file = 'log_api.json'
class Logger {

    api(req: any, res: Response, next: NextFunction) {
        const _path = __path
        const _file = __file
        const filepPath = _path + _file
        fs.readFile(filepPath, async (error, data) => {
            if (error) {
                fs.mkdirSync(_path, { recursive: true } as any)
                fs.writeFileSync(filepPath, JSON.stringify([]), 'utf8')
                rewrite(req, res, next, filepPath)
            } else {
                let _data
                try {
                    _data = JSON.parse(data.toString())
                } catch (e) {
                    fs.writeFileSync(filepPath, JSON.stringify([]), 'utf8')
                    _data = []
                }
                if (!Array.isArray(_data)) {
                    fs.writeFileSync(filepPath, JSON.stringify([]), 'utf8')
                }
                rewrite(req, res, next, filepPath)
            }
        })
    }

    unwrite(res: Response) {
        const _path = __path
        const _file = __file
        const filepPath = _path + _file
        const file: {
            req_id: string
        }[] = JSON.parse(fs.readFileSync(filepPath, 'utf8') as any)
        const log_index = file.findIndex(f => f.req_id === res.locals.req_id)
        if (log_index >= 0) {
            file.splice(log_index, 1)
        }
        fs.writeFileSync(filepPath, JSON.stringify(file), 'utf8')
    }

    setError(res: Response, error: any) {
        const _path = __path
        const _file = __file
        const filepPath = _path + _file
        const file: {
            req_id: string,
            error: any
        }[] = JSON.parse(fs.readFileSync(filepPath, 'utf8') as any)
        const log_index = file.findIndex(f => f.req_id === res.locals.req_id)
        if (log_index >= 0) {
            file[log_index].error = error
        }
        fs.writeFileSync(filepPath, JSON.stringify(file), 'utf8')
    }

}

function trimString(str: string) {
    return str.slice(0, 500)
}
function __trimBody(body: any) {
    if (isObject(body)) {
        return Object.entries(body).reduce((init, b) => {
            return {
                ...init,
                [b[0]]: isString(b[1]) ? trimString(b[1] as any) : trimBody(b[1])
            }
        }, {})
    }
    if (isString(body)) {
        return trimString(body)
    }
    return body
}

function trimBody(body: any) {
    if (isArray(body)) {
        return (body as any[]).map(_body => __trimBody(_body))
    }
    return __trimBody(body)
}

function rewrite(req: any, res: Response, next: NextFunction, filepPath: string) {
    if (['/', '/graphql', '/viewql'].includes(req._parsedUrl.pathname) || req.method === 'OPTIONS') {
        return next()
    }
    const req_id = uuidv4()
    res.locals.req_id = req_id
    let file: any = fs.readFileSync(filepPath, 'utf8')
    try {
        file = JSON.parse(file)
    } catch {
        file = []
    }
    const obj = { req_id, apis: {} }
    obj.apis = {
        endPoint: req._parsedUrl.pathname,
        method: req.method,
        query: req._parsedUrl.search ? req._parsedUrl.search : '',
        body: trimBody(req.body),
        headers: req.headers,
        exec_at: TimeHelper.momentz().format('YYYY-MM-DD HH:mm:ss')
    }
    file.push(obj)
    if (file.length > 1000) {
        file.shift()
    }
    fs.writeFileSync(filepPath, JSON.stringify(file), 'utf8')
    next()
}

export default new Logger()

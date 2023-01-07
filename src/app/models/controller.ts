import BaseModel from 'energie/build/app/models/_base'
import ErrorModel, { ERRORS } from './error'
import _Logger from 'app/logger'

import {
	Response,
} from 'express'
import { DataSource, EntityManager } from 'typeorm'
import * as ObjectHelper from 'sub_modules/utils/helpers/object'

export let __connection: DataSource[] = null

export const httpstatus = {
	ok: 200,
	badrequest: 400,
	unauthorized: 401,
	forbidden: 403,
	notfound: 404,
	conflict: 409,
	internalerror: 500,
	redirect: 302,
	permanentredirect: 301,
}

class ControllerModel extends BaseModel {

	protected static __type = 'controller'

	private connection: DataSource[] = null

	responder(response: Response) {
		return (_data: any) => {
			const data = ObjectHelper.parseNull(_data)
			return response.json(data) as any
		}
	}

	catcher(response: Response) {
		return (err: Error | ErrorModel) => {
			if (err instanceof ErrorModel) {
				return response.status(this.getStatus(err.type)).json(err)
			}
			if (err instanceof Error) {
				return response.status(httpstatus.internalerror).json(new ErrorModel('UNKNOWN', 'ERR_099|Unhandled error occured', {
					name: err.name,
					message: err.message,
				}))
			}
			return response.status(httpstatus.internalerror).json(new ErrorModel('UNKNOWN', 'ERR_099|Unhandled error occured', err))
		}
	}


	route(): object {
		return
	}

	setConnection(connection: DataSource[]) {
		this.connection = connection
		__connection = connection
		return true
	}

	async transaction<T extends (...trx: EntityManager[]) => Promise<any>>(res: Response, fn: T): Promise<Awaited<ReturnType<T>>> {
		const qRs = this.connection.map(Q => Q.createQueryRunner())
		await Promise.all(qRs.map(async qR => {
			await qR.connect()
			await qR.startTransaction()
		}))

		try {
			const result = await fn(...qRs.map(qR => qR.manager))

			await Promise.all(qRs.map(async qR => {
				await qR.commitTransaction()
				await qR.release()
			}))
			_Logger.unwrite(res)
			return this.responder(res)(result)
		} catch (err) {
			Logger(this, err)
			await Promise.all(qRs.map(async qR => {
				await qR.rollbackTransaction()
				await qR.release()
			}))
			_Logger.setError(res, err)
			return this.catcher(res)(err) as any
		}
	}

	private getStatus(type: ERRORS) {
		switch (type) {
			case ERRORS.UNKNOWN:
			default:
				return httpstatus.internalerror

			case ERRORS.NODATA:
				return httpstatus.notfound

			case ERRORS.NOT_AUTHORIZED:
				return httpstatus.unauthorized

			case ERRORS.NOT_FOUND:
				return httpstatus.notfound

			case ERRORS.NOT_SATISFIED:
				return httpstatus.badrequest

			case ERRORS.NOT_VALID:
				return httpstatus.badrequest

			case ERRORS.NOT_VERIFIED:
				return httpstatus.forbidden

			case ERRORS.NOT_ACCEPTED:
				return httpstatus.conflict
		}
	}
}


export default ControllerModel

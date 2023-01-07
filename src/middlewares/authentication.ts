import ErrorModel, { ERRORS } from 'app/models/error'

import {
	NextFunction,
	Request,
	Response,
} from 'express'
import { DataSource } from 'typeorm'
import { USER_ROLE } from 'energie/build/utils/constants/enum'
import { httpstatus } from 'app/models/controller'

export default function (role: USER_ROLE, connection: DataSource[], optional?: '?') {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (res.locals.data.next) {
			return next()
		}
		if (req.header('Authorization')) {
			res.locals.data.next = true
			return next()
		} else {
			if (optional) {
				res.locals.data.next = true
				return next()
			} else {
				return res.status(httpstatus.unauthorized).json(new ErrorModel(ERRORS.NOT_AUTHORIZED, 'ERR_101|NULL', 'Authorization token not provided'))
			}
		}
	}
}

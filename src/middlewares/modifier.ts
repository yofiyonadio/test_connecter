import {
	NextFunction,
	Request,
	Response,
} from 'express'
import { DataSource } from 'typeorm'

export default function(connection: DataSource[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		res.locals.data = {
			user: {},
		}
		res.type('json')
		next()
	}
}

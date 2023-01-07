import AuthenticationMiddleware from 'middlewares/authentication'
import ModifierMiddleware from 'middlewares/modifier'


import { Application } from 'express'
import { DataSource } from 'typeorm'

export default {
	init(app: Application, connection: DataSource[]) {
		app.use('/', ModifierMiddleware(connection))
		app.use('/*', AuthenticationMiddleware('USER', connection, '?'))
		app.use('/([0-9]).([0-9])/*', AuthenticationMiddleware('USER', connection, '?'))
		app.use('/graphql', AuthenticationMiddleware('USER', connection, '?'))
	}
}

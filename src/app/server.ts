import bodyParser from 'body-parser'
import Express from 'express'
import { DataSource } from 'typeorm'
import fileUpload from 'express-fileupload'
import session from 'express-session'
import cors from 'cors'
import Router from './router'
import Middleware from './middleware'
import Logger from './logger'
import { postgraphile } from 'postgraphile'
import Filter from 'postgraphile-plugin-connection-filter'
import PgSimplifyInflectorPlugin from '@graphile-contrib/pg-simplify-inflector'
import { Logger as _Logger, Log as _Log } from 'sub_modules/utils/helpers/logger'
import { Errors as ValidatorError } from 'sub_modules/utils/helpers/validator'
import { Errors as RepositoryError } from 'sub_modules/utils/libs/typeorm'
import { ErrorModel } from './models'

const app = Express()
const port = Number(process.env.PORT) + Number(process.env.NODE_APP_INSTANCE || 0)
declare global {
	function Logger(...arg: Parameters<typeof _Logger>): void
	function Log(...arg: Parameters<typeof _Log>): void
}

global.Logger = (...arg: Parameters<typeof _Logger>) => _Logger(...arg)
global.Log = (...arg: Parameters<typeof _Log>) => _Log(...arg)

ValidatorError.fn = (error: string): void => {
	throw new ErrorModel('NOT_SATISFIED', 'ERR_100|Parameter not satisfied', error)
}

RepositoryError.duplicateKey = (error: any): void => {
	throw new ErrorModel('NOT_ACCEPTED', 'ERR_110|Duplicate key', error)
}
RepositoryError.notFound = (error: any): void => {
	throw new ErrorModel('NOT_FOUND', 'ERR_101|NULL', error)
}
RepositoryError.notValid = (error: any): void => {
	throw new ErrorModel('NOT_VALID', 'ERR_103|Parameter invalid', error)
}


export default {
	init(connection: DataSource[]) {
		app.use(bodyParser.raw({ limit: '100kb', type: 'text/csv' })) // for csv uploading file
		app.use(bodyParser.json({ limit: '40mb' })) // for parsing application/json
		app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

		app.use(fileUpload())
		app.use(Logger.api)
		app.use(session({
			secret: process.env.CONNECTER_SECRET,
			resave: true, // jika false, maka akan selalu mengatur ulang session untuk setiap request
			saveUninitialized: true, // jika false, tidak akan menyimpan session jika tidak ada perubahan session
			proxy: true,
			cookie: {
				maxAge: 60 * 60 * 1000, // break session in 1 hour,
				...process.env.ENV !== 'localhost' ? {
					sameSite: 'none', // jika 'none', maka akan membolehkan cookie diset pada origin domain yg berbeda 
					secure: true, // menyembunyikan cookie dibrowser, set true jika sameSite = 'none'
					httpOnly: true,
				} : {}
			}

		}))
		app.use(cors({
			origin: true,
			credentials: true,
		}))
		app.options('*', cors({
			origin: true,
			credentials: true,
		}))
		Middleware.init(app, connection)
		Router.init(app, connection)

		app.use(postgraphile({
			ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
			user: process.env.DB_USER,
			host: process.env.DB_HOST,
			database: process.env.DB_NAME,
			password: process.env.DB_PASS,
			port: parseInt(process.env.DB_PORT, 10),
		}, [
			'app', 'master', 'other'
		], {
			graphqlRoute: '/graphql',
			watchPg: true,
			ignoreIndexes: true, // if false, cannot filter on unindexed columns
			graphiql: false, // disable graphiql on production
			exportJsonSchemaPath: './schema.json',
			enableQueryBatching: true,
			bodySizeLimit: '40mb',
			appendPlugins: [Filter, PgSimplifyInflectorPlugin],
			graphileBuildOptions: {
				pgSimpleCollections: 'only',
				pgOmitListSuffix: true,
				pgSimplifyAllRows: true,
			},
			dynamicJson: true,
		}))

		app.use(postgraphile({
			ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
			user: process.env.DB_USER,
			host: process.env.DB_HOST,
			database: process.env.DB_NAME,
			password: process.env.DB_PASS,
			port: parseInt(process.env.DB_PORT, 10),
		}, [
			'view',
		], {
			graphqlRoute: '/viewql',
			watchPg: true,
			disableDefaultMutations: true,
			ignoreIndexes: true, // if false, cannot filter on unindexed columns
			graphiql: false, // disable graphiql on production
			enableQueryBatching: true,
			bodySizeLimit: '40mb',
			appendPlugins: [Filter, PgSimplifyInflectorPlugin],
			graphileBuildOptions: {
				pgSimpleCollections: 'only',
				pgOmitListSuffix: true,
				pgSimplifyAllRows: true,
			},
			dynamicJson: true,
		}))

		app.use('/', (req, res) => {
			res.json(false)
		})
		app.listen(port, () => {
			_Logger('Server  ', 'Connecter is running on port ' + port + '!', 'blue')
			_Logger('Server  ', '---------------------------------------------', 'green')
		})
	},
}

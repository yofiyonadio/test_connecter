import {
	DataSource, EntityManager
} from 'typeorm'

import * as _Records1 from 'energie/build/app/records'
const Records1 = Object.values(_Records1).map(record => record.default)

import EntityHelper from 'energie/build/utils/helpers/entity'
import SchedulerManager from 'app/managers/scheduler'
import { Pool } from 'pg'
import listener from './listener'

export let Connections: DataSource[] = []

export async function trx<T extends (...trx: EntityManager[]) => Promise<any>>(fn: T): Promise<any> {
	const qRs = Connections.map(Connection => Connection.createQueryRunner())
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

		return result
	} catch (err) {
		Logger(this, err)
		await Promise.all(qRs.map(async qR => {
			await qR.rollbackTransaction()
			await qR.release()
		}))
		throw err
	}
}

export default {
	async init() {
		const conns = [
			await DBConnecter({
				NAME: 'defaultConnection',
				APPLICATION_NAME: 'Connecter 3.0 Service',
				DB_HOST: process.env.DB_HOST,
				DB_PORT: process.env.DB_PORT,
				DB_NAME: process.env.DB_NAME,
				DB_USER: process.env.DB_USER,
				DB_PASS: process.env.DB_PASS,
				RECORDS: Records1,
			})
		]
		Logger('Database', 'Connection has been established successfully!', 'blue')
		return conns
	}

}

async function DBConnecter({
	NAME,
	APPLICATION_NAME,
	DB_HOST,
	DB_PORT,
	DB_NAME,
	DB_USER,
	DB_PASS,
	RECORDS,
}: {
	NAME: string,
	APPLICATION_NAME: string,
	DB_HOST: any
	DB_PORT: any
	DB_NAME: any
	DB_USER: any
	DB_PASS: any,
	RECORDS: object,
}) {
	const dataSource = new DataSource({
		name: NAME,
		applicationName: APPLICATION_NAME,
		type: 'postgres',
		ssl: DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
		host: DB_HOST,
		port: parseInt(DB_PORT as any, 10),
		database: DB_NAME,
		username: DB_USER,
		password: DB_PASS,
		logging: ['error', 'warn', 'info', 'log'],
		synchronize: false,
		entities: [...Object.values(RECORDS).map(record => EntityHelper.create(record as any))]
	})
	const connection = await dataSource.initialize()
	Connections = [
		...Connections,
		connection
	]

	const pool = new Pool({
		user: DB_USER,
		host: DB_HOST,
		database: DB_NAME,
		password: DB_PASS,
		port: parseInt(DB_PORT, 10),
	})

	pool.connect(async (err, client) => {
		listener.listen(client)
	})

	const qR = connection.createQueryRunner()
	await qR.connect()

	Logger('Database', 'Connect to DB :::> ' + DB_HOST + ' ' + DB_NAME, 'amber')

	await qR.release()
	await SchedulerManager.initialize(connection)

	return connection
}

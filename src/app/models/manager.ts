import {
	DataSource, EntityManager,
} from 'typeorm'
import BaseModel from 'energie/build/app/models/_base'


class ManagerModel extends BaseModel {

	protected static __type = 'manager'

	protected connection: DataSource

	async transaction<Fn extends (transaction: EntityManager) => any>(fn: Fn): Promise<ReturnType<Fn>> {
		const qR = this.connection.createQueryRunner()

		await qR.connect()

		await qR.startTransaction()

		try {
			const result = await fn(qR.manager)

			await qR.commitTransaction()
				await qR.release()

			return result
		} catch (err) {

			await qR.rollbackTransaction()
			await qR.release()

			throw err
		}
	}

	setConnection(connection: DataSource) {
		this.connection = connection

		return true
	}

	// tslint:disable-next-line:ban-types
	protected async withTransaction<T extends (trx: EntityManager) => any>(transaction: EntityManager | undefined, fn: T): Promise<ReturnType<T>> {
		if(transaction === undefined) {
			return this.transaction((trx: EntityManager) => {
				return fn(trx)
			})
		} else {
			return fn(transaction)
		}
	}
}


export default ManagerModel

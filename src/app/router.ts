import { ControllerModel } from './models'
import Controllers from 'controllers'
import { Application } from 'express'
import { DataSource } from 'typeorm'

export default {
	init(app: Application, connection: DataSource[]) {
		Object.keys(Controllers).map(type => {
			const Route = Object.values(Controllers[type]).map((controller: ControllerModel) => {
				controller.setConnection(connection)

				return controller.route()
			}).reduce((init, i) => {
				return {
					...init,
					...i,
				}
			}, {})

			Object.keys(Route).forEach(key => {
				Object.keys(Route[key]).forEach(method => {
					let _key = key

					if (type !== 'common') {
						_key = `/${type}${key}`
					}

					app[method](_key, Route[key][method])
				})
			})
		})
	},
}

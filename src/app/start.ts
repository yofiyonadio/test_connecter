import {
	config,
} from 'dotenv'
import 'reflect-metadata'

config()

import Database from './database'
import Server from './server'
import Controllers from '../controllers'

Database
	.init()
	.then(async connection => {
		Server.init(connection)
	})
	.then(() => {
		if (process.env.UNIT_TEST === 'true') {
			Object.values(Controllers).forEach(c => {
				Object.values(c).forEach(_c => {
					Log('Controllers', (_c)['route']())
				})
			})
		}
	})
	.catch(e => Log(e))

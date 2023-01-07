import ControllerModel from 'app/models/controller'
import { Request, Response } from 'express'

// --------------------------
class CommonHealthController extends ControllerModel {

	route() {
		return {
			'/health': {
				get: this.health,
			},
		}
	}

	private health = (req: Request, res: Response) => {
		return this.responder(res)(true)
	}

}

export default new CommonHealthController()

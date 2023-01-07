import { ControllerModel } from 'app/models'
import { Request, Response } from 'express'

class CouponController extends ControllerModel {

	route() {
		return {
			'/': {
				get: this.getCoupons,
			}
		}
	}

	private getCoupons = async (req: Request, res: Response) =>
		this.transaction(res, async transaction => {
			return 'OK'
		})

}
export default new CouponController()

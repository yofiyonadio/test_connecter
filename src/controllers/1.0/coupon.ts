import { CouponManager } from 'app/managers'
import { ControllerModel } from 'app/models'
import { Request, Response } from 'express'

class CouponController extends ControllerModel {

	route() {
		return {
			'/coupon': {
				get: this.getCoupons,
			},
		}
	}

	private getCoupons = async (req: Request, res: Response) =>
		this.transaction(res, async transaction => {
			return await CouponManager.getCoupons({
				filter: {
					deleted_at: null
				},
				getAllWhenNoFilter: false
			}, transaction)
		})

}
export default new CouponController()

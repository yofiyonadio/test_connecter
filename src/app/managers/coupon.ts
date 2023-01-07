import { ManagerModel } from 'app/models'
import { CouponRepository } from 'app/repositories'
import { CouponInterface } from 'energie/build/app/records/coupon'
import { calcNumberByPercen } from 'sub_modules/utils'
import { EntityManager } from 'typeorm'
import * as TimeHelper from 'sub_modules/utils/helpers/time'

class CouponManager extends ManagerModel {

	static __displayName: string = 'CouponManager'

	// ============================= INSERT =============================

	async createCoupon({
		coupon,
		items
	}: {
		coupon: Parameters<typeof CouponRepository.insertCoupon>[0]
		items?: Parameters<typeof CouponRepository.upsertItems>[0]
	}, transaction: EntityManager) {
		const _coupon = await CouponRepository.insertCoupon(coupon, transaction)
		let _items: Awaited<ReturnType<typeof CouponRepository.upsertItems>>
		if (items?.length) {
			_items = await CouponRepository.upsertItems(items.map(i => {
				return {
					...i,
					coupon_id: _coupon.id
				}
			}), transaction)
		}
		return {
			..._coupon,
			items: _items
		}
	}

	// ============================= UPDATE =============================

	async updateCoupon({
		coupon,
		items
	}: {
		coupon: Parameters<typeof CouponRepository.updateCoupon>[0]
		items?: Parameters<typeof CouponRepository.upsertItems>[0]
	}, transaction: EntityManager) {
		await CouponRepository.updateCoupon(coupon, transaction)
		if (items?.length) {
			await CouponRepository.upsertItems(items.map(i => {
				return {
					...i,
					coupon_id: coupon.id
				}
			}), transaction)
		}

		// if (!coupons && !items?.length) {
		// 	return false
		// }
		return true
	}

	// ============================= GETTER =============================

	async getCoupons({
		filter,
		getAllWhenNoFilter
	}: {
		filter: Parameters<typeof CouponRepository.getCoupon>[0]['filter'],
		getAllWhenNoFilter: boolean
	}, transaction: EntityManager) {
		return await CouponRepository.getCoupon({
			filter: {
				...filter,
			},
			option: {
				get: 'MANY',
				with_items: true,
				getAllWhenNoFilter
			}
		}, transaction)
	}

	async getAvailableCoupons({
		coupons,
		platform_id
	}: {
		coupons: string[],
		platform_id: number
	}, transaction: EntityManager) {
		return await CouponRepository.getCoupon({
			filter: {
				code: coupons,
				platform_id,
				status: 'ACTIVE',
				published_at: {
					lessThanEqual: TimeHelper.momentz().toDate(),
					or_equal: null
				},
				expired_at: {
					moreThan: TimeHelper.momentz().toDate(),
					or_equal: null
				}
			},
			option: {
				get: 'MANY',
				with_items: true,
				getAllWhenNoFilter: false
			}
		}, transaction).then(coupon => coupon.filter(c => c.usage_limit > 0 || c.usage_limit == null))
	}

	// ============================= DELETE =============================

	async deleteCoupon(...args: Parameters<typeof CouponRepository.deleteCoupon>) {
		return await CouponRepository.deleteCoupon(...args)
	}

	// ============================= METHODS ============================

	discountCounter(price: number, coupon: CouponInterface) {
		if (coupon.type === 'NOMINAL') {
			return price - (price - coupon.amount)
		} else if (coupon.type === 'PERCENT') {
			return Math.min(coupon.max_discount, price - calcNumberByPercen(price, '-', coupon.amount))
		}
	}

	// ============================ PRIVATES ============================

}

export default new CouponManager()

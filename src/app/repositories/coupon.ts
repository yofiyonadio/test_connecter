import RepositoryModel, { GETTER, OPTION, Returned, TypeFilter } from 'sub_modules/utils/libs/typeorm'
import { EntityManager, SelectQueryBuilder } from 'typeorm'
import { CouponInterface, CouponRecord } from 'energie/build/app/records/coupon'
import { TypeInsert, TypeUpdate } from 'energie/build/utils/type/type'
import { COUPON_STATUS } from 'energie/build/utils/constants/enum'
import * as TimeHelper from 'sub_modules/utils/helpers/time'
import CouponItemRecord, { CoupomItemInterface } from 'energie/build/app/records/coupon.item'


class CouponRepository extends RepositoryModel {

	static __displayName = 'CouponRepository'

	// ============================= INSERT =============================

	async insertCoupon(coupon: TypeInsert<CouponInterface>, transaction: EntityManager
	) {
		return await this.queryInsert<CouponInterface>(CouponRecord, coupon, transaction)
	}

	async upsertItems(items: TypeInsert<CoupomItemInterface>[], transaction: EntityManager
	) {
		return await this.queryInsertOrUpdate<CoupomItemInterface[]>(CouponItemRecord, items, ['id'], transaction)
	}

	// ============================= UPDATE =============================

	async updateCoupon(coupon: TypeUpdate<CouponInterface>, transaction: EntityManager
	) {
		return await this.queryUpdate<CouponInterface>(CouponRecord, coupon, transaction)
	}

	// ============================= GETTER =============================

	async getCoupon<T extends CouponInterface & {
		items?: CoupomItemInterface[]
	}, GET extends GETTER>(
		{
			filter,
			option,
		}: {
			filter?: TypeFilter<{
				id?: number | number[]
				code?: string | string[]
				status?: COUPON_STATUS
				published_at?: Date,
				expired_at?: Date,
				deleted_at?: Date,
				is_public?: boolean,
				items__id?: number,
				platform_id?: number
			}>,
			option: OPTION<GET> & {
				with_items?: boolean
			}
		}, transaction: EntityManager
	): Returned<T, GET> {
		return await this.querySelectNew(CouponRecord, 'coupon', (Q: SelectQueryBuilder<T>) => {
			if (option.with_items) {
				Q.leftJoinAndMapMany('coupon.items', CouponItemRecord, 'items', 'items.coupon_id = coupon.id')
			}
			return Q
		}, {
			...option,
			filter
		}, transaction)

	}

	// ============================= DELETE =============================

	async deleteCoupon(coupon: TypeUpdate<CouponInterface>, transaction: EntityManager
	) {
		return await this.queryUpdate<CouponInterface>(CouponRecord, {
			...coupon,
			deleted_at: TimeHelper.momentz().toDate()
		}, transaction)
	}


	// ============================ PRIVATES ============================
}

export default new CouponRepository()


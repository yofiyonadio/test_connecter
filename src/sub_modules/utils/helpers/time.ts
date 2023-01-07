import moments from 'moment-timezone'
import _moment from 'moment'

const STYLING_DAYS = 7

const HOLIDAYS = {
	// 2021
	0: [1, 2, 3, 9, 10, 16, 17, 23, 24, 30, 31],					// JANUARY
	1: [6, 7, 12, 13, 14, 20, 21, 27, 28],							// FEBRUARY
	2: [6, 7, 11, 13, 14, 20, 21, 27, 28], 							// MARCH
	3: [2, 3, 4, 10, 11, 17, 18, 24, 25, 29, 30],					// APRIL
	4: [1, 2, 3, 4, 5, 6, 7, 8, 14, 15, 16, 21, 22, 26, 28, 29],		// MAY
	5: [1, 4, 5, 11, 12, 18, 19, 25, 26],							// JUNE
	6: [2, 3, 9, 10, 16, 17, 23, 24, 30, 31],						// JULY
	7: [6, 7, 13, 14, 17, 20, 21, 27, 28],							// AUGUST
	8: [3, 4, 10, 11, 17, 18, 24, 25],								// SEPTEMBER
	9: [1, 2, 8, 9, 15, 16, 22, 23, 29, 30],						// OCTOBER
	10: [5, 6, 12, 13, 19, 20, 26, 27],								// NOVEMBER
	11: [3, 4, 10, 11, 17, 24, 25, 31], 							// DECEMBER
}

export type Moment = moment.Moment

export function momentz(time?: any) {
    try {
        if (moments(time).isValid()) {
            moments.tz.setDefault('Asia/Jakarta')
            return moments(time)
        } else {
            throw new Error('momentz date/time invalid!')
        }
    } catch (e) {
        throw e
    }
}

export function format(time: any, pattern: 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm:ss Z') {
    return momentz(time).format(pattern)
}

export function toString(time?: any) {
    return momentz(time).format('YYYY-MM-DD HH:mm:ss Z')
}

export function calculateShipmentDate(remaining = STYLING_DAYS, NOW: Moment | Date = momentz()): moment.Moment {
    const _today = momentz(NOW)
    const _date = _today.date()
    const _month = _today.month()

    if (HOLIDAYS[_month].indexOf(_date) === -1) {
        // tomorrow is business day
        if (remaining - 1 <= 0) {
            return _today
        }

        return this.calculateShipmentDate(remaining - 1, _today.add(1, 'd').endOf('day'))
    } else {
        // tomorrow is not business day
        return this.calculateShipmentDate(remaining, _today.add(1, 'd').endOf('day'))
    }
}

const TimeHelper = {
    momentz,
    format
}
export default TimeHelper


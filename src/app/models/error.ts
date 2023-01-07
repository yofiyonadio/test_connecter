import BaseModel from 'energie/build/app/models/_base'

type ArrayToObject<T extends readonly [...any]> = {
	[Key in T[number]]: T[number]
}

const _ERRORS = ['UNKNOWN', 'NODATA', 'NOT_VALID', 'NOT_FOUND', 'NOT_VERIFIED', 'NOT_AUTHORIZED', 'NOT_SATISFIED', 'NOT_ACCEPTED'] as const
type _ERRORS = ArrayToObject<typeof _ERRORS>
export type ERRORS = typeof _ERRORS[number]
export const ERRORS: _ERRORS = {
	UNKNOWN: 'UNKNOWN',
	NODATA: 'NODATA',
	NOT_VALID: 'NOT_VALID',
	NOT_FOUND: 'NOT_FOUND',
	NOT_VERIFIED: 'NOT_VERIFIED',
	NOT_AUTHORIZED: 'NOT_AUTHORIZED',
	NOT_SATISFIED: 'NOT_SATISFIED',
	NOT_ACCEPTED: 'NOT_ACCEPTED',
}

const _ERROR_CODES = [
	'ERR_099|Unhandled error occured',
	'ERR_100|Parameter not satisfied',
	'ERR_101|NULL',
	'ERR_102|Need additional privilege',
	'ERR_103|Parameter invalid',
	'ERR_104|One of item(s) is unavailable',
	'ERR_105|Result invalid',
	'ERR_106|Try again later',
	'ERR_107|Multiple results found',
	'ERR_108|Duplicate value',
	'ERR_109|Need consent',
	'ERR_110|Duplicate key',
] as const
type _ERROR_CODES = ArrayToObject<typeof _ERROR_CODES>
export type ERROR_CODES = typeof _ERROR_CODES[number]
export const ERROR_CODES: _ERROR_CODES = {
	'ERR_099|Unhandled error occured': 'ERR_099|Unhandled error occured',
	'ERR_100|Parameter not satisfied': 'ERR_100|Parameter not satisfied',
	'ERR_101|NULL': 'ERR_101|NULL',
	'ERR_102|Need additional privilege': 'ERR_102|Need additional privilege',
	'ERR_103|Parameter invalid': 'ERR_103|Parameter invalid',
	'ERR_104|One of item(s) is unavailable': 'ERR_104|One of item(s) is unavailable',
	'ERR_105|Result invalid': 'ERR_105|Result invalid',
	'ERR_106|Try again later': 'ERR_106|Try again later',
	'ERR_107|Multiple results found': 'ERR_107|Multiple results found',
	'ERR_108|Duplicate value': 'ERR_108|Duplicate value',
	'ERR_109|Need consent': 'ERR_109|Need consent',
	'ERR_110|Duplicate key': 'ERR_110|Duplicate key',
}

class ErrorModel extends BaseModel {

	protected static __type = 'error'

	type: ERRORS
	code: string
	message: string
	detail: any
	is: (...args: ERROR_CODES[]) => boolean

	constructor(type: ERRORS, code: ERROR_CODES, detail?: any) {
		super()
		const messages = code.split('|')

		this.type = type
		this.code = messages[0]
		this.message = messages[1]
		this.detail = detail

		this.is = (...codes: ERROR_CODES[]): boolean => {
			return codes.findIndex(c => c === code) > -1
		}
	}
}


export default ErrorModel

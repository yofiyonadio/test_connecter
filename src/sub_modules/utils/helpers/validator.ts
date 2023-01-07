
import * as U from '..'
import { isArray, isObject } from '../helpers/object'
import * as O from './object'

export const Errors: {
    fn: (error: string) => void
} = {
    fn: (error: string): void => {
        throw new Error(error)
    }
}

const required = ['string', 'number', 'boolean', 'email', 'phone', 'date', 'datetime', 'time'] as const
const optional = ['string?', 'number?', 'boolean?', 'email?', 'phone?', 'date?', 'datetime?', 'time?'] as const
const enums = ['enum', 'enum?'] as const
const sets = ['set', 'set?'] as const

type _Group_Type = 'primitive' | 'object' | 'object?' | 'array' | 'array?' | 'array_or' | 'or' | 'array_object' | 'enum' | 'set'

type _Object<T> = keyof T extends string ? { [Key in keyof T]: Types<T[Key]> } : { [key: string]: Types<T> }
type _Required = typeof required[number]
type _Optional = typeof optional[number]
type _Enum = [typeof enums[0], any[] | { [key: string]: any }] | [typeof enums[1], any[] | { [key: string]: any }]
type _Set = [typeof sets[0], any[] | { [key: string]: any }] | [typeof sets[1], any[] | { [key: string]: any }]
type _Arrays<T> = ['array', (_Required | _Required[] | [typeof enums[0], any[]] | [typeof sets[0], any[]] | _Object<T extends Record<string, any>[] ? T[0] : T> | _Arrays<T>)]
type _Object_Optional<T> = ['object?', _Object<T>]
type _Array_Optional<T extends Record<string, any>[] | Record<string, any>> = ['array?', (_Required | _Required[] | [typeof enums[0], any[]] | [typeof sets[0], any[]] | _Object<T> | _Arrays<T>)]
type Types<T> = T extends Date ?
    _Optional
    |
    _Required
    |
    _Enum
    :
    T extends { [key: string]: any }[] | { [key: string]: any } | string[] ?
    _Set
    |
    _Object_Optional<T>
    |
    _Array_Optional<T>
    |
    _Arrays<T>
    |
    _Object<T>
    :
    T extends string | number | boolean | InstanceType<typeof Date> | undefined ?
    _Optional
    |
    _Required
    |
    _Enum
    |
    [_Required, _Required, ..._Required[]]
    :
    unknown

function _validator<T>(data: Record<string, any> | any, type: Record<string, Types<T>> | any, group_type: _Group_Type, property: string) {
    const thrower = (msg: string) => {
        throw Errors.fn(`parameter ${property ? `'${property}' ` : ''}invalid! (${msg})`)
    }
    const isOptional = (_data: any, _type: any) => _type.split('').pop() === '?' && (_data === undefined || _data === null)
    switch (group_type) {
        case 'primitive': {
            switch (type as _Required | _Optional) {
                case 'string': {
                    return _costum(data, type, property, () => {
                        if (typeof data === 'string' && data.length > 0) {
                            return true
                        }
                        throw false
                    })
                }
                case 'string?': {
                    return _costum(data, type, property, () => {
                        if (typeof data === 'string') {
                            return true
                        }
                        throw false
                    })
                }
                case 'number': {
                    return _costum(data, type, property, () => {
                        if (typeof data === 'number' && !isNaN(data)) {
                            return true
                        }
                        throw false
                    })
                }
                case 'number?': {
                    return _costum(data, type, property, () => {
                        if (typeof data === 'number' && !isNaN(data)) {
                            return true
                        }
                        throw false
                    })
                }
                case 'boolean': {
                    return _costum(data, type, property, () => {
                        if (typeof data === 'boolean') {
                            return true
                        }
                        throw false
                    })
                }
                case 'boolean?': {
                    return _costum(data, type, property, () => {
                        if (typeof data === 'boolean') {
                            return true
                        }
                        throw false
                    })
                }
                case 'email': {
                    return _costum(data, type, property, () => {
                        _check_email(data)
                        return true
                    })
                }
                case 'email?': {
                    return _costum(data, type, property, () => {
                        _check_email(data)
                        return true
                    })
                }
                case 'phone': {
                    return _costum(data, type, property, () => {
                        _check_phone(data)
                        return true
                    })
                }
                case 'phone?': {
                    return _costum(data, type, property, () => {
                        _check_phone(data)
                        return true
                    })
                }
                case 'datetime': {
                    return _costum(data, type, property, () => {
                        if (U.isDate(new Date(data))) {
                            return true
                        }
                        _check_date(data.split(' ')[0])
                        _check_time(data.split(' ')[1])
                        return true
                    })
                }
                case 'datetime?': {
                    return _costum(data, type, property, () => {
                        if (U.isDate(new Date(data))) {
                            return true
                        }
                        _check_date(data.split(' ')[0])
                        _check_time(data.split(' ')[1])
                        return true
                    })
                }
                case 'date': {
                    return _costum(data, type, property, () => {
                        if (U.isDate(new Date(data))) {
                            return true
                        }
                        _check_date(data)
                        return true
                    })
                }
                case 'date?': {
                    return _costum(data, type, property, () => {
                        if (U.isDate(new Date(data))) {
                            return true
                        }
                        _check_date(data)
                        return true
                    })
                }
                case 'time': {
                    return _costum(data, type, property, () => {
                        _check_time(data)
                        return true
                    })
                }
                case 'time?': {
                    return _costum(data, type, property, () => {
                        _check_time(data)
                        return true
                    })
                }
                default: {
                    throw Errors.fn('validator: type not found!')
                }
            }
        }
        case 'object': {
            return Object.keys(type).forEach(key => {
                Validator(data?.[key], type[key], (property ? property + '.' : '') + key)
            })
        }
        case 'object?': {
            if (isOptional(data, type[0])) {
                return true
            }
            if (!Object.keys(type[1])?.length) {
                if (!isObject(data)) {
                    thrower(`type must be '{}'`)
                }
            }
            return Object.keys(type[1]).forEach(key => {
                Validator(data?.[key], type[1][key], (property ? property + '.' : '') + key)
            })
        }
        case 'enum': {
            if (isOptional(data, type[0])) {
                return true
            }
            const type_enum: any[] = isObject(type[1]) ? Object.values(type[1]) : type[1]

            if (!type_enum?.includes(data)) {
                thrower(`type must be 'enum' ${type_enum}`)
            }
            return true
        }
        case 'set': {
            if (isOptional(data, type[0])) {
                return true
            }
            const type_set: any[] = isObject(type[1]) ? Object.values(type[1]) : type[1]

            if (!data?.length || !data?.every(set => type_set?.includes(set))) {
                thrower(`type must be 'set' ${type_set}`)
            }
            return true
        }
        case 'or': {
            const __type = (type as string[]).reduce((init: string[], t) => {
                return init.includes(t) ? init : [...init, t]
            }, [])
            const __check = (__type as any[]).reduce((_init, _type) => {
                try {
                    Validator(data, _type, property)
                    return true
                } catch (e) {
                    return _init ? true : false
                }
            }, false)
            if (!__check) {
                throw Errors.fn(`parameter ${property ? `'${property}' ` : ''}invalid! (type must be either ${(__type as any[]).map(t => `'${t}'`).join(' or ')})`)
            }
            return true
        }
        case 'array': {
            if (!isArray(data)) {
                thrower(`type must be 'array'`)
            }
            return (data as any[])?.forEach((_data, n) => {
                Validator(_data, type[1], (property ? property + '.' : '') + n)
            })
        }
        case 'array?': {
            if (isOptional(data, type[0])) {
                return true
            }
            if (!isArray(data)) {
                thrower(`type must be 'array?'`)
            }
            return (data as any[])?.forEach((_data, n) => {
                Validator(_data, type[1], (property ? property + '.' : '') + n)
            })
        }
        default: {
            throw Errors.fn(`validator: group_type not found!`)
        }
    }
}

function _costum(data: any, type: _Required | _Optional, property: string, func: () => boolean) {
    try {
        if (_isNull(data) && type.includes('?')) {
            return true
        }
        if (!func()) {
            throw false
        }
    } catch (e) {
        throw Errors.fn(`parameter ${property ? `'${property}' ` : ''}invalid! (value must be '${type}')`)
    }
}

function _check_date(date: string) {
    (date.split('-') as string[]).forEach((i, n) => {
        if ((n === 0 && /^[0-9]{4}$/.test(i))) {
            return true
        }
        if ((n === 1 && /^[0-9]{2}$/.test(i) && U.rangeNumber(U.toNumber(i), 1, 12))) {
            return true
        }
        if ((n === 2 && /^[0-9]{2}$/.test(i) && U.rangeNumber(U.toNumber(i), 1, 31))) {
            return true
        }
        throw false
    })
    return true
}

function _check_time(time: string) {
    (time.split(':') as string[]).forEach((i, n) => {
        if ((n === 0 && /^[0-9]{2}$/.test(i) && U.rangeNumber(U.toNumber(i), 0, 23))) {
            return true
        }
        if ((n === 1 && /^[0-9]{2}$/.test(i) && U.rangeNumber(U.toNumber(i), 0, 59))) {
            return true
        }
        if ((n === 2 && /^[0-9]{2}$/.test(i) && U.rangeNumber(U.toNumber(i), 0, 59))) {
            return true
        }
        throw false
    })
    return true
}

function _check_phone(phone: string) {
    const _split = phone.split('-') as string[]
    if (!_split[1]) {
        throw false
    }
    _split.forEach((i, n) => {
        if (n === 0 && /^[0-9]{2}$/.test(i)) {
            return true
        }
        if (n === 1 && ((i[0] + '') === '0')) {
            throw false
        }
        if (n === 1 && /^[0-9]{9,13}$/.test(i)) {
            return true
        }
        throw false
    })
    return true
}

function _check_email(email: string) {
    if (/^[a-z@.].*$/i.test(email)) {
        const _domain = (email.split('@') as string[]).filter((_, n) => n > 0).join('@').split('.')
        const _tld = _domain.filter((_, n) => n > 0).join('.')
        if (/^[a-z0-9]*$/i.test(_domain[0]) && /^[a-z]*$/i.test(_tld)) {
            return true
        }
        throw false
    }
    throw false
}

function _isNull(data: any) {
    return data === null || data === undefined
}


type R<T> = T
export function Validator<T extends Record<string, any>[] | Record<string, any> | any>(data: T, type: T extends Record<string, any>[] ? Types<R<T>[0]> :
    T extends Record<string, any> ?
    {
        [Key in keyof R<T>]: T[Key] extends Record<string, any>[] ? Types<R<T>[Key][0]> : Types<R<T>[Key]>
    } :
    Types<R<T>>, property: string = '') {
    try {
        // const _data: any = data
        if (O.isObject(type as any)) {
            // Logger('this Object', '')
            return _validator<T>(data, type as any, 'object', property)
        }
        if (type[0] === 'object?' && O.isObject(type[1] as any)) {
            // Logger('this Object?', '')
            return _validator<T>(data, type as any, 'object?', property)
        }
        if (type[0] === 'enum' || type[0] === 'enum?') {
            // Logger('this Enum', '')
            return _validator<T>(data, type as any, 'enum', property)
        }
        if (type[0] === 'set' || type[0] === 'set?') {
            // Logger('this Set', '')
            return _validator<T>(data, type as any, 'set', property)
        }
        if (type[0] === 'array') {
            // Logger('this Array', '')
            return _validator<T>(data, type as any, 'array', property)
        }
        if (type[0] === 'array?') {
            // Logger('this Array?', '')
            return _validator<T>(data, type as any, 'array?', property)
        }
        const _type = [...(isArray(type as any[]) ? (type as any) : [])]
        if (_type.every(t => required.includes(t)) && _type.some(t => required.includes(t))) {
            // Logger('this Or', '')
            return _validator<T>(data, type as any, 'or', property)
        }
        if ([...required, ...optional].includes(type as any)) {
            // Logger('this Primitive', '')
            return _validator<T>(data, type, 'primitive', property)
        }
        throw Errors.fn(`'validator' data and type ${property ? `at '${property}'` : ''} not match!`)
    } catch (e) {
        throw e
    }
}

export default Validator

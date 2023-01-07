function Try(func: () => any, catch_value?: any) {
    try {
        return func()
    } catch {
        return catch_value
    }
}

export function isObject(o: object) { return (!Array.isArray(o) && o instanceof Object && Try(() => JSON.stringify(o)[0] === '{', false)) }
export function isArray(o: any) { return (Array.isArray(o)) }

export function isEmptyObject(value: Record<string, any>): boolean {
    return isObject(value) ? Object.keys(value).length < 1 : false
}

export function isEmptyArray(value: any[]): boolean {
    return isArray(value) ? value.length < 1 : false
}

function _parseNull(data: Record<string, any>) {
    try {
        const isTrim = (val: any) => val === undefined || isEmptyArray(val as any) || isEmptyObject(val) || (isNaN(val as any) && typeof val === 'number')
        if (isObject(data)) {
            const new_object = Object.keys(data).reduce((init: Record<string, any>, key: string) => {
                if (isTrim(data[key])) {
                    init[key] = null
                    return init
                }
                init[key] = parseNull(data[key])
                return init
            }, {})
            return isEmptyObject(new_object) ? null : new_object
        }
        return isTrim(data) ? null : data
    } catch (e) {
        throw e
    }
}

export function parseNull(data: Record<string, any> | any[]) {
    try {
        if (isEmptyArray(data as any)) {
            return null
        }
        if (isEmptyObject(data as any)) {
            return null
        }
        if (isObject(data)) {
            return _parseNull(data)
        }
        if (isArray(data)) {
            return (data as any[]).map(_data => _parseNull(_data))
        }
        return _parseNull(data)
    } catch (e) {
        throw e
    }
}

export function trimObject<T extends Record<string, any>>(_object: T, option?: { with_null: boolean }): {
    [Key in keyof T]: T[Key]
} {
    return Object.keys(_object).reduce((init, key) => {
        return {
            ...init,
            ..._object[key] === undefined || _object[key] === (option?.with_null ? null : undefined) ? {} : {
                [key]: isObject(_object[key]) ? trimObject(_object[key]) : isArray(_object[key]) ? _object[key].map((i: any) => isObject(i) ? trimObject(i) : i) : _object[key]
            }
        }
    }, {}) as any
}

export function chunckArray<T extends any[]>(array: T, size: number): T[] {
    return array.reduce((init: any[][], i, n) => {
        const last_item = init.pop()
        return [
            ...init,
            ...n % size === 0 ? [...last_item.length ? [last_item] : [], [i]] : [[...last_item, i]]
        ]
    }, [[]] as any[][])
}

export function distinctArray<T extends ({ [key: string]: any }[])>(array: T, key: keyof T[number]): T
export function distinctArray<T extends any[]>(array: T): T
export function distinctArray<T extends ({ [key: string]: any }[]) | any[]>(array: T, key?: T extends ({ [key: string]: any }[]) ? keyof T[number] : undefined): T {
    return key ? (array as any).reduce((init: any[], i: any) => {
        return init.some(_i => _i[key] === i[key]) ? init : [
            ...init,
            i
        ]
    }, []) as any : (array as any).reduce((init: any[], i: any) => {
        return init.some(_i => _i === i) ? init : [
            ...init,
            i
        ]
    }, [])
}

export function mergeArray<T extends any[]>(array: T): T[number] {
    return array.reduce((init, i) => {
        return [
            ...init,
            ...i
        ]
    }, [])
}

export function blackListKey<T extends Record<string, any> | Record<string, any>[]>(object: T, black_list: (keyof T)[]): T {
    try {
        const _object = object as Record<string, any>
        if (isArray(object)) {
            return object.map((i: any) => {
                return blackListKey(i, black_list)
            })
        }
        if (isObject(object)) {
            return Object.keys(_object).reduce((init, key) => {
                return {
                    ...init,
                    ...black_list.includes(key as any) ? {} : {
                        [key]: isObject(_object[key]) ? blackListKey(_object[key], black_list) : isArray(_object[key]) ? _object[key].map((i: any) => blackListKey(i, black_list)) : _object[key]
                    }
                }
            }, {}) as any
        }
        return object
    } catch (e) {
        throw e
    }
}

export function whiteListKey<T extends Record<string, any> | Record<string, any>[]>(object: T, white_list: (keyof T)[]): T {
    try {
        const _object = object as Record<string, any>
        if (isArray(object)) {
            return object.map((i: any) => {
                return whiteListKey(i, white_list)
            })
        }
        if (isObject(object)) {
            return Object.keys(_object).reduce((init, key) => {
                return {
                    ...init,
                    ...(!white_list.includes(key as any)) ? {} : {
                        [key]: isObject(_object[key]) ? whiteListKey(_object[key], white_list) : isArray(_object[key]) ? _object[key].map((i: any) => whiteListKey(i, white_list)) : _object[key]
                    }
                }
            }, {}) as any
        }
        return object
    } catch (e) {
        throw e
    }
}

export function mapper(obj: { [key: string]: any }[], pattern: { [key: string]: any }, parrent_col?: string, parrent_col_id?: number, key_idx: number = 0): any {
    try {
        const _isObject = (o: object) => (!Array.isArray(o) && o instanceof Object)
        const _isArray = (o: object) => (Array.isArray(o))
        const _col = Object.keys(pattern)[key_idx as number]
        const _col_id = _col + '_id'
        if (!_isArray(pattern[_col]) && !_isObject(pattern[_col])) { throw new Error(`'mapper' pattern must be Array or Object`) }
        if (_isArray(pattern[_col])) {
            (pattern[_col] as []).forEach(i => {
                if (!_isObject(i)) {
                    throw new Error(`'mapper' pattern not valid!`)
                }
            })
        }

        const _mapping = ({ __isArray }: { __isArray?: boolean } = {}) => {
            const _result = [... new Set(parrent_col_id && parrent_col ? obj.filter((i: any) => i[parrent_col as any] === parrent_col_id).map((i: any) => i[_col_id]) : obj.map((i: any) => i[_col_id]))].map(i => {
                const _object = obj.find((_i: any) => _i[_col_id] === i) as any
                const __map_obj = Object.keys(_object).filter((_i: any) => _i.substring(0, _col.length) === _col).reduce((ac, a) => ({ ...ac, [a.replace((_col + '_'), '')]: _object[a] }), {})
                const __map_arr = Object.keys(__isArray ? (pattern[_col][0] ? pattern[_col][0] : []) : pattern[_col]).reduce((ac: any, a: any, _key_idx: number) => {
                    const _mapped = mapper(obj, __isArray ? pattern[_col][0] : pattern[_col], _col_id, i, _key_idx)
                    const _plural = _isArray(_mapped) ? /*'s'*/ '' : ''
                    return ({ ...ac, [a + _plural]: _mapped })
                }, {})
                return Object.values(__map_obj).some(_i => !!_i) ? {
                    ...__map_obj,
                    ...__map_arr,
                } : {}
            })
            const __result = __isArray ? _result : _result[0]
            if (_isArray(__result)) {
                if (__result.length <= 1) {
                    return Object.keys(__result[0]).length > 0 ? __result : null
                }
                return __result
            } else if (_isObject(__result)) {
                return Object.keys(__result).length > 0 ? __result : null
            }
            return null
        }
        if (_isArray(pattern[_col])) {
            return _mapping({ __isArray: true })
        } else if (_isObject(pattern[_col])) {
            return _mapping()
        }
        return undefined
    } catch (e) {
        throw e
    }
}

// ------------------------------------- EXPORT -------------------------------------------

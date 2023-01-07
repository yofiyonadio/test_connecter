import { Brackets, EntityManager, EntityTarget, In, ObjectLiteral, SelectQueryBuilder } from 'typeorm'
import { isArray, isEmptyArray, isEmptyObject, isObject, parseNull, trimObject } from '../helpers/object'
import { isString, SQLDate, SQLIn, SQLObject, SQLSearch, SQLValue } from '../'
import { SORT_OPTION } from '../types'

interface InterfaceModel {
    id: number
    created_at?: Date
    updated_at?: Date
}

type TypeMapOptionalArray<T> = {
    [Key in keyof T]: T[Key] | Array<T[Key]>
}

export const Errors: {
    notFound: (error: any) => void,
    notValid: (error: any) => void,
    duplicateKey: (error: any) => void
} = {
    notFound: (error: any): void => {
        throw new Error(error)
    },
    notValid: (error: any): void => {
        throw new Error(error)
    },
    duplicateKey: (error: any): void => {
        throw new Error(error)
    }
}

type TypeOne = { [Key: string]: any }
type TypeMany = { [Key: string]: any }[]

export type GETTER = 'ONE' | 'MANY' | 'MANY_AND_COUNT' | 'COUNT'
export type OPTION<GET extends GETTER = GETTER> = {
    filter?: TypeFilter<{ [key: string]: any }>
    sort?: _TypeSort
    limit?: number
    offset?: number
    getAllWhenNoFilter?: boolean
    get: GET
    join_distinct?: boolean
}

export type Returned<T, GET extends GETTER> = Promise<
    GET extends 'ONE' ? T :
    GET extends 'MANY_AND_COUNT' ? {
        count: number,
        data: T[]
    } :
    GET extends 'COUNT' ? number :
    T[]
>

type TypeInsert<T extends TypeOne | TypeMany, X> =
    T extends TypeMany ?
    (
        Omit<T[number], [keyof X][number]> &
        Partial<X>
    )[] :
    (
        Omit<T, keyof X> &
        Partial<X>
    )

type TypeInsertOrUpdate<T extends TypeOne | TypeMany, X> =
    T extends TypeMany ?
    (
        Omit<T[number], [keyof X][number]> &
        Partial<X>
    )[] :
    (
        Omit<T, keyof X> &
        Partial<X>
    )


type TypeUpdate<T extends TypeOne, X, _type extends '!' | '?'> =
    Omit<Partial<T>, keyof X> &
    Partial<X> & (_type extends '!' ? { id: number } : { id?: number })

type TypeDelete<T extends TypeOne, X> =
    Partial<
        T &
        X &
        { id: number }
    >


// ------------------------------- FILTER -------------------------------------

type ArrayToObject<T extends readonly [...any]> = {
    [Key in T[number]]: string
}

type FilterOption = {
    getAllWhenNoFilter?: boolean,
    Q?: SelectQueryBuilder<any>,
    fn?: (...args: any) => any
}

const _list_operator = ['equal', 'notEqual', 'lessThan', 'lessThanEqual', 'moreThan', 'moreThanEqual', 'contains', 'equalDate', 'similar', 'in', 'notIn'] as const

const _symbol: ArrayToObject<typeof _list_operator> = {
    equal: '=',
    equalDate: '=',
    notEqual: '<>',
    lessThan: '<',
    lessThanEqual: '<=',
    moreThan: '>',
    moreThanEqual: '>=',
    contains: 'ILIKE',
    similar: '>=',
    in: 'IN',
    notIn: 'NOT IN'
}

type joinKeys<T> = `or_${Extract<keyof T, string>}`

type _or_type_operator<T extends { [key: string]: any }> = {
    [key in joinKeys<T>]: T[key]
} & {
        [key in keyof T]: T[key]
    }


type _type_operator = Partial<_or_type_operator<{
    equal: any
    equalDate: string | Date
    notEqual: any
    lessThan: number | Date
    lessThanEqual: number | Date
    moreThan: number | Date
    moreThanEqual: number | Date
    contains: string
    similar: string
    in: any[],
    notIn: any[]
}>>

type _type_filter = {
    [Key: string]: _type_operator
    | string
    | number
    | boolean
    | Date
    | string[]
    | number[]
    | boolean[]
    | Date[]
}

export type TypeFilter<T extends { [Key: string]: any }> = {
    [Key in keyof T]: _type_operator | T[Key] | null
}


const _seperator = '__'

// ------------------------------- FILTER -------------------------------------


// ------------------------------- SORT -------------------------------------

type _TypeSort = {
    [key: string]: SORT_OPTION
}

export type TypeSort<T extends string[]> = {
    [key in T[number]]?: SORT_OPTION
}

// ------------------------------- SORT -------------------------------------

export default class RepositoryModel {
    protected manager: EntityManager

    async queryInsert<T extends TypeMany | TypeOne>(
        record: EntityTarget<T>,
        data: TypeInsert<T, InterfaceModel>,
        transaction: EntityManager
    ): Promise<T> {
        return await transaction.createQueryBuilder()
            .insert()
            .into(record)
            .values(isArray(data) ? (data as TypeMany).map(d => trimObject(d, { with_null: true })) : trimObject(data, { with_null: true }) as any)
            .returning('*')
            .execute()
            .then(result => {
                return isArray(data) ? result.generatedMaps : result.generatedMaps[0] as any
            }).catch(err => {
                if (err.code === '23505' || err.code === 23505) {
                    throw Errors.duplicateKey(err.constraint)
                }
                throw err
            })
    }

    async queryInsertOrUpdate<T extends TypeOne | TypeMany>(
        record: EntityTarget<T>,
        data: TypeInsertOrUpdate<T, InterfaceModel>,
        onConflict: T extends TypeMany ? (keyof T[number])[] : (keyof T)[],
        transaction: EntityManager
    ): Promise<T> {
        const Q = transaction.createQueryBuilder()
            .insert()
            .into(record, isArray(data) ? data.reduce((init: string[], i: { [key: string]: any }) => {
                return [...init.filter(_ => !Object.keys(i).includes(_)), ...Object.keys(i)]
            }, [] as string[]) : Object.keys(data))
            .values(isArray(data) ? (data as TypeMany).map(d => trimObject(d, { with_null: false })) : trimObject(data, { with_null: false }) as any)
            .orUpdate(isArray(data) ? Object.keys(trimObject({
                ...data[0],
                id: undefined
            })) : Object.keys(trimObject({
                ...data,
                id: undefined
            })), onConflict as any)
            .returning('*')

        return await Q.execute()
            .then(result => isArray(data) ? result.generatedMaps : result.generatedMaps[0] as any)
            .catch(err => {
                if (err.code === '23505' || err.code === 23505) {
                    throw Errors.duplicateKey(err.constraint)
                }
                throw err
            })
    }

    async queryRawInsertOrUpdate<T extends TypeOne | TypeMany>(
        record: EntityTarget<T>,
        data: TypeInsertOrUpdate<T, InterfaceModel>,
        onConflict: T extends TypeMany ? ((keyof T[number] | [(keyof T[number]), string])[]) : ((keyof T | [(keyof T), string])[]),
        transaction: EntityManager
    ): Promise<T> {
        const Q = transaction.createQueryBuilder()
            .insert()
            .into(record, isArray(data) ? data.reduce((init: string[], i: { [key: string]: any }) => {
                return [...init.filter(_ => !Object.keys(i).includes(_)), ...Object.keys(i)]
            }, [] as string[]) : Object.keys(data))
            .values(isArray(data) ? (data as TypeMany).map(d => trimObject(d, { with_null: true })) : trimObject(data, { with_null: true }) as any)
            .orUpdate(isArray(data) ? Object.keys(trimObject({
                ...data[0],
                id: undefined
            })) : Object.keys(trimObject({
                ...data,
                id: undefined
            })), onConflict.map((i: any) => isArray(i) ? `?COALESCE("${i[0]}", '${i[1]}')?` : i))
            .returning('*')
            .getQueryAndParameters()

        return await this.queryCustom(Q[0].replace('"?', '').replace('?"', '').replace('"?', '').replace('?"', ''), Q[1], transaction)
            .then(result => isArray(data) ? result : result?.[0] as any)
            .catch(err => {
                if (err.code === '23505' || err.code === 23505) {
                    throw new Errors.duplicateKey(err.detail)
                }
                throw err
            })
    }

    async queryUpdate<T extends TypeOne>(
        record: EntityTarget<T>,
        data: TypeUpdate<T, InterfaceModel, '!'>,
        transaction: EntityManager
    ): Promise<T>
    async queryUpdate<T extends TypeOne>(
        record: EntityTarget<T>,
        data: TypeUpdate<T, InterfaceModel, '?'>,
        where: Partial<TypeMapOptionalArray<T>>,
        transaction: EntityManager
    ): Promise<T[] | T>
    async queryUpdate<T extends TypeOne>(
        record: EntityTarget<T>,
        data: TypeUpdate<T, InterfaceModel, '!'> | TypeUpdate<T, InterfaceModel, '!'>,
        where: EntityManager | Partial<TypeMapOptionalArray<T>>,
        transaction?: EntityManager
    ) {
        const Q = (transaction ? transaction : (where as EntityManager)).createQueryBuilder()
            .update(record)
            .set(trimObject(data) as any)

        if (where && Object.values(where).some(i => !!i) && transaction) {
            const wheres = Object.keys(trimObject(where)).reduce((init, key) => {
                return {
                    ...init,
                    [key]: isArray(where[key]) ? In(where[key]) : where[key]
                }
            }, {})
            if (!Object.values(wheres).length) {
                // Logger(this, record)
                throw Errors.notValid(`'key' must be provided in where clause`)
            }
            Q.where(wheres)
        } else {
            if (!data.id) {
                // Logger(this, record)
                throw Errors.notValid(`'id' must be provided in where clause`)

            }
            Q.where({ id: data.id })
        }

        return Q.returning('*')
            .execute()
            .then(result => {
                if (!result.affected) {
                    throw Errors.notFound(record)
                }
                if (where && Object.values(where).some(i => !!i) && transaction) {
                    if (Object.values(where).some(i => isArray(i))) {
                        return result.raw as any
                    }
                    return result.raw[0] as any
                }
                return result.raw[0] as any
            })
    }

    async querySelectNew<T extends ObjectLiteral, GET extends GETTER>(
        record: EntityTarget<any>,
        alias: string,
        fn: (Q: SelectQueryBuilder<T>) => SelectQueryBuilder<any>,
        option: OPTION<GET>,
        transaction: EntityManager,
    ): Returned<T, GET> {
        const defaults = {
            limit: 40,
            offset: 0
        }
        // const Q = trx ? trx.from('app.order', 'order').select('"order".*').distinctOn(['"order".id']).orderBy('order.id') : this.querySelect(Order.OrderRecord, 'order', transaction)
        const QR = (trx?: SelectQueryBuilder<any>) => {
            let Q = trx ? trx.from(record, alias).select(`"${alias}".*`).distinctOn([`"${alias}".id`]).orderBy(`${alias}.id`) : transaction.createQueryBuilder(record, alias)
            Q = fn(Q)
            if (option.filter) {
                Q.andWhere(this.filter(alias, option.filter, {
                    getAllWhenNoFilter: option.getAllWhenNoFilter
                }))
            }
            if (option.sort) {
                this.sort(Q, alias, option.sort)
            }
            if (!option.join_distinct) {
                Q.limit(option.limit || defaults.limit)
                Q.offset(option.offset || defaults.offset)
            }
            return Q
        }
        // let Q = transaction.createQueryBuilder(record, alias)

        let QGet: () => SelectQueryBuilder<any> = undefined as any


        if (option.join_distinct) {
            QGet = () => QR().innerJoin(query => {
                const QQ = query.subQuery()
                    .from(subquery => {
                        const Q = QR(subquery)
                        return Q
                    }, 'sub')

                // QQ.addOrderBy('sub.id', 'ASC')
                QQ.limit(option.limit || defaults.limit)
                QQ.offset(option.offset || defaults.offset)
                return QQ
            }, 't', `t.id = "${alias}".id`)
        }

        if (process.env.DB_DEBUG === 'true') {
            if (option.join_distinct) {
                Log()
                Logger('QUERY', QGet().getQuery())
                
            } else {
                Log()
                Logger('QUERY', QR().getQuery())
            }
        }

        if (option.join_distinct) {
            if (option.get === 'ONE') {
                return await QGet().getOne() as any
            }

            if (option.get === 'MANY_AND_COUNT') {
                return {
                    count: await QR().getCount(),
                    data: await QGet().getMany()
                } as any
            }
            if (option.get === 'COUNT') {
                return await QGet().getCount() as any
            }
            return await QGet().getMany() as any
        } else {
            if (option.get === 'ONE') {
                return await QR().getOne() as any
            }

            if (option.get === 'MANY_AND_COUNT') {
                return {
                    count: await QR().getCount(),
                    data: await QR().getMany()
                } as any
            }
            if (option.get === 'COUNT') {
                return await QR().getCount() as any
            }
            return await QR().getMany() as any
        }
    }

    querySelect<T extends undefined>(
        record: EntityTarget<T>,
        alias: string,
        transaction: EntityManager
    ) {
        return transaction.createQueryBuilder(record as any, alias) as any
    }

    protected queryCustom<T>(
        query: string,
        parameters?: any[],
        transaction?: EntityManager
    ): Promise<T> {
        const manager = transaction || this.manager

        return manager.query(query, parameters)
    }

    async queryDelete<T extends TypeOne>(
        record: EntityTarget<T>,
        where: TypeMapOptionalArray<TypeDelete<T, InterfaceModel>>,
        transaction: EntityManager
    ): Promise<T[]> {
        const _where = trimObject(where)
        const Q = transaction.createQueryBuilder()
            .delete()
            .from(record)
            .where(Object.keys(_where).map(i => SQLObject(i) + (isArray(_where[i]) ? ' IN ' : ' = ') + (isArray(_where[i]) ? SQLIn(_where[i]) : SQLValue(_where[i]))).join(' AND '))

        if (!Object.values(_where).length) {
            // Logger(this, record)
            throw Errors.notValid(`'key' must be provided in where clause`)
        }

        return Q.returning('*')
            .execute()
            .then(result => {
                if (!result.affected) {
                    throw Errors.notFound(record)
                }
                return result.raw as any
            })
    }


    // -----------------------------------------------------------------------

    private isOr(str: string) {
        return str.substring(0, 2) === 'or'
    }

    private trimOr(str: string) {
        return str.split('or_').join('')
    }

    filter(filter: _type_filter | _type_filter[], option?: FilterOption): any
    filter(prefix: string, filter: _type_filter | _type_filter[], option?: FilterOption): any
    filter(prefix: string | _type_filter | _type_filter[], filter?: _type_filter | _type_filter[] | FilterOption, option: FilterOption = {
        getAllWhenNoFilter: false
    }) {
        let _prefix: string | undefined
        let _filter: _type_filter | _type_filter[]
        let _getAllWhenNoFilter: boolean | undefined

        if (!(typeof prefix === 'string')) {
            _prefix = undefined
            _filter = prefix as any
            _getAllWhenNoFilter = (filter as any).getAllWhenNoFilter as any || false
        } else {
            _prefix = prefix as any
            _filter = filter as any
            _getAllWhenNoFilter = option.getAllWhenNoFilter || false
        }

        let similar_cols = []

        let ress: any
        if (isArray(_filter)) {
            ress = new Brackets(q => {
                return (_filter as _type_filter[]).map(f => {
                    return q.orWhere(this._filter(_prefix ? _prefix : f, _prefix ? f : {
                        getAllWhenNoFilter: _getAllWhenNoFilter,
                        Q: option.Q || (filter as any).Q
                    }, {
                        getAllWhenNoFilter: _getAllWhenNoFilter,
                        Q: option.Q || (filter as any).Q
                    }))
                })
            })
        } else {
            ress = this._filter(_prefix ? _prefix : _filter as _type_filter, _prefix ? _filter as _type_filter : {
                getAllWhenNoFilter: _getAllWhenNoFilter,
                Q: option.Q || (filter as any).Q
            }, {
                getAllWhenNoFilter: _getAllWhenNoFilter,
                Q: option.Q || (filter as any).Q
            })
        }

        if (isArray(_filter)) {
            (_filter as _type_filter[]).forEach(f => {
                similar_cols = [...similar_cols, ...Object.entries(f).filter(([k, v]) => (v as any)?.similar)] as any
            })
        }

        if (similar_cols.length) {
            const key_similars = similar_cols.map(([k, v]: any) => {
                const key = k.split('.').join(_seperator)
                const table = key.includes(_seperator) ? key.split(_seperator)[0] : prefix
                const column = key.includes(_seperator) ? key.split(_seperator)[1] : key.split(_seperator)[0]
                return `word_similarity('${v?.similar}', "${table}"."${column}")`
            }).join(', ')

            if (option.Q) {
                option.Q.addOrderBy(`GREATEST(${key_similars})`, 'DESC')
            } else if ((filter as any).Q) {
                (option as any).Q.addOrderBy(`GREATEST(${key_similars})`, 'DESC')
            }
        }
        return ress
    }

    private _filter(prefix: string | _type_filter, filter?: _type_filter | FilterOption, option?: FilterOption) {
        return new Brackets(q => {
            const _getAllWhenNoFilter = typeof option?.getAllWhenNoFilter ? option?.getAllWhenNoFilter : filter?.getAllWhenNoFilter
            let _filter = (typeof prefix === 'string' ? filter : prefix) as any

            if ((!Object.keys(_filter || {}).length) && !_getAllWhenNoFilter) {
                q.andWhere('1 = 2')
            }

            if (_getAllWhenNoFilter) {
                _filter = Object.keys(_filter).reduce((init, key) => {
                    if (_filter[key] === undefined || isEmptyArray(_filter[key])) {
                        return init
                    } else {
                        if (isObject(_filter[key])) {
                            if (isEmptyObject(trimObject(_filter[key]))) {
                                return init
                            }

                            const __value = Object.entries(_filter[key]).reduce((_init, entry) => {
                                return entry[1] === undefined || isEmptyArray(entry[1] as any) ? _init : {
                                    ..._init,
                                    [entry[0]]: entry[1]
                                }
                            }, {})
                            return isEmptyObject(__value) ? init : {
                                ...init,
                                [key]: __value
                            }
                        }
                        return {
                            ...init,
                            [key]: _filter[key]
                        }
                    }
                }, {})
            } else {
                _filter = Object.keys(_filter).reduce((init, key) => {
                    return {
                        ...init,
                        [key]: _filter[key] === undefined ? undefined : parseNull(_filter[key])
                    }
                }, {})
            }

            return Object.keys(_filter).map(key_ => {
                const key = key_.split('.').join(_seperator)
                const _value = _filter[key]
                const _table = isObject(prefix as any) ? key.split(_seperator)[0] : key.includes(_seperator) ? key.split(_seperator)[0] : prefix

                const _column = isObject(prefix as any) ? key.split(_seperator)[1] : key.includes(_seperator) ? key.split(_seperator)[1] : key

                const table_column = (`"${_table}"."${_column}"${isString(_value) ? '::TEXT' : ''}`)

                const wheres = isObject(_value as any) ?
                    ('(' + (Object.keys(_value).map((_key, _n) => {
                        const __key = this.trimOr(_key)
                        const __idDate = ___key => this.trimOr(___key) === 'equalDate'

                        // if (__key === 'similar') {
                        //     if (option.Q) {
                        //         option.Q.addOrderBy()
                        //     }
                        //     if (filter.Q) {

                        //     }
                        // }

                        return (_n === 0 ? '' : this.isOr(_key) ? ' OR ' : ' AND ') + (__idDate(__key) ? (table_column + SQLDate(_value[_key], true)) : __key === 'similar' ? `word_similarity(${SQLValue(_value[_key])}, ${table_column}::TEXT)` :
                            __key === 'contains' ? (table_column + '::TEXT') :
                                table_column)
                            + ' ' +
                            (_value[_key] === null ? 'IS' : _symbol[__key]) + ` ${_symbol[__key] === _symbol.contains ? SQLSearch(_value[_key]) : __idDate(_key) ? SQLDate(_value[_key]) : __key === 'similar' ? SQLValue(0.3) : ['notIn', 'in'].includes(__key) ? SQLIn(_value[_key]) : SQLValue(_value[_key])}`
                    }).join('') + ')'))
                    :
                    (table_column + ' ' + (isArray(_value) ? `IN ${SQLIn(_value)}` : ((_value === null ? 'IS' : _symbol.equal) + ` ${SQLValue(_value)}`)))

                return wheres ? q.andWhere(wheres) : q
            })
        })
    }

    sort(Q: SelectQueryBuilder<any>, sort: _TypeSort): any
    sort(Q: SelectQueryBuilder<any>, prefix: string, sort: _TypeSort): any
    sort(Q: SelectQueryBuilder<any>, prefix: string | _TypeSort, sort?: _TypeSort) {
        let _prefix: string | undefined
        let _sort: _TypeSort

        if (!(typeof prefix === 'string')) {
            _prefix = undefined
            _sort = prefix as any
        } else {
            _prefix = prefix as any
            _sort = sort as any
        }
        if (!Object.keys(trimObject(_sort || {})).length) {
            return Q
        }
        Object.entries(trimObject(_sort)).forEach(([k, v]) => {
            const schema = k.includes(_seperator) ? k.split(_seperator)[0] : (_prefix || '')
            const table = k.includes(_seperator) ? k.split(_seperator)[1] : k
            const method: any = v.includes('_') ? v.split('_')[0] : v
            const option: any = v.includes('_') ? v.split('_').filter((_, n) => n > 0).join(' ') : undefined
            Q.addOrderBy(`"${schema}"."${table}"`, method, option)
        })
        return Q
    }

}

export type Insert<T> = Omit<T, 'id'>
export type Update<T> = Partial<T> & { id: number }
export type Delete<T> = Partial<T> & { id: number }


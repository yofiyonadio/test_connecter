export type ArrayToObject<T extends readonly [...any]> = {
    [Key in Uppercase<T[number]>]: T[number]
}

const _SORT_OPTION = ['ASC', 'DESC', 'ASC_NULLS_FIRST', 'DESC_NULLS_FIRST', 'ASC_NULLS_LAST', 'DESC_NULLS_LAST'] as const
type _SORT_OPTION = ArrayToObject<typeof _SORT_OPTION>
export type SORT_OPTION = typeof _SORT_OPTION[number]
export const SORT_OPTION: _SORT_OPTION = {
    ASC: 'ASC',
    DESC: 'DESC',
    ASC_NULLS_FIRST: 'ASC_NULLS_FIRST',
    DESC_NULLS_FIRST: 'DESC_NULLS_FIRST',
    ASC_NULLS_LAST: 'ASC_NULLS_LAST',
    DESC_NULLS_LAST: 'DESC_NULLS_LAST'
}

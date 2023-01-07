
enum EnumColor {
    pink = '#FF35A1',
    red = '#FF3535',
    green = '#76FF06',
    blue = '#06F7FF',
    amber = '#ffbf00',
}

const _colors = ['pink', 'red', 'green', 'blue', 'amber'] as const

export type TypeColor = typeof _colors[number]

export default EnumColor

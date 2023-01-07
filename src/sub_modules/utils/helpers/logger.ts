import chalk from 'chalk'
import EnumColor from './color'
import { TypeColor } from './color'

export function Logger(thiss: object | string, log: any, color?: TypeColor) {
    let class_name: string
    try {
        class_name = typeof thiss === 'string' ? thiss : (thiss as any).constructor.name
    } catch {
        class_name = ''
    }
    if (blackList(thiss)) {
        // tslint:disable-next-line: no-console
        if (color) console.log(class_name, '\x1b[90m:::>\x1b[0m', chalk.hex(EnumColor[color])(log))
        // tslint:disable-next-line: no-console
        else console.log(class_name, '\x1b[90m:::>\x1b[0m', log)
    }

}

export function Log(...logs: any[]) {
    if (blackList(logs[0])) {
        // tslint:disable-next-line: no-console
        console.log(...logs)
    }
}

function blackList(thiss: any) {
    return !['production'].includes(process.env.DB_HOST as any) || ['Server  ', 'Database'].includes(thiss)
}

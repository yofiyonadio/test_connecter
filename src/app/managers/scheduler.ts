import {
    DataSource,
} from 'typeorm'
import cron from 'node-cron'
import { ManagerModel } from 'app/models'


type SECONDS = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
    | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19
    | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29
    | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39
    | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49
    | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59

type HOURS = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
    | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19
    | 20 | 21 | 22 | 23

type DAYS = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
    | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19
    | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29
    | 30 | 31

type WEEKS = 0 | 1 | 2 | 3 | 4 | 5 | 6

type MONTHS = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

// const now = () => TimeHelper.toString()


class SchedulerManager extends ManagerModel {
    static __displayName = 'SchedulerManager'


    async initialize(connection: DataSource) { }
    // ============================= METHODS ============================

    watcher() {
        return this.schedule({
            seconds: '*/1',
        }, () => {
            // console.log('watcher running... at ' + now())
        })
    }


    // ============================ PRIVATES ============================
    private schedule(
        pattern: {
            seconds?: SECONDS | '*' | `*/${SECONDS}`,
            minutes?: SECONDS | '*' | `*/${SECONDS}`,
            hours?: HOURS | '*' | `*/${HOURS}`,
            days?: DAYS | '*' | `*/${DAYS}`,
            weeks?: WEEKS | '*' | `*/${WEEKS}`,
            months?: MONTHS | '*' | `*/${MONTHS}`,
        },
        func: () => any
    ) {
        const _second = pattern.seconds ? pattern.seconds : (pattern.weeks || pattern.months || pattern.days || pattern.hours || pattern.minutes) ? 0 : '*'
        const _minute = pattern.minutes ? pattern.minutes : (pattern.weeks || pattern.months || pattern.days || pattern.hours) ? 0 : '*'
        const _hour = pattern.hours ? pattern.hours : (pattern.weeks || pattern.months || pattern.days) ? 0 : '*'
        const _day = pattern.days ? pattern.days : pattern.months ? 1 : '*'
        const _month = pattern.months ? pattern.months : '*'
        const _weeks = pattern.weeks ? pattern.weeks : '*'
        return cron.schedule(`${_second} ${_minute} ${_hour} ${_day} ${_month} ${_weeks}`, func)
    }
}

export default new SchedulerManager()


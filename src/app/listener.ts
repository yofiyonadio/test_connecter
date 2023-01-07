import { PoolClient } from 'pg'
import { listener_event_name } from 'energie/build/utils/helpers/listener'
import { trx } from './database'
import { EntityManager } from 'typeorm'

interface ListenerInterface {
    old: { [key: string]: any },
    new: { [key: string]: any },
    schema: string,
    table: string,
    type: string,
    name: string
}

class Listener {

    listen(client: PoolClient) {
        client.query('LISTEN ' + listener_event_name)
        client.on('notification', async res => {
            const channel = res.channel
            const payload = JSON.parse(res.payload) as ListenerInterface
            if (channel === listener_event_name && process.env.ENV === 'production') {
                this.notify(payload).catch(err => {
                    Logger(this, err)
                })
            }
        })
    }

    async notify(listener: ListenerInterface) {
        await trx(async (transaction: EntityManager) => {
            switch (listener.name) { }
        })
    }
}

export default new Listener()

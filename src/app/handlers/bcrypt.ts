import { ErrorModel } from 'app/models'
import bcrypt from 'bcrypt'


class BcryptHandler {

    encrypt(password: string): string {
        return bcrypt.hashSync(password, 12)
    }

    decrypt(password: string, hash: string): boolean {
        if (bcrypt.compareSync(password, hash)) {
            return true
        }
        throw new ErrorModel('NOT_AUTHORIZED', 'ERR_103|Parameter invalid', `'password' invalid!`)
    }

}

export default new BcryptHandler()

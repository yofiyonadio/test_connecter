import { ErrorModel } from 'app/models'
import jwt from 'jsonwebtoken'

class JwtHandler {

    encode({ ...args }: { [key: string]: any }, option?: jwt.SignOptions) {
        try {
            return jwt.sign(args, process.env.JWT_SECRET, option)
        } catch (e) {
            Logger(this, e)
            throw new ErrorModel('NOT_VALID', 'ERR_103|Parameter invalid', 'Failed encode token')
        }
    }

    decode(token: string): { [key: string]: any } {
        try {
            return jwt.verify(token, process.env.JWT_SECRET) as any
        } catch (e) {
            Logger(this, e)
            throw new ErrorModel('NOT_VALID', 'ERR_103|Parameter invalid', 'Failed decode token')
        }
    }

}

export default new JwtHandler()

import { Router } from 'express'
import { createExpressEndpoints } from '@ts-rest/express'
import { accountingContract } from '@pharmacy-pos/shared/api/contracts'
import auth from '../../../../middleware/auth'
import { createValidationErrorHandler } from '../../../common/tsRest'
import { accountingController } from '../controllers/accounting.controller'

const router: Router = Router()

router.use(auth)

createExpressEndpoints(accountingContract, accountingController, router, {
  requestValidationErrorHandler: createValidationErrorHandler({
    defaultStatus: 400,
    pathParamStatus: 404,
  }),
})

export default router

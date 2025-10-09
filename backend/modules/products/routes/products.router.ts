import { Router } from 'express'
import { createExpressEndpoints } from '@ts-rest/express'
import { productsContract } from '@pharmacy-pos/shared/api/contracts'
import { productsController } from '../controllers/products.controller'

const router: Router = Router()
createExpressEndpoints(productsContract, productsController, router)

export default router

import { Router } from 'express'
import auth from '../../../middleware/auth'
import {
  createMedicineHandler,
  createProductHandler,
  createTestDataHandler,
  deleteProductHandler,
  getProductByCodeHandler,
  getProductByIdHandler,
  listBaseProductsHandler,
  listMedicinesHandler,
  listProductsHandler,
  updatePackageUnitsHandler,
  updateProductHandler,
} from './legacy.controller'
import {
  createMedicineValidators,
  createProductValidators,
  updateProductValidators,
  validateRequest,
} from './legacy.validators'

const router: Router = Router()

router.get('/', listProductsHandler)
router.get('/products', listBaseProductsHandler)
router.get('/medicines', listMedicinesHandler)
router.get('/code/:code', getProductByCodeHandler)
router.get('/:id', getProductByIdHandler)

router.post('/product', auth, createProductValidators, validateRequest, createProductHandler)
router.post('/medicine', auth, createMedicineValidators, validateRequest, createMedicineHandler)
router.put('/:id', auth, updateProductValidators, validateRequest, updateProductHandler)
router.delete('/:id', auth, deleteProductHandler)
router.put('/:id/package-units', updatePackageUnitsHandler)
router.post('/create-test-data', createTestDataHandler)

export default router

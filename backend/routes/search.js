const router      = require('express').Router()
const verifyToken = require('../middleware/auth')
const { search }  = require('../controllers/searchController')

router.get('/', verifyToken, search)

module.exports = router

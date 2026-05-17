const { Router } = require('express');
const ctrl = require('../controllers/ClauseController');

const router = Router();

router.get('/',          ctrl.list);
router.post('/',         ctrl.create);
router.put('/:id',       ctrl.update);
router.delete('/:id',    ctrl.remove);
router.post('/:id/duplicate', ctrl.duplicate);

module.exports = router;

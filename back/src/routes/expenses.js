'use strict';
const express = require('express');
const router  = express.Router();
const { getCategories, getExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/ExpenseController');

router.get('/categories', getCategories);
router.get('/',           getExpenses);
router.post('/',          createExpense);
router.put('/:id',        updateExpense);
router.delete('/:id',     deleteExpense);

module.exports = router;

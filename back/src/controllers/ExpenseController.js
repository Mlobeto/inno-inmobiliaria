'use strict';
const prisma = require('../utils/prismaClient');

const CATEGORIES = [
  'Sueldos / Honorarios',
  'Alquiler de oficina',
  'Servicios (luz, agua, internet)',
  'Marketing / Publicidad',
  'Mantenimiento',
  'Impuestos / Tasas',
  'Comisión de agente',
  'Otros',
];

exports.getCategories = (_req, res) => res.json(CATEGORIES);

exports.getExpenses = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { from, to, category } = req.query;

    const where = { tenantId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to)   where.date.lte = new Date(to);
    }
    if (category) where.category = category;

    const expenses = await prisma.Expenses.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener gastos', details: err.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { date, amount, category, description } = req.body;

    if (!date || !amount || !category) {
      return res.status(400).json({ error: 'Fecha, monto y categoría son obligatorios.' });
    }

    const expense = await prisma.Expenses.create({
      data: {
        tenantId,
        date:     new Date(date),
        amount:   parseFloat(amount),
        category,
        description: description || null,
      },
    });

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear gasto', details: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const id = parseInt(req.params.id);
    const { date, amount, category, description } = req.body;

    const existing = await prisma.Expenses.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Gasto no encontrado.' });

    const updated = await prisma.Expenses.update({
      where: { id },
      data: {
        ...(date      && { date: new Date(date) }),
        ...(amount    && { amount: parseFloat(amount) }),
        ...(category  && { category }),
        description: description ?? existing.description,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar gasto', details: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const id = parseInt(req.params.id);

    const existing = await prisma.Expenses.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Gasto no encontrado.' });

    await prisma.Expenses.delete({ where: { id } });
    res.json({ message: 'Gasto eliminado.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar gasto', details: err.message });
  }
};

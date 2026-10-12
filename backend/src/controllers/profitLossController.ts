import { Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Expense from '../models/Expense';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /api/profit-loss
 * Query params:
 *   - dateFrom  (YYYY-MM-DD)  optional
 *   - dateTo    (YYYY-MM-DD)  optional
 *   - filter    'today' | 'week' | 'month' | 'custom'  (default: 'month')
 *
 * Returns:
 *   - totalRevenue      : sum of all confirmed order totals (selling price)
 *   - totalCOGS         : sum of all costTotal from order items
 *   - grossProfit       : totalRevenue - totalCOGS
 *   - grossMargin       : grossProfit / totalRevenue * 100
 *   - totalExpenses     : sum of all expenses
 *   - netProfit         : grossProfit - totalExpenses
 *   - netMargin         : netProfit / totalRevenue * 100
 *   - totalOrders       : number of confirmed orders
 *   - productBreakdown  : per-product profit summary
 *   - since / until     : actual date range used
 */
export const getProfitLoss = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filter = 'month', dateFrom, dateTo } = req.query as {
      filter?: string;
      dateFrom?: string;
      dateTo?: string;
    };

    // ── Build date range ────────────────────────────────────────────────────
    const now = new Date();
    let since: Date;
    let until: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (filter === 'custom' && dateFrom && dateTo) {
      since = new Date(dateFrom);
      until = new Date(dateTo);
      until.setHours(23, 59, 59, 999);
    } else if (filter === 'today') {
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (filter === 'week') {
      since = new Date(now);
      since.setDate(now.getDate() - 6);
      since.setHours(0, 0, 0, 0);
    } else {
      // default: current month
      since = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    const dateMatch = { createdAt: { $gte: since, $lte: until } };

    // ── Aggregate confirmed orders ──────────────────────────────────────────
    const orderAgg = await Order.aggregate([
      { $match: { status: 'confirmed', ...dateMatch } },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$items.total' },
          totalCOGS: { $sum: '$items.costTotal' },
          totalOrders: { $addToSet: '$_id' },
        },
      },
    ]);

    const totalRevenue = orderAgg[0]?.totalRevenue ?? 0;
    const totalCOGS = orderAgg[0]?.totalCOGS ?? 0;
    const totalOrders = orderAgg[0]?.totalOrders?.length ?? 0;
    const grossProfit = totalRevenue - totalCOGS;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // ── Aggregate expenses ──────────────────────────────────────────────────
    const expenseAgg = await Expense.aggregate([
      { $match: { createdAt: { $gte: since, $lte: until } } },
      { $group: { _id: null, totalExpenses: { $sum: '$amount' } } },
    ]);
    const totalExpenses = expenseAgg[0]?.totalExpenses ?? 0;

    const netProfit = grossProfit - totalExpenses;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // ── Per-product breakdown ───────────────────────────────────────────────
    const productAgg = await Order.aggregate([
      { $match: { status: 'confirmed', ...dateMatch } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          unit: { $first: '$items.unit' },
          totalQty: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          totalCOGS: { $sum: '$items.costTotal' },
          avgSellingRate: { $avg: '$items.rate' },
          avgCostPrice: { $avg: '$items.costPrice' },
        },
      },
      {
        $addFields: {
          grossProfit: { $subtract: ['$totalRevenue', '$totalCOGS'] },
          margin: {
            $cond: [
              { $gt: ['$totalRevenue', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$totalRevenue', '$totalCOGS'] }, '$totalRevenue'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { grossProfit: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        since: since.toISOString(),
        until: until.toISOString(),
        filter,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCOGS: Math.round(totalCOGS * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        grossMargin: Math.round(grossMargin * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        netMargin: Math.round(netMargin * 100) / 100,
        productBreakdown: productAgg.map((p) => ({
          productId: p._id,
          productName: p.productName,
          unit: p.unit,
          totalQty: Math.round(p.totalQty * 100) / 100,
          avgSellingRate: Math.round(p.avgSellingRate * 100) / 100,
          avgCostPrice: Math.round(p.avgCostPrice * 100) / 100,
          totalRevenue: Math.round(p.totalRevenue * 100) / 100,
          totalCOGS: Math.round(p.totalCOGS * 100) / 100,
          grossProfit: Math.round(p.grossProfit * 100) / 100,
          margin: Math.round(p.margin * 100) / 100,
        })),
      },
    });
  } catch (error) {
    console.error('getProfitLoss error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

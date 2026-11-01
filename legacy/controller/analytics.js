// controller/analytics.js
const db = require("../models");
const { Order, OrderItem, Product, User, Payment } = db;
const { Op } = require("sequelize");

const getDashboardStats = async (req, res) => {
  try {
    // Total sales (only from orders with successful payments)
    const totalSales = await Order.sum("total", {
      where: {
        status: { [Op.not]: "cancelled" },
        id: {
          [Op.in]: db.sequelize.literal(
            `(SELECT "orderId" FROM "Payments" WHERE "status" = 'success')`
          ),
        },
      },
    });

    // Total orders (only orders with successful payments)
    const totalOrders = await Order.count({
      where: {
        status: { [Op.not]: "cancelled" },
        id: {
          [Op.in]: db.sequelize.literal(
            `(SELECT "orderId" FROM "Payments" WHERE "status" = 'success')`
          ),
        },
      },
    });

    // Total dumps (orders with pending payments)
    const totalDumps = await Order.count({
      where: {
        status: { [Op.not]: "cancelled" },
        id: {
          [Op.in]: db.sequelize.literal(
            `(SELECT "orderId" FROM "Payments" WHERE "status" = 'pending')`
          ),
        },
      },
    });

    // Total users
    const totalUsers = await User.count();

    // Monthly revenue (last 12 months)
    const monthlyRevenue = await Order.findAll({
      attributes: [
        [
          db.sequelize.fn("DATE_TRUNC", "month", db.sequelize.col("createdAt")),
          "month",
        ],
        [db.sequelize.fn("SUM", db.sequelize.col("total")), "revenue"],
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "orders"],
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 12)),
        },
        status: { [Op.not]: "cancelled" },
      },
      group: [
        db.sequelize.fn("DATE_TRUNC", "month", db.sequelize.col("createdAt")),
      ],
      order: [
        [
          db.sequelize.fn("DATE_TRUNC", "month", db.sequelize.col("createdAt")),
          "ASC",
        ],
      ],
    });

    // Top selling products
    const topProducts = await OrderItem.findAll({
      attributes: [
        "productId",
        [db.sequelize.fn("SUM", db.sequelize.col("quantity")), "totalSold"],
        [db.sequelize.fn("SUM", db.sequelize.col("subtotal")), "totalRevenue"],
      ],
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["name", "imageUrl", "price"],
        },
      ],
      group: ["productId", "product.id"],
      order: [[db.sequelize.fn("SUM", db.sequelize.col("quantity")), "DESC"]],
      limit: 5,
    });

    // Recent orders with user information
    const recentOrders = await Order.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    // Revenue distribution by status for pie chart
    const revenueByStatus = await Order.findAll({
      attributes: [
        "status",
        [db.sequelize.fn("SUM", db.sequelize.col("total")), "revenue"],
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 12)),
        },
      },
      group: ["status"],
      order: [[db.sequelize.fn("SUM", db.sequelize.col("total")), "DESC"]],
    });

    // Category revenue distribution
    const categoryRevenue = await OrderItem.findAll({
      attributes: [
        [
          db.sequelize.fn("SUM", db.sequelize.col("OrderItem.subtotal")),
          "revenue",
        ],
      ],
      include: [
        {
          model: Product,
          as: "product",
          attributes: [], // Remove individual product attributes
          include: [
            {
              model: db.Category,
              as: "category",
              attributes: ["id", "name"], // Keep these for grouping
            },
          ],
        },
        {
          model: Order,
          as: "order",
          where: {
            status: { [Op.not]: "cancelled" },
            createdAt: {
              [Op.gte]: new Date(
                new Date().setMonth(new Date().getMonth() - 12)
              ),
            },
          },
          attributes: [],
        },
      ],
      group: ["product.category.id", "product.category.name"], // Fixed grouping
      order: [
        [
          db.sequelize.fn("SUM", db.sequelize.col("OrderItem.subtotal")),
          "DESC",
        ],
      ],
      limit: 10,
    });

    res.json({
      stats: {
        totalSales: totalSales || 0,
        totalOrders: totalOrders || 0,
        totalUsers: totalUsers || 0,
        totalDumps: totalDumps || 0,
      },
      monthlyRevenue,
      topProducts,
      recentOrders,
      revenueByStatus,
      categoryRevenue,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res
      .status(500)
      .json({ message: "Failed to get dashboard stats", error: error.message });
  }
};

const getOrderAnalytics = async (req, res) => {
  try {
    const { period = "month" } = req.query;
    let dateFormat;
    let dateRange;

    switch (period) {
      case "day":
        dateFormat = "day";
        dateRange = new Date(new Date().setDate(new Date().getDate() - 30));
        break;
      case "week":
        dateFormat = "week";
        dateRange = new Date(new Date().setDate(new Date().getDate() - 84));
        break;
      case "3months":
        dateFormat = "month";
        dateRange = new Date(new Date().setMonth(new Date().getMonth() - 3));
        break;
      case "6months":
        dateFormat = "month";
        dateRange = new Date(new Date().setMonth(new Date().getMonth() - 6));
        break;
      case "year":
        dateFormat = "year";
        dateRange = new Date(
          new Date().setFullYear(new Date().getFullYear() - 5)
        );
        break;
      default:
        dateFormat = "month";
        dateRange = new Date(new Date().setMonth(new Date().getMonth() - 12));
    }

    const analytics = await Order.findAll({
      attributes: [
        [
          db.sequelize.fn(
            "DATE_TRUNC",
            dateFormat,
            db.sequelize.col("createdAt")
          ),
          "period",
        ],
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "orders"],
        [db.sequelize.fn("SUM", db.sequelize.col("total")), "revenue"],
      ],
      where: {
        createdAt: { [Op.gte]: dateRange },
        status: { [Op.not]: "cancelled" },
      },
      group: [
        db.sequelize.fn(
          "DATE_TRUNC",
          dateFormat,
          db.sequelize.col("createdAt")
        ),
      ],
      order: [
        [
          db.sequelize.fn(
            "DATE_TRUNC",
            dateFormat,
            db.sequelize.col("createdAt")
          ),
          "ASC",
        ],
      ],
    });

    // Get revenue distribution for pie chart
    const revenueDistribution = await OrderItem.findAll({
      attributes: [
        [
          db.sequelize.fn("SUM", db.sequelize.col("OrderItem.subtotal")),
          "revenue",
        ],
      ],
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["categoryId"],
          include: [
            {
              model: db.Category,
              as: "category",
              attributes: ["name"],
            },
          ],
        },
        {
          model: Order,
          as: "order",
          where: {
            status: { [Op.not]: "cancelled" },
            createdAt: { [Op.gte]: dateRange },
          },
          attributes: [],
        },
      ],
      group: ["product.category.id", "product.category.name"],
      order: [
        [
          db.sequelize.fn("SUM", db.sequelize.col("OrderItem.subtotal")),
          "DESC",
        ],
      ],
    });

    res.json({
      analytics,
      revenueDistribution,
      period: period,
    });
  } catch (error) {
    console.error("Order analytics error:", error);
    res
      .status(500)
      .json({ message: "Failed to get order analytics", error: error.message });
  }
};

module.exports = { getDashboardStats, getOrderAnalytics };


// // controller/order.js
// const db = require('../models');
// const { Order, OrderItem, Product, User, Address, Payment } = db;
// const { v4: uuidv4 } = require('uuid');

// const generateOrderNumber = () => {
//   return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
// };

// const createOrder = async (req, res) => {
//   const transaction = await db.sequelize.transaction();

//   try {
//     const { items, shippingAddressId, paymentMethod } = req.body;
//     const userId = req.user.id;

//     // Validate address
//     const address = await Address.findOne({ where: { id: shippingAddressId, userId } });
//     if (!address) {
//       return res.status(400).json({ message: 'Invalid shipping address' });
//     }

//     // Calculate totals
//     let subtotal = 0;
//     const orderItems = [];

//     for (const item of items) {
//       const product = await Product.findByPk(item.productId);
//       if (!product) {
//         throw new Error(`Product ${item.productId} not found`);
//       }

//       if (product.stockQuantity < item.quantity) {
//         throw new Error(`Insufficient stock for ${product.name}`);
//       }

//       const itemSubtotal = product.price * item.quantity;
//       subtotal += itemSubtotal;

//       orderItems.push({
//         productId: item.productId,
//         quantity: item.quantity,
//         price: product.price,
//         subtotal: itemSubtotal,
//         selectedFlavor: item.selectedFlavor,
//         selectedSize: item.selectedSize
//       });

//       // Update stock
//       await product.update({ 
//         stockQuantity: product.stockQuantity - item.quantity,
//         salesCount: product.salesCount + item.quantity
//       }, { transaction });
//     }

//     const shipping = subtotal > 50 ? 0 : 9.99;
//     const tax = subtotal * 0.08;
//     const total = subtotal + shipping + tax;

//     // Create order
//     const order = await Order.create({
//       orderNumber: generateOrderNumber(),
//       userId,
//       subtotal,
//       tax,
//       shipping,
//       total,
//       shippingAddressId,
//       status: 'pending'
//     }, { transaction });

//     // Create order items
//     for (const item of orderItems) {
//       await OrderItem.create({
//         orderId: order.id,
//         ...item
//       }, { transaction });
//     }

//     // Create payment record
//     await Payment.create({
//       orderId: order.id,
//       userId,
//       paymentMethod,
//       amount: total,
//       status: 'pending'
//     }, { transaction });

//     await transaction.commit();

//     // Fetch complete order
//     const completeOrder = await Order.findByPk(order.id, {
//       include: [
//         {
//           model: OrderItem,
//           as: 'orderItems',
//           include: [{ model: Product, as: 'product' }]
//         },
//         {
//           model: Address,
//           as: 'shippingAddress'
//         },
//         {
//           model: Payment,
//           as: 'payment'
//         }
//       ]
//     });

//     res.status(201).json({
//       message: 'Order created successfully',
//       order: completeOrder
//     });
//   } catch (error) {
//     await transaction.rollback();
//     res.status(500).json({ message: 'Failed to create order', error: error.message });
//   }
// };


// const getUserOrders = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { page = 1, limit = 10, status } = req.query;

//     const where = { userId };
//     if (status) where.status = status;

//     const orders = await Order.findAndCountAll({
//       where,
//       include: [
//         {
//           model: OrderItem,
//           as: 'orderItems',
//           include: [{ model: Product, as: 'product' }]
//         },
//         {
//           model: Address,
//           as: 'shippingAddress'
//         },
//         {
//           model: User,  // ADD THIS
//           as: 'user',   // ADD THIS
//           attributes: ['firstName', 'lastName', 'email'] // ADD THIS
//         }
//       ],
//       order: [['createdAt', 'DESC']],
//       limit: parseInt(limit),
//       offset: (page - 1) * limit
//     });

//     res.json({
//       orders: orders.rows,
//       pagination: {
//         total: orders.count,
//         page: parseInt(page),
//         limit: parseInt(limit),
//         pages: Math.ceil(orders.count / limit)
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to get orders', error: error.message });
//   }
// };


// const getOrderById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user.id;

//     const order = await Order.findOne({
//       where: { id, userId },
//       include: [
//         {
//           model: OrderItem,
//           as: 'orderItems',
//           include: [{ model: Product, as: 'product' }]
//         },
//         {
//           model: Address,
//           as: 'shippingAddress'
//         },
//         {
//           model: Payment,
//           as: 'payment'
//         }
//       ]
//     });

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     res.json({ order });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to get order', error: error.message });
//   }
// };

// const updateOrderStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, trackingNumber } = req.body;

//     const order = await Order.findByPk(id);
//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     const updateData = { status };
//     if (trackingNumber) updateData.trackingNumber = trackingNumber;
//     if (status === 'shipped') updateData.shippedAt = new Date();
//     if (status === 'delivered') updateData.deliveredAt = new Date();

//     await order.update(updateData);

//     res.json({ message: 'Order status updated successfully', order });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to update order status', error: error.message });
//   }
// };

// module.exports = { createOrder, getUserOrders, getOrderById, updateOrderStatus };



















// controller/order.js (Updated with discount support)
const db = require('../models');
const { Order, OrderItem, Product, User, Address, Payment, Discount, DiscountUsage, DeliveryFee } = db;
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

const createOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { items, shippingAddressId, guestShippingInfo, paymentMethod, discountCode } = req.body;
    const userId = req.user?.id; // Optional for guest checkout

    let address = null;
    let addressId = null;

    // Handle address - either from saved address or guest shipping info
    if (shippingAddressId && userId) {
      // Authenticated user with saved address
      address = await Address.findOne({ where: { id: shippingAddressId, userId } });
      if (!address) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Invalid shipping address' });
      }
      addressId = address.id;
    } else if (guestShippingInfo && userId) {
      // Authenticated user entering new address - create Address record
      address = await Address.create({
        userId: userId,
        type: 'home',
        firstName: guestShippingInfo.firstName,
        lastName: guestShippingInfo.lastName,
        streetAddress: guestShippingInfo.streetAddress,
        city: guestShippingInfo.city,
        state: guestShippingInfo.state,
        zipCode: guestShippingInfo.zipCode,
        country: guestShippingInfo.country || 'Nigeria',
        phone: guestShippingInfo.phone,
        isDefault: false
      }, { transaction });
      addressId = address.id;
    } else if (guestShippingInfo && !userId) {
      // Guest checkout - don't create Address record (requires userId)
      // Address info will be stored in Order.guestEmail and retrieved from guestShippingInfo
      addressId = null;
    } else {
      await transaction.rollback();
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    // Calculate subtotal
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemSubtotal,
        selectedFlavor: item.selectedFlavor,
        selectedSize: item.selectedSize
      });

      // NOTE: Stock will be updated after payment confirmation
      // Removed stock update from here to prevent issues with abandoned orders
    }

    // Handle discount validation and calculation
    let discount = null;
    let discountAmount = 0;

    if (discountCode) {
      discount = await Discount.findOne({
        where: { 
          code: discountCode.toUpperCase(),
          isActive: true,
          validFrom: { [Op.lte]: new Date() },
          [Op.or]: [
            { validUntil: null },
            { validUntil: { [Op.gte]: new Date() } }
          ]
        }
      });

      if (!discount) {
        throw new Error('Invalid or expired discount code');
      }

      // Check minimum order amount
      if (subtotal < discount.minOrderAmount) {
        throw new Error(`Minimum order amount of ₦${discount.minOrderAmount} required for this discount`);
      }

      // Calculate discount amount
      if (discount.type === 'percentage') {
        discountAmount = (subtotal * discount.value) / 100;
      } else {
        discountAmount = discount.value;
      }

      // Apply maximum discount limit
      if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
        discountAmount = discount.maxDiscountAmount;
      }

      discountAmount = Math.min(discountAmount, subtotal); // Can't discount more than subtotal
    }

    // Get delivery state and look up delivery fee
    let deliveryState = null;
    let deliveryFeeRecord = null;
    let shipping = 0;

    // Determine the delivery state from address or guest shipping info
    if (address && address.state) {
      deliveryState = address.state;
    } else if (guestShippingInfo && guestShippingInfo.state) {
      deliveryState = guestShippingInfo.state;
    }

    // Look up delivery fee for the state (case-insensitive)
    if (deliveryState) {
      // Use case-insensitive search to handle variations like "Edo" vs "edo" vs "EDO"
      deliveryFeeRecord = await DeliveryFee.findOne({
        where: {
          state: {
            [Op.iLike]: deliveryState
          },
          isActive: true
        }
      });

      if (deliveryFeeRecord) {
        shipping = parseFloat(deliveryFeeRecord.fee);
        console.log(`✅ Delivery fee found for "${deliveryState}": ₦${shipping} (matched: "${deliveryFeeRecord.state}")`);
      } else {
        // Log warning - this should never happen since every state must have a delivery fee
        console.warn(`⚠️  WARNING: No active delivery fee found for state: "${deliveryState}"`);
        console.warn(`   Order will be created with shipping = 0, which WILL cause accounting issues!`);

        // Try to find any delivery fee for this state (including inactive)
        const anyFee = await DeliveryFee.findOne({
          where: {
            state: {
              [Op.iLike]: deliveryState
            }
          }
        });

        if (anyFee && !anyFee.isActive) {
          console.warn(`   Found INACTIVE delivery fee: ₦${anyFee.fee}`);
          console.warn(`   Please activate this delivery fee or the order total will be wrong!`);
        } else if (!anyFee) {
          console.warn(`   No delivery fee record exists for this state at all!`);
          console.warn(`   Please create a delivery fee for "${deliveryState}"`);
        }
      }
    } else {
      console.warn(`⚠️  WARNING: No delivery state found for order!`);
      console.warn(`   Address: ${address ? 'Found' : 'Not found'}, Guest Info: ${guestShippingInfo ? 'Found' : 'Not found'}`);
    }

    const tax = 0; // Tax removed as per business requirements
    const total = subtotal - discountAmount + shipping;

    // Create order
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId: userId || null, // null for guest orders
      subtotal,
      discountAmount,
      discountId: discount ? discount.id : null,
      discountCode: discountCode || null,
      tax,
      shipping,
      total,
      shippingAddressId: addressId,
      deliveryFeeId: deliveryFeeRecord ? deliveryFeeRecord.id : null,
      status: 'pending',
      guestEmail: guestShippingInfo?.email || null, // Store guest email for order tracking
      guestShippingInfo: guestShippingInfo || null // Store complete guest shipping details
    }, { transaction });

    // Create order items
    for (const item of orderItems) {
      await OrderItem.create({
        orderId: order.id,
        ...item
      }, { transaction });
    }

    // Create payment record
    await Payment.create({
      orderId: order.id,
      userId: userId || null, // null for guest orders
      paymentMethod,
      amount: total,
      status: 'pending',
      currency: 'NGN'
    }, { transaction });

    // NOTE: Discount usage will be recorded after payment confirmation
    // Removed discount usage recording from here to prevent issues with abandoned orders

    await transaction.commit();

    // Fetch complete order
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }]
        },
        {
          model: Address,
          as: 'shippingAddress'
        },
        {
          model: Payment,
          as: 'payment'
        },
        {
          model: Discount,
          as: 'discount'
        }
      ]
    });

    res.status(201).json({
      message: 'Order created successfully',
      order: completeOrder
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ ORDER CREATION ERROR:');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Full error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const where = { userId };
    if (status) where.status = status;

    const orders = await Order.findAndCountAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }]
        },
        {
          model: Address,
          as: 'shippingAddress'
        },
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: Discount,
          as: 'discount',
          attributes: ['code', 'name', 'type', 'value']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      orders: orders.rows,
      pagination: {
        total: orders.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(orders.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get orders', error: error.message });
  }
};

// Get ALL orders (for admin)
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search, paymentStatus } = req.query;

    const where = {};
    if (status) where.status = status;

    // Add search functionality
    let searchConditions = {};
    if (search) {
      searchConditions = {
        [Op.or]: [
          { orderNumber: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    // Build include array with optional payment status filter
    const includeArray = [
      {
        model: OrderItem,
        as: 'orderItems',
        include: [{ model: Product, as: 'product' }]
      },
      {
        model: Address,
        as: 'shippingAddress'
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: Discount,
        as: 'discount',
        attributes: ['code', 'name', 'type', 'value']
      },
      {
        model: Payment,
        as: 'payment',
        attributes: ['id', 'status', 'paymentMethod', 'paystackReference', 'amount', 'paidAt'],
        ...(paymentStatus && { where: { status: paymentStatus } })
      }
    ];

    const orders = await Order.findAndCountAll({
      where: { ...where, ...searchConditions },
      include: includeArray,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    // If filtering by payment status, filter out orders without matching payment
    let filteredOrders = orders.rows;
    if (paymentStatus) {
      filteredOrders = orders.rows.filter(order => order.payment);
    }

    res.json({
      orders: filteredOrders,
      pagination: {
        total: paymentStatus ? filteredOrders.length : orders.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil((paymentStatus ? filteredOrders.length : orders.count) / limit)
      }
    });
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    res.status(500).json({ message: 'Failed to get orders', error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    // Build where clause - admins can view any order, regular users only their own
    const whereClause = { id };
    if (!isAdmin) {
      whereClause.userId = userId;
    }

    const order = await Order.findOne({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }]
        },
        {
          model: Address,
          as: 'shippingAddress'
        },
        {
          model: Payment,
          as: 'payment'
        },
        {
          model: Discount,
          as: 'discount'
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: DeliveryFee,
          as: 'deliveryFee',
          attributes: ['id', 'state', 'fee', 'zone', 'estimatedDays']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get order', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updateData = { status };
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (status === 'shipped') updateData.shippedAt = new Date();
    if (status === 'delivered') updateData.deliveredAt = new Date();

    await order.update(updateData);

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};

module.exports = { createOrder, getUserOrders, getAllOrders, getOrderById, updateOrderStatus };
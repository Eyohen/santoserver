// // controller/cart.js
// const db = require('../models');
// const { Cart, Product, User } = db;

// const addToCart = async (req, res) => {
//   try {
//     const { productId, quantity = 1, selectedFlavor, selectedSize, sessionId } = req.body;
    
//     // Check if product exists
//     const product = await Product.findByPk(productId);
//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     // Check stock availability
//     if (product.stockQuantity < quantity) {
//       return res.status(400).json({ message: 'Insufficient stock available' });
//     }

//     // For authenticated users
//     if (req.user) {
//       const userId = req.user.id;
      
//       // Check if item already exists in cart
//       const existingItem = await Cart.findOne({
//         where: { userId, productId, selectedFlavor, selectedSize }
//       });

//       if (existingItem) {
//         // Update quantity
//         const newQuantity = existingItem.quantity + quantity;
//         if (product.stockQuantity < newQuantity) {
//           return res.status(400).json({ message: 'Insufficient stock for requested quantity' });
//         }
        
//         await existingItem.update({ quantity: newQuantity });
//         const updatedItem = await Cart.findOne({
//           where: { id: existingItem.id },
//           include: [{ model: Product, as: 'product' }]
//         });
//         res.json({ message: 'Cart updated successfully', cartItem: updatedItem });
//       } else {
//         // Add new item to cart
//         const cartItem = await Cart.create({
//           userId,
//           productId,
//           quantity,
//           selectedFlavor,
//           selectedSize
//         });
        
//         const newItem = await Cart.findOne({
//           where: { id: cartItem.id },
//           include: [{ model: Product, as: 'product' }]
//         });
//         res.status(201).json({ message: 'Item added to cart', cartItem: newItem });
//       }
//     } else {
//       // For guest users, return success but don't store in database
//       // Frontend will handle guest cart storage
//       if (!sessionId) {
//         return res.status(400).json({ message: 'Session ID required for guest cart' });
//       }
      
//       res.status(201).json({ 
//         message: 'Item added to guest cart', 
//         cartItem: {
//           id: `guest-${sessionId}-${productId}-${selectedFlavor || 'none'}-${selectedSize || 'none'}`,
//           productId,
//           quantity,
//           selectedFlavor,
//           selectedSize,
//           product
//         }
//       });
//     }
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to add to cart', error: error.message });
//   }
// };

// const getCart = async (req, res) => {
//   try {
//     // Only for authenticated users
//     if (!req.user) {
//       return res.status(401).json({ message: 'Authentication required', cartItems: [] });
//     }

//     const userId = req.user.id;

//     const cartItems = await Cart.findAll({
//       where: { userId },
//       include: [
//         {
//           model: Product,
//           as: 'product',
//           attributes: ['id', 'name', 'price', 'originalPrice', 'imageUrl', 'stockQuantity', 'isActive', 'brand']
//         }
//       ],
//       order: [['createdAt', 'DESC']]
//     });

//     res.json({ cartItems });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to get cart', error: error.message });
//   }
// };

// const updateCartItem = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { quantity } = req.body;
    
//     if (!req.user) {
//       return res.status(401).json({ message: 'Authentication required' });
//     }
    
//     const userId = req.user.id;

//     const cartItem = await Cart.findOne({ 
//       where: { id, userId },
//       include: [{ model: Product, as: 'product' }]
//     });
    
//     if (!cartItem) {
//       return res.status(404).json({ message: 'Cart item not found' });
//     }

//     // Check stock availability
//     if (cartItem.product.stockQuantity < quantity) {
//       return res.status(400).json({ message: 'Insufficient stock available' });
//     }

//     await cartItem.update({ quantity });
    
//     const updatedItem = await Cart.findOne({
//       where: { id },
//       include: [{ model: Product, as: 'product' }]
//     });
    
//     res.json({ message: 'Cart item updated successfully', cartItem: updatedItem });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to update cart item', error: error.message });
//   }
// };

// const removeFromCart = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     if (!req.user) {
//       return res.status(401).json({ message: 'Authentication required' });
//     }
    
//     const userId = req.user.id;

//     const deleted = await Cart.destroy({ where: { id, userId } });

//     if (deleted) {
//       res.json({ message: 'Item removed from cart' });
//     } else {
//       res.status(404).json({ message: 'Cart item not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to remove from cart', error: error.message });
//   }
// };

// const clearCart = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ message: 'Authentication required' });
//     }
    
//     const userId = req.user.id;

//     await Cart.destroy({ where: { userId } });
//     res.json({ message: 'Cart cleared successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to clear cart', error: error.message });
//   }
// };

// // New function to merge guest cart with user cart after login
// const mergeGuestCart = async (req, res) => {
//   try {
//     const { guestCartItems } = req.body;
//     const userId = req.user.id;

//     if (!guestCartItems || !Array.isArray(guestCartItems)) {
//       return res.status(400).json({ message: 'Invalid guest cart data' });
//     }

//     const mergedItems = [];

//     for (const guestItem of guestCartItems) {
//       const { productId, quantity, selectedFlavor, selectedSize } = guestItem;

//       // Check if product exists and is active
//       const product = await Product.findOne({ 
//         where: { id: productId, isActive: true } 
//       });
      
//       if (!product) continue;

//       // Check if item already exists in user's cart
//       const existingItem = await Cart.findOne({
//         where: { userId, productId, selectedFlavor, selectedSize }
//       });

//       if (existingItem) {
//         // Update quantity (but don't exceed stock)
//         const newQuantity = Math.min(
//           existingItem.quantity + quantity, 
//           product.stockQuantity
//         );
//         await existingItem.update({ quantity: newQuantity });
//         mergedItems.push(existingItem);
//       } else {
//         // Create new cart item
//         const newQuantity = Math.min(quantity, product.stockQuantity);
//         if (newQuantity > 0) {
//           const cartItem = await Cart.create({
//             userId,
//             productId,
//             quantity: newQuantity,
//             selectedFlavor,
//             selectedSize
//           });
//           mergedItems.push(cartItem);
//         }
//       }
//     }

//     // Return updated cart
//     const cartItems = await Cart.findAll({
//       where: { userId },
//       include: [
//         {
//           model: Product,
//           as: 'product',
//           attributes: ['id', 'name', 'price', 'originalPrice', 'imageUrl', 'stockQuantity', 'isActive', 'brand']
//         }
//       ]
//     });

//     res.json({ 
//       message: 'Guest cart merged successfully', 
//       cartItems,
//       mergedCount: mergedItems.length
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to merge guest cart', error: error.message });
//   }
// };

// module.exports = { 
//   addToCart, 
//   getCart, 
//   updateCartItem, 
//   removeFromCart, 
//   clearCart, 
//   mergeGuestCart 
// };






// controller/cart.js - FIXED VERSION
const db = require('../models');
const { Cart, Product, User } = db;

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, selectedFlavor, selectedSize, sessionId } = req.body;
    
    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check stock availability
    if (product.stockQuantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock available' });
    }

    // For authenticated users
    if (req.user) {
      const userId = req.user.id;
      
      // Check if item already exists in cart
      const existingItem = await Cart.findOne({
        where: { userId, productId, selectedFlavor, selectedSize }
      });

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        if (product.stockQuantity < newQuantity) {
          return res.status(400).json({ message: 'Insufficient stock for requested quantity' });
        }
        
        await existingItem.update({ quantity: newQuantity });
        const updatedItem = await Cart.findOne({
          where: { id: existingItem.id },
          include: [{ model: Product, as: 'product' }]
        });
        res.json({ message: 'Cart updated successfully', cartItem: updatedItem });
      } else {
        // Add new item to cart
        const cartItem = await Cart.create({
          userId,
          productId,
          quantity,
          selectedFlavor,
          selectedSize
        });
        
        const newItem = await Cart.findOne({
          where: { id: cartItem.id },
          include: [{ model: Product, as: 'product' }]
        });
        res.status(201).json({ message: 'Item added to cart', cartItem: newItem });
      }
    } else {
      // For guest users, return success but don't store in database
      // Frontend will handle guest cart storage
      if (!sessionId) {
        return res.status(400).json({ message: 'Session ID required for guest cart' });
      }
      
      res.status(201).json({ 
        message: 'Item added to guest cart', 
        cartItem: {
          id: `guest-${sessionId}-${productId}-${selectedFlavor || 'none'}-${selectedSize || 'none'}`,
          productId,
          quantity,
          selectedFlavor,
          selectedSize,
          product
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to add to cart', error: error.message });
  }
};

const getCart = async (req, res) => {
  try {
    // Only for authenticated users
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required', cartItems: [] });
    }

    const userId = req.user.id;

    const cartItems = await Cart.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: 'product',
          // FIXED: Remove 'brand' and use 'brandId' instead
          attributes: ['id', 'name', 'price', 'originalPrice', 'imageUrl', 'stockQuantity', 'isActive', 'brandId']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ cartItems });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get cart', error: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userId = req.user.id;

    const cartItem = await Cart.findOne({ 
      where: { id, userId },
      include: [{ model: Product, as: 'product' }]
    });
    
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Check stock availability
    if (cartItem.product.stockQuantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock available' });
    }

    await cartItem.update({ quantity });
    
    const updatedItem = await Cart.findOne({
      where: { id },
      include: [{ model: Product, as: 'product' }]
    });
    
    res.json({ message: 'Cart item updated successfully', cartItem: updatedItem });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update cart item', error: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userId = req.user.id;

    const deleted = await Cart.destroy({ where: { id, userId } });

    if (deleted) {
      res.json({ message: 'Item removed from cart' });
    } else {
      res.status(404).json({ message: 'Cart item not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove from cart', error: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userId = req.user.id;

    await Cart.destroy({ where: { userId } });
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear cart', error: error.message });
  }
};

// New function to merge guest cart with user cart after login
const mergeGuestCart = async (req, res) => {
  try {
    const { guestCartItems } = req.body;
    const userId = req.user.id;

    if (!guestCartItems || !Array.isArray(guestCartItems)) {
      return res.status(400).json({ message: 'Invalid guest cart data' });
    }

    const mergedItems = [];

    for (const guestItem of guestCartItems) {
      const { productId, quantity, selectedFlavor, selectedSize } = guestItem;

      // Check if product exists and is active
      const product = await Product.findOne({ 
        where: { id: productId, isActive: true } 
      });
      
      if (!product) continue;

      // Check if item already exists in user's cart
      const existingItem = await Cart.findOne({
        where: { userId, productId, selectedFlavor, selectedSize }
      });

      if (existingItem) {
        // Update quantity (but don't exceed stock)
        const newQuantity = Math.min(
          existingItem.quantity + quantity, 
          product.stockQuantity
        );
        await existingItem.update({ quantity: newQuantity });
        mergedItems.push(existingItem);
      } else {
        // Create new cart item
        const newQuantity = Math.min(quantity, product.stockQuantity);
        if (newQuantity > 0) {
          const cartItem = await Cart.create({
            userId,
            productId,
            quantity: newQuantity,
            selectedFlavor,
            selectedSize
          });
          mergedItems.push(cartItem);
        }
      }
    }

    // Return updated cart
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: 'product',
          // FIXED: Use 'brandId' instead of 'brand'
          attributes: ['id', 'name', 'price', 'originalPrice', 'imageUrl', 'stockQuantity', 'isActive', 'brandId']
        }
      ]
    });

    res.json({ 
      message: 'Guest cart merged successfully', 
      cartItems,
      mergedCount: mergedItems.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to merge guest cart', error: error.message });
  }
};

module.exports = { 
  addToCart, 
  getCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart, 
  mergeGuestCart 
};
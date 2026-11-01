'use strict';
const { Product, ProductVariant, Category, DeliveryFee } = require('../models');
const { wrap } = require('../middleware/http');

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

/** The shape the storefront already consumes (see santo/src/api/catalogue.js). */
function serialize(p) {
  const variants = [...(p.variants || [])].sort(
    (a, b) => a.color.localeCompare(b.color) || SIZES.indexOf(a.size) - SIZES.indexOf(b.size),
  );
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    category: p.categoryRef?.slug ?? null,
    description: p.description,
    fabrics: p.fabrics,
    features: p.features,
    isNew: p.isNew,
    isActive: p.isActive,
    images: p.images,
    imagesByColor: p.imagesByColor,
    variants: variants.map((v) => ({ sku: v.sku, color: v.color, colorHex: v.colorHex, size: v.size, stock: v.stock })),
  };
}

const include = [
  { model: Category, as: 'categoryRef' },
  { model: ProductVariant, as: 'variants' },
];

exports.serialize = serialize;
exports.include = include;

exports.listProducts = wrap(async (req, res) => {
  const { category, q, sort = 'featured', maxPrice } = req.query;
  const list = (v) => (v ? String(v).split(',').filter(Boolean) : []);
  const sizes = list(req.query.sizes);
  const colors = list(req.query.colors);
  const term = q?.trim().toLowerCase();

  const rows = await Product.findAll({
    where: { isActive: true },
    include,
    order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
  });

  let products = rows.map(serialize)
    .filter((p) => !category || p.category === category)
    .filter((p) => !maxPrice || p.price <= Number(maxPrice))
    .filter((p) => !sizes.length || p.variants.some((v) => v.stock > 0 && sizes.includes(v.size)))
    .filter((p) => !colors.length || p.variants.some((v) => colors.includes(v.color)))
    .filter((p) => !term || [p.name, p.category, p.fabrics, p.features, ...p.variants.map((v) => v.color)]
      .join(' ').toLowerCase().includes(term));

  if (sort === 'price-asc') products.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') products.sort((a, b) => b.price - a.price);

  products = products.map(({ isActive, ...rest }) => rest); // eslint-disable-line no-unused-vars
  res.json({ products });
});

exports.getProduct = wrap(async (req, res) => {
  const row = await Product.findOne({ where: { slug: req.params.slug, isActive: true }, include });
  if (!row) return res.status(404).json({ message: 'Product not found.' });
  res.json({ product: serialize(row) });
});

exports.listCategories = wrap(async (req, res) => {
  const rows = await Category.findAll({ order: [['sortOrder', 'ASC']] });
  res.json({ categories: rows.map((c) => ({ id: c.id, slug: c.slug, name: c.name })) });
});

exports.listDeliveryFees = wrap(async (req, res) => {
  const rows = await DeliveryFee.findAll({ where: { isActive: true }, order: [['state', 'ASC']] });
  res.json({ deliveryFees: rows.map((r) => ({ state: r.state, zone: r.zone, fee: r.fee, estimate: r.estimate })) });
});

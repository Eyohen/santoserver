# Santo Veste API

Base: `http://localhost:9000/api`. JSON in/out. Errors are `{ message, field?, sku?, available? }` with a 4xx/5xx status.
Auth: `Authorization: Bearer <jwt>` (from `/auth/login`). Money is whole naira (integers).

## Storefront
| | |
|---|---|
| `GET /products?category&q&sort=featured\|price-asc\|price-desc&maxPrice&sizes=S,M&colors=Cream` | `{ products }` (active only) |
| `GET /products/:slug` | `{ product }` |
| `GET /categories`, `GET /delivery-fees` | `{ categories }`, `{ deliveryFees:[{state,zone,fee,estimate}] }` |
| `POST /discounts/validate {code, subtotal}` | `{ code, type, value, amount }` |
| `POST /checkout/quote {items:[{sku,qty}], state, discountCode?}` | `{ subtotal, discountAmount, shippingFee, total }` |
| `POST /checkout {email,name,phone,address,city,state,items,discountCode?}` | `{ orderNumber, reference, total, accessCode, authorizationUrl }` — open Paystack with `accessCode` |
| `POST /payments/verify {reference}` | `{ order }` — idempotent; call when Paystack returns |
| `GET /orders/track?orderNumber&email` | `{ order }` |
| `GET /orders/mine` (auth) | `{ orders }` |
| `POST /custom-requests {name,email,phone,quantity,product?,message?}` | `{ id }` |
| `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | `{ token, user }` |

`POST /webhooks/paystack` is Paystack-only (HMAC-SHA512 signature over the raw body).

## Admin (`/admin/*`, requires `role: admin`)
| | |
|---|---|
| `GET /admin/stats` | `grossSales, paidOrders, averageOrderValue, customers, awaitingFulfilment, newCustomRequests, flaggedOrders, ordersByStatus, revenueByMonth[{label,revenue,orders}], recentOrders, lowStock[{sku,product,color,size,stock}]` |
| `GET /admin/orders?status&paymentStatus&q&page&limit` | `{ orders, total, page, pages }` (unpaid checkouts hidden unless `paymentStatus=unpaid`) |
| `GET /admin/orders/:id`, `PATCH /admin/orders/:id {status?, trackingNumber?, adminNote?}` | `{ order }` — status flow: pending→processing→shipped→delivered; cancel/refund restocks; shipping emails the customer |
| `GET /admin/transactions?status&page` | `{ transactions, summary:{success:{amount,count},...}, total, page, pages }` |
| `GET /admin/customers` | `{ customers:[{email,name,phone,orders,spent,since}] }` |
| `GET /admin/categories`, `GET /admin/products` | `{ categories }`, `{ products }` (includes inactive) |
| `POST /admin/products`, `PUT /admin/products/:id`, `DELETE /admin/products/:id` | body `{name, category(slug), price, compareAtPrice?, description, fabrics?, features?, isNew?, isActive?, images[], imagesByColor{}, variants:[{color,colorHex?,size,stock,sku?}]}` |
| `PATCH /admin/variants/:sku/stock {stock}` | `{ sku, stock }` |
| `POST /admin/uploads` (multipart field `image`) | `{ url }` |
| `GET/POST /admin/delivery-fees`, `PUT/DELETE /admin/delivery-fees/:id` | `{state,zone,fee,estimate,isActive}` |
| `GET/POST /admin/discounts`, `PUT/DELETE /admin/discounts/:id` | `{code,name,type:'percentage'\|'fixed',value,minSubtotal?,usageLimit?,expiresAt?,isActive}` |
| `GET /admin/custom-requests`, `PATCH /admin/custom-requests/:id {status?,adminNote?}` | status: new/contacted/quoted/won/closed |

Order shape: `orderNumber,status,paymentStatus,email,customerName,phone,shipping{address,city,state},subtotal,discountAmount,discountCode,shippingFee,total,trackingNumber,adminNote,paymentReference,createdAt,items[{sku,name,color,size,image,unitPrice,quantity,lineTotal}]`.
Order `adminNote` starting "PAID BUT SHORT ON STOCK" or "Amount mismatch" means a human must act.

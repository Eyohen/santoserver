'use strict';
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    phone: DataTypes.STRING,
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('customer', 'admin'), defaultValue: 'customer' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  });

  User.associate = (m) => User.hasMany(m.Order, { foreignKey: 'userId', as: 'orders' });
  User.hash = (password) => bcrypt.hash(password, 10);
  User.prototype.check = function check(password) { return bcrypt.compare(password, this.passwordHash); };
  User.prototype.toPublic = function toPublic() {
    const { id, name, email, phone, role } = this;
    return { id, name, email, phone, role };
  };
  return User;
};

'use strict';


const {Model, UUIDV4} = require('sequelize');



module.exports = (sequelize, DataTypes) => {
  class Blog extends Model{
   
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */

 
    static associate(models) {
      // define association here
    //   Product.hasMany(models.Review, { foreignKey: 'productId', as:'Review' });
    //   Product.hasMany(models.Purchase, { foreignKey: 'productId', as:'Purchase' });
    }
  }
  Blog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      allowNull: false,
      primaryKey: true,
      // autoIncrement: true
    },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      heading: {
          type: DataTypes.STRING,
          allowNull: false
        },
      imageUrl: {
          type: DataTypes.STRING,
          allowNull: true
        },
      text: {
          type: DataTypes.TEXT,
          allowNull: true
        },

  }, {
    sequelize,
    modelName: 'Blog',
  });
  return Blog;
};
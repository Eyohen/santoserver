'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Migration: Allow NULL userId in Payments and DiscountUsages tables
     * Purpose: Enable guest checkout functionality
     * Risk: LOW - Non-destructive change (NOT NULL → NULL)
     */
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔄 Starting migration: allow-null-userId-payment-discountusage');

      // Change Payments.userId to allow NULL
      console.log('  ↳ Updating Payments.userId to allow NULL...');
      await queryInterface.changeColumn('Payments', 'userId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      // Change DiscountUsages.userId to allow NULL
      console.log('  ↳ Updating DiscountUsages.userId to allow NULL...');
      await queryInterface.changeColumn('DiscountUsages', 'userId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      await transaction.commit();
      console.log('✅ Migration completed successfully');
      console.log('  ✓ Payments.userId now allows NULL');
      console.log('  ✓ DiscountUsages.userId now allows NULL');
      console.log('  ✓ Guest checkout is now enabled');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error.message);
      console.error('  ✗ Database changes rolled back');
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Rollback: Revert userId columns back to NOT NULL
     * WARNING: This will FAIL if any NULL userId values exist in the database
     */
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔄 Starting rollback: allow-null-userId-payment-discountusage');

      // Check for NULL values in Payments before rolling back
      const nullPayments = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM "Payments" WHERE "userId" IS NULL',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (parseInt(nullPayments[0].count) > 0) {
        throw new Error(
          `Cannot rollback: Found ${nullPayments[0].count} payment(s) with NULL userId. ` +
          'Delete or update these records before rolling back.'
        );
      }

      // Check for NULL values in DiscountUsages before rolling back
      const nullDiscounts = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM "DiscountUsages" WHERE "userId" IS NULL',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (parseInt(nullDiscounts[0].count) > 0) {
        throw new Error(
          `Cannot rollback: Found ${nullDiscounts[0].count} discount usage(s) with NULL userId. ` +
          'Delete or update these records before rolling back.'
        );
      }

      // Revert Payments.userId back to NOT NULL
      console.log('  ↳ Reverting Payments.userId to NOT NULL...');
      await queryInterface.changeColumn('Payments', 'userId', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      // Revert DiscountUsages.userId back to NOT NULL
      console.log('  ↳ Reverting DiscountUsages.userId to NOT NULL...');
      await queryInterface.changeColumn('DiscountUsages', 'userId', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      await transaction.commit();
      console.log('✅ Rollback completed successfully');
      console.log('  ✓ Payments.userId reverted to NOT NULL');
      console.log('  ✓ DiscountUsages.userId reverted to NOT NULL');
      console.log('  ✓ Guest checkout is now disabled');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error.message);
      console.error('  ✗ Database changes rolled back');
      throw error;
    }
  }
};

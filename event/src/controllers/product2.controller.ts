import { ProductUpdateAction } from '@commercetools/platform-sdk';
import { createApiRoot } from '../client/create.client';
import CustomError from '../errors/custom.error';

/**
 * Execute update actions on a product
 *
 * @param {string} id - The product ID
 * @param {number} version - The product version
 * @param {Array<ProductUpdateAction>} actions - The array of update actions
 * @returns {Promise<object>} - The result of the update operation
 */
const executeUpdateActions = async (
  id: string,
  version: number,
  actions: Array<ProductUpdateAction>
) => {
  try {
    await createApiRoot()
      .products()
      .withId({ ID: id })
      .post({
        body: {
          version: version,
          actions: actions,
        },
      })
      .execute();

    return { statusCode: 200, actions: actions };
  } catch (error) {
    if (error instanceof Error) {
      throw new CustomError(
        400,
        `Internal server error on CartController: ${error.stack}`
      );
    }
  }
};

/**
 * Create the action to update price points
 *
 * @param {string} sku - The SKU of the product variant
 * @param {number} pricePoints - The new price points value
 * @returns {ProductUpdateAction} - The update action for price points
 */
const createUpdatePricePointsAction = (
  sku: string,
  pricePoints: number
): ProductUpdateAction => {
  return {
    action: 'setAttribute',
    sku: sku, // Specify the SKU to update
    name: 'pricePoints', // Name of the attribute to update
    value: pricePoints, // New value for the attribute
  };
};

/**
 * Create the action to publish the product
 *
 * @returns {ProductUpdateAction} - The update action to publish the product
 */
const createPublishAction = (): ProductUpdateAction => {
  return {
    action: 'publish',
  };
};

/**
 * Handle the update price action
 *
 * @returns {Promise<object>} - The result of the update operation
 */
const updatePrice = async (
  id: string,
  version: number,
  sku: string,
  pricePoints: number
) => {
  const actions: Array<ProductUpdateAction> = [];

  // Add update price points action
  actions.push(createUpdatePricePointsAction(sku, pricePoints));

  // Add publish action
  actions.push(createPublishAction());

  // Execute the update actions
  return await executeUpdateActions(id, version, actions);
};

/**
 * Product controller to handle different actions
 *
 * @param {string} action - The action type (e.g., 'Create' or 'UpdatePrice')
 * @param {string} id - The product ID
 * @param {number} version - The product version
 * @param {string} sku - The SKU of the product variant
 * @param {number} priceUpdate - The new price value
 * @returns {Promise<object>} - The result of the controller action
 */
export const productController = async (
  action: string,
  id: string,
  version: number,
  sku: string,
  priceUpdate: number
) => {
  switch (action) {
    case 'Create':
      // Handle create logic if needed
      break;
    case 'UpdatePrice':
      return await updatePrice(id, version, sku, priceUpdate);
    default:
      throw new CustomError(
        500,
        `Internal Server Error - Resource not recognized. Allowed values are 'Create' or 'UpdatePrice'.`
      );
  }
};
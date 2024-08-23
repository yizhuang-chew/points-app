import { ProductUpdateAction } from  '@commercetools/platform-sdk';

import { createApiRoot } from '../client/create.client';
import CustomError from '../errors/custom.error';

/**
 * Handle the create action
 *
 * @returns {object}
 */
const updatePrice = async (
  id: string,
  version: number,
  sku: string,
  priceId: string,
  pricePoints: number
) => {
  try {
    const updateActions: Array<ProductUpdateAction> = [];

    // Create the UpdateAction to change the pricePoints attribute
    const updatePricePointsAction: ProductUpdateAction = {
      action: 'setAttribute',
      sku: sku, // Specify the variant ID to update
      name: 'pricePoints', // Name of the attribute to update
      value: pricePoints, // New value for the attribute
    };
    updateActions.push(updatePricePointsAction);

    // Create the UpdateActions to publish the product
    const publishAction: ProductUpdateAction = {
      action: 'publish',
    };
    updateActions.push(publishAction);

    // Execute the update actions on the product
    await createApiRoot()
      .products()
      .withId({ ID: id })
      .post({
        body: {
          version: version,
          actions: updateActions,
        },
      })
      .execute();

    return { statusCode: 200, actions: updateActions };
  } catch (error) {
    // Retry or handle the error
    // Create an error object
    if (error instanceof Error) {
      throw new CustomError(
        400,
        `Internal server error on CartController: ${error.stack}`
      );
    }
  }
};

// Controller for update actions
// const update = (resource: Resource) => {};

/**
 * Handle the cart controller according to the action
 *
 * @param {string} action The action that comes with the request. Could be `Create` or `Update`
 * @param {Resource} resource The resource from the request body
 * @returns {Promise<object>} The data from the method that handles the action
 */
export const productController = async (
  action: string,
  id: string,
  version: number,
  sku: string,
  priceId: string,
  priceUpdate: number
) => {
  switch (action) {
    case 'Create':
      break;
    case 'UpdatePrice':
      updatePrice(id, version, sku, priceId, priceUpdate);
      break;
    default:
      throw new CustomError(
        500,
        `Internal Server Error - Resource not recognized. Allowed values are 'Create' or 'Update'.`
      );
  }
};

import { ProductUpdateAction } from '@commercetools/platform-sdk';
import { createApiRoot } from '../client/create.client';
import CustomError from '../errors/custom.error';
import { logger } from '../utils/logger.utils';

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
    logger.info('ERROR', error);
    if (error instanceof Error) {
      throw new CustomError(
        400,
        `Internal server error on ProductController: ${error.stack}`
      );
    }
  }
};

/**
 * Create the action to update price points
 *
 * @param {string} sku - The SKU of the product variant
 * @param {number} pricePoints - The new price points value
 * @returns {Array<ProductUpdateAction>} - The update action for price points
 */
const updatePrice = (
  priceId: string,
  price: number,
  priceCurrency: string
): Array<ProductUpdateAction> => {
  const actions: ProductUpdateAction[] = [
    {
      action: 'changePrice',
      priceId: priceId, // Specify the SKU to update
      price: {
        value: {
          centAmount: price,
          currencyCode: priceCurrency,
        },
      },
    },
  ];
  return actions;
};

/**
 * Create the action to update price points
 *
 * @param {string} sku - The SKU of the product variant
 * @param {number} pricePoints - The new price points value
 * @returns {Array<ProductUpdateAction>} - The update action for price points
 */
const createSecondPrice = (
  sku: string,
  price: number
): Array<ProductUpdateAction> => {
  const actions: ProductUpdateAction[] = [
    {
      action: 'addPrice',
      sku: sku, // Specify the SKU to update
      price: {
        value: {
          centAmount: price,
          currencyCode: 'AED',
        },
      },
    },
  ];
  return actions;
};

/**
 * Create the action to publish the product
 *
 * @returns {ProductUpdateAction} - The update action to publish the product
 */
const createPublishAction = (): Array<ProductUpdateAction> => {
  const actions: ProductUpdateAction[] = [
    {
      action: 'publish',
    },
  ];
  return actions;
};

/**
 * Create the action to update price points
 *
 * @param {string} sku - The SKU of the product variant
 * @param {number} pricePoints - The new price points value
 * @returns {Array<ProductUpdateAction>} - The update action for price points
 */
const createUpdatePricePointsAttributesAction = (
  sku: string,
  pricePoints: number,
  minimumPoints: number,
  bonusPoints: number,
  pointsEarnConversion: number
): Array<ProductUpdateAction> => {
  const actions: ProductUpdateAction[] = [
    {
      action: 'setAttribute',
      sku: sku, // Specify the SKU to update
      name: 'pricePoints', // Name of the attribute to update
      value: pricePoints, // New value for the attribute
    },
    {
      action: 'setAttribute',
      sku: sku, // Specify the SKU to update
      name: 'minimumPoints', // Name of the attribute to update
      value: minimumPoints, // New value for the attribute
    },
    {
      action: 'setAttribute',
      sku: sku, // Specify the SKU to update
      name: 'bonusPoints', // Name of the attribute to update
      value: bonusPoints, // New value for the attribute
    },
    {
      action: 'setAttribute',
      sku: sku, // Specify the SKU to update
      name: 'pointsEarnConversion', // Name of the attribute to update
      value: pointsEarnConversion, // New value for the attribute
    },
  ];
  return actions;
};

/**
 * Product controller to handle different actions
 */
export const productController = async (messageBody: any) => {
  let actions: Array<ProductUpdateAction> = [];

  const sku = messageBody.productProjection.masterVariant.sku;
  const mainPrice = messageBody.productProjection.masterVariant.prices.find(
    (price: { value: { currencyCode: string; centAmount: number } }) =>
      price.value.currencyCode === 'AUD'
  );
  const productId = messageBody?.resource.id;
  const productVersion = messageBody?.resourceVersion;
  const originalPricePoints = mainPrice.custom?.fields?.pointsPrice;
  let pricePoints = originalPricePoints;
  const minimumPoints = mainPrice.custom?.fields?.minimumPoints;
  const bonusPoints = mainPrice.custom?.fields?.bonusPoints;
  const pointsEarnConversion = mainPrice.custom?.fields?.pointsEarnConversion;

  logger.info("MAIN PRICE", mainPrice)
  logger.info("Product ID", productId)
  logger.info("Product Version", productVersion)

  // Create or Update Points Price Row
  const secondPrice = messageBody.productProjection.masterVariant.prices.find(
    (price: { value: { currencyCode: string; centAmount: number } }) =>
      price.value.currencyCode === 'AED'
  );
  if (secondPrice) {
    logger.info("Second Price", secondPrice)
    const secondPriceId = secondPrice?.id;
    const secondPriceAmount = secondPrice?.value?.centAmount / 100;

    if(secondPrice && secondPrice?.discounted){
      pricePoints = secondPrice?.discounted.centAmount / 100;
      logger.info("PRICE POINT CHECK FOR DISCOUNT - PRICE POINTS ALLOCATION", pricePoints)
    }

    if (secondPriceAmount != originalPricePoints) {
      const updateSecondPriceActions = updatePrice(
        secondPriceId,
        originalPricePoints * 100,
        'AED'
      );
      actions = [...actions, ...updateSecondPriceActions];
      logger.info("SECOND PRICE UPDATE ACTION", actions)
    }
  } else {
    const createSecondPriceActions = createSecondPrice(
      sku,
      originalPricePoints * 100
    );
    actions = [...actions, ...createSecondPriceActions];
    logger.info("SECOND PRICE CREATE ACTION", actions)
  }

  // Update Discounted Price onto Price Custom Field
  /* if (secondPrice && secondPrice.discounted) {
    const secondPriceDiscountedAmount = secondPrice?.discounted?.value / 100;

    if (secondPriceDiscountedAmount != pricePoints) {
      const updateMainPricePricePointActions = updatePrice(
        priceId,
        secondPriceDiscountedAmount,
        'AUD'
      );
      pricePoints = secondPriceDiscountedAmount;
      actions = [...actions, ...updateMainPricePricePointActions];
    }
  } */

  // Update Variant Level Attribute
  const updateVariantActions = createUpdatePricePointsAttributesAction(
    sku,
    pricePoints,
    minimumPoints,
    bonusPoints,
    pointsEarnConversion
  );

  actions = [...actions, ...updateVariantActions];
  logger.info("ATTRIBUTES UPDATE ACTION", updateVariantActions)

  // Publish
  const publishActions = createPublishAction();

  actions = [...actions, ...publishActions];

  logger.info('ACTIONS', actions);

  // Execute the update actions
  return await executeUpdateActions(productId, productVersion, actions);
};

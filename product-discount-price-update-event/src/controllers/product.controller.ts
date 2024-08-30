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

const updatePricePointsAttributesAction = (
  sku: string,
  pricePoints: number,
): Array<ProductUpdateAction> => {
  const actions: ProductUpdateAction[] = [
    {
      action: 'setAttribute',
      sku: sku, // Specify the SKU to update
      name: 'pricePoints', // Name of the attribute to update
      value: pricePoints, // New value for the attribute
    },
  ];
  return actions;
};

/**
 * Product controller to handle different actions
 */
export const productController = async (messageBody: any) => {
  let actions: Array<ProductUpdateAction> = [];

  logger.info('PRODUCT CONTROLLER MESSAGE', messageBody);
  const productId = messageBody?.resource.id;
  const productVersion = messageBody?.resourceVersion;

  logger.info('UPDATED PRICES', messageBody?.updatedPrices);

  // @@TODO - Handle Multiple SKU
  // ONLY HANDLE PRICE UPDATES FOR POINTS
  const updatedPriceRecord = messageBody?.updatedPrices?.find(
    (price: {discounted: { value: { currencyCode: string; centAmount: number } }}) =>
      price.discounted.value.currencyCode === 'AED'
  );
  const updatedSku = updatedPriceRecord.sku
  const updatedPrice = updatedPriceRecord.discounted;

  logger.info('UPDATED PRICE RECORD', updatedPriceRecord);
  logger.info('UPDATED PRICE', updatedPrice);

  const updatePricePointsOnMainActions = updatePricePointsAttributesAction(
    updatedSku,
    updatedPrice.value.centAmount * 100,
  );
  actions = [...actions, ...updatePricePointsOnMainActions];
  logger.info("UPDATED PRICE POINTS", updatePricePointsOnMainActions);

  /* const sku = messageBody.productProjection.masterVariant.sku;
  const mainPrice = messageBody.productProjection.masterVariant.prices.find(
    (price: { value: { currencyCode: string; centAmount: number } }) =>
      price.value.currencyCode === 'AUD'
  );

  const productId = messageBody?.resource.id;
  const productVersion = messageBody?.resourceVersion;
  const priceId = mainPrice?.id;
  let pricePoints = mainPrice.custom?.fields?.pointsPrice;
  const originalPricePoints = mainPrice.custom?.fields?.originalPricePoints;
  const minimumPoints = mainPrice.custom?.fields?.minimumPoints;
  const bonusPoints = mainPrice.custom?.fields?.bonusPoints;
  const pointsEarnConversion = mainPrice.custom?.fields?.pointsEarnConversion;

  // Create or Update Points Price Row
  const secondPrice = messageBody.productProjection.masterVariant.prices.find(
    (price: { value: { currencyCode: string; centAmount: number } }) =>
      price.value.currencyCode === 'AED'
  );
  if (secondPrice) {
    const secondPriceId = secondPrice?.id;
    const secondPriceAmount = secondPrice?.centAmount / 100;

    if (secondPriceAmount != originalPricePoints) {
      const updateSecondPriceActions = updatePrice(
        secondPriceId,
        originalPricePoints * 100,
        'AED'
      );
      actions = [...actions, ...updateSecondPriceActions];
    }
  } else {
    const createSecondPriceActions = createSecondPrice(
      sku,
      originalPricePoints * 100
    );
    actions = [...actions, ...createSecondPriceActions];
  }

  // Update Discounted Price onto Price Custom Field
  if (secondPrice && secondPrice.discounted) {
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
  }

  // Update Variant Level Attribute
  const updateVariantActions = createUpdatePricePointsAttributesAction(
    sku,
    pricePoints,
    minimumPoints,
    bonusPoints,
    pointsEarnConversion
  ); 

  actions = [...actions, ...updateVariantActions]; */

  // Publish
  const publishActions = createPublishAction();

  actions = [...actions, ...publishActions];
  logger.info("FINAL ACTIONS", actions)

  // Execute the update actions
  return await executeUpdateActions(productId, productVersion, actions);
};

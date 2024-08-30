import { Product, ProductUpdateAction } from '@commercetools/platform-sdk';
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
 * Fetch the product by ID and retrieve the price by priceId
 *
 * @param {string} productId - The product ID
 * @param {string} priceId - The price ID
 * @returns {Promise<any>} - The price record
 */
const fetchPriceFromProduct = async (
  productId: string,
  priceId: string
): Promise<any> => {
  try {
    const response = await createApiRoot()
      .products()
      .withId({ ID: productId })
      .get()
      .execute();

    const product: Product = response.body;
    for (const variant of product.masterData.current.variants) {
      const price = variant?.prices?.find(
        (price: { id: string }) => price.id === priceId
      );
      if (price) {
        return { price, sku: variant.sku };
      }
    }

    // Check master variant as well
    const masterPrice =
      product?.masterData?.current?.masterVariant?.prices?.find(
        (price) => price.id === priceId
      );
    if (masterPrice) {
      return {
        price: masterPrice,
        sku: product.masterData.current.masterVariant.sku,
      };
    }
    logger.info('MASTERPRICE', masterPrice);

    throw new Error(
      `Price with ID ${priceId} not found in product ${productId}`
    );
  } catch (error) {
    logger.info('ERROR FETCHING PRODUCT PRICE', error);
    throw new CustomError(
      400,
      `Error fetching product or price: ${error.message}`
    );
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
  pricePoints: number
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
    (price: {
      discounted: { value: { currencyCode: string; centAmount: number } };
    }) => price.discounted.value.currencyCode === 'AED'
  );

  // New Discount
  if (updatedPriceRecord) {
    const updatedSku = updatedPriceRecord.sku;
    const updatedPrice = updatedPriceRecord.discounted;

    logger.info('UPDATED PRICE RECORD', updatedPriceRecord);
    logger.info('UPDATED PRICE', updatedPrice);

    const updatePricePointsOnMainActions = updatePricePointsAttributesAction(
      updatedSku,
      updatedPrice.value.centAmount / 100
    );
    actions = [...actions, ...updatePricePointsOnMainActions];

    logger.info('UPDATED PRICE POINTS', updatePricePointsOnMainActions);
  } else {
    // Scenario where Discount is removed  }

    // Fetch Old and check if it's on points, then update
    const priceId = updatedPriceRecord?.priceId;

    if (priceId) {
      const { price, sku } = await fetchPriceFromProduct(productId, priceId);
      logger.info('OLD PRICE RECORD', price);

      if (price && price.value.currencyCode === 'AED') {
        const pricePoints = price.value.centAmount / 100;

        const updatePricePointsOnMainActions =
          updatePricePointsAttributesAction(sku, pricePoints);
        actions = [...actions, ...updatePricePointsOnMainActions];

        logger.info('RESTORED PRICE POINTS', updatePricePointsOnMainActions);
      }
    }

    /* const updatePricePointsOnMainActions = updatePricePointsAttributesAction(
      updatedSku,
      updatedPrice.value.centAmount / 100
    );
    actions = [...actions, ...updatePricePointsOnMainActions];

    logger.info('UPDATED PRICE POINTS', updatePricePointsOnMainActions); */
  }

  // Publish
  const publishActions = createPublishAction();

  actions = [...actions, ...publishActions];
  logger.info('FINAL ACTIONS', actions);

  // Execute the update actions
  return await executeUpdateActions(productId, productVersion, actions);
};

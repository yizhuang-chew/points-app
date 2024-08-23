import { Request, Response } from 'express';
import {
  HTTP_STATUS_SUCCESS_ACCEPTED,
  HTTP_STATUS_BAD_REQUEST,
} from '../constants/http-status.constants';
import { createApiRoot } from '../client/create.client';
import CustomError from '../errors/custom.error';
import { logger } from '../utils/logger.utils';
import {
  doValidation,
  isProductPublishMessage,
} from '../validators/message.validators';
import { decodeToJson } from '../utils/decoder.utils';

import { eventData}  from './testData';
import { productController } from './product.controller';

/**
 * Exposed event POST endpoint.
 * Receives the Pub/Sub message and works with it
 *
 * @param {Request} request The express request
 * @param {Response} response The express response
 * @returns
 */
export const post = async (request: Request, response: Response) => {
  try {
    // Check request body
    doValidation(request);

    const encodedMessageBody = request.body.message.data;
    const messageBody = decodeToJson(encodedMessageBody);
    // const messageBody = eventData;

    if (isProductPublishMessage(messageBody)) {
      const sku = messageBody.productProjection.masterVariant.sku;
      const priceId = messageBody.productProjection.masterVariant.prices[0].id;
      const pricePoints = messageBody.productProjection.masterVariant.prices[0].custom.fields.pointsPrice;
      await productController("UpdatePrice", messageBody.resource.id, messageBody.resourceVersion, sku, priceId, pricePoints);
      
      // @@TODO FILTER ONLY ACTIVE PRICE
      //@@ TODO Sub Variants too
      response.status(HTTP_STATUS_SUCCESS_ACCEPTED).send();
    }
  } catch (error) {
    if (error instanceof CustomError) {
      response.status(error.statusCode as number).send();
      logger.error(error)
      return;
    }
    throw new CustomError(400, `Bad request: ${error}`);
  }
};

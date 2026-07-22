import logger from '../../utility/logger';
import { ApiHandlerStickerBooks } from './apihandler/ApiHandler.stickerBooks';
import { ServiceApi } from './ServiceApi';

export class ApiHandler extends ApiHandlerStickerBooks implements ServiceApi {
  public static i: ApiHandler;

  private constructor(service: ServiceApi) {
    super(service);
  }

  public static getInstance(service: ServiceApi): ApiHandler {
    if (!service) {
      logger.error(
        'ApiHandler.getInstance was called with an undefined service. This will cause errors.',
      );
    }
    if (!ApiHandler.i || ApiHandler.i.s !== service) {
      ApiHandler.i = new ApiHandler(service);
    }
    return ApiHandler.i;
  }
}

import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { checkoutSchema, orderQuerySchema } from '../utils/order.validation';

export class OrderController {
  /**
   * POST /api/orders/checkout
   * Purchases an artwork using authenticated user's internal credits
   */
  public static async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = checkoutSchema.parse(req.body);
      const buyerId = req.user!.id;
      const result = await OrderService.checkout(buyerId, validatedData.artworkId);
      res.status(201).json({
        message: 'Order completed successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/my-orders
   * Retrieves orders purchased by the authenticated user
   */
  public static async getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = orderQuerySchema.parse(req.query);
      const buyerId = req.user!.id;
      const result = await OrderService.getMyOrders(
        buyerId,
        validatedQuery.page,
        validatedQuery.limit
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/:id
   * Retrieves an order by ID
   */
  public static async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
      const userId = req.user!.id;
      const userRole = req.user?.role;
      const result = await OrderService.getOrderById(orderId, userId, userRole);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

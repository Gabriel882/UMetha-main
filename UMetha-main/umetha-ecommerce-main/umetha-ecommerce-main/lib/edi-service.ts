import axios, { AxiosInstance } from "axios";
import { ediConfig } from "./edi-config";
import { prisma } from "./prisma";

type NormalizedEdiError = {
  message: string;
  responseData?: unknown;
};

const normalizeEdiError = (error: unknown): NormalizedEdiError => {
  if (axios.isAxiosError(error)) {
    return {
      message: error.message,
      responseData: error.response?.data,
    };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: String(error) };
};

interface PurchaseOrderItem {
  sku: string;
  quantity: number;
  upc?: string | null;
  price: number;
  name?: string;
}

interface PurchaseOrderData {
  id: string;
  orderNumber: string;
  supplierId: string;
  createdAt: string;
  items: PurchaseOrderItem[];
  shippingAddress?: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
}

interface InventoryUpdateItem {
  sku: string;
  quantityAvailable: number;
}

interface InventoryUpdate {
  partnerId: string;
  referenceId: string;
  items?: InventoryUpdateItem[];
}

interface OrderConfirmation {
  partnerId: string;
  referenceId: string;
  poNumber: string;
  status: string;
}

interface ShippingNotice {
  partnerId: string;
  referenceId: string;
  poNumber: string;
  shipDate?: string;
  trackingNumber?: string;
  carrier?: string;
}

interface InvoiceDocument {
  partnerId: string;
  referenceId: string;
  poNumber: string;
  invoiceNumber: string;
  totalAmount: number;
  currency?: string;
  dueDate: string;
  invoiceDate: string;
}

interface PaymentAdviceData {
  orderId?: string;
  orderNumber: string;
  supplierId: string;
  paymentId: string;
  invoiceNumber: string;
  paymentDate?: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
}

/**
 * EDI Service for interacting with EDI provider APIs
 * Handles sending and receiving EDI documents
 */
export class EDIService {
  private client: AxiosInstance;

  constructor() {
    // Initialize the API client with auth headers
    this.client = axios.create({
      baseURL: ediConfig.provider.baseUrl,
      headers: {
        Authorization: `Bearer ${ediConfig.provider.apiKey}`,
        "Content-Type": "application/json",
        "X-Company-Id": ediConfig.provider.companyId,
      },
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Send a purchase order (EDI 850) to a supplier
   */
  async sendPurchaseOrder(orderData: PurchaseOrderData) {
    try {
      console.log(
        `Sending purchase order ${orderData.orderNumber} to supplier ${orderData.supplierId}`
      );

      const response = await this.client.post("/documents/outbound/850", {
        tradingPartnerId: orderData.supplierId,
        purchaseOrder: {
          poNumber: orderData.orderNumber,
          orderDate: orderData.createdAt,
          items: orderData.items.map((item: PurchaseOrderItem) => ({
            sku: item.sku,
            quantity: item.quantity,
            upc: item.upc || null,
            price: item.price,
            description: item.name,
          })),
          shipTo: orderData.shippingAddress,
          billTo: orderData.billingAddress,
        },
      });

      // Log the successful EDI transmission
      await this.logEdiTransaction({
        documentType: "850",
        direction: "outbound",
        partnerId: orderData.supplierId,
        referenceId: response.data.referenceId,
        status: response.data.status || "sent",
        orderId: orderData.id,
        rawData: JSON.stringify(response.data),
      });

      return {
        success: true,
        referenceId: response.data.referenceId,
        status: response.data.status,
      };
    } catch (error: unknown) {
      const { message, responseData } = normalizeEdiError(error);
      console.error("EDI Purchase Order send error:", responseData ?? message);

      // Log the failed EDI transmission
      await this.logEdiTransaction({
        documentType: "850",
        direction: "outbound",
        partnerId: orderData.supplierId,
        status: "failed",
        orderId: orderData.id,
        errorMessage: message,
        rawData: JSON.stringify(responseData ?? {}),
      });

      return {
        success: false,
        error: responseData ?? message,
      };
    }
  }

  /**
   * Check for new inventory updates (EDI 846)
   */
  async checkInventoryUpdates() {
    try {
      const response = await this.client.get("/documents/inbound/846");

      // Process each inventory update
      for (const update of response.data.inventoryUpdates || []) {
        await this.processInventoryUpdate(update);
      }

      return {
        success: true,
        updatesProcessed: response.data.inventoryUpdates?.length || 0,
      };
    } catch (error: unknown) {
      const { message } = normalizeEdiError(error);
      console.error("Error checking inventory updates:", message);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Process a single inventory update
   */
  private async processInventoryUpdate(update: InventoryUpdate) {
    try {
      // Log the received inventory update
      await this.logEdiTransaction({
        documentType: "846",
        direction: "inbound",
        partnerId: update.partnerId,
        referenceId: update.referenceId,
        status: "received",
      });

      // Update inventory in database
      for (const item of update.items || []) {
        await prisma.product.updateMany({
          where: {
            sku: item.sku,
          },
          data: {
            countInStock: item.quantityAvailable,
            lastInventoryUpdate: new Date(),
          },
        });
      }

      // Mark the update as processed with the EDI provider
      await this.client.post(
        `/documents/inbound/846/${update.referenceId}/acknowledge`,
        {
          status: "processed",
        }
      );

      // Update the transaction status
      await this.logEdiTransaction({
        documentType: "846",
        direction: "inbound",
        partnerId: update.partnerId,
        referenceId: update.referenceId,
        status: "processed",
        rawData: JSON.stringify(update),
      });
    } catch (error: unknown) {
      const { message } = normalizeEdiError(error);
      console.error(
        `Error processing inventory update ${update.referenceId}:`,
        message
      );

      // Update the transaction status
      await this.logEdiTransaction({
        documentType: "846",
        direction: "inbound",
        partnerId: update.partnerId,
        referenceId: update.referenceId,
        status: "error",
        errorMessage: message,
      });
    }
  }

  /**
   * Retrieve order confirmations (EDI 855)
   */
  async getOrderConfirmations() {
    try {
      const response = await this.client.get("/documents/inbound/855");

      // Process each confirmation
      for (const confirmation of response.data.orderConfirmations || []) {
        await this.processOrderConfirmation(confirmation);
      }

      return {
        success: true,
        confirmationsProcessed: response.data.orderConfirmations?.length || 0,
      };
    } catch (error: unknown) {
      const { message } = normalizeEdiError(error);
      console.error("Error retrieving order confirmations:", message);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Process a single order confirmation
   */
  private async processOrderConfirmation(confirmation: OrderConfirmation) {
    try {
      // Find the order in our database
      const order = await prisma.order.findFirst({
        where: {
          orderNumber: confirmation.poNumber,
        },
      });

      if (!order) {
        console.error(
          `Order not found for confirmation ${confirmation.referenceId}, PO: ${confirmation.poNumber}`
        );
        return;
      }

      // Log the received order confirmation
      await this.logEdiTransaction({
        documentType: "855",
        direction: "inbound",
        partnerId: confirmation.partnerId,
        referenceId: confirmation.referenceId,
        status: "received",
        orderId: order.id,
      });

      // Update order status based on confirmation
      const orderStatus =
        confirmation.status === "accepted"
          ? "confirmed"
          : confirmation.status === "rejected"
          ? "rejected"
          : "processing";

      // Update the order in the database
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: orderStatus,
          edi: {
            update: {
              orderConfirmationReceived: true,
              orderConfirmationReceivedAt: new Date(),
              orderConfirmationReferenceNumber: confirmation.referenceId,
            },
          },
        },
      });

      // Acknowledge receipt of the confirmation
      await this.client.post(
        `/documents/inbound/855/${confirmation.referenceId}/acknowledge`,
        {
          status: "processed",
        }
      );

      // Update the transaction status
      await this.logEdiTransaction({
        documentType: "855",
        direction: "inbound",
        partnerId: confirmation.partnerId,
        referenceId: confirmation.referenceId,
        status: "processed",
        orderId: order.id,
        rawData: JSON.stringify(confirmation),
      });
    } catch (error: unknown) {
      const { message } = normalizeEdiError(error);
      console.error(
        `Error processing order confirmation ${confirmation.referenceId}:`,
        message
      );

      // Update the transaction status
      await this.logEdiTransaction({
        documentType: "855",
        direction: "inbound",
        partnerId: confirmation.partnerId,
        referenceId: confirmation.referenceId,
        status: "error",
        errorMessage: message,
      });
    }
  }

  /**
   * Get shipping notices (EDI 856)
   */
  async getShippingNotices() {
    try {
      const response = await this.client.get("/documents/inbound/856");

      // Process each shipping notice
      for (const notice of response.data.shippingNotices || []) {
        await this.processShippingNotice(notice);
      }

      return {
        success: true,
        noticesProcessed: response.data.shippingNotices?.length || 0,
      };
    } catch (error: unknown) {
      const { message } = normalizeEdiError(error);
      console.error("Error retrieving shipping notices:", message);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Process a single shipping notice
   */
  private async processShippingNotice(notice: ShippingNotice) {
    try {
      // Find the order in our database
      const order = await prisma.order.findFirst({
        where: {
          orderNumber: notice.poNumber,
        },
      });

      if (!order) {
        console.error(
          `Order not found for shipping notice ${notice.referenceId}, PO: ${notice.poNumber}`
        );
        return;
      }

      // Log the received shipping notice
      await this.logEdiTransaction({
        documentType: "856",
        direction: "inbound",
        partnerId: notice.partnerId,
        referenceId: notice.referenceId,
        status: "received",
        orderId: order.id,
      });

      // Update the order with shipping details
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "shipped",
          shippedAt: new Date(notice.shipDate),
          trackingNumber: notice.trackingNumber,
          shippingCarrier: notice.carrier,
          edi: {
            update: {
              shippingNoticeReceived: true,
              shippingNoticeReceivedAt: new Date(),
              shippingNoticeReferenceNumber: notice.referenceId,
              trackingNumber: notice.trackingNumber,
            },
          },
        },
      });

      // Acknowledge receipt of the shipping notice
      await this.client.post(
        `/documents/inbound/856/${notice.referenceId}/acknowledge`,
        {
          status: "processed",
        }
      );

      // Update the transaction status
      await this.logEdiTransaction({
        documentType: "856",
        direction: "inbound",
        partnerId: notice.partnerId,
        referenceId: notice.referenceId,
        status: "processed",
        orderId: order.id,
        rawData: JSON.stringify(notice),
      });
    } catch (error: unknown) {
      const { message } = normalizeEdiError(error);
      console.error(
        `Error processing shipping notice ${notice.referenceId}:`,
        message
      );

      // Update the transaction status
      await this.logEdiTransaction({
        documentType: "856",
        direction: "inbound",
        partnerId: notice.partnerId,
        referenceId: notice.referenceId,
        status: "error",
        errorMessage: message,
      });
    }
  }

  /**
   * Get invoices (EDI 810)
   */
  async getInvoices() {
    try {
      const response = await this.client.get("/documents/inbound/810");

      // Process each invoice
      for (const invoice of response.data.invoices || []) {
        await this.processInvoice(invoice);
      }

      return {
        success: true,
        invoicesProcessed: response.data.invoices?.length || 0,
      };
    } catch (error: unknown) {
      const { message } = normalizeEdiError(error);
      console.error("Error retrieving invoices:", message);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Process a single invoice
   */
  private async processInvoice(invoice: InvoiceDocument) {
    try {
      // Find the order in our database
      const order = await prisma.order.findFirst({
        where: {
          orderNumber: invoice.poNumber,
        },
      });

      if (!order) {
        console.error(
          `Order not found for invoice ${invoice.referenceId}, PO: ${invoice.poNumber}`
        );
        return;
      }

      // Log the received invoice
      await this.logEdiTransaction({
        documentType: "810",
        direction: "inbound",
        partnerId: invoice.partnerId,
        referenceId: invoice.referenceId,
        status: "received",
        orderId: order.id,
      });

      // Store the invoice in our database
      await prisma.invoice.create({
        data: {
          invoiceNumber: invoice.invoiceNumber,
          orderId: order.id,
          amount: invoice.totalAmount,
          currency: invoice.currency || "USD",
          dueDate: new Date(invoice.dueDate),
          issuedDate: new Date(invoice.invoiceDate),
          status: "received",
          ediReferenceNumber: invoice.referenceId,
        },
      });

      // Update the order with invoice details
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          edi: {
            update: {
              invoiceReceived: true,
              invoiceReceivedAt: new Date(),
              invoiceReferenceNumber: invoice.referenceId,
            },
          },
        },
      });

      // Acknowledge receipt of the invoice
      await this.client.post(
        `/documents/inbound/810/${invoice.referenceId}/acknowledge`,
        {
          status: "processed",
        }
      );

      // Update the transaction status
      await this.logEdiTransaction({
        documentType: "810",
        direction: "inbound",
        partnerId: invoice.partnerId,
        referenceId: invoice.referenceId,
        status: "processed",
        orderId: order.id,
        rawData: JSON.stringify(invoice),
      });
    } catch (error: unknown) {
      const { message } = normalizeEdiError(error);
      console.error(
        `Error processing invoice ${invoice.referenceId}:`,
        message
      );

      // Update the transaction status
      await this.logEdiTransaction({
        documentType: "810",
        direction: "inbound",
        partnerId: invoice.partnerId,
        referenceId: invoice.referenceId,
        status: "error",
        errorMessage: message,
      });
    }
  }

  /**
   * Send payment advice (EDI 820)
   */
  async sendPaymentAdvice(paymentData: PaymentAdviceData) {
    try {
      console.log(
        `Sending payment advice for order ${paymentData.orderNumber} to supplier ${paymentData.supplierId}`
      );

      const response = await this.client.post("/documents/outbound/820", {
        tradingPartnerId: paymentData.supplierId,
        paymentAdvice: {
          paymentId: paymentData.paymentId,
          poNumber: paymentData.orderNumber,
          invoiceNumber: paymentData.invoiceNumber,
          paymentDate: paymentData.paymentDate || new Date().toISOString(),
          amount: paymentData.amount,
          currency: paymentData.currency || "USD",
          paymentMethod: paymentData.paymentMethod,
        },
      });

      // Log the successful EDI transmission
      await this.logEdiTransaction({
        documentType: "820",
        direction: "outbound",
        partnerId: paymentData.supplierId,
        referenceId: response.data.referenceId,
        status: response.data.status || "sent",
        orderId: paymentData.orderId,
        rawData: JSON.stringify(response.data),
      });

      return {
        success: true,
        referenceId: response.data.referenceId,
        status: response.data.status,
      };
    } catch (error: unknown) {
      const { message, responseData } = normalizeEdiError(error);
      console.error(
        "EDI Payment Advice send error:",
        responseData ?? message
      );

      // Log the failed EDI transmission
      await this.logEdiTransaction({
        documentType: "820",
        direction: "outbound",
        partnerId: paymentData.supplierId,
        status: "failed",
        orderId: paymentData.orderId,
        errorMessage: message,
        rawData: JSON.stringify(responseData ?? {}),
      });

      return {
        success: false,
        error: responseData ?? message,
      };
    }
  }

  /**
   * Log an EDI transaction to the database for tracking
   */
  private async logEdiTransaction(transactionData: {
    documentType: string;
    direction: "inbound" | "outbound";
    partnerId: string;
    referenceId?: string;
    status: string;
    orderId?: string;
    errorMessage?: string;
    rawData?: string;
  }) {
    try {
      await prisma.ediTransaction.upsert({
        where: {
          documentType_direction_partnerId_referenceId: {
            documentType: transactionData.documentType,
            direction: transactionData.direction,
            partnerId: transactionData.partnerId,
            referenceId: transactionData.referenceId || "unknown",
          },
        },
        update: {
          status: transactionData.status,
          orderId: transactionData.orderId,
          errorMessage: transactionData.errorMessage,
          rawData: transactionData.rawData,
          updatedAt: new Date(),
        },
        create: {
          documentType: transactionData.documentType,
          direction: transactionData.direction,
          partnerId: transactionData.partnerId,
          referenceId: transactionData.referenceId || "unknown",
          status: transactionData.status,
          orderId: transactionData.orderId,
          errorMessage: transactionData.errorMessage,
          rawData: transactionData.rawData,
        },
      });
    } catch (error: unknown) {
      const { message } = normalizeEdiError(error);
      console.error("Error logging EDI transaction:", message);
    }
  }
}

// Create a singleton instance
const ediService = new EDIService();

export default ediService;

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const orderItemSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    quantity: { type: Number, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
}, { _id: false });
const shippingAddressSchema = new mongoose_1.Schema({
    street: { type: String, required: true },
    ward: { type: String, required: true },
    province: { type: String, required: true },
    phone: { type: String, required: true },
}, { _id: false });
const orderInfoSchema = new mongoose_1.Schema({
    shippingAddress: { type: shippingAddressSchema, required: true },
    items: { type: [orderItemSchema], required: true },
    paymentMethod: {
        type: String,
        enum: ['vnpay', 'zalopay', 'cod'],
        required: true,
    },
    shipping: { type: Number, required: true },
    code: { type: String, default: null },
    email: { type: String, default: null },
}, { _id: false });
const paymentSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    discount_amount: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['pending', 'canceled', 'success', 'failed', 'paid'],
        default: 'pending',
    },
    transaction_code: { type: String, required: true, unique: true },
    gateway: {
        type: String,
        enum: ['vnpay', 'zalopay', 'cod'],
        required: true,
    },
    transaction_data: { type: mongoose_1.Schema.Types.Mixed, default: null },
    transaction_summary: {
        type: Object,
        default: {},
    },
    paid_at: { type: Date, default: null },
    order_info: { type: orderInfoSchema, default: null },
    couponCode: { type: String, default: null },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
});
exports.default = mongoose_1.default.model('Payment', paymentSchema);

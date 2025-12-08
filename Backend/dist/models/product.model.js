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
const productSchema = new mongoose_1.Schema({
    category: {
        _id: {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'categories',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
    },
    name: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        required: false,
    },
    image: [
        {
            type: String,
        },
    ],
    variants: [
        {
            price: {
                type: Number,
                required: true,
                min: 0,
            },
            color: {
                type: String,
                enum: ['Đen', 'Trắng', 'Xám', 'Đỏ', 'Xanh da trời', 'Nâu', 'Hồng'],
                required: true,
            },
            size: {
                type: String,
                enum: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
                required: true,
            },
            stock: {
                type: Number,
                required: true,
                min: 0,
            },
            discountPercent: {
                type: Number,
                required: true,
                min: 0,
                max: 100,
                default: 0,
            },
        },
    ],
    is_active: {
        type: Boolean,
        required: true,
        default: true,
    },
    salesCount: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
}, {
    versionKey: false,
    timestamps: true,
});
productSchema.index({ name: 1, 'category._id': 1 });
productSchema.index({ salesCount: -1 });
const ProductModel = mongoose_1.default.model('Product', productSchema);
exports.default = ProductModel;

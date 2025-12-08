"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpMap = exports.vonage = exports.credentials = void 0;
const server_sdk_1 = require("@vonage/server-sdk");
const auth_1 = require("@vonage/auth");
exports.credentials = new auth_1.Auth({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
});
exports.vonage = new server_sdk_1.Vonage(exports.credentials);
exports.otpMap = new Map();

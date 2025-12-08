"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.normalizeFiles = normalizeFiles;
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({ storage });
function normalizeFiles(files) {
    if (!files)
        return [];
    if (Array.isArray(files))
        return files;
    return Object.values(files).flat();
}

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllChildCategoryIds = void 0;
const category_model_1 = __importDefault(require("../models/category.model"));
const getAllChildCategoryIds = (parentId) => __awaiter(void 0, void 0, void 0, function* () {
    const children = yield category_model_1.default.find({ parentId }).select("_id");
    let ids = children.map((child) => child._id.toString());
    for (const child of children) {
        const subIds = yield (0, exports.getAllChildCategoryIds)(child._id.toString());
        ids = ids.concat(subIds);
    }
    return ids;
});
exports.getAllChildCategoryIds = getAllChildCategoryIds;

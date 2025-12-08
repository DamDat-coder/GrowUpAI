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
exports.toggleActiveCategory = exports.updateCategory = exports.getCategoryById = exports.getCategoryTree = exports.createCategory = void 0;
const category_model_1 = __importDefault(require("../models/category.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const slugify_1 = __importDefault(require("slugify"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const mongoose_1 = require("mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
// Tạo danh mục mới
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, parentId, is_active, description } = req.body;
        if (!name)
            return res.status(400).json({ success: false, message: "Tên danh mục là bắt buộc." });
        const slug = (0, slugify_1.default)(name, { lower: true });
        const exists = yield category_model_1.default.findOne({ slug });
        if (exists)
            return res.status(409).json({ success: false, message: "Slug đã tồn tại." });
        let imageUrl = null;
        const file = req.file;
        if (file) {
            const result = yield new Promise((resolve, reject) => {
                const stream = cloudinary_1.default.uploader.upload_stream({ folder: "categories" }, (err, result) => {
                    if (err || !result)
                        reject(err);
                    else
                        resolve(result);
                });
                stream.end(file.buffer);
            });
            imageUrl = result.secure_url;
        }
        const newCategory = yield category_model_1.default.create({
            name,
            slug,
            description: description || "",
            parentId: parentId || null,
            image: imageUrl,
            is_active: typeof is_active === "boolean" ? is_active : true,
        });
        res.status(201).json({ success: true, message: "Tạo danh mục thành công.", data: newCategory });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi khi tạo danh mục." });
    }
});
exports.createCategory = createCategory;
// Lấy danh sách cây danh mục
const getCategoryTree = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield category_model_1.default.find().lean();
        const buildTree = (parentId = null) => {
            return categories
                .filter((cat) => {
                const catParentId = cat.parentId ? cat.parentId.toString() : null;
                return catParentId === parentId;
            })
                .map((cat) => (Object.assign(Object.assign({}, cat), { children: buildTree(cat._id.toString()) })));
        };
        const tree = buildTree();
        res.status(200).json({ success: true, data: tree });
    }
    catch (error) {
        console.error("Lỗi khi lấy cây danh mục:", error);
        res.status(500).json({ success: false, message: "Lỗi khi lấy cây danh mục." });
    }
});
exports.getCategoryTree = getCategoryTree;
// Lấy danh mục theo ID
const getCategoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const category = yield category_model_1.default.findById(id);
        if (!category)
            return res.status(404).json({ success: false, message: "Không tìm thấy danh mục." });
        res.status(200).json({ success: true, data: category });
    }
    catch (error) {
        console.error("Lỗi khi lấy danh mục theo ID:", error);
        res.status(500).json({ success: false, message: "Lỗi khi lấy danh mục." });
    }
});
exports.getCategoryById = getCategoryById;
// Cập nhật danh mục
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, parentId, is_active, description } = req.body;
        const updateData = {};
        if (name) {
            updateData.name = name;
            updateData.slug = (0, slugify_1.default)(name, { lower: true });
        }
        if (typeof parentId !== "undefined") {
            updateData.parentId =
                parentId === "" || parentId === null ? null : new mongoose_1.Types.ObjectId(parentId);
        }
        if (typeof is_active !== "undefined") {
            updateData.is_active = is_active;
        }
        if (typeof description !== "undefined") {
            updateData.description = description;
        }
        const file = req.file;
        if (file) {
            const result = yield new Promise((resolve, reject) => {
                const stream = cloudinary_1.default.uploader.upload_stream({ folder: "categories" }, (err, result) => {
                    if (err || !result)
                        reject(err);
                    else
                        resolve(result);
                });
                stream.end(file.buffer);
            });
            updateData.image = result.secure_url;
        }
        const updated = yield category_model_1.default.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy danh mục.",
            });
        }
        res.status(200).json({
            success: true,
            message: "Cập nhật danh mục thành công.",
            data: updated,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật danh mục.",
            error,
        });
    }
});
exports.updateCategory = updateCategory;
// Khóa hoặc mở khóa danh mục
const toggleActiveCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryId = req.params.id;
        const { is_active, force } = req.body;
        if (!mongoose_2.default.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                status: "error",
                message: "ID danh mục không hợp lệ",
            });
        }
        if (typeof is_active !== "boolean") {
            return res.status(400).json({
                status: "error",
                message: "Trạng thái is_active phải là boolean",
            });
        }
        if (!is_active) {
            const productCount = yield product_model_1.default.countDocuments({
                "category._id": new mongoose_2.default.Types.ObjectId(categoryId),
            });
            if (productCount > 0) {
                return res.status(400).json({
                    status: "error",
                    message: "Không thể khóa vì danh mục đang chứa sản phẩm",
                });
            }
            const childCategoryCount = yield category_model_1.default.countDocuments({
                parentId: categoryId,
            });
            if (childCategoryCount > 0) {
                return res.status(400).json({
                    status: "error",
                    message: "Không thể khóa vì danh mục đang có danh mục con",
                });
            }
        }
        const updatedCategory = yield category_model_1.default.findByIdAndUpdate(categoryId, { is_active }, { new: true, runValidators: true }).lean();
        if (!updatedCategory) {
            return res.status(404).json({
                status: "error",
                message: "Danh mục không tồn tại",
            });
        }
        return res.status(200).json({
            status: "success",
            message: `Danh mục đã được ${is_active ? "mở khóa" : "khóa"} thành công`,
            data: updatedCategory,
        });
    }
    catch (error) {
        console.error("Lỗi khi khóa/mở khóa danh mục:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});
exports.toggleActiveCategory = toggleActiveCategory;

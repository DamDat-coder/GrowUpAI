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
exports.lockProduct = exports.updateProduct = exports.createProduct = exports.getProductBySlug = exports.getProductsActiveStatus = exports.getProductById = exports.getAllProductsAdmin = exports.getAllProducts = exports.recommendProducts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const product_model_1 = __importDefault(require("../models/product.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const user_model_1 = __importDefault(require("../models/user.model"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const slugify_1 = __importDefault(require("slugify"));
const category_util_1 = require("../utils/category.util");
const string_util_1 = require("../utils/string.util");
const recommendation_1 = require("../ai/recommendation");
// Lấy sản phẩm gợi ý dựa trên hành vi người dùng
const recommendProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userBehavior = {
            viewed: req.body.viewed || [],
            cart: req.body.cart || [],
        };
        const excludedIds = [...userBehavior.viewed, ...userBehavior.cart];
        // Lấy tất cả sản phẩm đang active, loại bỏ sản phẩm đã xem/đặt trong cart
        const products = yield product_model_1.default
            .find({
            is_active: true,
            _id: { $nin: excludedIds },
        })
            .populate("category", "slug name")
            .lean();
        // Gọi AI để gợi ý outfit dựa trên sản phẩm còn lại
        const aiResult = yield (0, recommendation_1.getOutfitRecommendations)(userBehavior, products);
        // Lọc các ID hợp lệ
        const validRecommendations = aiResult.recommendations.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
        // Nếu không có gợi ý, trả về data rỗng
        if (validRecommendations.length === 0) {
            return res.json({ success: true, data: [] });
        }
        // Lấy dữ liệu sản phẩm theo ID do AI gợi ý
        const recommendedProducts = yield product_model_1.default
            .find({ _id: { $in: validRecommendations } })
            .populate("category", "slug name")
            .lean();
        return res.json({ success: true, data: recommendedProducts });
    }
    catch (err) {
        console.error("Recommend Error:", err);
        if (err.name === "CastError") {
            return res.status(400).json({
                status: "error",
                message: "ID sản phẩm không hợp lệ (ObjectId không đúng định dạng)",
            });
        }
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
});
exports.recommendProducts = recommendProducts;
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_cate, color, size, minPrice, maxPrice, is_active, sort_by, limit, } = req.query;
        const filter = {};
        if (id_cate && typeof id_cate === "string") {
            const allIds = [id_cate];
            const childIds = yield (0, category_util_1.getAllChildCategoryIds)(id_cate);
            allIds.push(...childIds);
            const validObjectIds = allIds
                .filter((id) => mongoose_1.default.Types.ObjectId.isValid(id))
                .map((id) => new mongoose_1.default.Types.ObjectId(id));
            filter["category._id"] = { $in: validObjectIds };
        }
        if (color)
            filter["variants.color"] = color;
        if (size)
            filter["variants.size"] = size;
        if (minPrice !== undefined || maxPrice !== undefined) {
            const priceFilter = {};
            if (minPrice !== undefined && !isNaN(Number(minPrice))) {
                priceFilter.$gte = Number(minPrice);
            }
            if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
                priceFilter.$lte = Number(maxPrice);
            }
            if (Object.keys(priceFilter).length > 0) {
                filter["variants.price"] = priceFilter;
            }
        }
        if (is_active !== undefined) {
            filter.is_active = is_active === "true";
        }
        let sort = {};
        let sort_by_clean = typeof sort_by === "string" ? sort_by.trim().toLowerCase() : "";
        switch (sort_by_clean) {
            case "newest":
                sort = { createdAt: -1 };
                break;
            case "oldest":
                sort = { createdAt: 1 };
                break;
            case "price_asc":
                sort = { "variants.price": 1 };
                break;
            case "price_desc":
                sort = { "variants.price": -1 };
                break;
            case "best_selling":
                sort = { salesCount: -1 };
                break;
        }
        // Thêm limit vào truy vấn
        const limitNumber = limit && !isNaN(Number(limit)) ? Number(limit) : undefined;
        let query = product_model_1.default.find(filter).sort(sort);
        if (limitNumber) {
            query = query.limit(limitNumber);
        }
        const products = yield query;
        const total = yield product_model_1.default.countDocuments(filter);
        res.json({
            success: true,
            total,
            data: products,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy danh sách sản phẩm.",
            error: err,
        });
    }
});
exports.getAllProducts = getAllProducts;
// Lấy tất cả sản phẩm cho admin
const getAllProductsAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, is_active, sort } = req.query;
        const query = {};
        if (name) {
            query.slug = new RegExp(name, "i");
        }
        if (typeof is_active !== "undefined") {
            if (is_active === "true")
                query.is_active = true;
            else if (is_active === "false")
                query.is_active = false;
            else {
                return res.status(400).json({
                    status: "error",
                    message: "Giá trị 'is_active' phải là 'true' hoặc 'false'.",
                });
            }
        }
        const sortMap = {
            newest: { _id: -1 },
            "best-seller": { salesCount: -1 },
            "name-asc": { name: 1 },
            "name-desc": { name: -1 },
        };
        let sortOption = sortMap["newest"];
        if (sort) {
            const sortKey = sort.toString();
            if (!sortMap[sortKey]) {
                return res.status(400).json({
                    status: "error",
                    message: "Tùy chọn sắp xếp không hợp lệ. Hỗ trợ: newest, best-seller, name-asc, name-desc.",
                });
            }
            sortOption = sortMap[sortKey];
        }
        const [products, total] = yield Promise.all([
            product_model_1.default
                .find(query)
                .select("name slug category image variants salesCount is_active")
                .populate("category", "name")
                .sort(sortOption)
                .lean(),
            product_model_1.default.countDocuments(query),
        ]);
        if (!products.length) {
            return res
                .status(404)
                .json({ status: "error", message: "Không tìm thấy sản phẩm nào" });
        }
        const result = products.map((product) => {
            var _a, _b;
            return (Object.assign(Object.assign({}, product), { category: {
                    _id: ((_a = product.category) === null || _a === void 0 ? void 0 : _a._id) || null,
                    name: ((_b = product.category) === null || _b === void 0 ? void 0 : _b.name) || "Không rõ",
                } }));
        });
        return res.status(200).json({
            status: "success",
            data: result,
            total,
        });
    }
    catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Lỗi server khi lấy danh sách sản phẩm",
        });
    }
});
exports.getAllProductsAdmin = getAllProductsAdmin;
// Lấy sản phẩm theo ID
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(req.params.id)) {
            res
                .status(400)
                .json({ status: "error", message: "ID sản phẩm không hợp lệ" });
            return;
        }
        const product = yield product_model_1.default.findById(req.params.id).lean();
        if (!product) {
            res
                .status(404)
                .json({ status: "error", message: "Sản phẩm không tồn tại" });
            return;
        }
        const result = Object.assign(Object.assign({}, product), { category: {
                _id: product.category._id,
                name: product.category.name,
            } });
        res.status(200).json({ status: "success", data: result });
    }
    catch (error) {
        console.error("Lỗi khi lấy sản phẩm theo ID:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});
exports.getProductById = getProductById;
const getProductsActiveStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productIds } = req.body;
        if (!Array.isArray(productIds) || productIds.length === 0) {
            res.status(400).json({
                status: "error",
                message: "Danh sách productIds phải là mảng và không được rỗng",
            });
            return;
        }
        // Lọc các ID hợp lệ
        const validIds = productIds.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
        if (validIds.length === 0) {
            res.status(400).json({
                status: "error",
                message: "Không có ID sản phẩm hợp lệ",
            });
            return;
        }
        const products = yield product_model_1.default
            .find({ _id: { $in: validIds } }, { _id: 1, is_active: 1 })
            .lean();
        const result = productIds.map((id) => {
            var _a, _b;
            return ({
                id,
                is_active: (_b = (_a = products.find((p) => p._id.toString() === id)) === null || _a === void 0 ? void 0 : _a.is_active) !== null && _b !== void 0 ? _b : false,
            });
        });
        res.status(200).json({
            status: "success",
            data: result,
        });
    }
    catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái sản phẩm:", error);
        res.status(500).json({
            status: "error",
            message: error.message || "Lỗi server khi kiểm tra trạng thái sản phẩm",
        });
    }
});
exports.getProductsActiveStatus = getProductsActiveStatus;
// Lấy sản phẩm theo slug
const getProductBySlug = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { slug } = req.params;
        const isExact = req.query.exact === "true";
        if (!slug || typeof slug !== "string") {
            res.status(400).json({ status: "error", message: "Slug không hợp lệ" });
            return;
        }
        const normalizedSlug = (0, slugify_1.default)((0, string_util_1.removeVietnameseTones)(slug), {
            lower: true,
        });
        if (isExact) {
            const product = yield product_model_1.default
                .findOne({ slug: normalizedSlug })
                .populate("category", "name")
                .lean();
            if (!product) {
                res.status(404).json({
                    status: "error",
                    message: "Không tìm thấy sản phẩm trùng khớp chính xác.",
                    matchedExactly: false,
                });
                return;
            }
            res.status(200).json({
                status: "success",
                data: Object.assign(Object.assign({}, product), { category: {
                        _id: ((_a = product.category) === null || _a === void 0 ? void 0 : _a._id) || null,
                        name: ((_b = product.category) === null || _b === void 0 ? void 0 : _b.name) || "Không rõ",
                    } }),
                matchedExactly: true,
            });
            return;
        }
        const products = yield product_model_1.default
            .find({ slug: { $regex: normalizedSlug, $options: "i" } })
            .populate("category", "name")
            .lean();
        if (!products || products.length === 0) {
            res.status(404).json({
                status: "error",
                message: "Không tìm thấy sản phẩm phù hợp.",
                matchedExactly: false,
            });
            return;
        }
        const matchedExactly = products.some((p) => p.slug === normalizedSlug);
        const result = products.map((product) => {
            var _a, _b;
            return (Object.assign(Object.assign({}, product), { category: {
                    _id: ((_a = product.category) === null || _a === void 0 ? void 0 : _a._id) || null,
                    name: ((_b = product.category) === null || _b === void 0 ? void 0 : _b.name) || "Không rõ",
                } }));
        });
        res.status(200).json({
            status: "success",
            data: result,
            total: result.length,
            matchedExactly,
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message || "Lỗi server khi tìm sản phẩm theo slug.",
        });
    }
});
exports.getProductBySlug = getProductBySlug;
// Thêm sản phẩm mới
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        let variantsParsed;
        try {
            variantsParsed = JSON.parse(body.variants);
        }
        catch (_a) {
            res.status(400).json({
                status: "error",
                message: "Trường variants phải là chuỗi JSON hợp lệ",
            });
            return;
        }
        const categoryId = body["category._id"] || body.category_id;
        if (!body.name ||
            !body.slug ||
            !categoryId ||
            !variantsParsed ||
            !Array.isArray(variantsParsed) ||
            variantsParsed.length === 0) {
            res.status(400).json({
                status: "error",
                message: "Thiếu thông tin bắt buộc: name, slug, category._id, hoặc variants",
            });
            return;
        }
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            res
                .status(400)
                .json({ status: "error", message: "Vui lòng upload ít nhất một ảnh" });
            return;
        }
        const category = yield category_model_1.default.findById(categoryId).lean();
        if (!category) {
            res
                .status(404)
                .json({ status: "error", message: "Danh mục không tồn tại" });
            return;
        }
        const imageUrls = yield Promise.all(req.files.map((file) => new Promise((resolve, reject) => {
            const stream = cloudinary_1.default.uploader.upload_stream({ resource_type: "image", folder: "products" }, (error, result) => {
                if (error || !result)
                    return reject(error);
                resolve(result.secure_url);
            });
            stream.end(file.buffer);
        })));
        const product = {
            name: body.name,
            slug: body.slug,
            description: body.description || "",
            image: imageUrls,
            category: {
                _id: category._id,
                name: category.name,
            },
            variants: variantsParsed,
            salesCount: Number(body.salesCount) || 0,
            is_active: true,
        };
        const newProduct = new product_model_1.default(product);
        const savedProduct = yield newProduct.save();
        res.status(201).json({
            status: "success",
            message: "Tạo sản phẩm thành công",
            data: savedProduct,
        });
        setImmediate(() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const users = yield user_model_1.default.find({}).select("_id").lean();
                const notifications = users.map((user) => ({
                    userId: user._id,
                    title: "Sản phẩm mới vừa ra mắt!",
                    message: `Sản phẩm "${savedProduct.name}" đã có mặt trên Shop For Real, khám phá ngay!`,
                    type: "product",
                    isRead: false,
                    link: `/products/${savedProduct._id}`,
                }));
                yield notification_model_1.default.insertMany(notifications);
                console.log("Thông báo đã gửi đến người dùng.");
            }
            catch (notiError) {
                console.error("Gửi thông báo thất bại:", notiError);
            }
        }));
    }
    catch (error) {
        console.error("Lỗi khi tạo sản phẩm:", error);
        if (error.code === 11000) {
            res
                .status(409)
                .json({
                status: "error",
                message: "Tên hoặc slug sản phẩm đã tồn tại",
            });
        }
        else {
            res.status(500).json({ status: "error", message: error.message });
        }
    }
});
exports.createProduct = createProduct;
// Cập nhật sản phẩm
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const productId = req.params.id;
        const product = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(productId)) {
            res
                .status(400)
                .json({ status: "error", message: "ID sản phẩm không hợp lệ" });
            return;
        }
        const existingProduct = yield product_model_1.default.findById(productId);
        if (!existingProduct) {
            res
                .status(404)
                .json({ status: "error", message: "Sản phẩm không tồn tại" });
            return;
        }
        // Xử lý ảnh nếu có upload mới
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            if (existingProduct.image && existingProduct.image.length > 0) {
                for (const img of existingProduct.image) {
                    const publicId = (_a = img.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
                    if (publicId) {
                        try {
                            yield cloudinary_1.default.uploader.destroy(`products/${publicId}`);
                        }
                        catch (err) {
                            console.error(`Lỗi khi xoá ảnh ${publicId}:`, err);
                        }
                    }
                }
            }
            const imageUrls = [];
            for (const file of req.files) {
                const result = yield new Promise((resolve, reject) => {
                    const stream = cloudinary_1.default.uploader.upload_stream({ resource_type: "image", folder: "products" }, (error, result) => {
                        if (error || !result)
                            return reject(error);
                        resolve(result);
                    });
                    stream.end(file.buffer);
                });
                imageUrls.push(result.secure_url);
            }
            product.image = imageUrls;
        }
        else {
            product.image = existingProduct.image;
        }
        if (typeof product.variants === "string") {
            try {
                product.variants = JSON.parse(product.variants);
            }
            catch (error) {
                res
                    .status(400)
                    .json({
                    status: "error",
                    message: "Định dạng variants không hợp lệ",
                });
                return;
            }
        }
        let newCategory = existingProduct.category;
        const categoryId = product.categoryId || product["category._id"];
        if (categoryId) {
            const category = yield category_model_1.default.findById(categoryId).lean();
            if (!category) {
                res
                    .status(404)
                    .json({ status: "error", message: "Danh mục không tồn tại" });
                return;
            }
            newCategory = {
                _id: category._id,
                name: category.name,
            };
        }
        delete product.category;
        delete product.categoryId;
        delete product["category._id"];
        const updateData = Object.assign(Object.assign({}, product), { category: newCategory });
        const updatedProduct = yield product_model_1.default
            .findByIdAndUpdate(productId, { $set: updateData }, { new: true, runValidators: true })
            .lean();
        if (!updatedProduct) {
            res
                .status(404)
                .json({ status: "error", message: "Sản phẩm không tồn tại" });
            return;
        }
        const result = Object.assign(Object.assign({}, updatedProduct), { category: {
                _id: updatedProduct.category._id,
                name: updatedProduct.category.name,
            } });
        res.status(200).json({
            status: "success",
            message: "Cập nhật sản phẩm thành công",
            data: result,
        });
        // Gửi thông báo cho user
        setImmediate(() => {
            (() => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const users = yield user_model_1.default.find({}).select("_id").lean();
                    const notifications = users.map((user) => ({
                        userId: user._id,
                        title: "Sản phẩm vừa được cập nhật!",
                        message: `Sản phẩm "${updatedProduct.name}" vừa được cập nhật, xem ngay!`,
                        type: "product",
                        isRead: false,
                    }));
                    yield notification_model_1.default.insertMany(notifications);
                    console.log("Thông báo cập nhật sản phẩm đã gửi.");
                }
                catch (error) {
                    console.error("❌ Gửi thông báo thất bại:", error);
                }
            }))();
        });
    }
    catch (error) {
        console.error("Lỗi khi cập nhật sản phẩm:", error);
        if (error.code === 11000) {
            res
                .status(409)
                .json({
                status: "error",
                message: "Tên hoặc slug sản phẩm đã tồn tại",
            });
        }
        else {
            res.status(500).json({ status: "error", message: error.message });
        }
    }
});
exports.updateProduct = updateProduct;
// Khóa/Mở khóa sản phẩm
const lockProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productId = req.params.id;
        const { is_active } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(productId)) {
            res
                .status(400)
                .json({ status: "error", message: "ID sản phẩm không hợp lệ" });
            return;
        }
        if (typeof is_active !== "boolean") {
            res
                .status(400)
                .json({
                status: "error",
                message: "Trạng thái is_active phải là boolean",
            });
            return;
        }
        const updatedProduct = yield product_model_1.default
            .findByIdAndUpdate(productId, { $set: { is_active } }, { new: true, runValidators: true })
            .lean();
        if (!updatedProduct) {
            res
                .status(404)
                .json({ status: "error", message: "Sản phẩm không tồn tại" });
            return;
        }
        const result = Object.assign(Object.assign({}, updatedProduct), { category: {
                _id: updatedProduct.category._id,
                name: updatedProduct.category.name,
            } });
        res.status(200).json({
            status: "success",
            message: `Sản phẩm đã được ${is_active ? "mở khóa" : "khóa"} thành công`,
            data: result,
        });
    }
    catch (error) {
        console.error("Lỗi khi khóa/mở khóa sản phẩm:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});
exports.lockProduct = lockProduct;

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
exports.mapNameToType = mapNameToType;
exports.mapTypeToGroup = mapTypeToGroup;
exports.getOutfitRecommendations = getOutfitRecommendations;
const google_genai_1 = require("@langchain/google-genai");
const messages_1 = require("@langchain/core/messages");
const mongoose_1 = __importDefault(require("mongoose"));
// =================== 1. Chuẩn hóa sản phẩm về type ===================
function mapNameToType(name) {
    if (!name || typeof name !== "string")
        return "other";
    const lower = name.toLowerCase();
    // Top
    const topKeywords = ["Áo sơ mi", "Áo polo", "Áo thun", "Áo thun nam", "Áo polo nam", "Áo sơ mi nam", "Áo sweater nam", "Áo thun nữ", "Áo sơ mi nữ", "Áo croptop nữ"];
    if (topKeywords.some(k => lower.includes(k)))
        return "top";
    // Bottom
    const bottomKeywords = ["Quần jeans baggy", "Quần jeans ống rộng", "Quần jogger", "Quần short", "Quần jeans nam", "Quần short nam", "Quần tây nam", "Quần jogger nam", "Quần kaki nam", "Quần dài nữ", "Quần jeans nữ", "Quần short nữ"];
    if (bottomKeywords.some(k => lower.includes(k)))
        return "bottom";
    // Outer
    const outerKeywords = ["Áo khoác gió",
        "Áo khoác bomber",
        "Áo sweater",
        "Áo hoodie", "Áo khoác denim nữ",
        "Áo khoác bomber nữ",
        "Áo sweater nữ"];
    if (outerKeywords.some(k => lower.includes(k)))
        return "outer";
    return "other";
}
// =================== 2. Nhóm vào group chính ===================
function mapTypeToGroup(type) {
    if (type === "top" || type === "bottom" || type === "outer")
        return type;
    return "other";
}
// =================== 3. Tạo model AI ===================
const model = new google_genai_1.ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-1.5-flash",
    temperature: 0,
});
// =================== 4. Gợi ý outfit ===================
function getOutfitRecommendations(userBehavior_1, products_1) {
    return __awaiter(this, arguments, void 0, function* (userBehavior, products, trendKeywords = []) {
        const productsWithType = products.map(p => {
            const rawType = mapNameToType(p.name);
            return { _id: String(p._id), name: p.name, category: p.category, rawType, type: mapTypeToGroup(rawType) };
        });
        const prompt = `
Bạn là hệ thống gợi ý phối đồ thông minh.

**Rule bắt buộc**:
1. "basic_outfit": 1 sản phẩm top + 1 sản phẩm bottom.
2. "layered_outfit": 1 sản phẩm top + 1 sản phẩm bottom + 1 sản phẩm outer.
3. "recommendations": tối đa 5 sản phẩm khác từ danh sách.
4. Không chọn sản phẩm type="other".
5. ID phải nằm trong danh sách sản phẩm cho trước.
6. Ưu tiên sản phẩm có type trùng với xu hướng: ${JSON.stringify(trendKeywords)}.

Dữ liệu người dùng: ${JSON.stringify(userBehavior)}
Danh sách sản phẩm: ${JSON.stringify(productsWithType)}

**Chỉ trả JSON đúng format**:
{
  "basic_outfit": ["id_top", "id_bottom"],
  "layered_outfit": ["id_top", "id_bottom", "id_outer"],
  "recommendations": ["id1", "id2", "id3", "id4", "id5"]
}
`;
        const res = yield model.invoke([new messages_1.HumanMessage(prompt)]);
        const raw = res.content.replace(/```json|```/g, "").trim();
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match)
            throw new Error("AI trả về dữ liệu không hợp lệ");
        const parsed = JSON.parse(match[0]);
        return sanitizeAIResult(parsed, productsWithType);
    });
}
// =================== 5. Hậu xử lý kết quả ===================
function sanitizeAIResult(aiResult, productsWithType) {
    const validIds = new Set(productsWithType.map(p => String(p._id)));
    const productMap = new Map(productsWithType.map(p => [String(p._id), p.type]));
    const usedIds = new Set();
    const filterValid = (ids) => ids.filter(id => validIds.has(id) && mongoose_1.default.Types.ObjectId.isValid(id));
    const pickUniqueByType = (type) => {
        for (const p of productsWithType) {
            if (p.type === type && !usedIds.has(p._id)) {
                usedIds.add(p._id);
                return p._id;
            }
        }
        return null;
    };
    const buildOutfit = (ids, requiredTypes, limit) => {
        const result = filterValid(ids).filter(id => !usedIds.has(id));
        result.forEach(id => usedIds.add(id));
        for (const type of requiredTypes) {
            if (!result.some(id => productMap.get(id) === type)) {
                const id = pickUniqueByType(type);
                if (id)
                    result.push(id);
            }
        }
        return result.slice(0, limit);
    };
    return {
        basic_outfit: buildOutfit(aiResult.basic_outfit || [], ["top", "bottom"], 2),
        layered_outfit: buildOutfit(aiResult.layered_outfit || [], ["top", "bottom", "outer"], 3),
        recommendations: buildOutfit(aiResult.recommendations || [], [], 5),
    };
}

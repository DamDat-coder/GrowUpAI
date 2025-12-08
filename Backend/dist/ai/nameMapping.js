"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapNameToType = mapNameToType;
exports.mapTypeToGroup = mapTypeToGroup;
function mapNameToType(name) {
    if (!name || typeof name !== "string")
        return "other";
    const lowerName = name.toLowerCase();
    if (lowerName.includes("áo thun") || lowerName.includes("t-shirt"))
        return "tshirt";
    if (lowerName.includes("polo"))
        return "polo";
    if (lowerName.includes("sơ mi") || lowerName.includes("shirt"))
        return "shirt";
    if (lowerName.includes("dài tay") || lowerName.includes("long-sleeve"))
        return "longsleeve";
    if (lowerName.includes("hoodie"))
        return "hoodie";
    if (lowerName.includes("sweater") || lowerName.includes("sweatshirt"))
        return "sweater";
    if (lowerName.includes("khoác") || lowerName.includes("blazer") || lowerName.includes("bomber") || lowerName.includes("trench"))
        return "outer";
    if (lowerName.includes("tanktop") || lowerName.includes("ba lỗ"))
        return "tanktop";
    // nếu có chứa "quần", "jean", "short", "váy", "đầm", "jumpsuit" thì cho vào bottom
    if (["quần", "jeans", "short", "váy", "đầm", "jumpsuit"].some((k) => lowerName.includes(k))) {
        return "bottom";
    }
    return "other";
}
// Quy đổi từ rawType sang nhóm chính cho AI
function mapTypeToGroup(type) {
    if (["tshirt", "polo", "shirt", "longsleeve", "hoodie", "sweater", "tanktop"].includes(type)) {
        return "top";
    }
    if (type === "bottom") {
        return "bottom";
    }
    if (type === "outer") {
        return "outer";
    }
    return "other";
}

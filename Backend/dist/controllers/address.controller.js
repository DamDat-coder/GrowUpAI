"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllWards = exports.getWardsByProvince = exports.getProvinces = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Đảm bảo lấy đúng đường dẫn tới thư mục 'data' ở cả môi trường dev và production
const dataDir = path_1.default.join(__dirname, "..", "..", "data");
const provinceData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(dataDir, "province.json"), "utf8"));
const wardData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(dataDir, "ward.json"), "utf8"));
// Lấy danh sách tỉnh/thành phố
const getProvinces = (req, res) => {
    res.json(Object.values(provinceData));
};
exports.getProvinces = getProvinces;
// Lấy danh sách phường/xã theo mã tỉnh/thành phố
const getWardsByProvince = (req, res) => {
    const { province_code } = req.params;
    const wards = Object.values(wardData).filter((ward) => ward.parent_code === province_code);
    res.json(wards);
};
exports.getWardsByProvince = getWardsByProvince;
const getAllWards = (req, res) => {
    res.json(Object.values(wardData));
};
exports.getAllWards = getAllWards;

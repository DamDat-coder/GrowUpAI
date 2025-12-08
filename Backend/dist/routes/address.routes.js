"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const address_controller_1 = require("../controllers/address.controller");
const router = (0, express_1.Router)();
router.get("/provinces", address_controller_1.getProvinces);
router.get("/wards/:province_code", address_controller_1.getWardsByProvince);
router.get("/wards/all", address_controller_1.getAllWards);
exports.default = router;

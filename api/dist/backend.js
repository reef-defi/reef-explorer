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
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-check
const express = require("express");
const pg_1 = require("pg");
const config = require("../api.config");
const ensure = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};
const getPool = () => __awaiter(void 0, void 0, void 0, function* () {
    const pool = new pg_1.Pool(config.postgresConnParams);
    yield pool.connect();
    return pool;
});
const app = express();
// Get User Reef Balance
const TOKEN_QUERY = `SELECT balance FROM token_holder WHERE holder_evm_address OR holder_account_id = $1`;
app.post('/api/user-balance', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userAddress = req.body.userAddress;
        const pool = yield getPool();
        const dbres = yield pool.query(TOKEN_QUERY, [userAddress]);
        res.send(dbres.rows[0].balance || 0);
        yield pool.end();
    }
    catch (e) {
        res.send(0);
    }
}));
app.listen(config.httpPort, () => console.log(`Reef explorer API is listening on port ${config.httpPort}.`));
//# sourceMappingURL=backend.js.map
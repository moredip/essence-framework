"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = __importDefault(require("node:http"));
const server = node_http_1.default.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Hello from JSX!</h1>');
});
server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

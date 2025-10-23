const chai = require("chai");
const chaiHttp = require("chai-http");
const App = require("../app");
require("dotenv").config();

chai.use(chaiHttp);
const { expect } = chai;

describe("Products", () => {
  let app;
  let authToken;

  before(async () => {
    // Khởi động Product Service
    app = new App();
    await app.connectDB();
    app.start();

    // 🔹 Gọi sang Auth Service để đăng ký + đăng nhập và lấy token
    const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3000";

    // Đăng ký user test
    await chai.request(authUrl)
      .post("/register")
      .send({ username: "testuser", password: "password" })
      .catch(() => {});

    // Đăng nhập để lấy token
    const loginRes = await chai.request(authUrl)
      .post("/login")
      .send({ username: "testuser", password: "password" });

    authToken = loginRes.body.token;
    // Kiểm tra token có hợp lệ không
    expect(authToken).to.be.a("string");
  });

  after(async () => {
    await app.disconnectDB();
    app.stop();
  });

  describe("POST /api/products", () => {
    it("should create a new product", async () => {
      const res = await chai
        .request(app.app)
        .post("/api/products")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Product 1",
          price: 10,
          description: "Description of Product 1",
        });

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("_id");
      expect(res.body).to.have.property("name", "Product 1");
    });
  });
});

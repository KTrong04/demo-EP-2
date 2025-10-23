const chai = require("chai");
const chaiHttp = require("chai-http");
const App = require("../app");
const expect = chai.expect;
require("dotenv").config();

chai.use(chaiHttp);

describe("Products", () => {
  let app;
  let authToken;

  before(async () => {
    app = new App();
    await app.init(); // ✅ Initializes DB, middleware, routes, message broker

    // Authenticate with the auth microservice to get a token
    try {
      const authRes = await chai
        .request("http://localhost:3000")
        .post("/login")
        .send({
          username: process.env.LOGIN_TEST_USER,
          password: process.env.LOGIN_TEST_PASSWORD,
        });

      // Ensure token is returned and log it
      authToken = authRes.body.token;
      if (!authToken) {
        throw new Error("Failed to receive a token from the auth service.");
      }

      console.log("Authentication token received:", authToken); // Logging token for debug

      app.start();
    } catch (error) {
      console.error("Error during authentication:", error.message);
      process.exit(1); // Exit the test if authentication fails
    }
  });

  after(async () => {
    await app.disconnectDB();
    app.stop();
  });

  describe("POST /products", () => {
    it("should create a new product", async () => {
      const product = {
        name: "Product 1",
        description: "Description of Product 1",
        price: 10,
      };

      const res = await chai
        .request(app.app)
        .post("/api/products")
        .set("Authorization", `Bearer ${authToken}`)
        .send(product);

      // Check if the response is as expected
      expect(res).to.have.status(201);
      expect(res.body).to.have.property("_id");
      expect(res.body).to.have.property("name", product.name);
      expect(res.body).to.have.property("description", product.description);
      expect(res.body).to.have.property("price", product.price);
    });

    it("should return an error if name is missing", async () => {
      const product = {
        description: "Description of Product 1",
        price: 10.99,
      };

      const res = await chai
        .request(app.app)
        .post("/api/products")
        .set("Authorization", `Bearer ${authToken}`)
        .send(product);

      // Check if the response status code is 400 for bad request
      expect(res).to.have.status(400);
    });
  });
});

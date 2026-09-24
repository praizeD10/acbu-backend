import { Request, Response } from "express";
import { AppError, errorHandler } from "./errorHandler";

describe("errorHandler", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("redacts sensitive app error data in production responses", () => {
    process.env.NODE_ENV = "production";

    const req = {
      path: "/api/test",
      method: "POST",
    } as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    errorHandler(
      new AppError("Sensitive database error", 500, "DB_FAILURE", {
        stack: "internal-stack-trace",
        secret: "super-secret",
      }),
      req,
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(500);

    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.error).toMatchObject({
      code: "DB_FAILURE",
      error_code: "DB_FAILURE",
      message: "Internal server error",
      statusCode: 500,
    });
    expect(payload.error).not.toHaveProperty("details");
  });
});

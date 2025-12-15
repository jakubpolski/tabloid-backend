import { verifyJwt, AuthRequest } from "../../middleware/authMiddleware";
import jwt from "jsonwebtoken";
import { Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET!

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe("verifyJwt middleware", () => {

  test("should return 401 if Authorization header missing", () => {
    const req = { headers: {} } as AuthRequest;
    const res = mockResponse();

    verifyJwt(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Missing Authorization header"
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 for malformed Authorization header", () => {
    const req = { headers: { authorization: "BadHeader" } } as AuthRequest;
    const res = mockResponse();

    verifyJwt(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid Authorization header"
    });
  });

  test("should return 401 for invalid token", () => {
    const req = {
      headers: { authorization: "Bearer invalidtoken" }
    } as AuthRequest;

    const res = mockResponse();
    verifyJwt(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid token"
    });
  });

  test("should attach payload to req for valid token", () => {
    const token = jwt.sign({ email: "test@gmail.com", user: "test" }, JWT_SECRET);
    const req = {
      headers: { authorization: `Bearer ${token}` }
    } as AuthRequest;

    const res = mockResponse();

    verifyJwt(req, res, mockNext);

    expect(req.payload).toMatchObject({ email: "test@gmail.com", user: "test" });
    expect(mockNext).toHaveBeenCalled();
  });

});

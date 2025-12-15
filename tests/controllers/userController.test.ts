import { loginUser } from "../../controllers/userController";
import { AuthRequest } from "../../middleware/authMiddleware";
import { Response } from "express";

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("loginUser controller", () => {
  test("should return user from req.user", () => {
    const req = {
      payload: { email: "test@gmail.com", name: "Test" }
    } as AuthRequest;

    const res = mockResponse();

    loginUser(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: "Login successful",
      payload: { email: "test@gmail.com", name: "Test" }
    });
  });
});
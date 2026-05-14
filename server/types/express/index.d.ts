import { IUserDocument } from "../../models/userModel.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}
